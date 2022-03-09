/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2014 - 2021 Adobe Systems Incorporated. All rights reserved.
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

/*
 * UI and controller logic for find/replace across multiple files within the project.
 *
 * FUTURE:
 *  - Handle matches that span multiple lines
 */
define(function (require, exports, module) {


    var AppInit           = require("utils/AppInit"),
        CommandManager    = require("command/CommandManager"),
        Commands          = require("command/Commands"),
        Dialogs           = require("widgets/Dialogs"),
        DefaultDialogs    = require("widgets/DefaultDialogs"),
        EditorManager     = require("editor/EditorManager"),
        WorkspaceManager  = require("view/WorkspaceManager"),
        FileFilters       = require("search/FileFilters"),
        FileUtils         = require("file/FileUtils"),
        FindBar           = require("search/FindBar").FindBar,
        FindInFiles       = require("search/FindInFiles"),
        FindUtils         = require("search/FindUtils"),
        InMemoryFile      = require("document/InMemoryFile"),
        ProjectManager    = require("project/ProjectManager"),
        SearchResultsView = require("search/SearchResultsView").SearchResultsView,
        StatusBar         = require("widgets/StatusBar"),
        Strings           = require("strings"),
        StringUtils       = require("utils/StringUtils"),
        Metrics           = require("utils/Metrics"),
        _                 = require("thirdparty/lodash");


    /** @const Maximum number of files to do replacements in-memory instead of on disk. */
    var MAX_IN_MEMORY = 20;

    /** @type {SearchResultsView} The results view. Initialized in htmlReady() */
    var _resultsView = null;

    /** @type {FindBar} Find bar containing the search UI. */
    var _findBar = null;

    /**
     * @private
     * Forward declaration for JSLint.
     * @type {Function}
     */
    var _finishReplaceBatch;

    /**
     * Does a search in the given scope with the given filter. Shows the result list once the search is complete.
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo Query info object
     * @param {?Entry} scope Project file/subfolder to search within; else searches whole project.
     * @param {?string} filter A "compiled" filter as returned by FileFilters.compile(), or null for no filter
     * @param {?string} replaceText If this is a replacement, the text to replace matches with.
     * @param {?$.Promise} candidateFilesPromise If specified, a promise that should resolve with the same set of files that
     *      getCandidateFiles(scope) would return.
     * @return {$.Promise} A promise that's resolved with the search results or rejected when the find competes.
     */
    function searchAndShowResults(queryInfo, scope, filter, replaceText, candidateFilesPromise) {
        return FindInFiles.doSearchInScope(queryInfo, scope, filter, replaceText, candidateFilesPromise)
            .done(function (zeroFilesToken) {
                // Done searching all files: show results
                if (FindInFiles.searchModel.hasResults()) {
                    _resultsView.open();

                    if (_findBar) {
                        _findBar.enable(true);
                        _findBar.focus();
                    }

                } else {
                    _resultsView.close();

                    if (_findBar) {
                        var showMessage = false;
                        _findBar.enable(true);
                        if (zeroFilesToken === FindInFiles.ZERO_FILES_TO_SEARCH) {
                            _findBar.showError(StringUtils.format(Strings.FIND_IN_FILES_ZERO_FILES,
                                FindUtils.labelForScope(FindInFiles.searchModel.scope)), true);
                        } else {
                            showMessage = true;
                        }
                        _findBar.showNoResults(true, showMessage);
                    }
                }

                StatusBar.hideBusyIndicator();
            })
            .fail(function (err) {
                console.log("find in files failed: ", err);
                StatusBar.hideBusyIndicator();
            });
    }

    /**
     * Does a search in the given scope with the given filter. Replace the result list once the search is complete.
     * @param {{query: string, caseSensitive: boolean, isRegexp: boolean}} queryInfo Query info object
     * @param {?Entry} scope Project file/subfolder to search within; else searches whole project.
     * @param {?string} filter A "compiled" filter as returned by FileFilters.compile(), or null for no filter
     * @param {?string} replaceText If this is a replacement, the text to replace matches with.
     * @param {?$.Promise} candidateFilesPromise If specified, a promise that should resolve with the same set of files that
     *      getCandidateFiles(scope) would return.
     * @return {$.Promise} A promise that's resolved with the search results or rejected when the find competes.
     */
    function searchAndReplaceResults(queryInfo, scope, filter, replaceText, candidateFilesPromise) {
        return FindInFiles.doSearchInScope(queryInfo, scope, filter, replaceText, candidateFilesPromise)
            .done(function (zeroFilesToken) {
                // Done searching all files: replace all
                if (FindInFiles.searchModel.hasResults()) {
                    _finishReplaceBatch(FindInFiles.searchModel);

                    if (_findBar) {
                        _findBar.enable(true);
                        _findBar.focus();
                    }

                }
                StatusBar.hideBusyIndicator();
            })
            .fail(function (err) {
                console.log("replace all failed: ", err);
                StatusBar.hideBusyIndicator();
            });
    }

    /**
     * @private
     * Displays a non-modal embedded dialog above the code mirror editor that allows the user to do
     * a find operation across all files in the project.
     * @param {?Entry} scope  Project file/subfolder to search within; else searches whole project.
     * @param {boolean=} showReplace If true, show the Replace controls.
     */
    function _showFindBar(scope, showReplace) {
        FindUtils.notifySearchScopeChanged();
        // If the scope is a file with a custom viewer, then we
        // don't show find in files dialog.
        if (scope && !EditorManager.canOpenPath(scope.fullPath)) {
            return;
        }

        if (scope instanceof InMemoryFile) {
            CommandManager.execute(Commands.FILE_OPEN, { fullPath: scope.fullPath }).done(function () {
                CommandManager.execute(Commands.CMD_FIND);
            });
            return;
        }

        // Get initial query/replace text
        let currentEditor = EditorManager.getActiveEditor();
        let focussedEditor = EditorManager.getFocusedEditor();
        if(!focussedEditor && _resultsView._$previewEditor && _resultsView._$previewEditor.editor
            && _resultsView._$previewEditor.editor.hasFocus()){
            currentEditor =  _resultsView._$previewEditor.editor;
        }

        let initialQuery = FindBar.getInitialQuery(_findBar, currentEditor);

        // Close our previous find bar, if any. (The open() of the new _findBar will
        // take care of closing any other find bar instances.)
        if (_findBar) {
            _findBar.close();
        }

        _findBar = new FindBar({
            multifile: true,
            replace: showReplace,
            initialQuery: initialQuery.query,
            initialReplaceText: initialQuery.replaceText,
            queryPlaceholder: Strings.FIND_QUERY_PLACEHOLDER,
            scopeLabel: FindUtils.labelForScope(scope)
        });
        _findBar.open();

        // TODO Should push this state into ModalBar (via a FindBar API) instead of installing a callback like this.
        // Custom closing behavior: if in the middle of executing search, blur shouldn't close ModalBar yet. And
        // don't close bar when opening Edit Filter dialog either.
        _findBar._modalBar.isLockedOpen = function () {
            // TODO: should have state for whether the search is executing instead of looking at find bar state
            // TODO: should have API on filterPicker to figure out if dialog is open
            return !_findBar.isEnabled() || $(".modal.instance .exclusions-editor").length > 0;
        };

        var candidateFilesPromise = FindInFiles.getCandidateFiles(scope),  // used for eventual search, and in exclusions editor UI
            filterPicker;

        function handleQueryChange() {
            // Check the query expression on every input event. This way the user is alerted
            // to any RegEx syntax errors immediately.
            var queryInfo = _findBar.getQueryInfo(),
                queryResult = FindUtils.parseQueryInfo(queryInfo);

            // Enable the replace button appropriately.
            _findBar.enableReplace(queryResult.valid);

            if (queryResult.valid || queryResult.empty) {
                _findBar.showNoResults(false);
                _findBar.showError(null);
            } else {
                _findBar.showNoResults(true, false);
                _findBar.showError(queryResult.error);
            }
        }

        function startSearch(replaceText) {
            var queryInfo = _findBar.getQueryInfo(),
                disableFindBar = (replaceText ? true : false);
            if (queryInfo && queryInfo.query) {
                _findBar.enable(!disableFindBar);
                StatusBar.showBusyIndicator(disableFindBar);
                let queryType = "query";
                if (queryInfo.isRegexp) {
                    queryType = queryType + ":regex";
                }
                if (queryInfo.isCaseSensitive) {
                    queryType = queryType + ":caseSensitive";
                }
                Metrics.countEvent(Metrics.EVENT_TYPE.SEARCH, "findInFiles", queryType);

                var filter;
                if (filterPicker) {
                    filter = FileFilters.commitPicker(filterPicker);
                } else {
                    // Single-file scope: don't use any file filters
                    filter = null;
                }
                searchAndShowResults(queryInfo, scope, filter, replaceText, candidateFilesPromise);
            }
            return null;
        }

        function startReplace() {
            startSearch(_findBar.getReplaceText());
        }

        _findBar
            .on("doFind.FindInFiles", function () {
                // Subtle issue: we can't just pass startSearch directly as the handler, because
                // we don't want it to get the event object as an argument.
                startSearch();
            })
            .on("queryChange.FindInFiles", handleQueryChange)
            .on("close.FindInFiles", function (e) {
                _findBar.off(".FindInFiles");
                _findBar = null;
            })
            .on("selectNextResult", function () {
                if (_findBar && _findBar._options.multifile){
                    _resultsView.selectNextResult();
                }
            })
            .on("selectPrevResult", function () {
                if (_findBar && _findBar._options.multifile){
                    _resultsView.selectPrevResult();
                }
            })
            .on("selectNextPage", function () {
                if (_findBar && _findBar._options.multifile){
                    _resultsView.selectN