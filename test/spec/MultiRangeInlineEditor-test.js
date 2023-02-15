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

/*global describe, it, expect, beforeEach, afterEach*/

define(function (require, exports, module) {


    var MultiRangeInlineEditor  = require("editor/MultiRangeInlineEditor").MultiRangeInlineEditor,
        InlineTextEditor        = require("editor/InlineTextEditor").InlineTextEditor,
        InlineWidget            = require("editor/InlineWidget").InlineWidget,
        SpecRunnerUtils         = require("spec/SpecRunnerUtils");

    // TODO: overlaps a lot with CSSInlineEdit-test integration suite
    describe("MultiRangeInlineEditor", function () {

        var inlineEditor,
            hostEditor,
            doc;

        describe("unit", function () {

            beforeEach(function () {
                // create dummy Document and Editor
                var mocks = SpecRunnerUtils.createMockEditor("hostEditor", "");
                doc = mocks.doc;
                hostEditor = mocks.editor;
            });

            afterEach(function () {
                SpecRunnerUtils.destroyMockEditor(doc);
                doc = null;
                inlineEditor = null;
                hostEditor = null;
            });

            function getRuleListItems() {
                return $(inlineEditor.htmlContent).find("li:not(.section-header)");
            }

            function getRuleListSections() {
                return $(inlineEditor.htmlContent).find("li.section-header");
            }

            function expectListItem($ruleListItem, ruleLabel, filename, lineNum) {  // TODO: duplicated with CSSInlineEdit-test
                expect($ruleListItem.text()).toBe(ruleLabel + " :" + lineNum);
                expect($ruleListItem.data("filename")).toBe(filename);
            }


            it("should initialize to a default state", function () {
                inlineEditor = new MultiRangeInlineEditor([]);

                expect(inlineEditor instanceof InlineTextEditor).toBe(true);
                expect(inlineEditor instanceof InlineWidget).toBe(true);
                expect(inlineEditor.editor).toBeNull();
                expect(inlineEditor.htmlContent instanceof HTMLElement).toBe(true);
                expect(inlineEditor.height).toBe(0);
                expect(inlineEditor.id).toBeNull();
                expect(inlineEditor.hostEditor).toBeNull();
            });

            it("should load a single rule and initialize htmlContent and editor", function () {
                var inlineDoc = SpecRunnerUtils.createMockDocument("inlineDoc\nstartLine\nendLine\n");
                var mockRange = {
                    document: inlineDoc,
                    lineStart: 1,
                    lineEnd: 2
                };

                inlineEditor = new MultiRangeInlineEditor([mockRange]);
                inlineEditor.load(hostEditor);

                expect(inlineEditor.editor).toBeTruthy();
                expect(inlineEditor.editor.document).toBe(inlineDoc);

                // Messages div should be hidden, editor holder should have a child editor.
                expect(inlineEditor.$htmlContent.find(".inline-editor-message").length).toBe(0);
                expect(inlineEditor.$htmlContent.find(".inline-editor-holder").children().length).toBe(1);

                // Rule list should be hidden with only one rule.
                expect(inlineEditor.$htmlContent.find(".related-container").length).toBe(0);
            });

            it("should contain a rule list widget displaying info for each rule", function () {
                var inlineDoc = SpecRunnerUtils.createMockDocument("div{}\n.foo{}\n"),
                    inlineDocName = inlineDoc.file.name;

                var mockRanges = [
                    {
                        document: inlineDoc,
                        name: "div"