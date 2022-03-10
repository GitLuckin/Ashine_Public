/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2014 - 2021 Adobe Systems Incorporated. All rights reserved.
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

define(function (require, exports, module) {


    var FileUtils       = require("file/FileUtils"),
        EventDispatcher = require("utils/EventDispatcher"),
        FindUtils       = require("search/FindUtils"),
        MainViewManager = require("view/MainViewManager");

    /**
     * @constructor
     * Manages a set of search query and result data.
     * Dispatches these events:
     *      "change" - whenever the results have been updated. Note that it's up to people who
     *      edit the model to call fireChange() when necessary - it doesn't automatically fire.
     */
    function SearchModel() {
        this.clear();
    }
    EventDispatcher.makeEventDispatcher(SearchModel.prototype);

    /** @const Constant used to define the maximum results found.
     *  Note that this is a soft limit - we'll likely go slightly over it since
     *  we always add all the searches in a given file.
     */
    SearchModel.MAX_TOTAL_RESULTS = 100000;

    /**
     * The current set of results.
     * @type {Object.<fullPath: string, {matches: Array.<Object>, collapsed: boolean, timestamp: Date}>}
     */
    SearchModel.prototype.results = null;

    /**
     * The query that generated these results.
     * @type {{query: string, caseSensitive: boolean, isRegexp: boolean}}
     */
    SearchModel.prototype.queryInfo = null;

    /**
     * The compiled query, expressed as a regexp.
     * @type {RegExp}
     */
    SearchModel.prototype.queryExpr = null;

    /**
     * Whether this is a find/replace query.
     * @type {boolean}
     */
    SearchModel.prototype.isReplace = false;

    /**
     * The replacement text specified for this query, if any.
     * @type {string}
     */
    SearchModel.prototype.replaceText = null;

    /**
     * The file/folder path representing the scope that this query was performed in.
     * @type {FileSystemEntry}
     */
    SearchModel.prototype.scope = null;

    /**
     * A file filter (as returned from FileFilters) to apply within the main scope.
     * @type {string}
     */
    SearchModel.prototype.filter = null;

    /**
     * The total number of matches in the model.
     * @type {number}
     */
    SearchModel.prototype.numMatches = 0;

    /**
     * Whether or not we hit the maximum number of results for the type of search we did.
     * @type {boolean}
     */
    SearchModel.prototype.foundMaximum = false;

    /**
     * Whether or not we exceeded the maximum number of results in the search we did.
     * @type {boolean}
     */
    SearchModel.prototype.exceedsMaximum = false;

    /**
     * Clears out the model to an empty state.
     */
    SearchModel.prototype.clear = function () {
        var numMatchesBefore = this.numMatches;
        this.results = {};
        this.queryInfo = null;
        this.queryExpr = null;
        this.isReplace = false;
        this.replaceText = null;
        this.scope = null;
        this.numMatches = 0;
        this.foundMaximum = false;
        this.exceedsMaximum = false;
        if (numMatchesBefore !== 0) {
            this.fireChanged();
        }
    };

    /**
     * Sets the given query info and stores a compiled RegExp query in this.queryExpr.
     * @param {{query: string, case