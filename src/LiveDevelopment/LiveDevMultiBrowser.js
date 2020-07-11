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
        LiveDevelopmentUtils = require("LiveDevelopment/LiveDevelopmentUtils"),
        LiveDevServerManager = require("LiveDevelopment/LiveDevServerManager"),
        ServiceWorkerTransport  = require("LiveDevelopment/MultiBrowserImpl/transports/ServiceWorkerTransport"),
        LiveDevProtocol      = require("LiveDevelopment/MultiBrowserImpl/protocol/LiveDevProtocol"),
        Metrics              = require("utils/Metrics"),
        PageLoaderWorkerScript = require("text!LiveDevelopment/BrowserScripts/pageLoaderWorker.js");

    // Documents
    const LiveCSSDocument      = require("LiveDevelopment/MultiBrowserImpl/documents/LiveCSSDocument"),
        LiveHTMLDocument     = require("LiveDevelopment/MultiBrowserImpl/documents/LiveHTMLDocument");

    /**
     * @private
     * The live HTML document for the currently active preview.
     * @type {LiveHTMLDocument}
     */
    var _liveDocument;

    /**
     * Live preview only tracks the pinned document.
     * @type {boolean}
     */
    let livePreviewUrlPinned = false;

    /**
     * @private
     * Live documents related to the active HTML document - for example, CSS files
     * that are used by the document.
     * @type {Object.<string: {LiveHTMLDocument|LiveCSSDocument}>}
     */
    var _relatedDocuments = {};

    /**
     * @private
     * Protocol handler that provides the actual live development API on top of the current transport.
     */
    var _protocol = LiveDevProtocol;

    /**
     * @private
     * Current live preview server
     * @type {BaseServer}
     */
    var _server;

    /**
     * @private
     * Determine which live document class should be used for a given document
     * @param {Document} document The document we want to create a live document for.
     * @return {function} The constructor for the live document class; will be a subclass of LiveDocument.
     */
    function _classForDocument(doc) {
        if (doc.getLanguage().getId() === "css") {
            return LiveCSSDocument;
        }

        if (LiveDevelopmentUtils.isHtmlFileExt(doc.file.fullPath)) {
            return LiveHTMLDocument;
        }

        return null;
    }

    /**
     * Returns true if the global Live Development mode is on (might be in the middle of connecting).
     * @return {boolean}
     */
    function isActive() {
        return exports.status > STATUS_INACTIVE;
    }

    /**
     * Returns the live document for a given path, or null if there is no live document for it.
     * @param {string} path
     * @return {?LiveDocument}
     */
    function getLiveDocForPath(path) {
        if (!_server) {
            return null;
        }

        return _server.get(path);
    }

    /**
     * @private
     * Close a live document.
     * @param {LiveDocument}
     */
    function _closeDocument(liveDocument) {
        liveDocument.off(".livedev");
        _protocol.off(".livedev");
        liveDocument.close();
    }

    /**
     * Removes the given CSS/JSDocument from _relatedDocuments. Signals that the
     * given file is no longer associated with the HTML document that is live (e.g.
     * if the related file has been deleted on disk).
     * @param {string} url Absolute URL of the related document
     */
    function _handleRelatedDocumentDeleted(url) {
        var liveDoc = _relatedDocuments[url];
        if (liveDoc) {
            delete _relatedDocuments[url];
        }

        if (_server) {
            _server.remove(liveDoc);
        }
        _closeDocument(liveDoc);
    }

    /**
     * Update the status. Triggers a statusChange event.
     * @param {number} status new status
     * @param {?string} closeReason Optional string key suffix to display to
     *     user when closing the live development connection (see LIVE_DEV_* keys)
     */
    function _setStatus(status, closeReason) {
        // Don't send a notification when the status didn't actually change
        if (status === exports.status) {
            return;
        }

        exports.status = status;

        var reason = status === STATUS_INACTIVE ? closeReason : null;
        exports.trigger(EVENT_STATUS_CHANGE, status, reason);
    }

    /**
     * @private
     * Close all live documents.
     */
    function _closeDocuments() {
        if (_liveDocument) {
            _closeDocument(_liveDocument);
            _liveDocument = undefined;
        }

        Object.keys(_relatedDocuments).forEach(function (url) {
            _closeDocument(_relatedDocuments[url]);
            delete _relatedDocuments[url];
        });

        // Clear all documents from request filtering
        if (_server) {
            _server.clear();
        }
    }

    /**
     * @private
     * Returns the URL that we would serve the given path at.
     * @param {string} path
     * @return {string}
     */
    function _resolveUrl(path) {
        return _server && _server.pathToUrl(path);
    }

    /**
     * @private
     * Create a LiveDocument for a Brackets editor/document to manage communication between the
     * editor and the browser.
     * @param {Document} doc
     * @param {Editor} editor
     * @param {roots} roots
     * @return {?LiveDocument} The live document, or null if this type of file doesn't support live editing.
     */
    function _createLiveDocument(doc, editor, roots) {
        var DocClass = _classForDocument(doc),
            liveDocument;

        if (!DocClass) {
            return null;
        }

        liveDocument = new DocClass(_protocol, _resolveUrl, doc, editor, roots);

        liveDocument.on("errorStatusChanged.livedev", function (event, hasErrors) {
            if (isActive()) {
                _setStatus(hasErrors ? STATUS_SYNC_ERROR : STATUS_ACTIVE);
            }
        });

        return liveDocument;
    }

    /**
     * Documents are considered to be out-of-sync if they are dirty and
     * do not have "update while editing" support
     * @param {Document} doc
     * @return {boolean}
     */
    function _docIsOutOfSync(doc) {
        var liveDoc = _server && _server.get(doc.file.fullPath),
            isLiveEditingEnabled = liveDoc && liveDoc.isLiveEditingEnabled();

        return doc.isDirty && !isLiveEditingEnabled;
    }

    /**
     * Handles a notification from the browser that a stylesheet was loaded into
     * the live HTML document. If the stylesheet maps to a file in the project, then
     * creates a live document for the stylesheet and adds it to _relatedDocuments.
     * @param {$.Event} event
     * @param {string} url The URL of the stylesheet that was added.
     * @param {array} roots The URLs of the roots of the stylesheet (the css files loaded through <link>)
     */
    function _styleSheetAdded(event, url, roots) {
        var path = _server && _server.urlToPath(url),
            alreadyAdded = !!_relatedDocuments[url];

        // path may be null if loading an external stylesheet.
        // Also, the stylesheet may already exist and be reported as added twice
        // due to Chrome reporting added/removed events after incremental changes
        // are pushed to the browser
        if (!path || alreadyAdded) {
            return;
        }

        var docPromise = DocumentManager.getDocumentForPath(path);

        docPromise.done(function (doc) {
            if ((_classForDocument(doc) === LiveCSSDocument) &&
                    (!_liveDocument || (doc !== _liveDocument.doc))) {
                var liveDoc = _createLiveDocument(doc, doc._masterEditor, roots);
                if (liveDoc) {
                    _server.add(liveDoc);
                    _relatedDocuments[doc.url] = liveDoc;
                    liveDoc.on("updateDoc", function (event, url) {
                        var path = _server.urlToPath(url),
                            doc = getLiveDocForPath(path);
                        doc._updateBrowser();
                    });
                }
            }
        });
    }

    /**
     * @private
     * Determine an index file that can be used to start Live Development.
     * This function will inspect all files in a project to find the closest index file
     * available for currently opened document. We are searching for these files:
     *  - index.html
     *  - index.htm
     *
     * If the project is configured with a custom base url for live development, then
     * the list of possible index files is extended to contain these index files too:
     *  - index.php
     *  - index.php3
     *  - index.php4
     *  - index.php5
     *  - index.phtm
     *  - index.phtml
     *  - index.cfm
     *  - index.cfml
     *  - index.asp
     *  - index.aspx
     *  - index.jsp
     *  - index.jspx
     *  - index.shm
     *  - index.shml
     *
     * If a file was found, the promise will be resolved with the full path to this file. If no file
     * was found in the whole project tree, the promise will be resolved with null.
     *
     * @return {jQuery.Promise} A promise that is resolved with a full path
     * to a file if one could been determined, or null if there was no suitable index
     * file.
     */
    function _getInitialDocFromCurrent() {
        var doc = DocumentManager.getCurrentDocument(),
            refPath,
            i;

        // Is the currently opened document already a file we can use for Live Development?
        if (doc) {
            refPath = doc.file.fullPath;
            if (LiveDevelopmentUtils.isStaticHtmlFileExt(refPath) || LiveDevelopmentUtils.isServerHtmlFileExt(refPath)) {
                return new $.Deferred().resolve(doc);
            }
        }

        var result = new $.Deferred();

        var baseUrl = ProjectManager.getBaseUrl(),
            hasOwnServerForLiveDevelopment = (baseUrl && baseUrl.length);

        ProjectManager.getAllFiles().done(function (allFiles) {
            var projectRoot = ProjectManager.getProjectRoot().fullPath,
                containingFolder,
                indexFileFound = false,
                stillInProjectTree = true;

            if (refPath) {
                containingFolder = FileUtils.getDirectoryPath(refPath);
            } else {
                containingFolder = projectRoot;
            }

            var filteredFiltered = allFiles.filter(function (item) {
                var parent = FileUtils.getParentPath(item.fullPath);

                return (containingFolder.indexOf(parent) === 0);
            });

            var filterIndexFile = function (fileInfo) {
                if (fileInfo.fullPath.indexOf(containingFolder) === 0) {
                    if (FileUtils.getFilenameWithoutExtension(fileInfo.name) === "index") {
                        if (hasOwnServerForLiveDevelopment) {
                            if ((LiveDevelopmentUtils.isServerHtmlFileExt(fileInfo.name)) ||
                                    (LiveDevelopmentUtils.isStaticHtmlFileExt(fileInfo.name))) {
                                return true;
                            }
                        } else if (LiveDevelopmentUtils.isStaticHtmlFileExt(fileInfo.name)) {
                            return true;
                        }
                    } else {
                        return false;
                    }
                }
            };

            while (!indexFileFound && stillInProjectTree) {
                i = _.findIndex(filteredFiltered, filterIndexFile);

                // We found no good match
                if (i === -1) {
                    // traverse the directory tree up one level
                    containingFolder = FileUtils.getParentPath(containingFolder);
                    // Are we still inside the project?
                    if (containingFolder.indexOf(projectRoot) === -1) {
                        stillInProjectTree = false;
                    }
                } else {
                    indexFileFound = true;
                }
            }

            if (i !== -1) {
                DocumentManager.getDocumentForPath(filteredFiltered[i].fullPath).then(result.resolve, result.resolve);
                return;
            }

            result.resolve(null);
        });

        return result.promise();
    }

    /**
     * @private
     * Close the connection and the associated window
     * @param {boolean} doCloseWindow Use true to close the window/tab in the browser
     * @param {?string} reason Optional string key suffix to display to user (see LIVE_DEV_* keys)
     */
    function _close(doCloseWindow, reason) {
        if (exports.status !== STATUS_INACTIVE) {
            // Close live documents
            _closeDocuments();
            // Close all active connections
            _protocol.closeAllConnections();

            if (_server) {
                // Stop listening for requests when disconnected
                _server.stop();

                // Dispose server
                _server = null;
            }
        }
    //TODO: implement closeWindow together with launchers.
//        if (doCloseWindow) {
//
//        }
        _setStatus(STATUS_INACTIVE, reason || "explicit_close");
    }

    /**
     * Closes all active connections.
     * Returns a resolved promise for API compatibility.
     * @return {$.Promise} A resolved promise
     */
    function close() {
        _close(true);
        return new $.Deferred().resolve().promise();
    }

    /**
     * @private
     * Displays an error when the server for live development files can't be started.
     */
    function _showLiveDevServerNotReadyError() {
        Dialogs.showModalDialog(
            DefaultDialogs.DIALOG_ID_ERROR,
            Strings.LIVE_DEVELOPMENT_ERROR_TITLE,
            Strings.LIVE_DEV_SERVER_NOT_READY_MESSAGE
        );
    }

    /**
     * @private
     * Creates the main live document for a given HTML document and notifies the server it exists.
     * TODO: we should really maintain the list of live documents, not the server.
     * @param {Document} doc
     */
    function _createLiveDocumentForFrame(doc) {
        // create live document
        doc._ensureMasterEditor();
        _liveDocument = _createLiveDocument(doc, doc._masterEditor);
        _server.add(_liveDocument);
        _server.addVirtualContentAtPath(
            `${_liveDocument.doc.file.parentPath}${LiveDevProtocol.LIVE_DEV_REMOTE_SCRIPTS_FILE_NAME}`,
            _protocol.getRemoteScriptContents());
        _server.addVirtualContentAtPath(
            `${_liveDocument.doc.file.parentPath}${LiveDevProtocol.LIVE_DEV_REMOTE_WORKER_SCRIPTS_FILE_NAME}`,
            PageLoaderWorkerScript);
    }


     /**
     * Launches the given URL in the default browser.
     * @param {string} url
      * @param {string} fullPath
     * TODO: launchers for multiple browsers
     */
    function _launch(url, fullPath) {
        exports.trigger(EVENT_OPEN_PREVIEW_URL, {
            url,
            fullPath
        });
    }

    /**
     * @private
     * Launches the given document in the browser, given that a live document has already
     * been created for it.
     * @param {Document} doc
     */
    function _open(doc) {
        if (doc && _liveDocument && doc === _liveDocument.doc) {
            if (_server) {
                // Launch the URL in the browser. If it's the first one to connect back to us,
                // our status will transition to ACTIVE once it does so.
                if (exports.status < STATUS_ACTIVE) {
                    _launch(_resolveUrl(doc.file.fullPath), doc.file.fullPath);
                }
                if (exports.status === STATUS_RESTARTING) {
                    // change page in browser
                    _protocol.navigate(_resolveUrl(doc.file.fullPath));
                }

                _protocol
                    // TODO: timeout if we don't get a connection within a certain time
                    .on("ConnectionConnect.livedev", function (event, msg) {
                        // check for the first connection
                        if (_protocol.getConnectionIds().length === 1) {
                            // check the page that connection comes from matches the current live document session
                            if (_liveDocument &&  msg.url === _resolveUrl(_liveDocument.doc.file.fullPath)) {
                                _setStatus(STATUS_ACTIVE);
                            }
                        }
                        Metrics.countEvent(Metrics.EVENT_TYPE.LIVE_PREVIEW, "connect",
                            `${_protocol.getConnectionIds().length}-preview`);
                    })
                    .on("ConnectionClose.livedev", function (event, {clientId}) {
                        exports.trigger(EVENT_CONNECTION_CLOSE, {clientId});
                        window.logger.livePreview.log(
                            "Live Preview: Phoenix received ConnectionClose, live preview left: ",
                            _protocol.getConnectionIds().length, clientId);
                    })
                    // extract stylesheets and create related LiveCSSDocument instances
                    .on("DocumentRelated.livedev", function (event, msg) {
                        var relatedDocs = msg.related;
                        var docs = Object.keys(relatedDocs.stylesheets);
                        docs.forEach(function (url) {
                            _styleSheetAdded(null, url, relatedDocs.stylesheets[url]);
                        });
                    })
                    // create new LiveCSSDocument if a new stylesheet is added
                    .on("StylesheetAdded.livedev", function (event, msg) {
                        _styleSheetAdded(null, msg.href, msg.roots);
                    })
                    // remove LiveCSSDocument instance when stylesheet is removed
                    .on("StylesheetRemoved.livedev", function (event, msg) {
                        _handleRelatedDocumentDeleted(msg.href);
                    })
                    .on(LiveDevProtocol.EVENT_LIVE_PREVIEW_CLICKED + ".livedev", function (event, msg) {
                        exports.trigger(EVENT_LIVE_PREVIEW_CLICKED, msg);
                    });
            } else {
                console.error("LiveDevelopment._open(): No server active");
            }
        } else {
            // Unlikely that we would get to this state where
            // a connection is in process but there is no current
            // document
            close();
        }
    }

    /**
     * @private
     * Creates the live document in preparation for launching the
     * preview of the given document, then launches it. (The live document
     * must already exist before we launch it so that the server can
     * ask it for the instrumented version of the document when the browser
     * requests it.)
     * TODO: could probably just consolidate this with _open()
     * @param {Document} doc
     */
    function _doLaunchAfterServerReady(initialDoc) {

        _createLiveDocumentForFrame(initialDoc);

        // start listening for requests
        _server.start();

        // open browser to the url
        _open(initialDoc);
    }

    /**
     * @private
     * Create the server in preparation for opening a live preview.
     * @param {Document} doc The document we want the server for. Different servers handle
     * different types of project (a static server for when no app server is configured,
     * vs. a user server when there is an app server set in File > Project Settings).
     */
    function _prepareServer(doc) {
        var deferred = new $.Deferred(),
            showBaseUrlPrompt = false;

        _server = LiveDevServerManager.getServer(doc.file.fullPath);

        // Optionally prompt for a base URL if no server was found but the
        // file is a known server file extension
        showBaseUrlPrompt = !_server && LiveDevelopmentUtils.isServerHtmlFileExt(doc.file.fullPa