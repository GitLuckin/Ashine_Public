/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2015 - 2021 Adobe Systems Incorporated. All rights reserved.
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


    // Load dependencies.
    var AppInit             = brackets.getModule("utils/AppInit"),
        CodeHintManager     = brackets.getModule("editor/CodeHintManager"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        JSONUtils           = brackets.getModule("language/JSONUtils"),
        Strings             = brackets.getModule("strings"),
        ThemeManager        = brackets.getModule("view/ThemeManager"),
        CodeInspection      = brackets.getModule("language/CodeInspection"),
        _                   = brackets.getModule("thirdparty/lodash"),
        languages           = LanguageManager.getLanguages(),
        isPrefDocument      = false,
        isPrefHintsEnabled  = false;

    // Stores data of preferences used by Brackets and its core/thirdparty extensions.
    var data = {
        language: {
            type: "object",
            description: Strings.DESCRIPTION_LANGUAGE
        },
        path: {
            type: "object",
            description: Strings.DESCRIPTION_PATH
        }
    };

    var stringMatcherOptions = {
        preferPrefixMatches: true
    };

    // List of parent keys for which no key hints will be provided.
    var parentKeyBlacklist = [
        "language.fileExtensions",
        "language.fileNames",
        "path"
    ];

    // Define a preference for code hinting.
    PreferencesManager.definePreference("codehint.PrefHints", "boolean", true, {
        description: Strings.DESCRIPTION_PREF_HINTS
    });

    /**
     * @private
     *
     * Determines whether or not the current document is a preferences document and
     * user has enabled code hints
     *
     * @return {Boolean}
     */
    function _isPrefHintsEnabled() {
        return (isPrefDocument &&
                PreferencesManager.get("showCodeHints") !== false &&
                PreferencesManager.get("codehint.PrefHints") !== false);
    }

    /**
     * @private
     *
     * Determines whether or not the name of a file matches the preferences files
     *
     * @param {!Document} document
     * @return {Boolean}
     */
    function _isPrefDocument(document) {
        return (/^\.?brackets\.json$/).test(document.file._name);
    }

    // Set listeners on preference, editor and language changes.
    PreferencesManager.on("change", "showCodeHints", function () {
        isPrefHintsEnabled = _isPrefHintsEnabled();
    });
    PreferencesManager.on("change", "codehint.PrefHints", function () {
        isPrefHintsEnabled = _isPrefHintsEnabled();
    });
    EditorManager.on("activeEditorChange", function (e, editor) {
        if (editor) {
            isPrefDocument = _isPrefDocument(editor.document);
        }
        isPrefHintsEnabled = _isPrefHintsEnabled();
    });
    LanguageManager.on("languageAdded", function () {
        languages = LanguageManager.getLanguages();
    });

    /*
     * Returns a sorted and formatted list of hints with the query substring
     * highlighted.
     *
     * @param {Array.<Object>} hints - the list of hints to format
     * @param {string} query - querystring used for highlighting matched
     *      portions of each hint
     * @return {Array.jQuery} sorted Array of jQuery DOM elements to insert
     */
    function formatHints(hints, query) {

        var hasMetadata = hints.some(function (token) {
            return token.type || token.description;
        });

        StringMatch.basicMatchSort(hints);
        return hints.map(function (token) {
            var $hintItem = $("<span>").addClass("brackets-pref-hints"),
                $hintObj  = $("<span>").addClass("hint-obj");

            // highlight the matched portion of each hint
            if (token.stringRanges) {
                token.stringRanges.forEach(function (item) {
                    if (item.matched) {
                        $hintObj.append($("<span>")
                            .text(item.text)
                            .addClass("matched-hint"));
                    } else {
                        $hintObj.append(item.text);
                    }
                });
            } else {
                $hintObj.text(token.value);
            }

            $hintItem.append($hintObj);

            if (hasMetadata) {
                $hintItem.data("type", token.type);
                if (token.description) {
                    $hintItem.append($("<span>")
                                        .addClass("hint-description")
                                        .text(token.description));
                }
            }
            return $hintItem;
        });
    }

    /**
     * @constructor
     */
    function PrefsCodeHints() {
        this.ctxInfo = null;

        // Add all the preferences defined except the excluded ones.
        var preferences = PreferencesManager.getAllPreferences(),
            preference;
        Object.keys(preferences).forEach(function (pref) {
            preference = preferences[pref];
            if (preference.excludeFromHints) {
                return;
            }
            data[pref] = $.extend(data[pref], preference);

            // If child keys found, add them.
            if (preference.keys) {
                data[pref].keys = _.clone(preference.keys);
            }
        });
    }

    /**
     * Determines whether or not hints are available in the current context
     *
     * @param {!Editor} editor
     * @param {String} implicitChar
     * @return {Boolean}
     */
    PrefsCodeHints.prototype.hasHints = function (editor, implicitChar) {
        if (isPrefHintsEnabled && editor.getModeForSelection() === "application/json") {
            this.editor = editor;
            this.ctxInfo = JSONUtils.getContextInfo(this.editor, this.editor.getCursorPos(), true);

            if (this.ctxInfo && this.ctxInfo.tokenType) {
                // Disallow hints for blacklisted keys.
                if (this.ctxInfo.tokenType === JSONUtils.TOKEN_KEY &&
                        parentKeyBlacklist.indexOf(this.ctxInfo.parentKeyName) !== -1) {
                    return false;
                }
                return true;
            }
        }
        return false;
    };

    /**
     * Returns a list of hints available in the current context
     *
     * @param {String} implicitChar
     * @return {!{hints: Array.<jQueryObject>, match: string, selectInitial: boolean, handleWideResults: boolean}}
     */
    PrefsCodeHints.prototype.getHints = function (implicitChar) {
        var hints = [], ctxInfo, query, keys, values, option = {type: null, description: null, values: null};

        ctxInfo = this.ctxInfo = JSONUtils.getContextInfo(this.editor, this.editor.getCursorPos(), true);

        if (ctxInfo && ctxInfo.token) {
            query = JSONUtils.stripQuotes(ctxInfo.token.string.substr(0, ctxInfo.offset)).trim();
            if (JSONUtils.regexAllowedChars.test(query)) {
                query = "";
            }

            if (ctxInfo.tokenType === JSONUtils.TOKEN_KEY) {
                // Provide hints for keys

                // Get options for parent key else use general options.
                if (data[ctxInfo.parentKeyName] && data[ctxInfo.parentKeyName].keys) {
                    keys = data[ctxInfo.parentKeyName].keys;
                } else if (ctxInfo.parentKeyName === "language") {
                    keys = languages;
                    option.type = "object";
                } else {
                    keys = data;
                }

                hints = $.map(Object.keys(keys), function (key) {
                    if (ctxInfo.exclusionList.indexOf(key) === -1) {
                        var match = StringMatch.stringMatch(key, query, stringMatcherOptions);
                        if (match) {
                            match.type = keys[key].type || option.type;
                            match.description = keys[key].description || null;
                            return match;
                        }
                    }
                });
            } else if (ctxInfo.tokenType === JSONUtils.TOKEN_VALUE) {
                // Provide hints for values.

                // Get the key from data.
                if (data[ctxInfo.parentKeyName] && data[ctxInfo.parentKeyName].keys &&
                        data[ctxInfo.parentKeyName].keys[ctxInfo.keyName]) {
                    option = data[ctxInfo.parentKeyName].keys[ctxInfo.keyName];
                } else if (data[ctxInfo.keyName]) {
                    option = data[ctxInfo.keyName];
                }

                // Get the values depending on the selected key.
                if (option && option.type === "boolean") {
                    values = ["false", "true"];
                } else if (option && option.values && (["number", "string"].indexOf(option.type) !== -1 ||
                                                       (option.type === "array" && ctxInfo.isArray))) {
                    values = option.values;
                } else if (ctxInfo.isArray && ctxInfo.keyName === "linting.prefer" && languages[ctxInfo.parentKeyName]) {
                    values = CodeInspection.getProviderIDsForLanguage(ctxInfo.parentKeyName);
                } else if (ctxInfo.keyName === "themes.theme") {
                    values = ThemeManager.getAllThemes().map(function (theme) {
                        return theme.name;
                    });
                } else if (ctxInfo.parentKeyName === "language.fileExtensions" ||
                           ctxInfo.parentKeyName === "language.fileNames") {
                    values = Object.keys(languages);
                } else {
                    return null;
                }

                // Convert integers to strings, so StringMatch.stringMatch can match it.
                if (option.type === "number" || option.valueType === "number") {
                    values = values.map(function (val) {
                        return val.toString();
                    });
          