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

/*global describe, it, expect, beforeEach, awaitsForDone, afterAll */

define(function (require, exports, module) {


    var SpecRunnerUtils    = brackets.getModule("spec/SpecRunnerUtils"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        prefs              = PreferencesManager.getExtensionPrefs("quickview");

    describe("extension:Quick View", function () {
        let testFolder = SpecRunnerUtils.getTestPath("/spec/quickview-extn-test-files");

        // load from testWindow
        var testWindow,
            brackets,
            CommandManager,
            Commands,
            MainViewManager,
            EditorManager,
            QuickView,
            editor,
            testFile = "test.css",
            oldFile;

        beforeEach(async function () {
            // Create a new window that will be shared by ALL tests in this spec.
            if (!testWindow) {
                testWindow = await SpecRunnerUtils.createTestWindowAndRun();

                await SpecRunnerUtils.loadProjectInTestWindow(testFolder);
            }

            // Load module instances from brackets.test
            brackets = testWindow.brackets;
            CommandManager = brackets.test.CommandManager;
            Commands = brackets.test.Commands;
            EditorManager = brackets.test.EditorManager;
            QuickView = brackets.test.QuickViewManager;
            MainViewManager = brackets.test.MainViewManager;

            if (testFile !== oldFile) {
                await awaitsForDone(SpecRunnerUtils.openProjectFiles([testFile]), "open test file: " + testFile);

                editor  = EditorManager.getCurrentFullEditor();
                oldFile = testFile;
            }
        }, 30000);

        afterAll(async function () {
            testWindow       = null;
            brackets         = null;
            CommandManager   = null;
            Commands         = null;
            EditorManager    = null;
            QuickView        = null;
            MainViewManager  = null;
            await SpecRunnerUtils.closeTestWindow();
        });

        async function getPopoverAtPos(lineNum, columnNum) {
            editor  = EditorManager.getCurrentFullEditor();
            var cm = editor._codeMirror,
                pos = { line: lineNum, ch: columnNum },
                token;

            editor.setCursorPos(pos);
            token = cm.getTokenAt(pos, true);

            return QuickView._queryPreviewProviders(editor, pos, token);
        }

        async function expectNoPreviewAtPos(line, ch) {
            var popoverInfo = await getPopoverAtPos(line, ch);
            expect(popoverInfo).toBeFalsy();
        }

        async function checkColorAtPos(expectedColor, line, ch) {
            var popoverInfo = await getPopoverAtPos(line, ch);
            expect(popoverInfo.content.find("#quick-view-color-swatch").attr("data-for-test")).toBe(expectedColor);
        }

        async function checkGradientAtPos(expectedGradient, line, ch) {
            // Just call await checkColorAtPos since both have the same function calls.
            await checkColorAtPos(expectedGradient, line, ch);
        }

        async function checkImagePathAtPos(expectedPathEnding, line, ch) {
            var popoverInfo = await getPopoverAtPos(line, ch),
                imagePath = popoverInfo.content.find("#quick-view-image-preview").attr("data-for-test");

            // Just check end of path - local drive location prefix unimportant
            expect(imagePath.substr(imagePath.length - expectedPathEnding.length)).toBe(expectedPathEnding);
        }

        async function checkNumberPopoverAtPos(expectedData, line, ch) {
            var popoverInfo = await getPopoverAtPos(line, ch),
                input = popoverInfo.content.find(".dial");
            expect(input.attr("value")).toBe(expectedData);
        }

        async function checkImageDataAtPos(expectedData, line, ch) {
            var popoverInfo = await getPopoverAtPos(line, ch),
                imagePath = popoverInfo.content.find("#quick-view-image-preview").attr("data-for-test");
            expect(imagePath).toBe(expectedData);
        }

        describe("Quick view colors", function () {
            it("should show preview of hex colors either in 3 digit hex or or 6-digit hex",async function () {
                await checkColorAtPos("#369", 3, 12);
                await checkColorAtPos("#2491F5", 4, 13);
            });

            it("should NOT show preview of color on words start with #",async function () {
                await expectNoPreviewAtPos(7, 7);     // cursor on #invalid_hex
                await expectNoPreviewAtPos(8, 15);    // cursor on #web
            });

            it("should show preview of valid rgb/rgba colors",async function () {
                await checkColorAtPos("rgb(255,0,0)",           12, 12);  // no whitespace
                await checkColorAtPos("rgb(100%,   0%,   0%)",  13, 17);  // extra whitespace
                await checkColorAtPos("rgb(50%, 75%, 25%)",     14, 24);

                // rgba with values of 0-255
                await checkColorAtPos("rgba(255, 0, 0, 0.5)", 15, 23);
                await checkColorAtPos("rgba(255, 0, 0, 1)",   16, 22);
                await checkColorAtPos("rgba(255, 0, 0, .5)",  17, 19);

                // rgba with percentage values
                await checkColorAtPos("rgba(100%, 0%, 0%, 0.5)",  18, 32);
                await checkColorAtPos("rgba(80%, 50%, 50%, 1)",   20, 33);
                await checkColorAtPos("rgba(50%, 75%, 25%, 1.0)", 21, 23);
            });

            it("should NOT show preview of unsupported rgb/rgba colors",async function () {
                await expectNoPreviewAtPos(25, 14);    // cursor on rgb(300, 0, 0)
                await expectNoPreviewAtPos(26, 15);    // cursor on rgb(0, 95.5, 0)
                await expectNoPreviewAtPos(27, 15);    // cursor on rgba(-0, 0, 0, 0.5)
            });

            it("should show preview of valid hsl/hsla colors",async function () {
                await checkColorAtPos("hsl(0, 100%, 50%)",       31, 22);
                await checkColorAtPos("hsla(0, 100%, 50%, 0.5)", 32, 23);
                await checkColorAtPos("hsla(0, 100%, 50%, .5)",  33, 23);
                await checkColorAtPos("hsl(390, 100%, 50%)",     34, 24);
            });

            it("should NOT show preview of unsupported hsl/hsla colors",async function () {
                await expectNoPreviewAtPos(38, 14);    // cursor on hsla(90, 100%, 50%, 2)
                await expectNoPreviewAtPos(39, 14);    // cursor on hsla(0, 200%, 50%, 0.5)
                await expectNoPreviewAtPos(40, 14);    // cursor on hsla(0.0, 100%, 50%, .5)
            });

            it("should show preview of colors with valid names", async function () {
                await checkColorAtPos("blueviolet",  