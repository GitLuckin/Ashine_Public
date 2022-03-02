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

/*unittests: FileTreeViewModel*/

/**
 * The view model (or a Store in the Flux terminology) used by the file tree.
 *
 * Many of the view model's methods are implemented by pure functions, which can be
 * helpful for composability. Many of the methods commit the new treeData and send a
 * change event when they're done whereas the functions do not do this.
 */
define(function (require, exports, module) {


    var Immutable           = require("thirdparty/immutable"),
        _                   = require("thirdparty/lodash"),
        EventDispatcher     = require("utils/EventDispatcher"),
        FileUtils           = require("file/FileUtils");

    // Constants
    var EVENT_CHANGE = "change";

    /**
     * Determine if an entry from the treeData map is a file.
     *
     * @param {Immutable.Map} entry entry to test
     * @return {boolean} true if this is a file and not a directory
     */
    function isFile(entry) {
        return entry.get("children") === undefined;
    }

    /**
     * @constructor
     *
     * Contains the treeData used to generate the file tree and methods used to update that
     * treeData.
     *
     * Instances dispatch the following events:
     * - "change" (FileTreeViewModel.EVENT_CHANGE constant): Fired any time there's a change that should be reflected in the view.
     */
    function FileTreeViewModel() {
        // For convenience in callbacks, make a bound version of this method so that we can
        // just refer to it as this._commit when passing in a callback.
        this._commit = this._commit.bind(this);
    }
    EventDispatcher.makeEventDispatcher(FileTreeViewModel.prototype);

    /**
     * @type {boolean}
     *
     * Preference for whether directories should all be sorted to the top of listings
     */
    FileTreeViewModel.prototype.sortDirectoriesFirst = false;

    /**
     * @type {Immutable.Map}
     * @private
     *
     * The data for the tree. Some notes about its structure:
     *
     * * It starts with a Map for the project root's contents.
     * * Each directory entry has a `children` key.
     *     * `children` will be null if the directory has not been loaded
     *     * An `open` key denotes whether the directory is open
     * * Most file entries are just empty maps
     *     * They can have flags like selected, context, rename, create with state information for the tree
     */
    FileTreeViewModel.prototype._treeData = Immutable.Map();

    Object.defineProperty(FileTreeViewModel.prototype, "treeData", {
        get: function () {
            return this._treeData;
        }
    });

    /**
     * @private
     * @type {Immutable.Map}
     * Selection view information determines how the selection bar appears.
     *
     * * width: visible width of the selection area
     * * scrollTop: current scroll position.
     * * scrollLeft: current horizontal scroll position
     * * offsetTop: top of the scroller element
     * * hasSelection: is the selection bar visible?
     * * hasContext: is the context bar visible?
     */
    FileTreeViewModel.prototype._selectionViewInfo = Immutable.Map({
        width: 0,
        scrollTop: 0,
        scrollLeft: 0,
        offsetTop: 0,
        hasContext: false,
        hasSelection: false
    });

    Object.defineProperty(FileTreeViewModel.prototype, "selectionViewInfo", {
        get: function () {
            return this._selectionViewInfo;
        }
    });

    /**
     * @private
     *
     * If the project root changes, we reset the tree data so that everything will be re-read.
     */
    FileTreeViewModel.prototype._rootChanged = function () {
        this._treeData = Immutable.Map();
    };

    /**
     * @private
     *
     * The FileTreeViewModel is like a database for storing the directory contents and its
     * state moves atomically from one value to the next. This method stores the next version
     * of the state, if it has changed, and triggers a change event so that the UI can update.
     *
     * @param {?Immutable.Map} treeData new treeData state
     * @param {?Immutable.Map} selectionViewInfo updated information for the selection/context bars
     */
    FileTreeViewModel.prototype._commit = function (treeData, selectionViewInfo) {
        var changed = false;
        if (treeData && treeData !== this._treeData) {
            this._treeData = treeData;
            changed = true;
        }

        if (selectionViewInfo && selectionViewInfo !== this._selectionViewInfo) {
            this._selectionViewInfo = selectionViewInfo;
            changed = true;
        }
        if (changed) {
            this.trigger(EVENT_CHANGE);
        }
    };

    /**
     * @private
     *
     * Converts a project-relative file path into an object path array suitable for
     * `Immutable.Map.getIn` and `Immutable.Map.updateIn`.
     *
     * The root path is "".
     *
     * @param {Immutable.Map} treeData
     * @param {string} path project relative path to the file or directory. Can include trailing slash.
     * @return {Array.<string>|null} Returns null if the path can't be found in the tree, otherwise an array of strings representing the path through the object.
     */
    function _filePathToObjectPath(treeData, path) {
        if (path === null) {
            return null;
        } else if (path === "") {
            return [];
        }

        var parts = path.split("/"),
            part = parts.shift(),
            result = [],
            node;

        // Step through the parts of the path and the treeData object simultaneously
        while (part) {
            // We hit the end of the tree without finding our object, so return null
            if (!treeData) {
                return null;
            }

            node = treeData.get(part);

            // The name represented by `part` isn't in the tree, so return null.
            if (node === undefined) {
                return null;
            }

            // We've verified this part, so store it.
            result.push(part);

            // Pull the next part of the path
            part = parts.shift();

            // If we haven't passed the end of the path string, then the object we've got in hand
            // *should* be a directory. Confirm that and add `children` to the path to move down
            // to the next directory level.
            if (part) {
                treeData = node.get("children");
                if (treeData) {
                    result.push("children");
                }
            }
        }

        return result;
    }

    /**
     * @private
     *
     * See `FileTreeViewModel.isFilePathVisible`
     */
    function _isFilePathVisible(treeData, path) {
        if (path === null) {
            return null;
        } else if (path === "") {
            return true;
        }

        var parts = path.split("/"),
            part = parts.shift(),
            result = [],
            node;

        while (part) {
            if (treeData === null) {
                return false;
            }
            node = treeData.get(part);
            if (node === undefined) {
                return null;
            }
            result.push(part);
            part = parts.shift();
            if (part) {
                if (!node.get("open")) {
                    return false;
                }
                treeData = node.get("children");
                if (treeData) {
                    result.push("children");
                }
            }
        }

        return true;
    }

    /**
     * Determines if a given file path is visible within the tree.
     *
     * For detailed documentation on how the loop works, see `_filePathToObjectPath` which
     * follows the same pattern. This differs from that function in that this one checks for
     * the open state of directories and has a different return value.
     *
     * @param {string} path project relative file path
     * @return {boolean|null} true if the given path is currently visible in the tree, null if the given path is not present in the tree.
     */
    FileTreeViewModel.prototype.isFilePathVisible = function (path) {
        return _isFilePathVisible(this._treeData, path);
    };

    /**
     * Determines if a given path has been loaded.
     *
     * @param {string} path project relative file or directory path
     * @return {boolean} true if the path has been loaded
     */
    FileTreeViewModel.prototype.isPathLoaded = function (path) {
        var objectPath = _filePathToObjectPath(this._treeData, path);

        if (!objectPath) {
            return false;
        }

        // If it's a directory, make sure that its children are loaded
        if (_.last(path) === "/") {
            var directory = this._treeData.getIn(objectPath);
            if (!directory.get("children") || directory.get("notFullyLoaded")) {
                return false;
            }
        }

        return true;
    };

    /**
     * @private
     *
     * See `FileTreeViewModel.getOpenNodes`.
     */
    function _getOpenNodes(treeData, projectRootPath) {
        var openNodes = [];

        function addNodesAtDepth(treeData, parent, depth) {
            if (!treeData) {
                return;
            }

            treeData.forEach(function (value, key) {
                if (isFile(value)) {
                    return;
                }

                var directoryPath = parent + key + "/";

                if (value.get("open")) {
                    var nodeList = openNodes[depth];
                    if (!nodeList) {
                        nodeList = openNodes[depth] = [];
                    }
                    nodeList.push(directoryPath);
                    addNodesAtDepth(value.get("children"), directoryPath, depth + 1);
                }
            });
        }

        // start at the top of the tree and the first array element
        addNodesAtDepth(treeData, projectRootPath, 0);
        return openNodes;
    }

    /**
     * @private
     * TODO: merge with _getOpenNodes?!
     * See `FileTreeViewModel.getChildNodes`.
     */
    function _getChildDirectories(treeData, projectRootPath) {
        var childDirectories = [];

        function addNodesAtDepth(treeData, parent, depth) {
            if (!treeData) {
                return;
            }

            treeData.forEach(function (value, key) {
                if (!isFile(value)) {
                    var directoryPath = key + "/";

                    childDirectories.push(directoryPath);
                }
            });
        }

        // start at the top of the tree and the first array element
        addNodesAtDepth(treeData, projectRootPath, 0);
        return childDirectories;
    }

    /**
     * Creates an array of arrays where each entry of the top-level array has an array
     * of paths that are at the same depth in the tree. All of the paths are full paths.
     *
     * This is used for saving the current set of open nodes to the preferences system
     * for restoring on project open.
     *
     * @param {string} projectRootPath Full path to the project root
     * @return {Array.<Array.<string>>} Array of array of full paths, organized by depth in the tree.
     */
    FileTreeViewModel.prototype.getOpenNodes = function (projectRootPath) {
        return _ge