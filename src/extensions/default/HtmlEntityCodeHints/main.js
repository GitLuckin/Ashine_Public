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

define(function (require, exports, module) {


    // Load dependent modules
    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        HTMLUtils           = brackets.getModule("language/HTMLUtils"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        Strings             = brackets.getModule("strings"),
        HtmlSpecialChars    = require("text!SpecialChars.json"),
        specialChars;


    PreferencesManager.definePreference("codehint.SpecialCharHints", "boolean", true, {
        description: Strings.DESCRIPTION_SPECIAL_CHAR_HINTS
    });

    /**
     * Encodes the special Char value given.
     *
     * @param {string} value
     * The value to encode
     *
     * @return {string}
     * The encoded string
     */
    function _encodeValue(value) {
        return value.replace("&", "&amp;").replace("#", "&#35;");
    }

    /**
     * Decodes the special Char value given.
     *
     * @param {string} value
     * The value to decode
     *
     * @return {string}
     * The decoded string
     */
    function _decodeValue(value) {
        return value.replace("&amp;", "&").replace("&#35;", "#");
    }

    /**
     * @constructor
     */
    function SpecialCharHints() {
        this.primaryTriggerKeys = "&ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#0123456789";
        this.currentQuery = "";
    }

    /**
     * Determines whether HtmlSpecialChar hints are available in the current editor
     * context.
     *
     * @param {Editor} editor
     * A non-null editor object for the active window.
     *
     * @param {string} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {boolean}
     * Determines whether the current provider is able to provide hints for
     * the given editor context and, in case implicitChar is non- null,
     * whether it is appropriate to do so.
     */
    SpecialCharHints.prototype.hasHints = function (editor, implicitChar) {
        this.editor = editor;

        return this._getQuery() !== null;
    };

    /**
     * Returns a list of available HtmlSpecialChar hints if possible for the current
     * editor context.
     *
     * @param {string} implicitChar
     * Either null, if the hinting request was explicit, or a single character
     * that represents the last insertion and that indicates an implicit
     * hinting request.
     *
     * @return {jQuery.Deferred|{
     *              hints: Array.<string|jQueryObject>,
     *              match: string,
     *              selectInitial: boolean,
     *              handleWideResults: boolean}}
     * Null if the provider wishes to end the hinting session. Otherwise, a
     * response object that provides:
     * 1. a sorted array hints that consists of strings
     