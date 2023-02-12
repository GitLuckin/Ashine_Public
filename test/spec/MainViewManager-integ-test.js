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

/*global describe, beforeEach, beforeAll, afterAll, afterEach, it, expect, awaitsForDone, spyOn, jasmine */

define(function (require, exports, module) {


    var CommandManager,          // loaded from brackets.test
        Commands,                // loaded from brackets.test
        DocumentManager,         // loaded from brackets.test
        EditorManager,           // loaded from brackets.test
        MainViewManager,         // loaded from brackets.test
        ProjectManager,          // loaded from brackets.test
        FileSystem,              // loaded from brackets.test
        Dialogs,                 // loaded from brackets.test
        DefaultDialogs,
        WorkspaceManager,
        Menus,
        SpecRunnerUtils          = require("spec/SpecRunnerUtils"),
        KeyEvent                 = require("utils/KeyEvent");

    describe("mainview:MainViewManager", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/MainViewManager-test-files"),
            testWindow,
            _$,
            promise;

        var getFileObject = function (name) {
            return FileSystem.getFileForPath(testPath + "/" + name);
        };

        async function _init() {
            await SpecRunnerUtils.loadProjectInTestWindow(testPath);
            // Load module instances from brackets.test
            CommandManager          = testWindow.brackets.test.CommandManager;
            Commands                = testWindow.brackets.test.Commands;
            DocumentManager         = testWindow.brackets.test.DocumentManager;
            EditorManager           = testWindow.brackets.test.EditorManager;
            DefaultDialogs          = testWindow.brackets.test.DefaultDialogs;
            MainViewManager         = testWindow.brackets.test.MainViewManager;
            ProjectManager          = testWindow.brackets.test.ProjectManager;
            WorkspaceManager        = testWindow.brackets.test.WorkspaceManager;
            FileSystem              = testWindow.brackets.test.FileSystem;
            Dialogs                 = testWindow.brackets.test.Dialogs,
            Menus                   = testWindow.brackets.test.Menus;
            _$                      = testWindow.$;
        }

        beforeAll(async function () {
            testWindow = await SpecRunnerUtils.createTestWindowAndRun();
            await _init();
        }, 30000);

        afterAll(async function () {
            MainViewManager._closeAll(MainViewManager.ALL_PANES);
            testWindow              = null;
            CommandManager          = null;
            Commands                = null;
            DocumentManager         = null;
            EditorManager           = null;
            ProjectManager          = null;
            FileSystem              = null;
            //await SpecRunnerUtils.closeTestWindow();
        });

        beforeEach(async function () {
            MainViewManager._closeAll(MainViewManager.ALL_PANES);
            MainViewManager.setActivePaneId(MainViewManager.FIRST_PANE);
        });

        describe("basic attributes", function () {
            it("should have an active pane id", function () {
                expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
            });
            it("should have only one pane", function () {
                expect(MainViewManager.getPaneCount()).toEqual(1);
                expect(MainViewManager.getPaneIdList().length).toEqual(1);
                expect(MainViewManager.getPaneIdList()[0]).toEqual("first-pane");
            });
            it("should not be viewing anything", function () {
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(null);
                expect(MainViewManager.getCurrentlyViewedFile("first-pane")).toEqual(null);
                expect(MainViewManager.getCurrentlyViewedPath("first-pane")).toEqual(null);
            });
            it("Pane should not have a title", function () {
                expect(MainViewManager.getPaneTitle("first-pane")).toBeFalsy();
            });
        });

        describe("opening and closing files", function () {
            it("should open a file", async function () {
                expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
                promise = MainViewManager._open(MainViewManager.FIRST_PANE, FileSystem.getFileForPath(testPath + "/test.js"));
                await awaitsForDone(promise, "MainViewManager.doOpen");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(testPath + "/test.js");
                expect(MainViewManager.getCurrentlyViewedFile("first-pane").name).toEqual("test.js");
                expect(MainViewManager.getCurrentlyViewedPath("first-pane")).toEqual(testPath + "/test.js");
                expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);// panes are not activated on open

                MainViewManager._close(MainViewManager.ACTIVE_PANE, FileSystem.getFileForPath(testPath + "/test.js" ));
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);
            });
            it("should add file to working-set when opening files that are outside of the project", async function () {
                ProjectManager.isWithinProject = function () {
                    return false;
                };
                promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, FileSystem.getFileForPath(testPath + "/test.js"));
                await awaitsForDone(promise, "MainViewManager.doOpen");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(testPath + "/test.js");
                expect(MainViewManager.getCurrentlyViewedFile("first-pane").name).toEqual("test.js");
                expect(MainViewManager.getCurrentlyViewedPath("first-pane")).toEqual(testPath + "/test.js");
                expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(1);

                MainViewManager._close(MainViewManager.ACTIVE_PANE, FileSystem.getFileForPath(testPath + "/test.js"));
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);
            });
            it("should edit a document", async function () {
                promise = new $.Deferred();
                DocumentManager.getDocumentForPath(testPath + "/test.js")
                    .done(function (doc) {
                        MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
                        promise.resolve();
                    });

                await awaitsForDone(promise, "MainViewManager.doEdit");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                expect(MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE)).toEqual(testPath + "/test.js");
                expect(MainViewManager.getCurrentlyViewedFile("first-pane").name).toEqual("test.js");
                expect(MainViewManager.getCurrentlyViewedPath("first-pane")).toEqual(testPath + "/test.js");
                expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(1);

                MainViewManager._close(MainViewManager.ACTIVE_PANE, FileSystem.getFileForPath(testPath + "/test.js"));
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(0);
            });
            it("should not automatically be added to the working set when opening a file", async function () {
                promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, FileSystem.getFileForPath(testPath + "/test.js"));
                await awaitsForDone(promise, "MainViewManager.doOpen");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(1);
            });
            it("should fail when operating on an invalid pane id", async function () {
                spyOn(Dialogs, 'showModalDialog').and.callFake(function (dlgClass, title, message, buttons) {
                    return {done: function (callback) { callback(Dialogs.DIALOG_BTN_OK); } };
                });
                var testme = function () {
                    CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                        paneId: "second-pane" });
                };
                expect(testme).toThrow();
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toBeFalsy();
                expect(function () { MainViewManager.setActivePaneId("second-pane"); }).toThrow();
                expect(MainViewManager.getActivePaneId()).not.toEqual("second-pane");
                expect(function () { MainViewManager.addToWorkingSet("second-pane", getFileObject("test.js")); }).toThrow();
                expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, testPath + "/test.js")).toEqual(-1);
                expect(function () { MainViewManager.findInWorkingSet("second-pane", testPath + "/test.js"); }).toThrow();
                expect(function () { MainViewManager.addListToWorkingSet("second-pane", [getFileObject("test.js")]); }).toThrow();
                expect(MainViewManager.findInWorkingSet(MainViewManager.ALL_PANES, testPath + "/test.js")).toEqual(-1);
                expect(function () { MainViewManager.findInWorkingSet("second-pane", testPath + "/test.js"); }).toThrow();
            });
        });
        describe("editor manager integration", function () {
            it("should report the existing editor as the current full editor", async function () {
                var promise,
                    testDoc;
                promise = new $.Deferred();
                DocumentManager.getDocumentForPath(testPath + "/test.js")
                    .done(function (doc) {
                        testDoc = doc;
                        MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
                        promise.resolve();
                    });

                await awaitsForDone(promise, "MainViewManager.doEdit");
                expect(EditorManager.getCurrentFullEditor()).toEqual(testDoc._masterEditor);
            });
            it("should notify when active editor changes", async function () {
                var promise,
                    docChangeListener = jasmine.createSpy(),
                    activeEditorChangeListener = jasmine.createSpy();

                DocumentManager.on("currentDocumentChange", docChangeListener);
                EditorManager.on("activeEditorChange", activeEditorChangeListener);
                promise = new $.Deferred();
                DocumentManager.getDocumentForPath(testPath + "/test.js")
                    .done(function (doc) {
                        MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
                        promise.resolve();
                    });

                await awaitsForDone(promise, "MainViewManager.doEdit");
                expect(docChangeListener).toHaveBeenCalled();
                expect(activeEditorChangeListener).toHaveBeenCalled();
            });
        });
        describe("currentFileChange event handlers", function () {
            it("should fire currentFileChange event", async function () {
                var currentFileChangeListener = jasmine.createSpy();

                MainViewManager.on("currentFileChange", currentFileChangeListener);
                expect(currentFileChangeListener.calls.count()).toBe(0);
                promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, FileSystem.getFileForPath(testPath + "/test.js"));
                await awaitsForDone(promise, "MainViewManager.doOpen");
                expect(currentFileChangeListener.calls.count()).toBe(1);
                expect(currentFileChangeListener.calls.all()[0].args[1].name).toEqual("test.js");
                expect(currentFileChangeListener.calls.all()[0].args[2]).toEqual("first-pane");
                MainViewManager._closeAll(MainViewManager.ALL_PANES);
                expect(currentFileChangeListener.calls.count()).toBe(2);
                expect(currentFileChangeListener.calls.all()[1].args[1]).toEqual(null);
                MainViewManager.off("currentFileChange", currentFileChangeListener);
            });
            it("DocumentManager should listen to currentFileChange events", async function () {
                promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, FileSystem.getFileForPath(testPath + "/test.js"));
                await awaitsForDone(promise, "MainViewManager.doOpen");
                expect(DocumentManager.getCurrentDocument()).toBeTruthy();
                expect(DocumentManager.getCurrentDocument().file.name).toEqual("test.js");
                MainViewManager._closeAll(MainViewManager.ALL_PANES);
                expect(DocumentManager.getCurrentDocument()).toBe(null);
            });
            it("EditorManager should listen to currentFileChange events", async function () {
                promise = MainViewManager._open(MainViewManager.ACTIVE_PANE, FileSystem.getFileForPath(testPath + "/test.js"));
                await awaitsForDone(promise, "MainViewManager.doOpen");
                expect(EditorManager.getCurrentFullEditor()).toBeTruthy();
                expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.js");
                MainViewManager._closeAll(MainViewManager.ALL_PANES);
                expect(EditorManager.getCurrentFullEditor()).toBe(null);
            });
        });
        describe("Splitting Views", function () {
            it("should create a new pane", async function () {
                var paneCreateListener = jasmine.createSpy(),
                    paneLayoutChangeListener = jasmine.createSpy();

                MainViewManager.on("paneCreate", paneCreateListener);
                MainViewManager.on("paneLayoutChange", paneLayoutChangeListener);
                MainViewManager.setLayoutScheme(1, 2);
                expect(MainViewManager.getPaneCount()).toEqual(2);
                expect(MainViewManager.getPaneIdList().length).toEqual(2);
                expect(MainViewManager.getPaneIdList()[1]).toEqual("second-pane");
                expect(MainViewManager.getAllOpenFiles().length).toEqual(0);

                expect(paneCreateListener.calls.count()).toBe(1);
                expect(paneLayoutChangeListener.calls.count()).toBe(1);

                expect(paneCreateListener.calls.all()[0].args[1]).toEqual("second-pane");
                expect(paneLayoutChangeListener.calls.all()[0].args[1]).toEqual("VERTICAL");
                MainViewManager.off("paneCreate", paneCreateListener);
                MainViewManager.off("paneLayoutChange", paneLayoutChangeListener);
            });
            it("should should show interstitial page", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                var interstitials = _$(".not-editor");
                expect(interstitials.length).toEqual(2);
                expect(_$(interstitials[0]).css("display")).not.toEqual("none");
                expect(_$(interstitials[1]).css("display")).not.toEqual("none");
            });
            it("should destroy a pane", async function () {
                // when we migrated to jasmine 2.0, this test was not activating the pane. assuming that all tests are
                // working correctly, the tests has been tweaked to match reality. We stopped reloading the test window
                // after each test to improve performance. This caused the issue to prop.
                var paneDestroyListener = jasmine.createSpy(),
                    paneLayoutChangeListener = jasmine.createSpy();

                MainViewManager.on("paneDestroy", paneDestroyListener);
                MainViewManager.on("paneLayoutChange", paneLayoutChangeListener);
                MainViewManager.setLayoutScheme(1, 2);
                expect(MainViewManager.getPaneCount()).toEqual(2);
                expect(MainViewManager.getPaneIdList().length).toEqual(2);
                expect(MainViewManager.getPaneIdList()[1]).toEqual("second-pane");
                MainViewManager.setLayoutScheme(1, 1);
                expect(MainViewManager.getPaneCount()).toEqual(1);
                expect(MainViewManager.getPaneIdList().length).toEqual(1);
                expect(MainViewManager.getPaneIdList()[0]).toEqual("first-pane");

                expect(paneDestroyListener.calls.count()).toBe(1);
                expect(paneLayoutChangeListener.calls.count()).toBe(1);

                expect(paneDestroyListener.calls.all()[0].args[1]).toEqual("second-pane");
                MainViewManager.off("paneDestroy", paneDestroyListener);
                MainViewManager.off("paneLayoutChange", paneLayoutChangeListener);
            });
            it("should show two files", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "first-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                expect(MainViewManager._getPaneIdForPath(testPath + "/test.css")).toEqual("second-pane");
                expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(1);
                expect(MainViewManager.getWorkingSetSize("second-pane")).toEqual(1);
                MainViewManager.setActivePaneId("first-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.js");
                MainViewManager.setActivePaneId("second-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.css");
                expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.css");
            });
            it("should flip the view to the other pane", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "first-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                MainViewManager.setActivePaneId("first-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                MainViewManager.setActivePaneId("second-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                MainViewManager._getPane("first-pane").$headerFlipViewBtn.trigger("click");
                MainViewManager.setActivePaneId("first-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
                MainViewManager.setActivePaneId("second-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                MainViewManager._getPane("second-pane").$headerFlipViewBtn.trigger("click");
                MainViewManager.setActivePaneId("first-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                MainViewManager.setActivePaneId("second-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
            });
            it("should show the file instead of flipping if file is already open", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "first-pane" });
                await awaitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.css",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                MainViewManager._getPane("first-pane").$headerFlipViewBtn.trigger("click");
                MainViewManager.setActivePaneId("first-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.js");
                MainViewManager.setActivePaneId("second-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                expect(EditorManager.getCurrentFullEditor().document.file.name).toEqual("test.js");
            });
            it("should merge two panes to the right", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "first-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(1);
                expect(MainViewManager.getWorkingSetSize("second-pane")).toEqual(1);
                MainViewManager.setLayoutScheme(1, 1);
                expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                expect(MainViewManager._getPaneIdForPath(testPath + "/test.css")).toEqual("first-pane");
            });
            it("should merge two panes to the left", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "first-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                expect(MainViewManager.getWorkingSetSize("first-pane")).toEqual(1);
                expect(MainViewManager.getWorkingSetSize("second-pane")).toEqual(1);
                MainViewManager.setActivePaneId("first-pane");
                MainViewManager.setLayoutScheme(1, 1);
                expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                expect(MainViewManager._getPaneIdForPath(testPath + "/test.css")).toEqual("first-pane");
            });
            it("should close the view when clicked", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "first-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                expect(MainViewManager._getPaneIdForPath(testPath + "/test.js")).toEqual("first-pane");
                MainViewManager.setActivePaneId("first-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE).name).toEqual("test.js");
                MainViewManager._getPane("first-pane").$headerCloseBtn.trigger("click");
                MainViewManager.setActivePaneId("first-pane");
                expect(MainViewManager.getCurrentlyViewedFile(MainViewManager.ACTIVE_PANE)).toEqual(null);
            });
            it("should collapse the panes when close button is clicked on a pane with no files", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                MainViewManager._getPane("first-pane").$headerCloseBtn.trigger("click");
                expect(MainViewManager.getLayoutScheme()).toEqual({rows: 1, columns: 1});
            });
            it("should switch pane when Commands.CMD_SWITCH_PANE_FOCUS is called", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                $('#first-pane').click();
                CommandManager.execute(Commands.CMD_SWITCH_PANE_FOCUS);
                expect(MainViewManager.getActivePaneId()).toEqual("second-pane");
                $('#second-pane').click();
                CommandManager.execute(Commands.CMD_SWITCH_PANE_FOCUS);
                expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
                MainViewManager.setLayoutScheme(2, 1);
                $('#first-pane').click();
                CommandManager.execute(Commands.CMD_SWITCH_PANE_FOCUS);
                expect(MainViewManager.getActivePaneId()).toEqual("second-pane");
                $('#second-pane').click();
                CommandManager.execute(Commands.CMD_SWITCH_PANE_FOCUS);
                expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
            });
            it("should activate pane when editor gains focus", async function () {
                var editors = {},
                    handler = function (e, doc, editor, paneId) {
                        editors[doc.file.name] = editor;
                    };

                EditorManager.on("_fullEditorCreatedForDocument", handler);
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "first-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                editors["test.css"].focus();
                expect(MainViewManager.getActivePaneId()).toEqual("second-pane");
                editors["test.js"].focus();
                expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
                editors = null;
                EditorManager.off("_fullEditorCreatedForDocument", handler);
            });
            it("should activate pane when inline editor gains focus", async function () {
                var inlineEditor,
                    editors = {},
                    handler = function (e, doc, editor, paneId) {
                        editors[doc.file.name] = editor;
                    };

                EditorManager.on("_fullEditorCreatedForDocument", handler);
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.html",
                    paneId: "first-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                MainViewManager.setActivePaneId("first-pane");

                // open inline editor at specified offset index
                var inlineEditorResult = SpecRunnerUtils.toggleQuickEditAtOffset(editors["test.html"], {line: 8, ch: 14});
                await awaitsForDone(inlineEditorResult, "inline editor opened", 1000);

                MainViewManager.setActivePaneId("second-pane");
                inlineEditor = EditorManager.getInlineEditors(editors["test.html"])[0];
                inlineEditor.focus();
                expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
            });
            it("should activate pane when pane is clicked", async function () {
                var activePaneChangeListener = jasmine.createSpy();

                MainViewManager.on("activePaneChange", activePaneChangeListener);
                MainViewManager.setLayoutScheme(1, 2);
                _$("#second-pane").click();
                expect(MainViewManager.getActivePaneId()).toEqual("second-pane");
                _$("#first-pane").click();
                expect(MainViewManager.getActivePaneId()).toEqual("first-pane");
                expect(activePaneChangeListener.calls.count()).toBe(2);
                MainViewManager.off("activePaneChange", activePaneChangeListener);
            });
            it("should enforce bounds", function () {
                expect(MainViewManager.setLayoutScheme(1, 4)).toBeFalsy();
                expect(MainViewManager.setLayoutScheme(4, -2)).toBeFalsy();
                expect(MainViewManager.setLayoutScheme(0, 0)).toBeFalsy();
                expect(MainViewManager.setLayoutScheme(-1, -1)).toBeFalsy();
                expect(MainViewManager.setLayoutScheme(4, 1)).toBeFalsy();
                expect(MainViewManager.setLayoutScheme(1, 1)).toBeTruthy();
                expect(MainViewManager.setLayoutScheme(1, 2)).toBeTruthy();
                expect(MainViewManager.setLayoutScheme(2, 1)).toBeTruthy();
            });
            it("should toggle layout", async function () {
                var paneLayoutChangeListener = jasmine.createSpy();

                MainViewManager.on("paneLayoutChange", paneLayoutChangeListener);
                MainViewManager.setLayoutScheme(1, 2);
                expect(MainViewManager.getLayoutScheme()).toEqual({rows: 1, columns: 2});
                expect(paneLayoutChangeListener.calls.all()[0].args[1]).toEqual("VERTICAL");
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "first-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                promise = CommandManager.execute(Commands.FILE_OPEN,  { fullPath: testPath + "/test.css",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.FILE_OPEN);
                MainViewManager.setLayoutScheme(2, 1);
                expect(MainViewManager.getLayoutScheme()).toEqual({rows: 2, columns: 1});
                expect(paneLayoutChangeListener.calls.all()[1].args[1]).toEqual("HORIZONTAL");
                expect(paneLayoutChangeListener.calls.count()).toBe(2);
                MainViewManager.off("paneLayoutChange", paneLayoutChangeListener);
            });
        });
        describe("Targeted Pane API tests", function () {
            it("should count open views", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "first-pane" });
                await awaitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.css",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                expect(MainViewManager.getWorkingSetSize(MainViewManager.ALL_PANES)).toEqual(2);
                expect(MainViewManager.getWorkingSetSize(MainViewManager.ACTIVE_PANE)).toEqual(1);
            });
            it("should find file in view", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                expect(MainViewManager.findInAllWorkingSets(testPath + "/test.js").shift().paneId).toEqual("second-pane");
            });
            it("should reopen file in view", async function () {
                MainViewManager.setLayoutScheme(1, 2);
                promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN,  { fullPath: testPath + "/test.js",
                    paneId: "second-pane" });
                await awaitsForDone(promise, Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN);
                promise = CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, 