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
     * @return {{specials:Array.<number>, lastSegmentSpecialsInde