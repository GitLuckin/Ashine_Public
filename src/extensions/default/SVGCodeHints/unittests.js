/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2015 - 2021 Adobe Systems Incorporated. All rights reserved.
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

/*global describe, beforeEach, afterEach, it, expect */

define(function (require, exports, module) {


    // Load dependent modules.
    var SpecRunnerUtils     = brackets.getModule("spec/SpecRunnerUtils"),
        SVGCodeHints        = require("./main");

    describe("unit:SVG Code Hints", function () {
        var testContent, testDocument, testEditor;

        // SVG Content that we will be using to run tests against.
        testContent =   "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n" +
                        "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
                        "     width=\"200\" height=\"200\" preserveAspectRatio=\"xMinYMin meet\">\n" +
                        "    <title>Brackets SVG Code Hints</title>\n" +
                        "    <rect width=\"200\" height=\"200\" baseline-shift=\"baseline\" alignment-baseline=\"alphabetic\" stroke-width=\"1\" color=\"\"></rect>\n" +
                        "    <rect width='160' height='160' x='20' y='20' baseline-shift='super' alignment-baseline='baseline' color='rent' fill='transparent' />\n" +
                        "    <g>\n" +
                        "        \n" +
                        "    </g>\n" +
                        "</svg>\n";

        beforeEach(function () {
            // Create a mock svg document to run tests against.
            var mockEditor = SpecRunnerUtils.createMockEditor(testContent, "svg", {
                startLine: 0,
                endLine: 10
            });
            testEditor = mockEditor.editor;
            testDocument = mockEditor.doc;
        });

        afterEach(function () {
            testEditor.destroy();
            testEditor = null;
        });

        // Returns a list of hints.
        function extractHintList(hints) {
            return $.map(hints, function ($node) {
                return $node.text();
            });
        }

        // Verifies the availability of hints.
        function expectHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBe(true);
            var hintObj = provider.getHints();
            expect(hintObj).toBeTruthy();
            return hintObj.hints;
        }

        // Verifies the non-availability of hints.
        function expectNoHints(provider) {
            expect(provider.hasHints(testEditor, null)).toBe(false);
        }

        // Verifies the presence of a hint.
        function verifyHints(hintList, expectedHint) {
            var hints = extractHintList(hintList);
            expect(hints[0]).toBe(expectedHint);
        }

        // Verifies the exclusion of an unexpected hint.
        function verifyHintsExcluded(hintList, unexpectedHint) {
            var hints = extractHintList(hintList);
            expect(hints.indexOf(unexpectedHint)).toBe(-1);
        }

        // Inserts the hint in document.
        function selectHint(provider, expectedHint) {
            var hintList = expectHints(provider),
                hints = extractHintList(hintList);
            expect(hints.indexOf(expectedHint)).not.toBe(-1);
            return provider.insertHint(expectedHint);
        }

        // Used to test token at given positions.
        function expectTokenAt(pos, string, type) {
            var token = testEditor._codeMirror.getTokenAt(pos);
            expect(token.string).toBe(string);
            expect(token.type).toBe(type);
        }

        // Helper functions for testing cursor position / selection range
        function fixPos(pos) {
            if (!("sticky" in pos)) {
                pos.sticky = null;
            }
            return pos;
        }

        // Used to test cursor position.
        function expectCursorAt(pos) {
            var selection = testEditor.getSelection();
            expect(fixPos(selection.start)).toEql(fixPos(selection.end));
            expect(fixPos(selection.start)).toEql(fixPos(pos));
        }

        describe("Tag Hinting", function () {
            it("should hint at < before tag name", function () {
                // After < in <svg
                testEditor.setCursorPos({line: 1, ch: 1});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "a");
            });

            it("should hint inside the tag name", function () {
                // After <sv in <svg
                testEditor.setCursorPos({line: 1, ch: 3});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "svg");
            });

            it("should hint at the end of the tag", function () {
                // After <svg in <svg
                testEditor.setCursorPos({line: 1, ch: 4});
                var hintList = expectHints(SVGCodeHints.hintProvider);
                verifyHints(hintList, "svg");
            });

            it("should NOT hint in closing tag between < and /", function () {
                // Between < and / in </title>
                testEditor.setCursorPos({line: 3, ch: 35});
                expectNoHints(SVGCodeHints.hintProvider);

                // In case we have space between < and /
                testDocument.replaceRange(" ", {line: 3, ch: 35});
                testEditor.setCursorPos({line: 3, ch: 36});
                expectNoHints(SVGCodeHints.hintProvider);
            });

            it("should NOT hint in closing tag after </", function () {
                // After </ in </title>
                testEditor.setCursorPos({line: 3, ch: 36});
                expectNoHints(SVGCodeHints.hintProvider);
            });

            it("should NOT hint in the middle of closing tag", function () {
                // After </tit in </title>
                testEditor.setCursorPos({line: 3, ch: 39});
                expectNoHints(SVGCodeHints.hintProvider);
            });

            it("should NOT hint at the end of closing tag", function () {
                // Before > in </title>
                testEditor.setCursorPos({line: 3, ch: 41});
                expectNoHints(SVGCodeHints.hintProvider);
            });

            it("should NOT hint after the first space in closing tag", function () {
                // Before > in </title >
                testDocument.replaceRange(" ", {line: 3, ch: 41});
                testEditor.setCur