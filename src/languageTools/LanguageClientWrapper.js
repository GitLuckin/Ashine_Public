/*
 * Copyright (c) 2019 - present Adobe. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*eslint no-console: 0*/
/*eslint indent: 0*/
/*eslint max-len: ["error", { "code": 200 }]*/
define(function (require, exports, module) {


    var ToolingInfo = JSON.parse(require("text!languageTools/ToolingInfo.json")),
        MESSAGE_FORMAT = {
            BRACKETS: "brackets",
            LSP: "lsp"
        };

    function _addTypeInformation(type, params) {
        return {
            type: type,
            params: params
        };
    }

    function hasValidProp(obj, prop) {
        return (obj && obj[prop] !== undefined && obj[prop] !== null);
    }

    function hasValidProps(obj, props) {
        var retval = !!obj,
            len = props.length,
            i;

        for (i = 0; retval && (i < len); i++) {
            retval = (retval && obj[props[i]] !== undefined && obj[props[i]] !== null);
        }

        return retval;
    }
    /*
        RequestParams creator - sendNotifications/request
    */
    function validateRequestParams(type, params) {
        var validatedParams = null;

        params = params || {};

        //Don't validate if the formatting is done by the caller
        if (params.format === MESSAGE_FORMAT.LSP) {
            return params;
        }

        switch (type) {
            case ToolingInfo.LANGUAGE_SERVICE.START:
                {
                    if (hasValidProp(params, "rootPaths") || hasValidProp(params, "rootPath")) {
                        validatedParams = params;
                        validatedParams.capabilities = validatedParams.capabilities || false;
                    }
                    break;
                }
            case ToolingInfo.FEATURES.CODE_HINTS:
            case ToolingInfo.FEATURES.PARAMETER_HINTS:
            case ToolingInfo.FEATURES.JUMP_TO_DECLARATION:
            case ToolingInfo.FEATURES.JUMP_TO_DEFINITION:
            case ToolingInfo.FEATURES.JUMP_TO_IMPL:
                {
                    if (hasValidProps(params, ["filePath", "cursorPos"])) {
                        validatedParams = params;
                    }
                    break;
                }
            case ToolingInfo.FEATURES.CODE_HINT_INFO:
                {
                    validatedParams = params;
                    break;
                }
            case ToolingInfo.FEATURES.FIND_REFERENCES:
                {
                    if (hasValidProps(params, ["filePath", "cursorPos"])) {
                        validatedParams = params;
                        validatedParams.includeDeclaration = validatedParams.includeDeclaration || false;
                    }
                    break;
                }
            case ToolingInfo.FEATURES.DOCUMENT_SYMBOLS:
                {
                    if (hasValidProp(params, "filePath")) {
                        validatedParams = params;
                    }
                    break;
                }
            case ToolingInfo.FEATURES.PROJECT_SYMBOLS:
                {
                    if (hasValidProp(params, "query") && typeof params.query === "string") {
                        validatedParams = params;
                    }
                    break;
                }
            case ToolingInfo.LANGUAGE_SERVICE.CUSTOM_REQUEST:
                {
                    validatedParams = params;
                }
        }

        return validatedParams;
    }

    /*
        ReponseParams transformer - used by OnNotifications
    */
    function validateNotificationParams(type, params) {
        var validatedParams = null;

        params = params || {};

        //Don't validate if the formatting is done by the caller
        if (params.format === MESSAGE_FORMAT.LSP) {
            return params;
        }

        switch (type) {
            case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_OPENED:
                {
                    if (hasValidProps(params, ["filePath", "fileContent", "languageId"])) {
                        validatedParams = params;
                    }
                    break;
                }
            case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CHANGED:
                {
                    if (hasValidProps(params, ["filePath", "fileContent"])) {
                        validatedParams = params;
                    }
                    break;
                }
            case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_SAVED:
                {
                    if (hasValidProp(params, "filePath")) {
                        validatedParams = params;
                    }
                    break;
                }
            case ToolingInfo.SYNCHRONIZE_EVENTS.DOCUMENT_CLOSED:
                {
                    if (hasValidProp(params, "filePath")) {
                        validatedParams = params;
                    }
                    break;
                }
            case ToolingInfo.SYNCHRONIZE_EVENTS.PROJECT_FOLDERS_CHANGED:
                {
                    if (hasValidProps(params, ["foldersAdded", "foldersRemoved"])) {
                        validatedParams = params;
                    }
                    break;
                }
            case ToolingInfo.LANGUAGE_SERVICE.CUSTOM_NOTIFICATION:
                {
                    validatedParams = params;
                }
        }

        return validatedParams;
    }

    function validateHandler(handler) {
        var retval = false;

        if (handler && typeof handler === "function") {
            retval = true;
        } else {
            console.warn("Handler validation failed. Handler should be of type 'function'. Provided handler is of type :", typeof handler);
        }

        return retval;
    }

    function LanguageClientWrapper(name, path, domainInterface, languages) {
        this._name = name;
        this._path = path;
        this._domainInterface = domainInterface;
        this._languages = languages || [];
        this._startClient = null;
        this._stopClient = null;
        this._notifyClient = null;
        this._requestClient = null;
        this._onRequestHandler = {};
        this._onNotificationHandlers = {};
        this._dynamicCapabilities = {};
        this._serverCapabilities = {};

        //Initialize with keys for brackets events we want to tap into.
        this._onEventHandlers = {
            "activeEditorChange": [],
            "projectOpen": [],
            "beforeProjectClose": [],
            "dirtyFlagChange": [],
            "documentChange": [],
            "fileNameChange": [],
            "beforeAppClose": []
        };

        this._init();
    }

    LanguageClientWrapper.prototype._init = function () {
        this._domainInterface.registerMethods([
            {
                methodName: ToolingInfo.LANGUAGE_SERVICE.REQUEST,
                methodHandle: this._onRequestDelegator.bind(this)
            },
            {
                methodName: ToolingInfo.LANGUAGE_SERVICE.NOTIFY,
                methodHandle: this._onNotificationDelegator.bind(this)
            }
        ]);

        //create function interfaces
        this._startClient = this._domainInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.START, true);
        this._stopClient = this._domainInterface.createInterface(ToolingInfo.LANGUAGE_SERVICE.STOP, true);
        this._notifyClient = this._domainInterface.createInterface(ToolingInfo.LAN