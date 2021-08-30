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

/*global jsPromise*/

/**
 * Manages linters and other code inspections on a per-language basis. Provides a UI and status indicator for
 * the resulting errors/warnings.
 *
 * Currently, inspection providers are only invoked on the current file and only when it is opened, switched to,
 * or saved. But in the future, inspectors may be invoked as part of a global scan, at intervals while typing, etc.
 * Currently, results are only displayed in a bottom panel list and in a status bar icon. But in the future,
 * results may also be displayed inline in the editor (as gutter markers, etc.).
 * In the future, support may also be added for error/warning providers that cannot process a single file at a time
 * (e.g. a full-project compiler).
 */
define(function (require, exports, module) {


    const _ = require("thirdparty/lodash");

    // Load dependent modules
    const Commands                = require("command/Commands"),
        WorkspaceManager        = require("view/WorkspaceManager"),
        CommandManager          = require("command/CommandManager"),
        DocumentManager         = require("document/DocumentManager"),
        EditorManager           = require("editor/EditorManager"),
        Editor                  = require("editor/Editor").Editor,
        MainViewManager         = require("view/MainViewManager"),
        LanguageManager         = require("language/LanguageManager"),
        PreferencesManager      = require("preferences/PreferencesManager"),
        PerfUtils               = require("utils/PerfUtils"),
        Strings                 = require("strings"),
        StringUtils             = require("utils/StringUtils"),
        AppInit                 = require("utils/AppInit"),
        StatusBar               = require("widgets/StatusBar"),
        Async                   = require("utils/Async"),
        PanelTemplate           = require("text!htmlContent/problems-panel.html"),
        ResultsTemplate         = require("text!htmlContent/problems-panel-table.html"),
        Mustache                = require("thirdparty/mustache/mustache"),
        QuickViewManager        = require("features/QuickViewManager");

    const CODE_INSPECTION_GUTTER_PRIORITY      = 500,
        CODE_INSPECTION_GUTTER = "code-inspection-gutter";

    const INDICATOR_ID = "status-inspection";

    /** Values for problem's 'type' property */
    const Type = {
        /** Unambiguous error, such as a syntax error */
        ERROR: "error",
        /** Maintainability issue, probable error / bad smell, etc. */
        WARNING: "warning",
        /** Inspector unable to continue, code too complex for static analysis, etc. Not counted in err/warn tally. */
        META: "meta"
    };

    function _getIconClassForType(type) {
        switch (type) {
        case Type.ERROR: return "line-icon-problem_type_error fa-solid fa-times-circle";
        case Type.WARNING: return "line-icon-problem_type_warning fa-solid fa-exclamation-triangle";
        case Type.META: return "line-icon-problem_type_info fa-solid fa-info-circle";
        default: return "line-icon-problem_type_info fa-solid fa-info-circle";
        }
    }

    const CODE_MARK_TYPE_INSPECTOR = "codeInspector";

    /**
     * Constants for the preferences defined in this file.
     */
    const PREF_ENABLED            = "enabled",
        PREF_COLLAPSED          = "collapsed",
        PREF_ASYNC_TIMEOUT      = "asyncTimeout",
        PREF_PREFER_PROVIDERS   = "prefer",
        PREF_PREFERRED_ONLY     = "usePreferredOnly";

    const prefs = PreferencesManager.getExtensionPrefs("linting");

    /**
     * When disabled, the errors panel is closed and the status bar icon is grayed out.
     * Takes precedence over _collapsed.
     * @private
     * @type {boolean}
     */
    var _enabled = false;

    /**
     * When collapsed, the errors panel is closed but the status bar icon is kept up to date.
     * @private
     * @type {boolean}
     */
    var _collapsed = false;

    /**
     * @private
     * @type {$.Element}
     */
    var $problemsPanel;

    /**
     * @private the panelView
     * @type {Panel}
     */
    var problemsPanel;

    /**
     * @private
     * @type {$.Element}
     */
    var $problemsPanelTable;

    /**
     * @private
     * @type {boolean}
     */
    var _gotoEnabled = false;

    /**
     * @private
     * @type {{languageId:string, Array.<{name:string, scanFileAsync:?function(string, string):!{$.Promise}, scanFile:?function(string, string):Object}>}}
     */
    var _providers = {};

    /**
     * @private
     * @type
     */
    let _registeredLanguageIDs = [];

    /**
     * @private
     * @type {boolean}
     */
    var _hasErrors;

    /**
     * Promise of the returned by the last call to inspectFile or null if linting is disabled. Used to prevent any stale promises
     * to cause updates of the UI.
     *
     * @private
     * @type {$.Promise}
     */
    var _currentPromise = null;

    /**
     * Enable or disable the "Go to First Error" command
     * @param {boolean} gotoEnabled Whether it is enabled.
     */
    function setGotoEnabled(gotoEnabled) {
        CommandManager.get(Commands.NAVIGATE_GOTO_FIRST_PROBLEM).setEnabled(gotoEnabled);
        _gotoEnabled = gotoEnabled;
    }

    function _unregisterAll() {
        _providers = {};
    }

    /**
     * Returns a list of provider for given file path, if available.
     * Decision is made depending on the file extension.
     *
     * @param {!string} filePath
     * @return {Array.<{name:string, scanFileAsync:?function(string, string):!{$.Promise}, scanFile:?function(string, string):?{errors:!Array, aborted:boolean}}>}
     */
    function getProvidersForPath(filePath) {
        var language            = LanguageManager.getLanguageForPath(filePath).getId(),
            context             = PreferencesManager._buildContext(filePath, language),
            installedProviders  = getProvidersForLanguageId(language),
            preferredProviders,

            prefPreferredProviderNames  = prefs.get(PREF_PREFER_PROVIDERS, context),
            prefPreferredOnly           = prefs.get(PREF_PREFERRED_ONLY, context),

            providers;

        if (prefPreferredProviderNames && prefPreferredProviderNames.length) {
            if (typeof prefPreferredProviderNames === "string") {
                prefPreferredProviderNames = [prefPreferredProviderNames];
            }
            preferredProviders = prefPreferredProviderNames.reduce(function (result, key) {
                var provider = _.find(installedProviders, {name: key});
                if (provider) {
                    result.push(provider);
                }
                return result;
            }, []);
            if (prefPreferredOnly) {
                providers = preferredProviders;
            } else {
                providers = _.union(preferredProviders, installedProviders);
            }
        } else {
            providers = installedProviders;
        }
        return providers;
    }

    /**
     * Returns an array of the IDs of providers registered for a specific language
     *
     * @param {!string} languageId
     * @return {Array.<string>} Names of registered providers.
     */
    function getProviderIDsForLanguage(languageId) {
        if (!_providers[languageId]) {
            return [];
        }
        return _providers[languageId].map(function (provider) {
            return provider.name;
        });
    }

    /**
     * Runs a file inspection over passed file. Uses the given list of providers if specified, otherwise uses
     * the set of providers that are registered for the file's language.
     * This method doesn't update the Brackets UI, just provides inspection results.
     * These results will reflect any unsaved changes present in the file if currently open.
     *
     * The Promise yields an array of provider-result pair objects (the result is the return value of the
     * provider's scanFile() - see register() for details). The result object may be null if there were no
     * errors from that provider.
     * If there are no providers registered for this file, the Promise yields null instead.
     *
     * @param {!File} file File that will be inspected for errors.
     * @param {?Array.<{name:string, scanFileAsync:?function(string, string):!{$.Promise}, scanFile:?function(string, string):?{errors:!Array, aborted:boolean}}>} providerList
     * @return {$.Promise} a jQuery promise that will be resolved with ?Array.<{provider:Object, result: ?{errors:!Array, aborted:boolean}}>
     */
    function inspectFile(file, providerList) {
        var response = new $.Deferred(),
            results = [];

        providerList = providerList || getProvidersForPath(file.fullPath);

        if (!providerList.length) {
            response.resolve(null);
            return response.promise();
        }

        DocumentManager.getDocumentText(file)
            .done(function (fileText) {
                var perfTimerInspector = PerfUtils.markStart("CodeInspection:\t" + file.fullPath),
                    masterPromise;

                masterPromise = Async.doInParallel(providerList, function (provider) {
                    var perfTimerProvider = PerfUtils.markStart("CodeInspection '" + provider.name + "':\t" + file.fullPath),
                        runPromise = new $.Deferred();

                    runPromise.done(function (scanResult) {
                        results.push({provider: provider, result: scanResult});
                    });

                    if (provider.scanFileAsync) {
                        window.setTimeout(function () {
                            // timeout error
                            var errTimeout = {
                                pos: { line: -1, col: 0},
                                message: StringUtils.format(Strings.LINTER_TIMED_OUT, provider.name, prefs.get(PREF_ASYNC_TIMEOUT)),
                                type: Type.ERROR
                            };
                            runPromise.resolve({errors: [errTimeout]});
                        }, prefs.get(PREF_ASYNC_TIMEOUT));
                        jsPromise(provider.scanFileAsync(fileText, file.fullPath))
                            .then(function (scanResult) {
                                PerfUtils.addMeasurement(perfTimerProvider);
                                runPromise.resolve(scanResult);
                            })
                            .catch(function (err) {
                                PerfUtils.finalizeMeasurement(perfTimerProvider);
                                var errError = {
                                    pos: {line: -1, col: 0},
                                    message: StringUtils.format(Strings.LINTER_FAILED, provider.name, err),
                                    type: Type.ERROR
                                };
                                console.error("[CodeInspection] Provider " + provider.name + " (async) failed: " + err.stack);
                                runPromise.resolve({errors: [errError]});
                            });
                    } else {
                        try {
                            var scanResult = provider.scanFile(fileText, file.fullPath);
                            PerfUtils.addMeasurement(perfTimerProvider);
                            runPromise.resolve(scanResult);
                        } catch (err) {
                            PerfUtils.finalizeMeasurement(perfTimerProvider);
                            var errError = {
                                pos: {line: -1, col: 0},
                                message: StringUtils.format(Strings.LINTER_FAILED, provider.name, err),
                                type: Type.ERROR
                            };
                            console.error("[CodeInspection] Provider " + provider.name + " (sync) threw an error: " + err.stack);
                            runPromise.resolve({errors: [errError]});
                        }
                    }
                    return runPromise.promise();

                }, false);

                masterPromise.then(function () {
                    // sync async may have pushed results in different order, restore the original order
                    results.sort(function (a, b) {
                        return providerList.indexOf(a.provider) - providerList.indexOf(b.provider);
                    });
                    PerfUtils.addMeasurement(perfTimerInspector);
                    response.resolve(results);
                });

            })
            .fail(function (err) {
                console.error("[CodeInspection] Could not read file for inspection: " + file.fullPath);
                response.reject(err);
            });

        return response.promise();
    }

    /**
     * Update the title of the problem panel and the tooltip of the status bar icon. The title and the tooltip will
     * change based on the number of problems reported and how many provider reported problems.
     *
     * @param {Number} numProblems - total number of problems across all providers
     * @param {Array.<{name:string, scanFileAsync:?function(string, string):!{$.Promise}, scanFile:?function(string, string):Object}>} providersReportingProblems - providers that reported problems
     * @param {boolean} aborted - true if any provider returned a result with the 'aborted' flag set
     */
    function updatePanelTitleAndStatusBar(numProblems, providersReportingProblems, aborted) {
        var message, tooltip;

        if (providersReportingProblems.length === 1) {
            // don't show a header if there is only one provider available for this file type
            $problemsPanelTable.find(".inspector-section").hide();
            $problemsPanelTable.find("tr").removeClass("forced-hidden");

            if (numProblems === 1 && !aborted) {
                message = StringUtils.format(Strings.SINGLE_ERROR, providersReportingProblems[0].name);
            } else {
                if (aborted) {
                    numProblems += "+";
                }

                message = StringUtils.format(Strings.MULTIPLE_ERRORS, providersReportingProblems[0].name, numProblems);
            }
        } else if (providersReportingProblems.length > 1) {
            $problemsPanelTable.find(".inspector-section").show();

            if (aborted) {
                numProblems += "+";
            }

            message = StringUtils.format(Strings.ERRORS_PANEL_TITLE_MULTIPLE, numProblems);
        } else {
            return;
        }

        $problemsPanel.find(".title").text(message);
        tooltip = StringUtils.format(Strings.STATUSBAR_CODE_INSPECTION_TOOLTIP, message);
        StatusBar.updateIndicator(INDICATOR_ID, true, "inspection-e