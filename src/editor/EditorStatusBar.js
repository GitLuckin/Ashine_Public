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

/**
 * Manages parts of the status bar related to the current editor's state.
 */
define(function (require, exports, module) {


    // Load dependent modules
    var _                    = require("thirdparty/lodash"),
        AnimationUtils       = require("utils/AnimationUtils"),
        AppInit              = require("utils/AppInit"),
        DropdownButton       = require("widgets/DropdownButton").DropdownButton,
        EditorManager        = require("editor/EditorManager"),
        MainViewManager      = require("view/MainViewManager"),
        Editor               = require("editor/Editor").Editor,
        KeyEvent             = require("utils/KeyEvent"),
        LanguageManager      = require("language/LanguageManager"),
        PreferencesManager   = require("preferences/PreferencesManager"),
        StatusBar            = require("widgets/StatusBar"),
        Strings              = require("strings"),
        FileUtils            = require("file/FileUtils"),
        InMemoryFile         = require("document/InMemoryFile"),
        Dialogs              = require("widgets/Dialogs"),
        DefaultDialogs       = require("widgets/DefaultDialogs"),
        ProjectManager       = require("project/ProjectManager"),
        Async                = require("utils/Async"),
        FileSystem           = require("filesystem/FileSystem"),
        CommandManager       = require("command/CommandManager"),
        Commands             = require("command/Commands"),
        DocumentManager      = require("document/DocumentManager"),
        StringUtils          = require("utils/StringUtils"),
        Metrics              = require("utils/Metrics");

    var SupportedEncodingsText = require("text!supported-encodings.json"),
        SupportedEncodings = JSON.parse(SupportedEncodingsText);

    /* StatusBar indicators */
    var languageSelect, // this is a DropdownButton instance
        encodingSelect, // this is a DropdownButton instance
        $cursorInfo,
        $fileInfo,
        $indentType,
        $indentWidthLabel,
        $indentWidthInput,
        $statusOverwrite;

    /** Special list item for the 'set as default' gesture in language switcher dropdown */
    var LANGUAGE_SET_AS_DEFAULT = {};


    /**
     * Determine string based on count
     * @param {number} number Count
     * @param {string} singularStr Singular string
     * @param {string} pluralStr Plural string
     * @return {string} Proper string to use for count
     */
    function _formatCountable(number, singularStr, pluralStr) {
        return StringUtils.format(number > 1 ? pluralStr : singularStr, number);
    }

    /**
     * Update file mode
     * @param {Editor} editor Current editor
     */
    function _updateLanguageInfo(editor) {
        var doc = editor.document,
            lang = doc.getLanguage();

        // Show the current language as button title
        languageSelect.$button.text(lang.getName());
    }

    /**
     * Update encoding
     * @param {Editor} editor Current editor
     */
    function _updateEncodingInfo(editor) {
        var doc = editor.document;

        // Show the current encoding as button title
        if (!doc.file._encoding) {
            doc.file._encoding = "utf8";
        }
        encodingSelect.$button.text(doc.file._encoding);
    }

    /**
     * Update file information
     * @param {Editor} editor Current editor
     */
    function _updateFileInfo(editor) {
        var lines = editor.lineCount();
        $fileInfo.text(_formatCountable(lines, Strings.STATUSBAR_LINE_COUNT_SINGULAR, Strings.STATUSBAR_LINE_COUNT_PLURAL));
    }

    /**
     * Update indent type and size
     * @param {string} fullPath Path to file in current editor
     */
    function _updateIndentType(fullPath) {
        var indentWithTabs = Editor.getUseTabChar(fullPath);
        $indentType.text(indentWithTabs ? Strings.STATUSBAR_TAB_SIZE : Strings.STATUSBAR_SPACES);
        $indentType.attr("title", indentWithTabs ? Strings.STATUSBAR_INDENT_TOOLTIP_SPACES : Strings.STATUSBAR_INDENT_TOOLTIP_TABS);
        $indentWidthLabel.attr("title", indentWithTabs ? Strings.STATUSBAR_INDENT_SIZE_TOOLTIP_TABS : Strings.STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES);
    }

    /**
     * Get indent size based on type
     * @param {string} fullPath Path to file in current editor
     * @return {number} Indent size
     */
    function _getIndentSize(fullPath) {
        return Editor.getUseTabChar(fullPath) ? Editor.getTabSize(fullPath) : Editor.getSpaceUnits(fullPath);
    }

    /**
     * Update indent size
     * @param {string} fullPath Path to file in current editor
     */
    function _updateIndentSize(fullPath) {
        var size = _getIndentSize(fullPath);
        $indentWidthLabel.text(size);
        $indentWidthInput.val(size);
    }

    /**
     * Toggle indent type
     */
    function _toggleIndentType() {
        var current = EditorManager.getActiveEditor(),
            fullPath = current && current.document.file.fullPath;

        Editor.setUseTabChar(!Editor.getUseTabChar(fullPath), fullPath);
        _updateIndentType(fullPath);
        _updateIndentSize(fullPath);
    }

    /**
     * Update cursor(s)/selection(s) information
     * @param {Event} event (unused)
     * @param {Editor} editor Current editor
     */
    function _updateCursorInfo(event, editor) {
        editor = editor || EditorManager.getActiveEditor();

        // compute columns, account for tab size
        var cursor = editor.getCursorPos(true);

        var cursorStr = StringUtils.format(Strings.STATUSBAR_CURSOR_POSITION, cursor.line + 1, cursor.ch + 1);

        var sels = editor.getSelections(),
            selStr = "";

        if (sels.length > 1) {
            //Send analytics data for multicursor use
            Metrics.countEvent(
                Metrics.EVENT_TYPE.EDITOR,
                "multiCursor",
                "usage"
            );
            selStr = StringUtils.format(Strings.STATUSBAR_SELECTION_MULTIPLE, sels.length);
        } else if (editor.hasSelection()) {
            var sel = sels[0];
            if (sel.start.line !== sel.end.line) {
                var lines = sel.end.line - sel.start.line + 1;
                if (sel.end.ch === 0) {
                    lines--;  // end line is exclusive if ch is 0, inclusive otherwise
                }
                selStr = _formatCountable(lines, Strings.STATUSBAR_SELECTION_LINE_SINGULAR, Strings.STATUSBAR_SELECTION_LINE_PLURAL);
            } else {
                var cols = editor.getColOffset(sel.end) - editor.getColOffset(sel.start);  // end ch is exclusive always
                selStr = _formatCountable(cols, Strings.STATUSBAR_SELECTION_CH_SINGULAR, Strings.STATUSBAR_SELECTION_CH_PLURAL);
            }
        }
        $cursorInfo.text(cursorStr 