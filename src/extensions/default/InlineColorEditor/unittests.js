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

/*global describe, it, expect, beforeEach, afterEach, awaits, awaitsForDone, spyOn */

define(function (require, exports, module) {


    // Modules from the SpecRunner window
    var KeyEvent           = brackets.getModule("utils/KeyEvent"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        SpecRunnerUtils    = brackets.getModule("spec/SpecRunnerUtils"),
        testContentCSS     = require("text!unittest-files/unittests.css"),
        testContentHTML    = require("text!unittest-files/unittests.html"),
        provider           = require("main").inlineColorEditorProvider,
        InlineColorEditor  = require("InlineColorEditor").InlineColorEditor,
        ColorEditor        = require("ColorEditor").ColorEditor,
        tinycolor          = brackets.getModule("thirdparty/tinycolor");

    // Helper functions for testing cursor position / selection range
    function fixPos(pos) {
        if (!("sticky" in pos)) {
            pos.sticky = null;
        }
        return pos;
    }
    function fixSel(sel) {
        fixPos(sel.start);
        fixPos(sel.end);
        if (!("reversed" in sel)) {
            sel.reversed = false;
        }
        return sel;
    }
    function fixSels(sels) {
        sels.forEach(function (sel) {
            fixSel(sel);
        });
        return sels;
    }

    describe("unit: Inline Color Editor", function () {

        var testDocument, testEditor, inline;

        /**
         * Creates an inline color editor connected to the given cursor position in the test editor.
         * Note that this does *not* actually open it as an inline editor in the test editor.
         * Tests that use this must wrap their contents in a runs() block.
         * @param {!{line:number, ch: number}} cursor Position for which to open the inline editor.
         * if the provider did not create an inline editor.
         */
        async function makeColorEditor(cursor) {
            var promise = provider(testEditor, cursor);
            if (promise) {
                promise.done(function (inlineResult) {
                    inlineResult.onAdded();
                    inline = inlineResult;
                });
                await awaitsForDone(promise, "open color editor");
            }
        }

        /**
         * Expects an inline editor to be opened at the given cursor position and to have the
         * given initial color (which should match the color at that position).
         * @param {!{line:number, ch:number}} cursor The cursor position to try opening the inline at.
         * @param {string} color The expected color.
         */
        async function testOpenColor(cursor, color) {
            await makeColorEditor(cursor);
            expect(inline).toBeTruthy();
            expect(inline._color).toBe(color);
        }

        /**
         * Simulate the given event with clientX/clientY specified by the given
         * ratios of the item's actual width/height (offset by the left/top of the
         * item).
         * @param {string} event The name of the event to simulate.
         * @param {object} $item A jQuery object to trigger the event on.
         * @param {Array.<number>} ratios Numbers between 0 and 1 indicating the x and y positions of the
         *      event relative to the item's width and height.
         */
        function eventAtRatio(event, $item, ratios) {
            $item.trigger($.Event(event, {
                clientX: $item.offset().left + (ratios[0] * $item.width()),
                clientY: $item.offset().top + (ratios[1] * $item.height())
            }));
        }

        describe("Inline editor - CSS", function () {

            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testContentCSS, "css");
                testDocument = mock.doc;
                testEditor = mock.editor;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
                inline = null;
            });

            describe("simple open cases", function () {

                it("should show the correct color when opened on an #rrggbb color", async function () {
                    await testOpenColor({line: 1, ch: 18}, "#abcdef");
                });
                it("should open when at the beginning of the color", async function () {
                    await testOpenColor({line: 1, ch: 16}, "#abcdef");
                });
                it("should open when at the end of the color", async function () {
                    await testOpenColor({line: 1, ch: 23}, "#abcdef");
                });
                it("should show the correct color when opened on an #rgb color", async function () {
                    await testOpenColor({line: 5, ch: 18}, "#abc");
                });
                it("should show the correct color when opened on an rgb() color", async function () {
                    await testOpenColor({line: 9, ch: 18}, "rgb(100, 200, 150)");
                });
                it("should show the correct color when opened on an rgba() color", async function () {
                    await testOpenColor({line: 13, ch: 18}, "rgba(100, 200, 150, 0.5)");
                });
                it("should show the correct color when opened on an hsl() color", async function () {
                    await testOpenColor({line: 17, ch: 18}, "hsl(180, 50%, 50%)");
                });
                it("should show the correct color when opened on an hsla() color", async function () {
                    await testOpenColor({line: 21, ch: 18}, "hsla(180, 50%, 50%, 0.5)");
                });
                it("should show the correct color when opened on an uppercase hex color", async function () {
                    await testOpenColor({line: 33, ch: 18}, "#DEFCBA");
