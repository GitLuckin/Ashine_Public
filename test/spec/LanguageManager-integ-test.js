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

/*global describe, jasmine, beforeEach, afterEach, it, awaitsFor, expect, awaitsForDone, spyOn */
/*unittests: LanguageManager */

define(function (require, exports, module) {


    // Load dependent modules
    var LanguageManager     = require("language/LanguageManager"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");

    describe("integration:LanguageManager", function () {

        beforeEach(async function () {
            await awaitsForDone(LanguageManager.ready, "LanguageManager ready", 10000);

            spyOn(console, "error");
        });

        afterEach(function () {
            LanguageManager._resetPathLanguageOverrides();
        });

        describe("Document language updating", function () {

            it("should update the document's language when a file is renamed", async function () {
                var tempDir     = SpecRunnerUtils.getTempDirectory(),
                    oldFilename = tempDir + "/foo.js",
                    newFilename = tempDir + "/dummy.html",
                    spy         = jasmine.createSpy("languageChanged event handler"),
                    dmspy       = jasmine.createSpy("currentDocumentLanguageChanged event handler"),
                    javascript,
                    html,
                    oldFile,
                    doc;

                var DocumentManager,
                    FileSystem,
                    LanguageManager,
                    MainViewManager;

                await SpecRunnerUtils.createTempDirectory();

                let w = await SpecRunnerUtils.createTestWindowAndRun();
                // Load module instances from brackets.test
                FileSystem = w.brackets.test.FileSystem;
                LanguageManager = w.brackets.test.LanguageManager;
                DocumentManager = w.brackets.test.DocumentManager;
                MainViewManager = w.brackets.test.MainViewManager;

                var writeDeferred = $.Deferred();
                oldFile = FileSystem.getFileForPath(oldFilename);
                oldFile.write("", function (err) {
                    if (err) {
                        writeDeferred.reject(err);
                    } else {
                        writeDeferred.resolve();
                    }
                });
                await awaitsForDone(writeDeferred.promise(), "old file creation");

                await SpecRunnerUtils.loadProjectInTestWindow(tempDir);

                await awaitsForDone(DocumentManager.getDocumentForPath(oldFilename).done(function (_doc) {
                    doc = _doc;
                }), "get document");

                var renameDeferred = $.Deferred();
                MainViewManager._edit(MainViewManager.ACTIVE_PANE, doc);
                javascript = LanguageManager.getLanguage("javascript");

                // sanity check language
                expect(doc.getLanguage()).toBe(javascript);

                // Documents are only 'active' while referenced; they won't be maintained by DocumentManager
                // for global updates like rename otherwise.
                doc.addRef();

                // listen for event
                doc.on("languageChanged", spy);
                DocumentManager.on("currentDocumentLanguageChanged", dmspy);

                // trigger a rename
                oldFile.rename(newFilename, function (err) {
                    if (err) {
                       