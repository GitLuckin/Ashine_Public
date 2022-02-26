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

/*unittests: FileTreeView*/

/**
 * This is the view layer (template) for the file tree in the sidebar. It takes a FileTreeViewModel
 * and renders it to the given element using Preact. User actions are signaled via an ActionCreator
 * (in the Flux sense).
 */
define(function (require, exports, module) {


    var Preact            = require("thirdparty/preact"),
        Classnames        = require("thirdparty/classnames"),
        Immutable         = require("thirdparty/immutable"),
        _                 = require("thirdparty/lodash"),
        FileUtils         = require("file/FileUtils"),
        LanguageManager   = require("language/LanguageManager"),
        FileTreeViewModel = require("project/FileTreeViewModel"),
        ViewUtils         = require("utils/ViewUtils"),
        KeyEvent          = require("utils/KeyEvent"),
        PreferencesManager  = require("preferences/PreferencesManager");

    var DOM = Preact.DOM;

    /**
     * @private
     * @type {Immutable.Map}
     *
     * Stores the file tree extensions for adding classes and icons. The keys of the map
     * are the "categories" of the extensions and values are vectors of the callback functions.
     */
    var _extensions = Immutable.Map();

     /**
     * @private
     * @type {string}
     *
     * Stores the path of the currently dragged item in the filetree.
     */
    var _draggedItemPath;


    // Constants

    // Time range from first click to second click to invoke renaming.
    var CLICK_RENAME_MINIMUM  = 500,
        RIGHT_MOUSE_BUTTON    = 2,
        LEFT_MOUSE_BUTTON     = 0;

    var INDENTATION_WIDTH     = 10;

    /**
     * @private
     *
     * Returns the name of a file without its extension.
     *
     * @param {string} fullname The complete name of the file (not including the rest of the path)
     * @param {string} extension The file extension
     * @return {string} The fullname without the extension
     */
    function _getName(fullname, extension) {
        return extension !== "" ? fullname.substring(0, fullname.length - extension.length - 1) : fullname;
    }

    /**
     * Mixin that allows a component to compute the full path to its directory entry.
     */
    var pathComputer = {
        /**
         * Comp