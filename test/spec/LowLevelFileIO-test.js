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

/*global describe, it, expect, beforeEach, afterEach, awaitsFor, awaitsForDone*/

define(function (require, exports, module) {


    require("utils/Global");

    // Load dependent modules
    var SpecRunnerUtils     = require("spec/SpecRunnerUtils");

    var UTF8 = "utf8",
        UTF16 = "utf16";

    // These are tests for the low-level file io routines in brackets-app. Make sure
    // you have the latest brackets-app before running.

    describe("LowLevelFileIO", function () {

        var baseDir = SpecRunnerUtils.getTempDirectory(),
            testDir;

        function readdirSpy() {
            var callback = function (err, content) {
                callback.error = err;
                callback.content = content;
                callback.wasCalled = true;
            };

            callback.wasCalled = false;

            return callback;
        }

        function statSpy() {
            var callback = function (err, stat) {
                callback.error = err;
                callback.stat = stat;
                callback.wasCalled = true;
            };

            callback.wasCalled = false;

            return callback;
        }

        function readFileSpy() {
            var callback = function (err, content) {
                callback.error = err;
                callback.content = content;
                callback.wasCalled = true;
            };

            callback.wasCalled = false;

            return callback;
        }

        function errSpy() {
            var callback = function (err) {
                callback.error = err;
                callback.wasCalled = true;
            };

            callback.wasCalled = false;

            return callback;
        }

        beforeEach(async function () {
            await SpecRunnerUtils.createTempDirectory();

            // create the test folder and init the test files
            var testFiles = SpecRunnerUtils.getTestPath("/spec/LowLevelFileIO-test-files");
            await awaitsForDone(SpecRunnerUtils.copy(testFiles, baseDir), "copy temp files");
            testDir = `${baseDir}/LowLevelFileIO-test-files`;
        });

        afterEach(async function () {
            await SpecRunnerUtils.removeTempDirectory();
        });

        it("should have a brackets.fs namespace", function () {
            expect(brackets.fs).toBeTruthy();
        });

        describe("readdir", function () {

            it("should read a directory from disk", async function () {
                var cb = readdirSpy();

                brackets.fs.readdir(testDir, cb);

                await awaitsFor(function () { return cb.wasCalled; }, "readdir to finish", 1000);

                expect(cb.error).toBeFalsy();

                // Look for known files
                expect(cb.content.indexOf("file_one.txt")).not.toBe(-1);
                expect(cb.content.indexOf("file_two.txt")).not.toBe(-1);
                expect(cb.content.indexOf("file_three.txt")).not.toBe(-1);

                // Make sure '.' and '..' are omitted
                expect(cb.content.indexOf(".")).toBe(-1);
                expect(cb.content.indexOf("..")).toBe(-1);
            });

            it("should return an error if the directory doesn't exist", async function () {
                var cb = readdirSpy();

                brackets.fs.readdir("/This/directory/doesnt/exist", cb);

                await awaitsFor(function () { return cb.wasCalled; }, "readdir to finish", 1000);

                expect(cb.error.code).toBe(brackets.fs.ERR_NOT_FOUND);
            });

            it("should return an error if the directory can't be read (Mac only)", async function () {
                if (brackets.platform === "mac") {
                    var cb = readdirSpy();

                    brackets.fs.readdir(baseDir + "/cant_read_here", cb);

                    await awaitsFor(function () { return cb.wasCalled; }, "readdir to finish", 1000);

                    expect(cb.error).toBe(brackets.fs.ERR_CANT_READ);
                }

            });

            it("should return an error if invalid parameters are passed", function () {
                var cb = readdirSpy();

                expect(function () {
                    brackets.fs.readdir(42, cb);
                }).toThrow();
            });
        }); // describe("readdir")

        describe("stat", function () {

            it("should return correct information for a directory", async function () {
                var cb = statSpy();

                brackets.fs.stat(baseDir, cb);

                await awaitsFor(function () { return cb.wasCalled; }, 1000);

                expect(cb.error).toBeFalsy();
                expect(cb.stat.isDirectory()).toBe(true);
                expect(cb.stat.isFile()).toBe(false);
            });

            it("should return correct information for a file", async function () {
                var cb = statSpy();

                brackets.fs.stat(testDir + "/file_one.txt", cb);

                await awaitsFor(function () { return cb.wasCalled; }, "stat to finish", 1000);

                expect(cb.error).toBeFalsy();
                expect(cb.stat.isDirectory()).toBe(false);
                expect(cb.stat.isFile()).toBe(true);
            });

            it("should return an error if the file/directory doesn't exist", async function () {
                var cb = statSpy();

                brackets.fs.stat("/This/directory/doesnt/exist", cb);

                await awaitsFor(function () { return cb.wasCalled; }, "stat to finish", 1000);

                expect(cb.error.code).toBe(brackets.fs.ERR_NOT_FOUND);
            });

            it("should return an error if incorrect parameters are passed", function () {
                var cb = statSpy();

                expect(function () {
                    brackets.fs.stat(42, cb);
                }).toThrow();
            });

        }); // describe("stat")

        describe("readFile", function () {

            it("should read a text file", async function () {
                var cb = readFileSpy();

                brackets.fs.readFile(testDir + "/file_one.txt", UTF8, cb);

                await awaitsFor(function () { return cb.wasCalled; }, "readFile to finish", 1000);

                expect(cb.error).toBeFalsy();
                expect(cb.content).toBe("Hello world");
            });

            it("should return an error if trying to read a non-existent file", async function () {
                var cb = readFileSpy();

                brackets.fs.readFile("/This/file/doesnt/exist.txt", UTF8, cb);

                await awaitsFor(function () { return cb.wasCalled; }, "readFile to finish", 1000);

                expect(cb.error.code).toBe(brackets.fs.ERR_NOT_FOUND);
            });

            it("should return an error if trying to use an unsppported encoding", function () {
                brackets.fs.readFile(testDir + "/file_one.txt", UTF16, (a, c)=>{
                    expect(ArrayBuffer.isView(c)).toBe(true);
                });
            });

            it("should return an error if called with invalid parameters", function () {
                var cb = readFileSpy();

                expect(function () {
                    brackets.fs.readFile(42, [], cb);
                }).toThrow();
            });

            it("should return an error if trying to read a directory", async function () {
                var cb = readFileSpy();

                brackets.fs.readFile(baseDir, UTF8, cb);

                await awaitsFor(function () { return cb.wasCalled; }, 1000);

                expect(cb.error.code).toBe(brackets.fs.ERR_EISDIR);
            });

            it("should return an error trying to read a binary file", function () {
                brackets.fs.readFile(testDir + "/tree.jpg", "bin", (a, c)=> {
                    expect(ArrayBuffer.isView(c)).toBe(true);
                });
            });

            it("should be able to quickly determine if a large file is UTF-8", async function () {
                var cb = readFileSpy();

                brackets.fs.readFile(testDir + "/ru_utf8.html", UTF8, cb);

                await awaitsFor(function () { return cb.wasCalled; }, "readFile to finish", 1000);

                expect(cb.error).toBe(null);
            });

            it("should be able to quickly read a small UTF-8 file", async function () {
                var cb = readFileSpy();

                brackets.fs.readFile(testDir + "/es_small_utf8.html", UTF8, cb);

                await awaitsFor(function () { return cb.wasCalled; }, "readFile to finish", 1000);

                expect(cb.error).toBe(null);
            });


            it("should be able to read a zero-length file", async 