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

/*global describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, awaitsFor, awaitsForDone, jasmine */
/*unittests: FindReplace*/

define(function (require, exports, module) {


    var Commands        = require("command/Commands"),
        KeyEvent        = require("utils/KeyEvent"),
        SpecRunnerUtils = require("spec/SpecRunnerUtils"),
        StringUtils     = require("utils/StringUtils"),
        Strings         = require("strings");

    var defaultContent = "/* Test comment */\n" +
                         "define(function (require, exports, module) {\n" +
                         "    var Foo = require(\"modules/Foo\"),\n" +
                         "        Bar = require(\"modules/Bar\"),\n" +
                         "        Baz = require(\"modules/Baz\");\n" +
                         "    \n" +
                         "    function callFoo() {\n" +
                         "        \n" +
                         "        foo();\n" +
                         "        \n" +
                         "    }\n" +
                         "\n" +
                         "}";

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

    describe("search:FindReplace - Integration", function () {

        var LINE_FIRST_REQUIRE = 2;
        var CH_REQUIRE_START = 14;
        var CH_REQUIRE_PAREN = CH_REQUIRE_START + "require".length;

        var fooExpectedMatches = [
            {start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}},
            {start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}},
            {start: {line: 6, ch: 17}, end: {line: 6, ch: 20}},
            {start: {line: 8, ch: 8}, end: {line: 8, ch: 11}}
        ];
        var capitalFooSelections = [
            {start: {line: LINE_FIRST_REQUIRE, ch: 8}, end: {line: LINE_FIRST_REQUIRE, ch: 11}},
            {start: {line: LINE_FIRST_REQUIRE, ch: 31}, end: {line: LINE_FIRST_REQUIRE, ch: 34}},
            {start: {line: 6, ch: 17}, end: {line: 6, ch: 20}}
        ];
        var barExpectedMatches = [
            {start: {line: LINE_FIRST_REQUIRE + 1, ch: 8}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 11}},
            {start: {line: LINE_FIRST_REQUIRE + 1, ch: 31}, end: {line: LINE_FIRST_REQUIRE + 1, ch: 34}}
        ];


        var testWindow, twCommandManager, twEditorManager, twFindInFiles, tw$;
        var myDocument, myEditor;

        // Helper functions for testing cursor position / selection range
        // TODO: duplicated from EditorCommandHandlers-test
        function expectSelection(sel) {
            if (!sel.reversed) {
                sel.reversed = false;
            }
            expect(fixSel(myEditor.getSelection())).toEql(fixSel(sel));
        }
        function expectMatchIndex(index, count) {
            var matchInfo = StringUtils.format(Strings.FIND_MATCH_INDEX, index + 1, count);
            expect(myEditor._codeMirror._searchState.matchIndex).toEql(index);
            expect(myEditor._codeMirror._searchState.resultSet.length).toEql(count);
            expect($(testWindow.document).find("#find-counter").text()).toBe(matchInfo);
        }
        function expectHighlightedMatches(selections, expectedDOMHighlightCount) {
            var cm = myEditor._codeMirror;
            var searchState = cm._searchState;

            expect(searchState).toBeDefined();
            expect(searchState.marked).toBeDefined();
            expect(searchState.marked.length).toEql(selections.length);

            // Verify that searchState's marked ranges match expected ranges
            if (selections) {
                selections.forEach(function (location, index) {
                    var textMarker = searchState.marked[index];
                    var markerLocation = textMarker.find();
                    expect(fixPos(markerLocation.from)).toEql(fixPos(location.start));
                    expect(fixPos(markerLocation.to)).toEql(fixPos(location.end));
                });
            }

            // Verify number of tickmarks equals number of highlights
            var tickmarks = tw$(".tickmark-track .tickmark", myEditor.getRootElement());
            expect(tickmarks.length).toEql(selections.length);

            // Verify that editor UI doesn't have extra ranges left highlighted from earlier
            // (note: this only works for text that's short enough to not get virtualized)
            var lineDiv = tw$(".CodeMirror-lines .CodeMirror-code", myEditor.getRootElement());
            var actualHighlights = tw$(".CodeMirror-searching", lineDiv);
            if (expectedDOMHighlightCount === undefined) {
                expectedDOMHighlightCount = selections.length;
            }
            expect(actualHighlights.length).toEql(expectedDOMHighlightCount);
        }
        function expectFindNextSelections(selections) {
            var i;
            for (i = 0; i < selections.length; i++) {
                expectSelection(selections[i]);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
            }

            // next find should wraparound
            expectSelection(selections[0]);
        }


        function getSearchBar() {
            return tw$(".modal-bar");
        }
        function getSearchField() {
            return tw$("#find-what");
        }
        function getReplaceField() {
            return tw$("#replace-with");
        }

        function expectSearchBarOpen() {
            expect(getSearchBar()[0]).toBeDefined();
        }
        async function waitsForSearchBarClose() {
            await awaitsFor(function () {
                return getSearchBar().length === 0;
            }, 1000, "search bar closing");
        }
        async function waitsForSearchBarReopen() {
            // If Find is invoked again while a previous Find bar is already up, we want to
            // wait for the old Find bar to disappear before continuing our test, so we know
            // which modal bar to look at.
            await awaitsFor(function () {
                return getSearchBar().length === 1;
            }, 1000, "search bar reopening");
        }

        function enterSearchText(str) {
            expectSearchBarOpen();
            var $input = getSearchField();
            $input.val(str);
            $input.trigger("input");
        }
        function enterReplaceText(str) {
            expectSearchBarOpen();
            var $input = getReplaceField();
            $input.val(str);
            $input.trigger("input");
        }

        function pressEscape() {
            expectSearchBarOpen();
            SpecRunnerUtils.simulateKeyEvent(KeyEvent.DOM_VK_ESCAPE, "keydown", getSearchField()[0]);
        }

        function toggleCaseSensitive(val) {
            if (tw$("#find-case-sensitive").is(".active") !== val) {
                tw$("#find-case-sensitive").click();
            }
        }
        function toggleRegexp(val) {
            if (tw$("#find-regexp").is(".active") !== val) {
                tw$("#find-regexp").click();
            }
        }


        beforeAll(async function () {
            await SpecRunnerUtils.createTempDirectory();

            // Create a new window that will be shared by ALL tests in this spec.
            testWindow = await SpecRunnerUtils.createTestWindowAndRun();
            // Load module instances from brackets.test
            twCommandManager = testWindow.brackets.test.CommandManager;
            twEditorManager  = testWindow.brackets.test.EditorManager;
            twFindInFiles    = testWindow.brackets.test.FindInFiles;
            tw$              = testWindow.$;

            await SpecRunnerUtils.loadProjectInTestWindow(SpecRunnerUtils.getTempDirectory());
        }, 30000);

        afterAll(async function () {
            testWindow       = null;
            twCommandManager = null;
            twEditorManager  = null;
            twFindInFiles    = null;
            tw$              = null;
            await SpecRunnerUtils.closeTestWindow();

            await SpecRunnerUtils.removeTempDirectory();
        });

        beforeEach(async function () {
            await awaitsForDone(twCommandManager.execute(Commands.FILE_NEW_UNTITLED));

            myEditor = twEditorManager.getCurrentFullEditor();
            myDocument = myEditor.document;
            myDocument.replaceRange(defaultContent, {line: 0, ch: 0});
            myEditor.centerOnCursor = jasmine.createSpy("centering");
        });

        afterEach(async function () {
            // Reset search options for next test, since these are persisted and the window is shared
            // Note: tests that explicitly close the search bar before finishing will need to reset any changed options themselves
            toggleCaseSensitive(false);
            toggleRegexp(false);

            await awaitsForDone(twCommandManager.execute(Commands.FILE_CLOSE, { _forceClose: true }));

            await waitsForSearchBarClose();

            myEditor = null;
            myDocument = null;
        });

        describe("Search", function () {
            it("should have the correct match count even if DOM highlighting is turned off when over 2000 matches", async function () {
                var text = "bbbbbbbbbb", i;
                // Create a text string that is 2430 (10 x 3^5) characters long
                for (i = 0; i < 5; i++) {
                    text += text + text;
                }
                myEditor._codeMirror.setValue(text);
                myEditor.setCursorPos(0, 0);

                twCommandManager.execute(Commands.CMD_FIND);

                enterSearchText("b");

                expectMatchIndex(0, 2430);
                // When exceeding 2000 matches, tickmarks disabled and only the *current* editor highlight is shown
                expectHighlightedMatches([], 1);
            });

            it("should find all case-insensitive matches with lowercase text", async function () {
                myEditor.setCursorPos(0, 0);

                twCommandManager.execute(Commands.CMD_FIND);
                // The previous search term "b" was pre-filled, so the editor was centered there already
                expect(myEditor.centerOnCursor.calls.count()).toEql(1);

                enterSearchText("foo");
                expectHighlightedMatches(fooExpectedMatches);
                expectSelection(fooExpectedMatches[0]);
                expectMatchIndex(0, 4);
                expect(myEditor.centerOnCursor.calls.count()).toEql(2);

                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[1]);
                expectMatchIndex(1, 4);
                expect(myEditor.centerOnCursor.calls.count()).toEql(3);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[2]);
                expectMatchIndex(2, 4);
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
                expectSelection(fooExpectedMatches[3]);
                expectMatchIndex(3, 4);
                expectHighlightedMatches(fooExpectedMatches);  // no change in highlights

                // wraparound
                twCommandManager.execute(Commands.CMD_FIND_NEXT);
          