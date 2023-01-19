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

/*global describe, it, expect */
/*unittests: HTML Tokenizer*/

define(function (require, exports, module) {


    var Tokenizer = require("language/HTMLTokenizer").Tokenizer;

    describe("HTML Tokenizer", function () {
        it("should handle tags and text", function () {
            var t = new Tokenizer("<html>\n<body>Hello</body>\n</html>");
            expect(t.nextToken()).toEqual({
                type: "opentagname",
                contents: "html",
                start: 1,
                end: 5,
                startPos: {line: 0, ch: 1},
                endPos: {line: 0, ch: 5}
            });
            expect(t.nextToken()).toEqual({
                type: "opentagend",
                contents: "",
                start: -1,
                end: 6,
                startPos: null,
                endPos: {line: 0, ch: 6}
            });
            expect(t.nextToken()).toEqual({
                type: "text",
                contents: "\n",
                start: 6,
                end: 7,
                startPos: {line: 0, ch: 6},
                endPos: {line: 1, ch: 0}
            });
            expect(t.nextToken()).toEqual({
                type: "opentagname",
                contents: "body",
                start: 8,
                end: 12,
                startPos: {line: 1, ch: 1},
                endPos: {line: 1, ch: 5}
            });
            expect(t.nextToken()).toEqual({
                type: "opentagend",
                contents: "",
                start: -1,
                end: 13,
                startPos: null,
                endPos: {line: 1, ch: 6}
            });
            expect(t.nextToken()).toEqual({
                type: "text",
                contents: "Hello",
                start: 13,
                end: 18,
                startPos: {line: 1, ch: 6},
                endPos: {line: 1, ch: 11}
            });
            expect(t.nextToken()).toEqual({
                type: "closetag",
                contents: "body",
                start: 20,
                end: 24,
                startPos: {line: 1, ch: 13},
                endPos: {line: 1, ch: 17}
            });
            expect(t.nextToken()).toEqual({
                type: "text",
                contents: "\n",
                start: 25,
                end: 26,
                startPos: {line: 1, ch: 18},
                endPos: {line: 2, ch: 0}
            });
            expect(t.nextToken()).toEqual({
                type: "closetag",
                contents: "html",
                start: 28,
                end: 32,
                startPos: {line: 2, ch: 2},
                endPos: {line: 2, ch: 6}
            });
        });

        it("should handle attributes", function () {
            var t = new Tokenizer("<div class='foo bar' style=\"baz: quux\" checked></div>");
            expect(t.nextToken()).toEqual({
                type: "opentagname",
                contents: "div",
                start: 1,
                end: 4,
                startPos: {line: 0, ch: 1},
                endPos: {line: 0, ch: 4}
            });
            expect(t.nextToken()).toEqual({
                type: "attribname",
                contents: "class",
                start: 5,
                end: 10,
                startPos: {line: 0, ch: 5},
                endPos: {line: 0, ch: 10}
            });
            expect(t.nextToken()).toEqual({
                type: "attribvalue",
                contents: "foo bar",
                start: 12,
                end: 19,
                startPos: {line: 0, ch: 12},
                endPos: {line: 0, ch: 19}
            });
            expect(t.nextToken()).toEqual({
                type: "attribname",
                contents: "style",
                start: 21,
                end: 26,
                startPos: {line: 0, ch: 21},
                endPos: {line: 0, ch: 26}
            });
            expect(t.nextToken()).toEqual({
                type: "attribvalue",
                contents: "baz: quux",
                start: 28,
                end: 37,
                startPos: {line: 0, ch: 28},
                endPos: {line: 0, ch: 37}
            });
            expect(t.nextToken()).toEqual({
                type: "attribname",
                contents: "checked",
                start: 39,
                end: 46,
                startPos: {line: 0, ch: 39},
                endPos: {line: 0, ch: 46}
            });
            expect(t.nextToken()).toEqual({
                type: "opentagend",
                contents: "",
                start: -1,
                end: 47,
                startPos: null,
                endPos: {line: 0, ch: 47}
            });
            expect(t.nextToken()).toEqual({
                type: "closetag",
                contents: "div",
                start: 49,
                end: 52,
                startPos: {line: 0, ch: 49},
                endPos: {line: 0, ch: 52}
            });
            expect(t.nextToken()).toEqual(null);
        });

        it("should handle various newline cases", function () {
            var t = new Tokenizer("<div \n    class='foo'\n    checked>\n    some text\n    with a newline\n    <br/>\n<!--multiline\ncomment-->\n</div>");
            expect(t.nextToken()).toEqual({
                type: "opentagname",
                contents: "div",
                start: 1,
                end: 4,
                startPos: {line: 0, ch: 1},
                endPos: {line: 0, ch: 4}
            });
            expect(t.nextToken()).toEqual({
                type: "attribname",
                contents: "class",
                start: 10,
                end: 15,
                startPos: {line: 1, ch: 4},
                endPos: {line: 