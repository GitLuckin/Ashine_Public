
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

/*global Phoenix*/

/*
 * Throughout this file, the term "outer scope" is used to refer to the outer-
 * most/global/root Scope objects for particular file. The term "inner scope"
 * is used to refer to a Scope object that is reachable via the child relation
 * from an outer scope.
 */

define(function (require, exports, module) {


    var _ = require("thirdparty/lodash");

    const CodeMirror          = require("thirdparty/CodeMirror/lib/codemirror"),
        DefaultDialogs      = require("widgets/DefaultDialogs"),
        Dialogs             = require("widgets/Dialogs"),
        DocumentManager     = require("document/DocumentManager"),
        EditorManager       = require("editor/EditorManager"),
        FileSystem          = require("filesystem/FileSystem"),
        FileUtils           = require("file/FileUtils"),
        LanguageManager     = require("language/LanguageManager"),
        PreferencesManager  = require("preferences/PreferencesManager"),
        ProjectManager      = require("project/ProjectManager"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils"),
        InMemoryFile        = require("document/InMemoryFile"),
        IndexingWorker      = require("worker/IndexingWorker");

    IndexingWorker.loadScriptInWorker(`${Phoenix.baseURL}JSUtils/worker/tern-main.js`);

    var HintUtils           = require("./HintUtils"),
        MessageIds          = JSON.parse(require("text!./MessageIds.json")),
        Preferences         = require("./Preferences");

    let ternEnvironment     = [],
        ternConfigInitDone        = false,
        pendingTernRequests = {},
        builtinLibraryNames = [],
        isDocumentDirty     = false,
        _hintCount          = 0,
        currentModule       = null,
        documentChanges     = null,     // bounds of document changes
        preferences         = null,
        deferredPreferences = null;


    const MAX_HINTS           = 30,  // how often to reset the tern server
        LARGE_LINE_CHANGE   = 100,
        LARGE_LINE_COUNT    = 10000,
        OFFSET_ZERO         = {line: 0, ch: 0};

    var config = {};

    /**
     *  An array of library names that contain JavaScript builtins definitions.
     *
     * @return {Array.<string>} - array of library  names.
     */
    function getBuiltins() {
        return builtinLibraryNames;
    }

    /**
     * Read in the json files that have type information for the builtins, dom,etc
     */
    function initTernEnv() {
        const builtinDefinitionFiles = JSON.parse(require("text!thirdparty/tern/defs/defs.json"));

        for(let fileName of builtinDefinitionFiles){
            let fileUrl = `${Phoenix.baseURL}thirdparty/tern/defs/${fileName}`;
            console.log("loading tern definition file: ", fileUrl);
            fetch(fileUrl)
                .then(async contents =>{
                    const ternDefsLibrary = await contents.json();
                    builtinLibraryNames.push(ternDefsLibrary["!name"]);
                    ternEnvironment.push(ternDefsLibrary);
                })
                .catch(e =>{
                    console.error("failed to init from tern definition file " + fileName, e);
                });
        }
    }

    initTernEnv();

    /**
     *  Init preferences from a file in the project root or builtin
     *  defaults if no file is found;
     *
     *  @param {string=} projectRootPath - new project root path. Only needed
     *  for unit tests.
     */
    function initPreferences(projectRootPath) {

        // Reject the old preferences if they have not completed.
        if (deferredPreferences && deferredPreferences.state() === "pending") {
            deferredPreferences.reject();
        }

        deferredPreferences = $.Deferred();
        var pr = ProjectManager.getProjectRoot();

        // Open preferences relative to the project root
        // Normally there is a project root, but for unit tests we need to
        // pass in a project root.
        if (pr) {
            projectRootPath = pr.fullPath;
        } else if (!projectRootPath) {
            console.log("initPreferences: projectRootPath has no value. Using Defaults.");
            preferences = new Preferences();
            return;
        }

        var path = projectRootPath + Preferences.FILE_NAME;

        preferences = new Preferences();
        FileSystem.resolve(path, function (err, file) {
            if (!err) {
                FileUtils.readAsText(file).done(function (text) {
                    var configObj = null;
                    try {
                        configObj = JSON.parse(text);
                    } catch (e) {
                        // continue with null configObj which will result in
                        // default settings.
                        console.log("Error parsing preference file: " + path);
                        if (e instanceof SyntaxError) {
                            console.log(e.message);
                        }
                    }
                    preferences = new Preferences(configObj);
                    deferredPreferences.resolve();
                }).fail(function (error) {
                    preferences = new Preferences();
                    deferredPreferences.resolve();
                });
            } else {
                deferredPreferences.resolve();
            }
        });
    }

    /**
     * Will initialize preferences only if they do not exist.
     *
     */
    function ensurePreferences() {
        if (!deferredPreferences) {
            initPreferences();
        }
    }

    /**
     * Send a message to the tern module - if the module is being initialized,
     * the message will not be posted until initialization is complete
     */
    function postMessage(msg) {
        if (currentModule) {
            currentModule.postMessage(msg);
        }
    }

    /**
     * Test if the directory should be excluded from analysis.
     *
     * @param {!string} path - full directory path.
     * @return {boolean} true if excluded, false otherwise.
     */
    function isDirectoryExcluded(path) {
        var excludes = preferences.getExcludedDirectories();

        if (!excludes) {
            return false;
        }

        var testPath = ProjectManager.makeProjectRelativeIfPossible(path);
        testPath = FileUtils.stripTrailingSlash(testPath);

        return excludes.test(testPath);
    }

    /**
     * Test if the file path is in current editor
     *
     * @param {string} filePath file path to test for exclusion.
     * @return {boolean} true if in editor, false otherwise.
     */
    function isFileBeingEdited(filePath) {
        var currentEditor   = EditorManager.getActiveEditor(),
            currentDoc      = currentEditor && currentEditor.document;

        return (currentDoc && currentDoc.file.fullPath === filePath);
    }

    /**
     * Test if the file path is an internal exclusion.
     *
     * @param {string} path file path to test for exclusion.
     * @return {boolean} true if excluded, false otherwise.
     */
    function isFileExcludedInternal(path) {
        // The detectedExclusions are files detected to be troublesome with current versions of Tern.
        // detectedExclusions is an array of full paths.
        var detectedExclusions = PreferencesManager.get("jscodehints.detectedExclusions") || [];
        if (detectedExclusions && detectedExclusions.indexOf(path) !== -1) {
            return true;
        }

        return false;
    }

    /**
     * Test if the file should be excluded from analysis.
     *
     * @param {!File} file - file to test for exclusion.
     * @return {boolean} true if excluded, false otherwise.
     */
    function isFileExcluded(file) {
        if (file.name[0] === ".") {
            return true;
        }

        var languageID = LanguageManager.getLanguageForPath(file.fullPath).getId();
        if (languageID !== HintUtils.LANGUAGE_ID) {
            return true;
        }

        var excludes = preferences.getExcludedFiles();
        if (excludes && excludes.test(file.name)) {
            return true;
        }

        if (isFileExcludedInternal(file.fullPath)) {
            return true;
        }

        return false;
    }

    /**
     * Add a pending request waiting for the tern-module to complete.
     * If file is a detected exclusion, then reject request.
     *
     * @param {string} file - the name of the file
     * @param {{line: number, ch: number}} offset - the offset into the file the request is for
     * @param {string} type - the type of request
     * @return {jQuery.Promise} - the promise for the request
     */
    function addPendingRequest(file, offset, type) {
        var requests,
            key = file + "@" + offset.line + "@" + offset.ch,
            $deferredRequest;

        // Reject detected exclusions
        if (isFileExcludedInternal(file)) {
            return (new $.Deferred()).reject().promise();
        }

        if (_.has(pendingTernRequests, key)) {
            requests = pendingTernRequests[key];
        } else {
            requests = {};
            pendingTernRequests[key] = requests;
        }

        if (_.has(requests, type)) {
            $deferredRequest = requests[type];
        } else {
            requests[type] = $deferredRequest = new $.Deferred();
        }
        return $deferredRequest.promise();
    }

    /**
     * Get any pending $.Deferred object waiting on the specified file and request type
     * @param {string} file - the file
     * @param {{line: number, ch: number}} offset - the offset into the file the request is for
     * @param {string} type - the type of request
     * @return {jQuery.Deferred} - the $.Deferred for the request
     */
    function getPendingRequest(file, offset, type) {
        var key = file + "@" + offset.line + "@" + offset.ch;
        if (_.has(pendingTernRequests, key)) {
            var requests = pendingTernRequests[key],
                requestType = requests[type];

            delete pendingTernRequests[key][type];

            if (!Object.keys(requests).length) {
                delete pendingTernRequests[key];
            }

            return requestType;
        }
    }

    /**
     * @param {string} file a relative path
     * @return {string} returns the path we resolved when we tried to parse the file, or undefined
     */
    function getResolvedPath(file) {
        return currentModule.getResolvedPath(file);
    }

    /**
     * Get a Promise for the definition from TernJS, for the file & offset passed in.
     * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
     * - type of update, name of file, and the text of the update.
     * For "full" updates, the whole text of the file is present. For "part" updates,
     * the changed portion of the text. For "empty" updates, the file has not been modified
     * and the text is empty.
     * @param {{line: number, ch: number}} offset - the offset in the file the hints should be calculate at
     * @return {jQuery.Promise} - a promise that will resolve to definition when
     *      it is done
     */
    function getJumptoDef(fileInfo, offset) {
        postMessage({
            type: MessageIds.TERN_JUMPTODEF_MSG,
            fileInfo: fileInfo,
            offset: offset
        });

        return addPendingRequest(fileInfo.name, offset, MessageIds.TERN_JUMPTODEF_MSG);
    }

    /**
     * check to see if the text we are sending to Tern is too long.
     * @param {string} the text to check
     * @return {string} the text, or the empty text if the original was too long
     */
    function filterText(text) {
        var newText = text;
        if (text.length > preferences.getMaxFileSize()) {
            newText = "";
        }
        return newText;
    }

    /**
     * Get the text of a document, applying any size restrictions
     * if necessary
     * @param {Document} document - the document to get the text from
     * @return {string} the text, or the empty text if the original was too long
     */
    function getTextFromDocument(document) {
        var text = document.getText();
        text = filterText(text);
        return text;
    }

    /**
     * Handle the response from the tern node domain when
     * it responds with the references
     *
     * @param response - the response from the node domain
     */
    function handleRename(response) {

        if (response.error) {
            // todo: we need to show this error message, but it will cause problems with the
            // highlight references feature which use the same code. Rn, if tern rename fails, we do nothing.
            // EditorManager.getActiveEditor().displayErrorMessageAtCursor(response.error);
            return;
        }

        let file = response.file,
            offset = response.offset;

        let $deferredFindRefs = getPendingRequest(file, offset, MessageIds.TERN_REFS);

        if ($deferredFindRefs) {
            $deferredFindRefs.resolveWith(null, [response]);
        }
    }

    /**
     * Request Jump-To-Definition from Tern.
     *
     * @param {session} session - the session
     * @param {Document} document - the document
     * @param {{line: number, ch: number}} offset - the offset into the document
     * @return {jQuery.Promise} - The promise will not complete until tern
     *      has completed.
     */
    function requestJumptoDef(session, document, offset) {
        var path    = document.file.fullPath,
            fileInfo = {
                type: MessageIds.TERN_FILE_INFO_TYPE_FULL,
                name: path,
                offsetLines: 0,
                text: filterText(session.getJavascriptText())
            };

        var ternPromise = getJumptoDef(fileInfo, offset);

        return {promise: ternPromise};
    }

    /**
     * Handle the response from the tern node domain when
     * it responds with the definition
     *
     * @param response - the response from the node domain
     */
    function handleJumptoDef(response) {

        var file = response.file,
            offset = response.offset;

        var $deferredJump = getPendingRequest(file, offset, MessageIds.TERN_JUMPTODEF_MSG);

        if ($deferredJump) {
            response.fullPath = getResolvedPath(response.resultFile);
            $deferredJump.resolveWith(null, [response]);
        }
    }

    /**
     * Handle the response from the tern node domain when
     * it responds with the scope data
     *
     * @param response - the response from the node domain
     */
    function handleScopeData(response) {
        var file = response.file,
            offset = response.offset;

        var $deferredJump = getPendingRequest(file, offset, MessageIds.TERN_SCOPEDATA_MSG);

        if ($deferredJump) {
            $deferredJump.resolveWith(null, [response]);
        }
    }

    /**
     * Get a Promise for the completions from TernJS, for the file & offset passed in.
     *
     * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
     * - type of update, name of file, and the text of the update.
     * For "full" updates, the whole text of the file is present. For "part" updates,
     * the changed portion of the text. For "empty" updates, the file has not been modified
     * and the text is empty.
     * @param {{line: number, ch: number}} offset - the offset in the file the hints should be calculate at
     * @param {boolean} isProperty - true if getting a property hint,
     * otherwise getting an identifier hint.
     * @return {jQuery.Promise} - a promise that will resolve to an array of completions when
     *      it is done
     */
    function getTernHints(fileInfo, offset, isProperty) {

        /**
         *  If the document is large and we have modified a small portions of it that
         *  we are asking hints for, then send a partial document.
         */
        postMessage({
            type: MessageIds.TERN_COMPLETIONS_MSG,
            fileInfo: fileInfo,
            offset: offset,
            isProperty: isProperty
        });

        return addPendingRequest(fileInfo.name, offset, MessageIds.TERN_COMPLETIONS_MSG);
    }

    /**
     * Get a Promise for the function type from TernJS.
     * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
     * - type of update, name of file, and the text of the update.
     * For "full" updates, the whole text of the file is present. For "part" updates,
     * the changed portion of the text. For "empty" updates, the file has not been modified
     * and the text is empty.
     * @param {{line:number, ch:number}} offset - the line, column info for what we want the function type of.
     * @return {jQuery.Promise} - a promise that will resolve to the function type of the function being called.
     */
    function getTernFunctionType(fileInfo, offset) {
        postMessage({
            type: MessageIds.TERN_CALLED_FUNC_TYPE_MSG,
            fileInfo: fileInfo,
            offset: offset
        });

        return addPendingRequest(fileInfo.name, offset, MessageIds.TERN_CALLED_FUNC_TYPE_MSG);
    }


    /**
     *  Given a starting and ending position, get a code fragment that is self contained
     *  enough to be compiled.
     *
     * @param {!Session} session - the current session
     * @param {{line: number, ch: number}} start - the starting position of the changes
     * @return {{type: string, name: string, offsetLines: number, text: string}}
     */
    function getFragmentAround(session, start) {
        var minIndent = null,
            minLine   = null,
            endLine,
            cm        = session.editor._codeMirror,
            tabSize   = cm.getOption("tabSize"),
            document  = session.editor.document,
            p,
            min,
            indent,
            line;

        // expand range backwards
        for (p = start.line - 1, min = Math.max(0, p - 100); p >= min; --p) {
            line = session.getLine(p);
            var fn = line.search(/\bfunction\b/);

            if (fn >= 0) {
                indent = CodeMirror.countColumn(line, null, tabSize);
                if (minIndent === null || minIndent > indent) {
                    if (session.getToken({line: p, ch: fn + 1}).type === "keyword") {
                        minIndent = indent;
                        minLine = p;
                    }
                }
            }
        }

        if (minIndent === null) {
            minIndent = 0;
        }

        if (minLine === null) {
            minLine = min;
        }

        var max = Math.min(cm.lastLine(), start.line + 100),
            endCh = 0;

        for (endLine = start.line + 1; endLine < max; ++endLine) {
            line = cm.getLine(endLine);

            if (line.length > 0) {
                indent = CodeMirror.countColumn(line, null, tabSize);
                if (indent <= minIndent) {
                    endCh = line.length;
                    break;
                }
            }
        }

        var from = {line: minLine, ch: 0},
            to   = {line: endLine, ch: endCh};

        return {type: MessageIds.TERN_FILE_INFO_TYPE_PART,
            name: document.file.fullPath,
            offsetLines: from.line,
            text: document.getRange(from, to)};
    }


    /**
     * Get an object that describes what tern needs to know about the updated
     * file to produce a hint. As a side-effect of this calls the document
     * changes are reset.
     *
     * @param {!Session} session - the current session
     * @param {boolean=} preventPartialUpdates - if true, disallow partial updates.
     * Optional, defaults to false.
     * @return {{type: string, name: string, offsetLines: number, text: string}}
     */
    function getFileInfo(session, preventPartialUpdates) {
        var start = session.getCursor(),
            end = start,
            document = session.editor.document,
            path = document.file.fullPath,
            isHtmlFile = LanguageManager.getLanguageForPath(path).getId() === "html",
            result;

        if (isHtmlFile) {
            result = {type: MessageIds.TERN_FILE_INFO_TYPE_FULL,
                name: path,
                text: session.getJavascriptText()};
        } else if (!documentChanges) {
            result = {type: MessageIds.TERN_FILE_INFO_TYPE_EMPTY,
                name: path,
                text: ""};
        } else if (!preventPartialUpdates && session.editor.lineCount() > LARGE_LINE_COUNT &&
                (documentChanges.to - documentChanges.from < LARGE_LINE_CHANGE) &&
                documentChanges.from <= start.line &&
                documentChanges.to > end.line) {
            result = getFragmentAround(session, start);
        } else {
            result = {type: MessageIds.TERN_FILE_INFO_TYPE_FULL,
                name: path,
                text: getTextFromDocument(document)};
        }

        documentChanges = null;
        return result;
    }

    /**
     *  Get the current offset. The offset is adjusted for "part" updates.
     *
     * @param {!Session} session - the current session
     * @param {{type: string, name: string, offsetLines: number, text: string}} fileInfo
     * - type of update, name of file, and the text of the update.
     * For "full" updates, the whole text of the file is present. For "part" updates,
     * the changed portion of the text. For "empty" updates, the file has not been modified
     * and the text is empty.
     * @param {{line: number, ch: number}=} offset - the default offset (optional). Will
     * use the cursor if not provided.
     * @return {{line: number, ch: number}}
     */
    function getOffset(session, fileInfo, offset) {
        var newOffset;

        if (offset) {
            newOffset = {line: offset.line, ch: offset.ch};
        } else {
            newOffset = session.getCursor();
        }

        if (fileInfo.type === MessageIds.TERN_FILE_INFO_TYPE_PART) {
            newOffset.line = Math.max(0, newOffset.line - fileInfo.offsetLines);
        }

        return newOffset;
    }

    /**
     * Get a Promise for all of the known properties from TernJS, for the directory and file.
     * The properties will be used as guesses in tern.
     * @param {Session} session - the active hinting session
     * @param {Document} document - the document for which scope info is
     *      desired
     * @return {jQuery.Promise} - The promise will not complete until the tern
     *      request has completed.
     */
    function requestGuesses(session, document) {
        var $deferred = $.Deferred(),
            fileInfo = getFileInfo(session),
            offset = getOffset(session, fileInfo);

        postMessage({
            type: MessageIds.TERN_GET_GUESSES_MSG,
            fileInfo: fileInfo,
            offset: offset
        });

        var promise = addPendingRequest(fileInfo.name, offset, MessageIds.TERN_GET_GUESSES_MSG);
        promise.done(function (guesses) {
            session.setGuesses(guesses);
            $deferred.resolve();
        }).fail(function () {
            $deferred.reject();
        });

        return $deferred.promise();
    }

    /**
     * Handle the response from the tern node domain when
     * it responds with the list of completions
     *
     * @param {{file: string, offset: {line: number, ch: number}, completions:Array.<string>,
     *          properties:Array.<string>}} response - the response from node domain
     */
    function handleTernCompletions(response) {

        var file = response.file,
            offset = response.offset,
            completions = response.completions,
            properties = response.properties,
            fnType  = response.fnType,
            type = response.type,
            error = response.error,
            $deferredHints = getPendingRequest(file, offset, type);

        if ($deferredHints) {
            if (error) {
                $deferredHints.reject();
            } else if (completions) {
                $deferredHints.resolveWith(null, [{completions: completions}]);
            } else if (properties) {
                $deferredHints.resolveWith(null, [{properties: properties}]);
            } else if (fnType) {
                $deferredHints.resolveWith(null, [fnType]);
            }
        }
    }

    /**
     * Handle the response from the tern node domain when
     * it responds to the get guesses message.
     *
     * @param {{file: string, type: string, offset: {line: number, ch: number},
     *      properties: Array.<string>}} response -
     *      the response from node domain contains the guesses for a
     *      property lookup.
     */
    function handleGetGuesses(response) {
        var path = response.file,
            type = response.type,
            offset = response.offset,
            $deferredHints = getPendingRequest(path, offset, type);

        if ($deferredHints) {
            $deferredHints.resolveWith(null, [response.properties]);
        }
    }

    /**
     * Handle the response from the tern node domain when
     * it responds to the update file message.
     *
     * @param {{path: string, type: string}} response - the response from node domain
     */
    function handleUpdateFile(response) {

        var path = response.path,
            type = response.type,
            $deferredHints = getPendingRequest(path, OFFSET_ZERO, type);

        if ($deferredHints) {
            $deferredHints.resolve();
        }
    }

    /**
     * Handle timed out inference
     *
     * @param {{path: string, type: string}} response - the response from node domain
     */
    function handleTimedOut(response) {

        var detectedExclusions  = PreferencesManager.get("jscodehints.detectedExclusions") || [],
            filePath            = response.file;

        // Don't exclude the file currently being edited
        if (isFileBeingEdited(filePath)) {
            return;
        }

        // Handle file that is already excluded
        if (detectedExclusions.indexOf(filePath) !== -1) {
            console.log("JavaScriptCodeHints.handleTimedOut: file already in detectedExclusions array timed out: " + filePath);
            return;
        }

        // Save detected exclusion in project prefs so no further time is wasted on it
        detectedExclusions.push(filePath);
        PreferencesManager.set("jscodehints.detectedExclusions", detectedExclusions, { location: { scope: "project" } });

        // Show informational dialog
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_INFO,
            Strings.DETECTED_EXCLUSION_TITLE,
            StringUtils.format(
                Strings.DETECTED_EXCLUSION_INFO,
                StringUtils.breakableUrl(filePath)
            ),
            [
                {
                    className: Dialogs.DIALOG_BTN_CLASS_PRIMARY,
                    id: Dialogs.DIALOG_BTN_OK,
                    text: Strings.OK
                }
            ]
        );
    }

    DocumentManager.on("dirtyFlagChange", function (event, changedDoc) {
        if (changedDoc.file.fullPath) {
            postMessage({
                type: MessageIds.TERN_UPDATE_DIRTY_FILE,
                name: changedDoc.file.fullPath,
                action: changedDoc.isDirty
            });
        }
    });

    // Clear dirty document list in tern node domain
    ProjectManager.on("beforeProjectClose", function () {
        postMessage({
            type: MessageIds.TERN_CLEAR_DIRTY_FILES_LIST
        });
    });

    /**
     * Encapsulate all the logic to talk to the tern module.  This will create
     * a new instance of a TernModule, which the rest of the hinting code can use to talk
     * to the tern node domain, without worrying about initialization, priming the pump, etc.
     *
     */
    function TernModule() {
        var ternPromise         = null,
            addFilesPromise     = null,
            rootTernDir         = null,
            projectRoot         = null,
            stopAddingFiles     = false,
            resolvedFiles       = {},       // file -> resolved file
            numInitialFiles     = 0,
            numResolvedFiles    = 0,
            numAddedFiles       = 0;

        /**
         * @param {string} file a relative path
         * @return {string} returns the path we resolved when we tried to parse the file, or undefined
         */
        function getResolvedPath(file) {
            return resolvedFiles[file];