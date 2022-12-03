/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2014 - 2021 Adobe Systems Incorporated. All rights reserved.
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

/*global describe, it, beforeEach, expect */
/*unittests: FileTreeViewModel*/

define(function (require, exports, module) {

    var FileTreeViewModel = require("project/FileTreeViewModel"),
        _ = require("thirdparty/lodash"),
        Immutable = require("thirdparty/immutable");

    describe("FileTreeViewModel", function () {
        describe("_filePathToObjectPath", function () {
            var treeData;
            beforeEach(function () {
                treeData = Immutable.fromJS({
                    "subdir": {
                        open: true,
                        children: {
                            "afile.js": {},
                            "subsubdir": {
                                children: {
                                    "thirdsub": {
                                        children: {}
                                    }
                                }
                            }
                        }
                    },
                    "anothersub": {
                        children: {}
                    },
                    "aclosedsub": {
                        children: null
                    }
                });
            });

            it("should find items at the root", function () {
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "subdir/")).toEqual(["subdir"]);
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "anothersub/")).toEqual(["anothersub"]);
            });

            it("can refer to the root", function () {
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "")).toEqual([]);
            });

            it("should find nested files", function () {
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "subdir/afile.js")).toEqual(["subdir", "children", "afile.js"]);
            });

            it("should find nested directories", function () {
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "subdir/subsubdir/thirdsub/")).toEqual(
                    ["subdir", "children", "subsubdir", "children", "thirdsub"]
                );
            });

            it("returns undefined for a file in a path that mistakenly includes a file", function () {
                expect(FileTreeViewModel._filePathToObjectPath(treeData, "subdir/afile.js/nofile.js")).toBeNull();
            });

            it("can return if an a path is visible or not", function () {
                var isFilePathVisible = _.partial(FileTreeViewModel._isFilePathVisible, treeData);
                expect(isFilePathVisible("subdir/afile.js")).toBe(true);
                expect(isFilePathVisible("aclosedsub/hiddenfile.js")).toBe(false);
                expect(isFilePathVisible("DOESNOTEXIST")).toBe(null);
                expect(isFilePathVisible("")).toBe(true);
            });

            it("can return whether a given path is loaded (in the tree)", function () {
                var vm = new FileTreeViewModel.FileTreeViewModel();
                vm._treeData = treeData;
                expect(vm.isPathLoaded("subdir/afile.js")).toBe(true);
                expect(vm.isPathLoaded("anothersub/")).toBe(true);
                expect(vm.isPathLoaded("aclosedsub/")).toBe(false);
            });

            it("can return whether a given path is loaded even when directories and files are added", function () {
                var vm = new FileTreeViewModel.FileTreeViewModel();
                vm._treeData = treeData;
                vm.setDirectoryContents("aclosedsub/newdir/", [
                    {
                        name: "newfile",
                        isFile: true
                    }
                ]);
                expect(vm.isPathLoaded("aclosedsub/")).toBe(false);
            });
        });

        describe("setDirectoryOpen", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                changesFired;

            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changesFired++;
            });

            beforeEach(function () {
                changesFired = 0;
                vm._treeData = Immutable.fromJS({
                    "subdir": {
                        open: true,
                        children: {
                            "afile.js": {}
                        }
                    },
                    "closedDir": {
                        children: null
                    }
                });
            });

            it("can mark a directory as open", function () {
                expect(vm.setDirectoryOpen("closedDir", true)).toBe(true);
                expect(vm._treeData.getIn(["closedDir", "open"])).toBe(true);
                expect(changesFired).toBe(1);
            });

            it("can unmark an open directory", function () {
                expect(vm.setDirectoryOpen("subdir", false)).toBe(false);
                expect(vm._treeData.getIn(["subdir", "open"])).toBeUndefined();
                expect(changesFired).toBe(1);
            });

            it("won't change a file", function () {
                expect(vm.setDirectoryOpen("subdir/afile.js", true)).toBe(false);
                expect(changesFired).toBe(0);
                expect(vm._treeData.getIn(["subdir", "children", "afile.js", "open"])).toBeUndefined();
            });

            it("doesn't signal a change when there is none", function () {
                expect(vm.setDirectoryOpen("subdir", true)).toBe(false);
                expect(vm.setDirectoryOpen("closedDir", false)).toBe(false);
                expect(changesFired).toBe(0);
            });
        });

        describe("closeSubtree", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                changesFired;

            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changesFired++;
            });

            beforeEach(function () {
                changesFired = 0;
                vm._treeData = Immutable.fromJS({
                    "subdir": {
                        open: true,
                        children: {
                            "afile.js": {},
                            "subsubdir": {
                                open: true,
                                children: {
                                    "evensubbersubdir": {
                                        open: true,
                                        children: {
                                            waydownhere: {
                                                children: null
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            });

            it("closes the top dir and its children without clearing the children", function () {
                vm.closeSubtree("subdir/");
                expect(changesFired).toBe(1);
                expect(vm._getObject("subdir/subsubdir/evensubbersubdir/").get("open")).toBeUndefined();
                expect(vm._getObject("subdir/subsubdir/").get("open")).toBeUndefined();
                expect(vm._getObject("subdir/").get("open")).toBeUndefined();
            });

            it("doesn't fail on an unknown path", function () {
                vm.closeSubtree("foo");
            });

            it("will close a directory that's already hidden", function () {
                vm.setDirectoryOpen("subdir/subsubdir/", false);
                expect(vm._getObject("subdir/subsubdir/evensubbersubdir/").get("open")).toBe(true);
                vm.closeSubtree("subdir/");
                expect(vm._getObject("subdir/subsubdir/evensubbersubdir/").get("open")).toBeUndefined();
            });
        });

        describe("setDirectoryContents", function () {
            var vm = new FileTreeViewModel.FileTreeViewModel(),
                changesFired;

            vm.on(FileTreeViewModel.EVENT_CHANGE, function () {
                changesFired++;
            });

            beforeEach(function () {
                changesFired = 0;
                vm._treeData = Immutable.Map({
                });
            });

            var sampleData = [
                {
                    name: "afile.js",
                    isFile: true
                }, {
                    name: "subdir",
                    isFile: false
                }
            ];

            it("can set the root contents", function () {
                vm.setDirectoryContents("", sampleData);
                expect(vm._treeData.toJS()).toEqual({
                    "afile.js": {},
                    "subdir": {
                        children: null
                    }
                });
                expect(changesFired).toBe(1);
            });

            it("can replace the root contents without replacing subdirectories", function () {
                vm.setDirectoryContents("", sampleData);
                vm.setDirectoryContents("subdir", sampleData);
                vm.setDirectoryContents("", sampleData);
                expect(vm._treeData.toJS()).toEqual({
                    "afile.js": {},
                    "subdir": {
                        children: {
                            "afile.js": {},
                            subdir: {
                                children: null
                            }
                        }
                    }
                });
            });

            it("doesn't fire a change message with no change", function () {
                vm.setDirectoryContents("", sampleData);
                changesFired = 0;
                vm.setDirectoryContents("", sampleData);
                expect(changesFired).toBe(0);
            });

            it("can set a subdirectory's contents", function () {
                vm.setDirectoryContents("", sampleData);
                changesFired = 0;
                vm.setDirectoryContents("subdir", sampleData);
                expect(changesFired).toBe(1);
                expect(vm._treeData.toJS()).toEqual({
                    "afile.js": {},
                    subdir: {
                        children: {
                            "afile.js": {},
                            subdir: {
                                children: null
                            }
                        }
                    }
                });
            });

            it("does nothing if you point to a file", function () {
                vm.setDirectoryContents("", sampleData);
                var firstTreeData = vm._treeData;
                vm.setDirectoryContents("afile.js", sampleData);
                expect(vm._treeData).toBe(firstTreeData);
            });

            it("will remove a file or subdirectory that has gone away", function () {
                vm.setDirectoryContents("", sampleData);
                changesFired = 0;
                vm.setDirectoryContents("", []);
                expect(vm._treeData.toJS()).toEqual({});
                expect(changesFired).toBe(1);
            });

            it("can save directory contents before it gets intermediate directories", function () {
                vm.setDirectoryContents("foo/bar", sampleData);
                expect(vm._treeData.toJS()).toEqual({
                    foo: {
                        notFullyLoaded: true,
                        children: {
                            bar: {
                                children: {
                                    "afile.js": {},
                                    subdir: {
                                        children: null
                                    }
                                }
                            }
                        }
                    }
                });
            });

            it("will mark a directory loaded once its contents have been set", function () {
                vm.setDirectoryContents("foo/subdir", sampleData);
                var subdirObject = vm._treeData.getIn(["foo", "children", "subdir"]);
                expect(vm._treeData.getIn(["foo", "notFullyLoaded"])).toBe(true);

                vm.setDirectoryContents("foo", sampleData);

                expect(vm._treeData.toJS()).toEqual({
                    foo: {
                        children: {
                            "afile.js": {},
                            "subdir": {
                                children: {
                                    "afile.js": {},
                                    subdir: {
                                        childre