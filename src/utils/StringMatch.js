/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2013 - 2021 Adobe Systems Incorporated. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://opensource.org/licenses/AGPL-3.0.
 *
 */

/*unittests: StringMatch */

define(function (require, exports, module) {


    var _ = require("thirdparty/lodash");

    /*
     * Performs matching that is useful for QuickOpen and similar searches.
     */

    /** Object representing a search result with associated metadata (added as extra ad hoc fields) */
    function SearchResult(label) {
        this.label = label;
    }



    /*
     * Identifies the "special" characters in the given string.
     * Special characters for matching purposes are:
     *
     * * the first character
     * * "/" and the character following the "/"
     * * "_", "." and "-" and the character following it
     * * an uppercase character that follows a lowercase one (think camelCase)
     *
     * The returned object contains an array called "specials". This array is
     * a list of indexes into the original string where all of the special
     * characters are. It also has a property "lastSegmentSpecialsIndex" which
     * is an index into the specials array that denotes which location is the
     * beginning of the last path segment. (This is used to allow scanning of
     * the last segment's specials separately.)
     *
     * @param {string} input string to break apart (e.g. filename that is being searched)
     * @return {{specials:Array.<number>, lastSegmentSpecialsIndex:number}}
     */
    function findSpecialCharacters(str) {
        var i, c;

        // the beginning of the string is always special
        var specials = [0];

        // lastSegmentSpecialsIndex starts off with the assumption that
        // there are no segments
        var lastSegmentSpecialsIndex = 0;

        // used to track down the camelCase changeovers
        var lastWasLowerCase = false;

        for (i = 0; i < str.length; i++) {
            c = str[i];
            if (c === "/") {
                // new segment means this character and the next are special
                specials.push(i++);
                specials.push(i);
                lastSegmentSpecialsIndex = specials.length - 1;
                lastWasLowerCase = false;
            } else if (c === "." || c === "-" || c === "_") {
                // _, . and - are separators so they are
                // special and so is the next character
                specials.push(i);
                if (str[i + 1] !== "/") {
                    // if the next key is a slash, handle it separately
                    // see #10871
                    specials.push(++i);
                }
                lastWasLowerCase = false;
            } else if (c.toUpperCase() === c) {
                // this is the check for camelCase changeovers
                if (lastWasLowerCase) {
                    specials.push(i);
                }
                lastWasLowerCase = false;
            } else {
                lastWasLowerCase = true;
            }
        }
        return {
            specials: specials,
            lastSegmentSpecialsIndex: lastSegmentSpecialsIndex
        };
    }

    // states used during the scanning of the string
    var SPECIALS_MATCH = 0;
    var ANY_MATCH = 1;

    // Scores can be hard to make sense of. The DEBUG_SCORES flag
    // provides a way to peek into the parts that made up a score.
    // This flag is used for manual debugging and in the unit tests only.
    var DEBUG_SCORES = false;
    function _setDebugScores(ds) {
        DEBUG_SCORES = ds;
    }


    // Constants for scoring
    var SPECIAL_POINTS = 40;
    var MATCH_POINTS = 10;
    var UPPER_CASE_MATCH = 100;
    var CONSECUTIVE_MATCHES_POINTS = 8;
    var BEGINNING_OF_NAME_POINTS = 13;
    var LAST_SEGMENT_BOOST = 1;
    var DEDUCTION_FOR_LENGTH = 0.2;
    var NOT_STARTING_ON_SPECIAL_PENALTY = 25;

    // Used in match lists to designate matches of "special" characters (see
    // findSpecialCharacters above
    function SpecialMatch(index, upper) {
        this.index = index;
        if (upper) {
            this.upper = upper;
        }
    }

    // Used in match lists to designate any matched characters that are not special
    function NormalMatch(index, upper) {
        this.index = index;
        if (upper) {
            this.upper = upper;
        }
    }

    /*
     * Finds the best matches between the query and the string. The query is
     * compared with str (usually a lower case string with a lower case
     * query).
     *
     * Generally speaking, this function tries to find "special" characters
     * (see findSpecialCharacters above) first. Failing that, it starts scanning
     * the "normal" characters. Sometimes, it will find a special character that matches
     * but then not be able to match the rest of the query. In cases like that, the
     * search will backtrack and try to find matches for the whole query earlier in the
     * string.
     *
     * A contrived example will help illustrate how the searching and backtracking works. It's a bit long,
     * but it illustrates different pieces of the algorithm which can be tricky. Let's say that we're
     * searching the string "AzzBzzCzdzezzDgxgEF" for "abcdex".
     *
     * To start with, it will match "abcde" from the query to "A B C D E" in the string (the spaces
     * represent gaps in the matched part of the string), because those are all "special characters".
     * However, the "x" in the query doesn't match the "F" which is the only character left in the
     * string.
     *
     * Backtracking kicks in. The "E" is pulled off of the match list.
     * deadBranches[4] is set to the "g" before the "E". This means that for the 5th
     * query character (the "e") we know that we don't have a match beyond that point in the string.
     *
     * To resume searching, the backtrack function looks at the previous match (the "D") and starts
     * searching in character-by-character (ANY_MATCH) mode right after that. It fails to find an
     * "e" before it gets to deadBranches[4], so it has to backtrack again.
     *
     * This time, the "D" is pulled off the match list.
     * deadBranches[3] is set to the "z" before the "D", because we know that for the "dex" part of the
     * query, we can't make it work past the "D". We'll resume searching with the "z" after the "C".
     *
     * Doing an ANY_MATCH search, we find the "d". We then start searching specials for "e", but we
     * stop before we get to "E" because deadBranches[4] tells us that's a dead end. So, we switch
     * to ANY_MATCH and find the "e".
     *
     * Finally, we search for the "x". We don't find a special that matches, so we start an ANY_MATCH
     * search. Then we find the "x", and we have a successful match.
     *
     * Here are some notes on how the algorithm works:
     *
     * * We only backtrack() when we're exhausted both special AND normal forward searches past that point,
     *   for the query remainder we currently have.  For a different query remainder, we may well get further
     *   along - hence deadBranches[] being dependent on queryCounter; but in order to get a different query
     *   remainder, we must give up one or more current matches by backtracking.
     *
     * * Normal "any char" forward search is a superset of special matching mode -- anything that would have
     *   been matched in special mode *could* also be matched by normal mode. In practice, however,
     *   any special characters that could have matched would be picked up first by the specials matching
     *   code.
     *
     * * backtrack() always goes at least as far back as str[deadBranches[queryCounter]-1] before allowing
     *   forward searching to resume
     *
     * * When `deadBranches[queryCounter] = strCounter` it means if we're still trying to match
     *   `queryLower[queryCounter]` and we get to `str[strCounter]`, there's no way we can match the
     *   remainer of `queryLower` with the remainder of `str` -- either using specials-only or
     *   full any-char matching.
     *
     * * We know this because deadBranches[] is set in backtrack(), and we don't get to backtrack() unless
     *   either:
     *   1. We've already exhausted both special AND normal forward searches past that point
     *      (i.e. backtrack() due to `strCounter >= str.length`, yet `queryCounter < query.length`)
     *   2. We stopped searching further forward due to a previously set deadBranches[] value
     *      (i.e. backtrack() due to `strCounter > deadBranches[queryCounter]`, yet
     *      `queryCounter < query.length`)
     *
     * @param {string} query the search string (generally lower cased)
     * @param {string} str the string to compare with (generally lower cased)
     * @param {string} originalQuery the "non-normalized" query string (used to detect case match priority)
     * @param {string} originalStr the "non-normalized" string to compare with (used to detect case match priority)
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} startingSpecial index into specials array to start scanning with
     * @return {Array.<SpecialMatch|NormalMatch>} matched indexes or null if no matches possible
     */
    function _generateMatchList(query, str, originalQuery, originalStr, specials, startingSpecial) {
        var result = [];

        // used to keep track of which special character we're testing now
        var specialsCounter = startingSpecial;

        // strCounter and queryCounter are the indexes used for pulling characters
        // off of the str/compareLower and query.
        var strCounter = specials[startingSpecial];
        var queryCounter;

        // the search branches out between special characters and normal characters
        // that are found via consecutive character scanning. In the process of
        // performing these scans, we discover that parts of the query will not match
        // beyond a given point in the string. We keep track of that information
        // in deadBranches, which has a slot for each character in the query.
        // The value stored in the slot is the index into the string after which we
        // are certain there is no match.
        var deadBranches = [];

        for (queryCounter = 0; queryCounter < query.length; queryCounter++) {
            deadBranches[queryCounter] = Infinity;
        }

        queryCounter = 0;

        var state = SPECIALS_MATCH;

        // Compares the current character from the query string against the
        // special characters in str. Returns true if a match was found,
        // false otherwise.
        function findMatchingSpecial() {
            // used to loop through the specials
            var i;

            for (i = specialsCounter; i < specials.length; i++) {
                // short circuit this search when we know there are no matches following
                if (specials[i] >= deadBranches[queryCounter]) {
                    break;
                }

                // First, ensure that we're not comparing specials that
                // come earlier in the string than our current search position.
                // This can happen when the string position changes elsewhere.
                if (specials[i] < strCounter) {
                    specialsCounter = i;
                } else if (query[queryCounter] === str[specials[i]]) {
                    // we have a match! do the required tracking
                    strCounter = specials[i];

                    // Upper case match check:
                    // If the query and original string matched, but the original string
                    // and the lower case version did not, that means that the original
                    // was upper case.
                    var upper = originalQuery[queryCounter] === originalStr[strCounter] && originalStr[strCounter] !== str[strCounter];
                    result.push(new SpecialMatch(strCounter, upper));
                    specialsCounter = i;
                    queryCounter++;
                    strCounter++;
                    return true;
                }
            }

            return false;
        }

        // This function implements the backtracking that is done when we fail to find
        // a match with the query using the "search for specials first" approach.
        //
        // returns false when it is not able to backtrack successfully
        function backtrack() {

            // The idea is to pull matches off of our match list, rolling back
            // characters from the query. We pay special attention to the special
            // characters since they are searched first.
            while (result.length > 0) {
                var item = result.pop();

                // nothing in the list? there's no possible match then.
                if (!item) {
                    return false;
                }

                // we pulled off a match, which means that we need to put a character
                // back into our query. strCounter is going to be set once we've pulled
                // off the right special character and know where we're going to restart
                // searching from.
                queryCounter--;

                if (item instanceof SpecialMatch) {
                    // pulled off a special, which means we need to make that special available
                    // for matching again
                    specialsCounter--;

                    // check to see if we've gone back as far as we need to
                    if (item.index < deadBranches[queryCounter]) {
                        // we now know that this part of the query does not match beyond this
                        // point
                        deadBranches[queryCounter] = item.index - 1;

                        // since we failed with the specials along this track, we're
                        // going to reset to looking for matches consecutively.
                        state = ANY_MATCH;

                        // we figure out where to start looking based on the new
                        // last item in the list. If there isn't anything else
                        // in the match list, we'll start over at the starting special
                        // (which is generally the beginning of the string, or the
                        // beginning of the last segment of the string)
                        item = result[result.length - 1];
                        if (!item) {
                            strCounter = specials[startingSpecial] + 1;
                            return true;
                        }
                        strCounter = item.index + 1;
                        return true;
                    }
                }
            }
            return false;
        }

        while (true) {

            // keep looping until we've either exhausted the query or the string
            while (queryCounter < query.length && strCounter < str.length && strCounter <= deadBranches[queryCounter]) {
                if (state === SPECIALS_MATCH) {
                    if (!findMatchingSpecial()) {
                        state = ANY_MATCH;
                    }
                }

                if (state === ANY_MATCH) {
                    // we look character by character for matches
                    if (query[queryCounter] === str[strCounter]) {
                        // got a match! record it, and switch back to searching specials

                        // See the specials section above for a comment on the expression
                        // for `upper` below.
                        var upper = originalQuery[queryCounter] === originalStr[strCounter] && originalStr[strCounter] !== str[strCounter];
                        result.push(new NormalMatch(strCounter++, upper));

                        queryCounter++;
                        state = SPECIALS_MATCH;
                    } else {
                        // no match, keep looking
                        strCounter++;
                    }
                }
            }

            // if we've finished the query, or we haven't finished the query but we have no
            // more backtracking we can do, then we're all done searching.
            if (queryCounter >= query.length || (queryCounter < query.length && !backtrack())) {
                break;
            }
        }

        // return null when we don't find anything
        if (queryCounter < query.length || result.length === 0) {
            return null;
        }
        return result;
    }


    /*
     * Seek out the best match in the last segment (generally the filename).
     * Matches in the filename are preferred, but the query entered could match
     * any part of the path. So, we find the best match we can get in the filename
     * and then allow for searching the rest of the string with any characters that
     * are left from the beginning of the query.
     *
     * The parameters and return value are the same as for getMatchRanges,
     * except this function is always working on the last segment and the
     * result can optionally include a remainder, which is the characters
     * at the beginning of the query which did not match in the last segment.
     *
     * @param {string} query the search string (generally lower cased)
     * @param {string} str the string to compare with (generally lower cased)
     * @param {string} originalQuery the "non-normalized" query string (used to detect case match priority)
     * @param {string} originalStr the "non-normalized" string to compare with (used to detect case match priority)
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} startingSpecial index into specials array to start scanning with
     * @param {boolean} lastSegmentStart which character does the last segment start at
     * @return {{remainder:int, matchList:Array.<SpecialMatch|NormalMatch>}} matched indexes or null if no matches possible
     */
    function _lastSegmentSearch(query, str, originalQuery, originalStr, specials, startingSpecial, lastSegmentStart) {
        var queryCounter, matchList;

        // It's possible that the query is longer than the last segment.
        // If so, we can chop off the bit that we know couldn't possibly be there.
        var remainder = "",
            originalRemainder = "",
            extraCharacters = specials[startingSpecial] + query.length - str.length;

        if (extraCharacters > 0) {
            remainder = query.substring(0, extraCharacters);
            originalRemainder = originalQuery.substring(0, extraCharacters);
            query = query.substring(extraCharacters);
            originalQuery = originalQuery.substring(extraCharacters);
        }

        for (queryCounter = 0; queryCounter < query.length; queryCounter++) {
            matchList = _generateMatchList(query.substring(queryCounter),
                                     str, originalQuery.substring(queryCounter),
                                     originalStr, specials, startingSpecial);

            // if we've got a match *or* there are no segments in this string, we're done
            if (matchList || startingSpecial === 0) {
                break;
            }
        }

        if (queryCounter === query.length || !matchList) {
            return null;
        }
        return {
            remainder: remainder + query.substring(0, queryCounter),
            originalRemainder: originalRemainder + originalQuery.substring(0, queryCounter),
            matchList: matchList
        };

    }

    /*
     * Implements the top-level search algorithm. Search the last segment first,
     * then search the rest of the string with the remainder.
     *
     * The parameters and return value are the same as for getMatchRanges.
     *
     * @param {string} queryLower the search string (will be searched lower case)
     * @param {string} compareLower the lower-cased string to search
     * @param {string} originalQuery the "non-normalized" query string (used to detect case match priority)
     * @param {string} originalStr the "non-normalized" string to compare with (used to detect case match priority)
     * @param {Array} specials list of special indexes in str (from findSpecialCharacters)
     * @param {int} lastSegmentSpecialsIndex index into specials array to start scanning with
     * @return {Array.<SpecialMatch|NormalMatch>} matched indexes or null if no matches possible
     */
    function _wholeStringSearch(queryLower, compareLower, originalQuery, originalStr, specials, lastSegmentSpecialsIndex) {
        var lastSegmentStart = specials[lastSegmentSpecialsIndex];
        var result;
        var matchList;

        result = _lastSegmentSearch(queryLower, compareLower, originalQuery, originalStr, specials, lastSegmentSpecialsIndex, lastSegmentStart);

        if (result) {
            matchList = result.matchList;

            // Do we have more query characters that did not fit?
            if (result.remainder) {
                // Scan with the remainder only through the beginning of the last segment
                var remainderMatchList = _generateMatchList(result.remainder,
                                              compareLower.substring(0, lastSegmentStart),
                                              result.originalRemainder,
                                              originalStr.substring(0