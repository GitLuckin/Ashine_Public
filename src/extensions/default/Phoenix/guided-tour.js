
/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
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
    const NotificationUI = brackets.getModule("widgets/NotificationUI"),
        LiveDevelopment  = brackets.getModule("LiveDevelopment/main"),
        ExtensionInterface = brackets.getModule("utils/ExtensionInterface"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        MainViewManager  = brackets.getModule("view/MainViewManager"),
        CommandManager = brackets.getModule("command/CommandManager"),
        Commands = brackets.getModule("command/Commands"),
        Strings = brackets.getModule("strings"),
        Menus = brackets.getModule("command/Menus"),
        StringUtils = brackets.getModule("utils/StringUtils"),
        KeyBindingManager = brackets.getModule("command/KeyBindingManager"),
        Metrics = brackets.getModule("utils/Metrics"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        SurveyTemplate = require("text!html/survey-template.html"),
        NOTIFICATION_BACKOFF = 10000,
        GUIDED_TOUR_LOCAL_STORAGE_KEY = "guidedTourActions";

    const GITHUB_STARS_POPUP_TIME = 120000, // 2 min
        POWER_USER_SURVEY_TIME = 180000, // 3 min
        GENERAL_SURVEY_TIME = 600000, // 10 min
        TWO_WEEKS_IN_DAYS = 14,
        USAGE_COUNTS_KEY    = "healthDataUsage"; // private to phoenix, set from health data extension

    const userAlreadyDidAction = localStorage.getItem(GUIDED_TOUR_LOCAL_STORAGE_KEY)
        ? JSON.parse(localStorage.getItem(GUIDED_TOUR_LOCAL_STORAGE_KEY)) : {
            version: 1,
            clickedNewProjectIcon: false,
            beautifyCodeShown: false,
            generalSurveyShownVersion: 0
        };

    // we should only show one notification at a time
    let currentlyShowingNotification;

    function _shouldContinueCommandTracking() {
        return (!userAlreadyDidAction.clickedNewProjectIcon); // use or ||
    }

    function _startCommandTracking() {
        if(!_shouldContinueCommandTracking()){
            return;
        }
        function commandTracker(_event, commandID) {
            let write = false;
            switch(commandID) {
            case Commands.FILE_NEW_PROJECT: userAlreadyDidAction.clickedNewProjectIcon = true; write = true; break;
            }
            if(write){
                localStorage.setItem(GUIDED_TOUR_LOCAL_STORAGE_KEY, JSON.stringify(userAlreadyDidAction));
            }
            if(!_shouldContinueCommandTracking()){
                CommandManager.off(CommandManager.EVENT_BEFORE_EXECUTE_COMMAND, commandTracker);
            }
        }
        CommandManager.on(CommandManager.EVENT_BEFORE_EXECUTE_COMMAND, commandTracker);
    }

    /* Order of things in first boot now:
    *  1. First we show the popup in new project window to select default project - see the html in assets folder
    *  2. Then after user opens default project, we show "edit code for live preview popup"
    *  3. When user changes file by clicking on files panel, we show "click here to open new project window"
    *     this will continue showing every session until user clicks on the new project icon
    *  4. After about 2 minutes, the GitHub stars popup will show, if not shown in the past two weeks. Repeats 2 weeks.
    *  5. After about 3 minutes, the health popup will show up.
    *  6. power user survey shows up if the user has used brackets for 3 days or 8 hours in the last two weeks after 3
    *     minutes. This will not coincide with health popup due to the power user check.
    *  7. After about 10 minutes, survey shows up.
    *  // the rest are by user actions
    *  a. When user clicks on live preview, we show "click here to popout live preview"
    *  b. Beautification notification when user opened the editor context menu and have not done any beautification yet.
    * */

    // 3. Beautification notification when user opened the editor context menu for the first time
    function _showBeautifyNotification() {
        if(userAlreadyDidAction.beautifyCodeShown){
            return;
        }
        let editorContextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
        function _showNotification() {
            if(currentlyShowingNotification){
                return;
            }
            setTimeout(()=>{
                let keyboardShortcut = KeyBindingManager.getKeyBindings(Commands.EDIT_BEAUTIFY_CODE);
                keyboardShortcut = (keyboardShortcut && keyboardShortcut[0]) ? keyboardShortcut[0].displayKey : "-";
                userAlreadyDidAction.beautifyCodeShown =  true;
                localStorage.setItem(GUIDED_TOUR_LOCAL_STORAGE_KEY, JSON.stringify(userAlreadyDidAction));
                Metrics.countEvent(Metrics.EVENT_TYPE.UI, "guide", "beautify");
                currentlyShowingNotification = NotificationUI.createFromTemplate(
                    StringUtils.format(Strings.BEAUTIFY_CODE_NOTIFICATION, keyboardShortcut),
                    "editor-context-menu-edit.beautifyCode", {
                        allowedPlacements: ['left', 'right'],
                        autoCloseTimeS: 15,
                        dismissOnClick: true}
                );
                currentlyShowingNotification.done(()=>{
                    currentlyShowingNotification = null;
                });
                editorContextMenu.off(Menus.EVENT_BEFORE_CONTEXT_MENU_OPEN, _showNotification);
            }, 500);
        }
        editorContextMenu.on(Menus.EVENT_BEFORE_CONTEXT_MENU_OPEN, _showNotification);
    }

    // 3. When user changes file by clicking on files panel, we show "click here to open new project window"
    // this will continue showing every session until user clicks on the new project icon
    function _showNewProjectNotification() {
        if(userAlreadyDidAction.clickedNewProjectIcon){
            return;
        }
        function _showNotification() {
            if(currentlyShowingNotification){
                return;
            }
            Metrics.countEvent(Metrics.EVENT_TYPE.UI, "guide", "newProj");
            currentlyShowingNotification = NotificationUI.createFromTemplate(Strings.NEW_PROJECT_NOTIFICATION,
                "newProject", {
                    allowedPlacements: ['top', 'bottom'],
                    autoCloseTimeS: 15,
                    dismissOnClick: true}
            );
            currentlyShowingNotification.done(()=>{
                currentlyShowingNotification = null;