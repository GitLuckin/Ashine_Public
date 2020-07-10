/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2012 - 2021 Adobe Systems Incorporated. All rights reserved.
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
 * LiveDevelopment allows Brackets to launch a browser with a "live preview" that's
 * connected to the current editor.
 *
 * # STARTING
 *
 * To start a session call `open`. This will read the currentDocument from brackets,
 * launch it in the default browser, and connect to it for live editing.
 *
 * # STOPPING
 *
 * To stop a session call `close`. This will close the connection to the browser
 * (but will not close the browser tab).
 *
 * # STATUS
 *
 * Status updates are dispatched as `statusChange` jQuery events. The status
 * is passed as the first parameter and the reason for the change as the second
 * parameter. Currently only the "Inactive" status supports the reason parameter.
 * The status codes are:
 *
 *  0: Inactive
 *  1: Connecting (waiting for a browser connection)
 *  2: Active
 *  3: Out of sync
 *  4: Sync error
 *  5: Reloading (after saving JS changes)
 *  6: Restarting (switching context to a new HTML live doc)
 *
 * The reason codes are:
 * - null (Unknown reason)
 * - "explicit_close" (LiveDevelopment.close() was called)
 * - "navigated_away" (The browser changed to a location outside of the project)
 * - "detached_target_closed" (The tab or window was closed)
 */
define(function (require, exports, module) {


    // Status Codes
    const STATUS_INACTIVE      = exports.STATUS_INACTIVE       =  0;
    const STATUS_CONNECTING    = exports.STATUS_CONNECTING     =  1;
    const STATUS_ACTIVE        = exports.STATUS_ACTIVE         =  2;
    const STATUS_OUT_OF_SYNC   = exports.STATUS_OUT_OF_SYNC    =  3;
    const STATUS_SYNC_ERROR    = exports.STATUS_SYNC_ERROR     =  4;
    const STATUS_RELOADING     = exports.STATUS_RELOADING      =  5;
    const STATUS_RESTARTING    = exports.STATUS_RESTARTING     =  6;

    // events
    const EVENT_OPEN_PREVIEW_URL = "openPreviewURL",
        EVENT_CONNECTION_CLOSE = "ConnectionClose",
        EVENT_STATUS_CHANGE = "statusChange",
        EVENT_LIVE_PREVIEW_CLICKED= "livePreviewClicked";

    const Dialogs              = require("widgets/Dialogs"),
        DefaultDialogs       = require("widgets/DefaultDialogs"),
        DocumentManager      = require("document/DocumentManager"),
        EditorManager        = require("editor/EditorManager"),
        EventDispatcher      = require("utils/EventDispatcher"),
        FileUtils            = require("file/FileUtils"),
        MainViewManager      = require("view/MainViewManager"),
        PreferencesDialogs   = require("preferences/PreferencesDialogs"),
        ProjectManager       = require("project/ProjectManager"),
        Strings              = require("strings"),
        _                    = require("thirdparty/lodash"),
        LiveDevelopmentUtils = require("LiveDevelopment/Li