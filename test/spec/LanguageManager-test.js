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
    var CodeMirror          = require("thirdparty/CodeMirror/lib/codemirror"),
        LanguageManager     = require("language/LanguageManager"),
        PreferencesManager  = require("preferences/PreferencesManager");

    describe("LanguageManager", function () {

        beforeEach(async function () {
            await awaitsForDone(LanguageManager.ready, "LanguageManager ready", 10000);

            spyOn(console, "error");
        });

        afterEach(function () {
            LanguageManager._resetPathLanguageOverrides();
        });

        function defineLanguage(definition) {
            var def = $.extend({}, definition);

            if (def.blockComment) {
                def.blockComment = [def.blockComment.prefix, def.blockComment.suffix];
            }

            return LanguageManager.defineLanguage(definition.id, def);
        }

        function validateLanguage(expected, actual) {
            if (!actual) {
                actual = LanguageManager.getLanguage(expected.id);
            } else {
                expect(LanguageManager.getLanguage(expected.id)).toBe(actual);
            }

            var i = 0,
                expectedFileExtensions = expected.fileExtensions || [],
                expectedFileExtensionsLength = expectedFileExtensions.length,
                actualFileExtensions = actual.getFileExtensions();

            expect(actual.getId()).toBe(expected.id);
            expect(actual.getName()).toBe(expected.name);

            for (i; i < expectedFileExtensionsLength; i++) {
                expect(actualFileExtensions).toContain(expectedFileExtensions[i]);
            }

            expect(actual.getFileNames()).toEqual(expected.fileNames || []);

            if (expected.blockComment) {
                expect(actual.hasBlockCommentSyntax()).toBe(true);
                expect(actual.getBlockCommentPrefix()).toBe(expected.blockComment.prefix);
                expect(actual.getBlockCommentSuffix()).toBe(expected.blockComment.suffix);
            } else {
                expect(actual.hasBlockCommentSyntax()).toBe(false);
            }

            if (expected.lineComment) {
                var lineComment = Array.isArray(expected.lineComment) ? expected.lineComment : [expected.lineComment];
                expect(actual.hasLineCommentSyntax()).toBe(true);
                expect(actual.getLineCommentPrefixes().toString()).toBe(lineComment.toString());
            } else {
                expect(actual.hasLineCommentSyntax()).toBe(false);
            }
        }

        describe("built-in languages", function () {

            it("should support built-in languages", function () {
                var html   = LanguageManager.getLanguage("html"),
                    coffee = LanguageManager.getLanguage("coffeescript");

                // check basic language support
                expect(html).toBeTruthy();
                expect(LanguageManager.getLanguage("css")).toBeTruthy();
                expect(LanguageManager.getLanguage("javascript")).toBeTruthy();
                expect(LanguageManager.getLanguage("json")).toBeTruthy();

                // check html mode
                var def = {
                    "id": "html",
                    "name": "HTML",
                    "mode": ["htmlmixed", "text/x-brackets-html"],
                    "fileExtensions": ["html", "htm", "shtm", "shtml", "xhtml"],
                    "blockComment": {prefix: "<!--", suffix: "-->"}
                };

                validateLanguage(def, html);

                def = {
                    "id": "coffeescript",
                    "name": "CoffeeScript",
                    "mode": "coffeescript",
                    "fileExtensions": ["coffee", "cf", "cson"],
                    "fileNames": ["cakefile"],
                    "lineComment": ["#"],
                    "blockComment": {prefix: "###", suffix: "###"}
                };

                validateLanguage(def, coffee);
            });

        });

        describe("LanguageManager API", function () {

            it("should map identifiers to languages", function () {
                var html = LanguageManager.getLanguage("html");

                expect(html).toBeTruthy();
                expect(LanguageManager.getLanguage("DoesNotExist")).toBe(undefined);
            });

            it("should map file extensions to languages", function () {
                var html    = LanguageManager.getLanguage("html"),
                    css     = LanguageManager.getLanguage("css"),
                    unknown = LanguageManager.getLanguage("unknown");

                // Bare file names
                expect(LanguageManager.getLanguageForPath("foo.html")).toBe(html);
                expect(LanguageManager.getLanguageForPath("INDEX.HTML")).toBe(html);
                expect(LanguageManager.getLanguageForPath("foo.doesNotExist")).toBe(unknown);

                // Paths
                expect(LanguageManager.getLanguageForPath("c:/only/testing/the/path.html")).toBe(html);  // abs Windows-style
                expect(LanguageManager.getLanguageForPath("/only/testing/the/path.css")).toBe(css);      // abs Mac/Linux-style
                expect(LanguageManager.getLanguageForPath("only/testing/the/path.css")).toBe(css);       // relative

                // Unknown file types
                expect(LanguageManager.getLanguageForPath("/code/html")).toBe(unknown);
                expect(LanguageManager.getLanguageForPath("/code/foo.html.notreally")).toBe(unknown);
            });

            it("should map complex file extensions to languages", function () {
                var ruby    = LanguageManager.getLanguage("ruby"),
                    html    = LanguageManager.getLanguage("html"),
                    unknown = LanguageManager.getLanguage("unknown");

                expect(LanguageManager.getLanguageForPath("foo.html.noSuchExt")).toBe(unknown);
                expect(LanguageManager.getLanguageForPath("foo.noSuchExt")).toBe(unknown);

                html.addFileExtension("html.noSuchExt");
                ruby.addFileExtension("noSuchExt");

                expect(LanguageManager.getLanguageForPath("foo.html.noSuchExt")).toBe(html);
                expect(LanguageManager.getLanguageForPath("foo.noSuchExt")).toBe(ruby);
            });

            it("should map file names to languages", function () {
                var coffee  = LanguageManager.getLanguage("coffeescript"),
                    unknown = LanguageManager.getLanguage("unknown");

                expect(LanguageManager.getLanguageForPath("cakefile")).toBe(coffee);
                expect(LanguageManager.getLanguageForPath("CakeFiLE")).toBe(coffee);
                expect(LanguageManager.getLanguageForPath("cakefile.doesNotExist")).toBe(unknown);
                expect(LanguageManager.getLanguageForPath("Something.cakefile")).toBe(unknown);
            });

            it("should remove file extensions and add to new languages", function () {
                var html    = LanguageManager.getLanguage("html"),
                    ruby    = LanguageManager.getLanguage("ruby"),
                    unknown = LanguageManager.getLanguage("unknown");

                expect(LanguageManager.getLanguageForPath("test.html")).toBe(html);

                html.removeFileExtension("html");
                expect(LanguageManager.getLanguageForPath("test.html")).toBe(unknown);

                ruby.addFileExtension("html");
                expect(LanguageManager.getLanguageForPath("test.html")).toBe(ruby);
            });

            it("should remove file names and add to new languages", function () {
                var coffee  = LanguageManager.getLanguage("coffeescript"),
                    html    = LanguageManager.getLanguage("html"),
                    unknown = LanguageManager.getLanguage("unknown");

                expect(LanguageManager.getLanguageForPath("Cakefile")).toBe(coffee);

                coffee.removeFileName("Cakefile");
                expect(LanguageManager.getLanguageForPath("Cakefile")).toBe(unknown);

                html.addFileName("Cakefile");
                expect(LanguageManager.getLanguageForPath("Cakefile")).toBe(html);
            });

            it("should add multiple file extensions to languages", function () {
                var ruby    = LanguageManager.getLanguage("ruby"),
                    unknown = LanguageManager.getLanguage("unknown");

                expect(LanguageManager.getLanguageForPath("foo.1")).toBe(unknown);
                expect(LanguageManager.getLanguageForPath("foo.2")).toBe(unknown);

                ruby.addFileExtension(["1", "2"]);

                expect(LanguageManager.getLanguageForPath("foo.1")).toBe(ruby);
                expect(LanguageManager.getLanguageForPath("foo.2")).toBe(ruby);
            });

            it("should remove multiple file extensions from languages", function () {
                var ruby    = LanguageManager.getLanguage("ruby"),
                    unknown = LanguageManager.getLanguage("unknown");

                // Assumes test above already ran (tests in this suite are not isolated)
                expect(LanguageManager.getLanguageForPath("foo.1"))