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


    var _                           = require("thirdparty/lodash"),
        Mustache                    = require("thirdparty/mustache/mustache"),
        Dialogs                     = require("widgets/Dialogs"),
        DefaultDialogs              = require("widgets/DefaultDialogs"),
        FileSystem                  = require("filesystem/FileSystem"),
        FileUtils                   = require("file/FileUtils"),
        Package                     = require("extensibility/Package"),
        Strings                     = require("strings"),
        StringUtils                 = require("utils/StringUtils"),
        Commands                    = require("command/Commands"),
        CommandManager              = require("command/CommandManager"),
        InstallExtensionDialog      = require("extensibility/InstallExtensionDialog"),
        ThemeManager                = require("view/ThemeManager"),
        AppInit                     = require("utils/AppInit"),
        Async                       = require("utils/Async"),
        KeyEvent                    = require("utils/KeyEvent"),
        ExtensionManager            = require("extensibility/ExtensionManager"),
        ExtensionManagerView        = require("extensibility/ExtensionManagerView").ExtensionManagerView,
        ExtensionManagerViewModel   = require("extensibility/ExtensionManagerViewModel"),
        PreferencesManager          = require("preferences/PreferencesManager"),
        Metrics                     = require("utils/Metrics");

    var dialogTemplate    = require("text!htmlContent/extension-manager-dialog.html");

    // bootstrap tabs component
    require("widgets/bootstrap-tab");

    var _activeTabIndex;

    function _stopEvent(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    /**
     * @private
     * Triggers changes requested by the di