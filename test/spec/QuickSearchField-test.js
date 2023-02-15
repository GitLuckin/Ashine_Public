/*
 *  Copyright (c) 2021 - present core.ai . All rights reserved.
 *  Original work Copyright (c) 2014 - 2021 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/*global jasmine, describe, it, expect, beforeEach, afterEach, awaitsFor */

define(function (require, exports, module) {


    var QuickSearchField    = require("search/QuickSearchField").QuickSearchField,
        KeyEvent            = require("utils/KeyEvent"),
        SpecRunnerUtils     = require("spec/SpecRunnerUtils");

    describe("QuickSearchField", function () {
        var $mockInput,
            searchField,
            provider,
            mockResults,
            onCommit;

        beforeEach(function () {
            $mockInput = $("<input>");
            SpecRunnerUtils.createMockElement().append($mockInput);

            // Create a QuickSearchField that proxies to these function references, which each
            // testcase can set to whatever mock implementation is needed
            provider = null;
            onCommit = null;

            var options = {
                formatter: function (item) { return "<li>" + item + "</li>"; },
                resultProvider: function (query) { return provider(query); },
                onCommit: function (item, query) { return onCommit(item, query); },
                onHighlight: jasmine.createSpy(),
                firstHighlightIndex: 0
            };
            searchField = new QuickSearchField($mockInput, options);

            // Many tests start from this results template, but they can modify it to customize
            mockResults = {
                "f": ["one", "two", "three", "four"],
                "foo": ["one", "two", "three"],
                "foobar": ["three"],
                "bar": ["five"]
            };
            mockResults.fo = mockResults.f;
            mockResults.foob = mockResults.foo;
            mockResults.fooba = mockResults.foo;
        });

        afterEach(function () {
            searchField.destroy();
            $mockInput.parent().remove();
        });


        /** Sets provider to a function that synchronously returns results from mockResults */
        function makeSyncProvider() {
            provider = jasmine.createSpy().and.callFake(function (query) {
                return mockResults[query || "<blank>"];
            });
        }

        /**
         * Sets provider to a function that returns Promises, and can be triggered to resolve them later with
         * results from mockResults, by calling finishAsync().
         */
        function makeAsyncProvider() {
            provider = jasmine.createSpy().and.callFake(function (query) {
                var promise = new $.Deferred();
                provider.futures.push(function () {
                    promise.resolve(mockResults[query || "<blank>"]);
                });
                return promise;
            });
            provider.futures = [];
        }

        /** Resolve the Nth call to the async provider now