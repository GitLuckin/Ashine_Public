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
                expect(EditorManager.getCurrentFullEditor()).toBeT