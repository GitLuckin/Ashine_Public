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

/*global jasmine, describe, beforeAll, afterAll,beforeEach, afterEach, it, expect, awaitsForDone */

define(function (require, exports, module) {


    // Load dependent modules
    var CommandManager,      // loaded from brackets.test
        Commands,            // loaded from brackets.test
        EditorManager,       // loaded from brackets.test
        DocumentModule,      // loaded from brackets.test
        DocumentManager,     // loaded from brackets.test
        MainViewManager,     // loaded from brackets.test
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");

    describe("integration:Document Integration", function () {

        var testPath = SpecRunnerUtils.getTestPath("/spec/Document-test-files"),
            testWindow,
            $;

        beforeAll(async function () {
            testWindow = await SpecRunnerUtils.createTestWindowAndRun();
            $ = testWindow.$;

            // Load module instances from brackets.test
            CommandManager      = testWindow.brackets.test.CommandManager;
            Commands            = testWindow.brackets.test.Commands;
            EditorManager       = testWindow.brackets.test.EditorManager;
            DocumentModule      = testWindow.brackets.test.DocumentModule;
            DocumentManager     = testWindow.brackets.test.DocumentManager;
            MainViewManager     = testWindow.brackets.test.MainViewManager;

            await SpecRunnerUtils.loadProjectInTestWindow(testPath);
        }, 30000);

        afterAll(async function () {
            testWindow      = null;
            CommandManager  = null;
            Commands        = null;
            EditorManager   = null;
            DocumentModule  = null;
            DocumentManager = null;
            MainViewManager = null;
            await SpecRunnerUtils.closeTestWindow();
            testWindow = null;
        });

        afterEach(function () {
            testWindow.closeAllFiles();
            expect(DocumentManager.getAllOpenDocuments().length).toBe(0);
            DocumentModule.off(".docTest");
        });

        var JS_FILE   = testPath + "/test.js",
            CSS_FILE  = testPath + "/test.css",
            HTML_FILE = testPath + "/test.html";


        describe("Dirty flag and undo", function () {
            var promise;

            it("should not fire dirtyFlagChange when created", async function () {
                let dirtyFlagListener = jasmine.createSpy();
                DocumentManager.on("dirtyFlagChange", dirtyFlagListener);

                promise = DocumentManager.getDocumentForPath(JS_FILE);
                await awaitsForDone(promise);
                expect(dirtyFlagListener.calls.count()).toBe(0);
                DocumentManager.off("dirtyFlagChange", dirtyFlagListener);
            });

            it("should clear dirty flag, preserve undo when marked saved", async function () {
                let dirtyFlagListener = jasmine.createSpy();
                DocumentManager.on("dirtyFlagChange", dirtyFlagListener);

                promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                await awaitsForDone(promise);
                let doc = DocumentManager.getOpenDocumentForPath(JS_FILE);
                expect(doc.isDirty).toBe(false);
                expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0);

                // Make an edit (make dirty)
                doc.replaceRange("Foo", {line: 0, ch: 0});
                expect(doc.isDirty).toBe(true);
                expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1);
                expect(dirtyFlagListener.calls.count()).toBe(1);

                // Mark saved (e.g. called by Save command)
                doc.notifySaved();
                expect(doc.isDirty).toBe(false);
                expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1); // still has undo history
                expect(dirtyFlagListener.calls.count()).toBe(2);

                DocumentManager.off("dirtyFlagChange", dirtyFlagListener);
            });

            it("should clear dirty flag AND undo when text reset", async function () {
                let dirtyFlagListener = jasmine.createSpy(),
                    changeListener    = jasmine.createSpy();
                DocumentManager.on("dirtyFlagChange", dirtyFlagListener);

                promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                await awaitsForDone(promise);
                let doc = DocumentManager.getOpenDocumentForPath(JS_FILE);
                doc.on("change", changeListener);

                expect(doc.isDirty).toBe(false);
                expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0);

                // Make an edit (make dirty)
                doc.replaceRange("Foo", {line: 0, ch: 0});
                expect(doc.isDirty).toBe(true);
                expect(doc._masterEditor._codeMirror.historySize().undo).toBe(1);
                expect(dirtyFlagListener.calls.count()).toBe(1);
                expect(changeListener.calls.count()).toBe(1);

                // Reset text (e.g. called by Revert command, or syncing external changes)
                doc.refreshText("New content", Date.now());
                expect(doc.isDirty).toBe(false);
                expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0); // undo history GONE
                expect(dirtyFlagListener.calls.count()).toBe(2);
                expect(changeListener.calls.count()).toBe(2);

                doc.off("change", changeListener);
                DocumentManager.off("dirtyFlagChange", dirtyFlagListener);
            });

            it("should fire change but not dirtyFlagChange when clean text reset, with editor", async function () {
                // bug #502
                let dirtyFlagListener = jasmine.createSpy(),
                    changeListener    = jasmine.createSpy();
                DocumentManager.on("dirtyFlagChange", dirtyFlagListener);

                promise = CommandManager.execute(Commands.FILE_OPEN, {fullPath: JS_FILE});
                await awaitsForDone(promise, "Open file");

                let doc = DocumentManager.getOpenDocumentForPath(JS_FILE);
                doc.on("change", changeListener);

                expect(doc.isDirty).toBe(false);
                expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0);

                doc.refreshText("New content", Date.now());  // e.g. syncing external changes
                expect(doc.isDirty).toBe(false);
                expect(doc._masterEditor._codeMirror.historySize().undo).toBe(0); // still no undo history
                expect(dirtyFlagListener.calls.count()).toBe(0);  // isDirty hasn't changed
                expect(changeListener.calls.count()).toBe(1);     // but still counts as a content change

                doc.off("change", changeListener);
                DocumentManager.off("dirtyFlagChange", dirtyFlagListener);
            });

            it("should fire change but not dirtyFlagChange when clean text reset, without editor", async function () {
                let dirtyFlagListener = jasmine.createSpy(),
                    changeListener    = jasmine.createSpy(),
                    doc;
                DocumentManager.on("dirtyFlagChange", dirtyFlagListener);

                promise = DocumentManager.getDocumentForPath(JS_FILE)
                    .done(function (result) { doc = result; });
                await awaitsForDone(promise, "Create Document");
               