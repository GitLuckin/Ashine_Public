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

/*
 * To ensure cache coherence, current and future asynchronous state-changing
 * operations of FileSystemEntry and its subclasses should implement the
 * following high-level sequence of steps:
 *
 * 1. Block external filesystem change events;
 * 2. Execute the low-level state-changing operation;
 * 3. Update the internal filesystem state, including caches;
 * 4. Apply the callback;
 * 5. Fire an appropriate internal change notification; and
 * 6. Unblock external change events.
 *
 * Note that because internal filesystem state is updated first, both the original
 * caller and the change notification listeners observe filesystem state that is
 * current w.r.t. the operation. Furthermore, because external change events are
 * blocked before the operation begins, listeners will only receive the internal
 * change event for the operation and not additional (or possibly inconsistent)
 * external change events.
 *
 * State-changing operations that block external filesystem change events must
 * take care to always subsequently unblock the external change events in all
 * control paths. It is safe to assume, however, that the underlying impl will
 * always apply the callback with some value.

 * Caches should be conservative. Consequently, the entry's cached data should
 * always be cleared if the underlying impl's operation fails. This is the case
 * event for read-only operations because an unexpected failure implies that the
 * system is in an unknown state. The entry should communicate this by failing
 * where appropriate, and should not use the cache to hide failure.
 *
 * Only watched entries should make use of cached data because change events are
 * only expected for such entries, and change events are used to granularly
 * invalidate out-of-date caches.
 *
 * By convention, callbacks are optional for asynchronous, state-changing
 * operations, but required for read-only operations. The first argument to the
 * callback should always be a nullable error string from FileSystemError.
 */
define(function (require, exports, module) {


    var FileSystemError = require("filesystem/FileSystemError"),
        WatchedRoot     = require("filesystem/WatchedRoot");

    var VISIT_DEFAULT_MAX_DEPTH = 100,
        VISIT_DEFAULT_MAX_ENTRIES = 200000;

    /* Counter to give every entry a unique id */
    var nextId = 0;

    /**
     * Model for a file system entry. This is the base class for File and Directory,
     * and is never used directly.
     *
     * See the File, Directory, and FileSystem classes for more details.
     *
     * @constructor
     * @param {string} path The path for this entry.
     * @param {FileSystem} fileSystem The file system associated with this entry.
     */
    function FileSystemEntry(path, fileSystem) {
        this._setPath(path);
        this._fileSystem = fileSystem;
        this._id = nextId++;
    }

    // Add "fullPath", "name", "parent", "id", "isFile" and "isDirectory" getters
    Object.defineProperties(FileSystemEntry.prototype, {
        "fullPath": {
            get: function () { return this._path; },
            set: function () { throw new Error("Cannot set fullPath"); }
        },
        "name": {
            get: function () { return this._name; },
            set: function () { throw new Error("Cannot set name"); }
        },
        "parentPath": {
            get: function () { return this._parentPath; },
            set: function () { throw new Error("Cannot set parentPath"); }
        },
        "id": {
            get: function () { return this._id; },
            set: function () { throw new Error("Cannot set id"); }
        },
        "isFile": {
            get: function () { return this._isFile; },
            set: function () { throw new Error("Cannot