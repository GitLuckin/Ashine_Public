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
 * Initializes the default brackets menu items.
 */
define(function (require, exports, module) {


    var AppInit         = require("utils/AppInit"),
        Commands        = require("command/Commands"),
        Menus           = require("command/Menus"),
        Strings         = require("strings"),
        MainViewManager = require("view/MainViewManager"),
        CommandManager  = require("command/CommandManager");

    /**
     * Disables menu items present in items if enabled is true.
     * enabled is true if file is saved and present on user system.
     * @param {boolean} enabled
     * @param {array} items
     */
    function _setContextMenuItemsVisible(enabled, items) {
        items.forEach(function (item) {
            CommandManager.get(item).setEnabled(enabled);
        });
    }

    /**
     * Checks if file saved and present on system and
     * disables menu items accordingly
     */
    function _setMenuItemsVisible() {
        var file = MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE);
        if (file) {
            file.exists(function (err, isPresent) {
                if (err) {
                    return err;
                }
                _setContextMenuItemsVisible(isPresent, [Commands.FILE_RENAME, Commands.NAVIGATE_SHOW_IN_FILE_TREE]);
            });
        }
    }

    AppInit.htmlReady(function () {
        /*
         * File menu
         */
        var menu;
        menu = Menus.addMenu(Strings.FILE_MENU, Menus.AppMenuBar.FILE_MENU);
        menu.addMenuItem(Commands.FILE_NEW);
        menu.addMenuItem(Commands.FILE_NEW_FOLDER);
        menu.addMenuItem(Commands.FILE_OPEN_FOLDER);
        menu.addMenuItem(Commands.FILE_CLOSE);
        menu.addMenuItem(Commands.FILE_CLOSE_ALL);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.FILE_SAVE);
        menu.addMenuItem(Commands.FILE_SAVE_ALL);
        menu.addMenuItem(Commands.FILE_DOWNLOAD_PROJECT, undefined, undefined, undefined, {
            hideWhenCommandDisabled: true
        });
        // menu.addMenuItem(Commands.FILE_SAVE_AS); not yet available in phoenix
        // menu.addMenuItem(Commands.FILE_PROJECT_SETTINGS); not yet available in phoenix
        menu.addMenuDivider();
        menu.addMenuItem(Commands.FILE_EXTENSION_MANAGER);

        /*
         * Edit  menu
         */
        menu = Menus.addMenu(Strings.EDIT_MENU, Menus.AppMenuBar.EDIT_MENU);
        menu.addMenuItem(Commands.EDIT_UNDO);
        menu.addMenuItem(Commands.EDIT_REDO);
        menu.addMenuDivider();

        // TODO: add js handlers for copy and paste using browser standards.
        menu.addMenuItem(Commands.EDIT_CUT);
        menu.addMenuItem(Commands.EDIT_COPY);
        if(window.Phoenix.browser.isTauri || !window.Phoenix.browser.desktop.isFirefox){
            menu.addMenuItem(Commands.EDIT_PASTE);
        }
        menu.addMenuDivider();

        menu.addMenuItem(Commands.EDIT_SELECT_ALL);
        menu.addMenuItem(Commands.EDIT_SELECT_LINE);
        menu.addMenuItem(Commands.EDIT_SPLIT_SEL_INTO_LINES);
        menu.addMenuItem(Commands.EDIT_ADD_CUR_TO_PREV_LINE);
        menu.addMenuItem(Commands.EDIT_ADD_CUR_TO_NEXT_LINE);
        menu.addMenuDivider();
        menu.addMenuItem(Commands.EDIT_INDENT);
        menu.addMenuItem(Commands.EDIT_UNINDENT);
        menu.addMenuItem(Commands