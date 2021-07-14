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
                });
                it("should show the correct color when opened on a color in a shorthand property", async function () {
                    await testOpenColor({line: 41, ch: 27}, "#0f0f0f");
                });
                it("should show the correct color when opened on an rgba() color with a leading period in the alpha field", async function () {
                    await testOpenColor({line: 45, ch: 18}, "rgba(100, 200, 150, .5)");
                });
                it("should show the correct color when opened on an hsla() color with a leading period in the alpha field", async function () {
                    await testOpenColor({line: 49, ch: 18}, "hsla(180, 50%, 50%, .5)");
                });

                it("should not open when not on a color", async function () {
                    await makeColorEditor({line: 1, ch: 6});
                    expect(inline).toEqual(null);
                });
                it("should not open when on an invalid color", async function () {
                    await makeColorEditor({line: 25, ch: 18});
                    expect(inline).toEqual(null);
                });
                it("should not open when on an hsl color with missing percent signs", async function () {
                    await makeColorEditor({line: 37, ch: 18});
                    expect(inline).toEqual(null);
                });

                it("should open on the second color when there are two colors in the same line", async function () {
                    await testOpenColor({line: 29, ch: 48}, "#ddeeff");
                });

                it("should properly add/remove ref to document when opened/closed", async function () {
                    spyOn(testDocument, "addRef").and.callThrough();
                    spyOn(testDocument, "releaseRef").and.callThrough();
                    await makeColorEditor({line: 1, ch: 18});
                    expect(testDocument.addRef).toHaveBeenCalled();
                    expect(testDocument.addRef.calls.count()).toBe(1);

                    inline.onClosed();
                    expect(testDocument.releaseRef).toHaveBeenCalled();
                    expect(testDocument.releaseRef.calls.count()).toBe(1);
                });

            });

            describe("update host document on edit in color editor", function () {

                it("should update host document when change is committed in color editor", async function () {
                    await makeColorEditor({line: 1, ch: 18});
                    inline.colorEditor.setColorFromString("#c0c0c0");
                    expect(testDocument.getRange({line: 1, ch: 16}, {line: 1, ch: 23})).toBe("#c0c0c0");
                });

                it("should update correct range of host document with color format of different length", async function () {
                    await makeColorEditor({line: 1, ch: 18});
                    inline.colorEditor.setColorFromString("rgb(20, 20, 20)");
                    expect(testDocument.getRange({line: 1, ch: 16}, {line: 1, ch: 31})).toBe("rgb(20, 20, 20)");
                });

                it("should not invalidate range when change is committed", async function () {
                    await makeColorEditor({line: 1, ch: 18});
                    inline.colorEditor.setColorFromString("rgb(20, 20, 20)");
                    expect(inline.getCurrentRange()).toBeTruthy();
                });

                it("should update correct range of host document when the in-editor color string is invalid", async function () {
                    await makeColorEditor({line: 1, ch: 18});
                    testDocument.replaceRange("", {line: 1, ch: 22}, {line: 1, ch: 24});
                    inline.colorEditor.setColorFromString("#c0c0c0");
                    expect(fixSel(inline.getCurrentRange())).toEql(fixSel({start: {line: 1, ch: 16}, end: {line: 1, ch: 23}}));
                    expect(testDocument.getRange({line: 1, ch: 16}, {line: 1, ch: 23})).toBe("#c0c0c0");
                });

            });

            describe("update color editor on edit in host editor", function () {

                it("should update when edit is made to color range in host editor", async function () {
                    await makeColorEditor({line: 1, ch: 18});
                    spyOn(inline, "close");

                    testDocument.replaceRange("0", {line: 1, ch: 18}, {line: 1, ch: 19});
                    expect(inline._color).toBe("#a0cdef");
                    // TODO (#2201): this assumes getColor() is a tinycolor, but sometimes it's a string
                    expect(inline.colorEditor.getColor().toHexString().toLowerCase()).toBe("#a0cdef");
                    expect(inline.close).not.toHaveBeenCalled();
                    expect(fixSel(inline.getCurrentRange())).toEql(fixSel({start: {line: 1, ch: 16}, end: {line: 1, ch: 23}}));
                });

                it("should close itself if edit is made that destroys end textmark and leaves color invalid", async function () {
                    await makeColorEditor({line: 1, ch: 18});
                    spyOn(inline, "close");

                    // Replace everything including the semicolon, so it crosses the textmark boundary.
                    testDocument.replaceRange("rgb(255, 25", {line: 1, ch: 16}, {line: 1, ch: 24});
                    expect(inline.close).toHaveBeenCalled();
                });

                it("should maintain the range if the user deletes the last character of the color and types a new one", async function () {
                    await makeColorEditor({line: 1, ch: 18});
                    spyOn(inline, "close");

                    testDocument.replaceRange("", {line: 1, ch: 22}, {line: 1, ch: 23});
                    testDocument.replaceRange("0", {line: 1, ch: 22}, {line: 1, ch: 22});
                    expect(inline._color).toBe("#abcde0");
                    expect(inline.close).not.toHaveBeenCalled();
                    expect(fixSel(inline.getCurrentRange())).toEql(fixSel({start: {line: 1, ch: 16}, end: {line: 1, ch: 23}}));
                });

                it("should not update the end textmark and the color shown to a shorter valid match if the marker still exists and the color becomes invalid", async function () {
                    await makeColorEditor({line: 1, ch: 18});
                    testDocument.replaceRange("", {line: 1, ch: 22}, {line: 1, ch: 23});
                    expect(inline._color).toBe("#abcdef");
                    expect(fixSel(inline.getCurrentRange())).toEql(fixSel({start: {line: 1, ch: 16}, end: {line: 1, ch: 22}}));
                });

                it("should not update the end textmark and the color shown to a shorter valid match if the marker no longer exists and the color becomes invalid", async function () {
                    await makeColorEditor({line: 1, ch: 18});
                    testDocument.replaceRange("", {line: 1, ch: 22}, {line: 1, ch: 24});
                    expect(inline._color).toBe("#abcdef");
                    expect(fixSel(inline.getCurrentRange())).toEql(fixSel({start: {line: 1, ch: 16}, end: {line: 1, ch: 22}}));
                });

            });

            describe("edit batching", function () {
                it("should combine multiple edits within the same inline editor into a single undo in the host editor", async function () {
                    await makeColorEditor({line: 1, ch: 18});
                    inline.colorEditor.setColorFromString("#010101");
                    inline.colorEditor.setColorFromString("#123456");
                    inline.colorEditor.setColorFromString("#bdafe0");
                    testDocument._masterEditor._codeMirror.undo();
                    expect(testDocument.getRange({line: 1, ch: 16}, {line: 1, ch: 23})).toBe("#abcdef");
                });
            });
        });

        describe("Inline editor - HTML", function () {

            beforeEach(function () {
                var mock = SpecRunnerUtils.createMockEditor(testContentHTML, "html");
                testDocument = mock.doc;
                testEditor = mock.editor;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(testDocument);
                testEditor = null;
                testDocument = null;
            });

            it("should open on a color in an HTML file", async function () {
                await testOpenColor({line: 4, ch: 30}, "#dead01");
            });
        });

        describe("Inline editor - used colors processing", function () {

            it("should trim the original array to the given length", function () {
                var inline = new InlineColorEditor();
                var result = inline._collateColors(["#abcdef", "#fedcba", "#aabbcc", "#bbccdd"], 2);
                expect(result).toEqual([
                    {value: "#abcdef", count: 1},
                    {value: "#fedcba", count: 1}
                ]);
            });

            it("should remove duplicates from the original array and sort it by usage", function () {
                var inline = new InlineColorEditor();
                var result = inline._collateColors(["#abcdef", "#fedcba", "#123456", "#FEDCBA", "#123456", "#123456", "rgb(100, 100, 100)"], 100);
                expect(result).toEqual([
                    {value: "#123456", count: 3},
                    {value: "#fedcba", count: 2},
                    {value: "#abcdef", count: 1},
                    {value: "rgb(100, 100, 100)", count: 1}
                ]);
            });
        });

        describe("Color editor UI", function () {
            var colorEditor,
                defaultSwatches = [{value: "#abcdef", count: 3}, {value: "rgba(100, 200, 250, 0.5)", count: 2}];

            /**
             * Creates a hidden ColorEditor and appends it to the body. Note that this is a standalone
             * ColorEditor, not inside an InlineColorEditor.
             * @param {string} initialColor The color that should be initially set in the ColorEditor.
             * @param {?function} callback An optional callback to be passed as the ColorEditor's callback. If
             *     none is supplied, a dummy function is passed.
             * @param {?Array.<{value:string, count:number}>} swatches An optional array of swatches to display.
             *     If none is supplied, a default set of two swatches is passed.
             * @param {boolean=} hide Whether to hide the color picker; default is true.
             */
            function makeUI(initialColor, callback, swatches, hide) {
                colorEditor = new ColorEditor($(window.document.body),
                                              initialColor,
                                              callback || function () { },
                                              swatches || defaultSwatches);
                if (hide !== false) {
                    colorEditor.getRootElement().css("display", "none");
                }
            }

            afterEach(function () {
                colorEditor.getRootElement().remove();
            });

            /**
             * Checks whether the difference between val1 and val2 is within the given tolerance.
             * (We can't use Jasmine's .toBeCloseTo() because that takes a precision in decimal places,
             * whereas we often need to check an absolute distance.)
             * @param {(number|string)} val1 The first value to check.
             * @param {(number|string)} val2 The second value to check.
             * @param {number} tolerance The desired tolerance.
             */
            function checkNear(val1, val2, tolerance) {
                expect(Math.abs(Number(val1) - Number(val2)) < (tolerance || 1.0)).toBe(true);
            }
            /**
             * Checks whether the given percentage string is near the given value.
             * @param {string} pct The percentage to check. Assumed to be a string ending in "%".
             * @param {number} val The value to check against. Assumed to be a percentage number, but not ending in "%".
             */
            function checkPercentageNear(pct, val) {
                expect(checkNear(pct.substr(0, pct.length - 1), val));
            }

            /** Returns the colorEditor's current value as a string in its current format */
            function getColorString() {
                return tinycolor(colorEditor.getColor()).getOriginalInput();
            }

            describe("simple load/commit", function () {

                it("should load the initial color correctly", async function () {
                    var colorStr    = "rgba(77, 122, 31, 0.5)";
                    var colorStrRgb = "rgb(77, 122, 31)";

                    makeUI(colorStr);
                    expect(colorEditor.getColor().getOriginalInput()).toBe(colorStr);
                    expect(colorEditor.$colorValue.val()).toBe(colorStr);
                    expect(tinycolor.equals(colorEditor.$currentColor.css("background-color"), colorStr)).toBe(true);

                    // Not sure why the tolerances need to be larger for these.
                    checkNear(tinycolor(colorEditor.$selection.css("background-color")).toHsv().h, 90, 2.0);
                    checkNear(tinycolor(colorEditor.$hueBase.css("background-color")).toHsv().h, 90, 2.0);

                    expect(tinycolor.equals(colorEditor.$selectionBase.css("background-color"), colorStrRgb)).toBe(true);

                    // Need to do these on a timeout since we can't seem to read back CSS positions synchronously.
                    await awaits(1);

                    checkPercentageNear(colorEditor.$hueSelector[0].style.bottom, 25);
                    checkPercentageNear(colorEditor.$opacitySelector[0].style.bottom, 50);
                    checkPercentageNear(colorEditor.$selectionBase[0].style.left, 74);
                    checkPercentageNear(colorEditor.$selectionBase[0].style.bottom, 47);
                });

                it("should load a committed color correctly", async function () {
                    var colorStr = "rgba(77, 122, 31, 0.5)";
                    var colorStrRgb = "rgb(77, 122, 31)";

                    makeUI("#0a0a0a");
                    colorEditor.setColorFromString(colorStr);
                    expect(colorEditor.getColor().getOriginalInput()).toBe(colorStr);
                    expect(colorEditor.$colorValue.val()).toBe(colorStr);
                    expect(tinycolor.equals(colorEditor.$currentColor.css("background-color"), colorStr)).toBe(true);
                    checkNear(tinycolor(colorEditor.$selection.css("background-color")).toHsv().h, tinycolor(colorStr).toHsv().h);
                    checkNear(tinycolor(colorEditor.$hueBase.css("background-color")).toHsv().h, tinycolor(colorStr).toHsv().h);
                    expect(tinycolor.equals(colorEditor.$selectionBase.css("background-color"), colorStrRgb)).toBe(true);

                    // Need to do these on a timeout since we can't seem to read back CSS positions synchronously.
                    await awaits(1);

                    checkPercentageNear(colorEditor.$hueSelector[0].style.bottom, 25);
                    checkPercentageNear(colorEditor.$opacitySelector[0].style.bottom, 50);
                    checkPercentageNear(colorEditor.$selectionBase[0].style.left, 74);
                    checkPercentageNear(colorEditor.$selectionBase[0].style.bottom, 47);
                });

                it("should call the callback when a new color is committed", function () {
                    var lastColor;
                    makeUI("rgba(100, 100, 100, 0.5)", function (color) {
                        lastColor = color;
                    });
                    colorEditor.setColorFromString("#a0a0a0");
                    expect(lastColor).toBe("#a0a0a0");
                });

            });

            /**
             * Test whether converting the given color to the given mode results in the expected color.
             * @param {string} initialColor The color to convert.
             * @param {string} mode The mode to convert to: must be "rgba", "hsla", or "hex".
             * @param {string} result The expected result of the conversion.
             */
            function testConvert(initialColor, mode, result) {
                makeUI(initialColor);
                var buttonMap = {
                    "rgba": "$rgbaButton",
                    "hsla": "$hslButton",
                    "hex": "$hexButton"
                };
                colorEditor[buttonMap[mode]].trigger("click");
                expect(colorEditor.getColor().getOriginalInput()).toBe(result);
            }

            describe("conversions in lower case", function () {

                it("should convert a hex color to rgb when mode button clicked", function () {
                    testConvert("#112233", "rgba", "rgb(17, 34, 51)");
                });
                it("should convert a hex color to hsl when mode button clicked", function () {
                    testConvert("#112233", "hsla", "hsl(210, 50%, 13%)");
                });
                it("should convert an rgb color to hex when mode button clicked", function () {
                    testConvert("rgb(15, 160, 21)", "hex", "#0fa015");
                });
                it("should convert an rgba color to hex with alpha when mode button clicked", function () {
                    testConvert("rgba(15, 160, 21, 0.5)", "hex", "#0fa01580");
                });
                it("should convert an rgb color to hsl when mode button clicked", function () {
                    testConvert("rgb(15, 160, 21)", "hsla", "hsl(122, 83%, 34%)");
                });
                it("should convert an rgba color to hsla when mode button clicked", function () {
                    testConvert("rgba(15, 160, 21, 0.3)", "hsla", "hsla(122, 83%, 34%, 0.3)");
                });
                it("should convert an hsl color to hex when mode button clicked", function () {
                    testConvert("hsl(152, 12%, 22%)", "hex", "#313f39");
                });
                it("should convert an hsla color to hex with alpha when mode button clicked", function () {
                    testConvert("hsla(152, 12%, 22%, 0.7)", "hex", "#313f39b3");
                });
                it("should convert an hsl color to rgb when mode button clicked", function () {
                    testConvert("hsl(152, 12%, 22%)", "rgba", "rgb(49, 63, 57)");
                });
                it("should convert an hsla color to rgba when mode button clicked", function () {
                    testConvert("hsla(152, 12%, 22%, 0.7)", "rgba", "rgba(49, 63, 57, 0.7)");
                });
                it("should convert a mixed case hsla color to rgba when mode button clicked", function () {
                    testConvert("HsLa(152, 12%, 22%, 0.7)", "rgba", "rgba(49, 63, 57, 0.7)");
                });
                it("should convert a mixed case hex color to rgb when mode button clicked", function () {
                    testConvert("#fFfFfF", "rgba", "rgb(255, 255, 255)");
                });

            });

            describe("conversions in UPPER CASE", function () {

                beforeEach(function () {
                    // Enable uppercase colors
                    PreferencesManager.set("uppercaseColors", true);
                });
                afterEach(function () {
                    // Re-disable uppercase colors
                    PreferencesManager.set("uppercaseColors", false);
                });

                it("should use uppercase colors", function () {
                    expect(PreferencesManager.get("uppercaseColors")).toBe(true);
                });
                it("should convert a hex color to rgb in uppercase when