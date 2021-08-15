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

/*jslint regexp: true */
/*global unescape */

/**
 * Set of utilities for working with files and text content.
 */
define(function (require, exports, module) {


    require("utils/Global");

    var FileSystemError     = require("filesystem/FileSystemError"),
        DeprecationWarning  = require("utils/DeprecationWarning"),
        LanguageManager     = require("language/LanguageManager"),
        PerfUtils           = require("utils/PerfUtils"),
        Strings             = require("strings"),
        StringUtils         = require("utils/StringUtils");

    // These will be loaded asynchronously
    var DocumentCommandHandlers, LiveDevelopmentUtils;

    /**
     * @const {Number} Maximium file size (in megabytes)
     *   (for display strings)
     *   This must be a hard-coded value since this value
     *   tells how low-level APIs should behave which cannot
     *   have a load order dependency on preferences manager
     */
    var MAX_FILE_SIZE_MB = 16;

    /**
     * @const {Number} Maximium file size (in bytes)
     *   This must be a hard-coded value since this value
     *   tells how low-level APIs should behave which cannot
     *   have a load order dependency on preferences manager
     */
    var MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

    /**
     * @const {List} list of File Extensions which will be opened in external Application
     */
    var extListToBeOpenedInExtApp = [];

    function _getDecodedString(buffer, encoding) {
        try {
            return new TextDecoder(encoding).decode(buffer);
        } catch (e) {
            return null;
        }
    }

    /**
     * Asynchronously reads a file as UTF-8 encoded text.
     * @param {!File} file File to read
     * @return {$.Promise} a jQuery promise that will be resolved with the
     *  file's text content plus its timestamp, or rejected with a FileSystemError string
     *  constant if the file can not be read.
     */
    function readAsText(file) {
        var result = new $.Deferred();

        // Measure performance
        var perfTimerName = PerfUtils.markStart("readAsText:\t" + file.fullPath);
        result.always(function () {
            PerfUtils.addMeasurement(perfTimerName);
        });

        // Read file as utf-8. there is a bug in virtual file system(filer) where filer will try utf-8fy the string
        // returned even if it is not utf-8. But on native fs, this will return an error.
        // We need to modify filer vfs to throw error when reading non utf-8 strings ideally.
        // Or We could add the check here by read as binary here and use the utf-8 check mechanism
        // in "phoenix-fs lib :fslib_native.js" to check if it is valid utf-8
        file.read({encoding: 'utf8'},function (err, data, encoding, stat) {
            if (!err) {
                result.resolve(data, stat.mtime);
            } else {
                result.reject(err);
            }
        });

        return result.promise();
    }

    /**
     * Asynchronously writes a file as UTF-8 encoded text.
     * @param {!File} file File to write
     * @param {!string} text
     * @param {boolean=} allowBlindWrite Indicates whether or not CONTENTS_MODIFIED
     *      errors---which can be triggered if the actual file contents differ from
     *      the FileSystem's last-known contents---should be ignored.
     * @return {$.Promise} a jQuery promise that will be resolved when
     * file writing completes, or rejected with a FileSystemError string constant.
     */
    function writeText(file, text, allowBlindWrite) {
        var result = new $.Deferred(),
            options = {};

        if (allowBlindWrite) {
            options.blind = true;
        }

        file.write(text, options, function (err) {
            if (!err) {
                result.resolve();
            } else {
                result.reject(err);
            }
        });

        return result.promise();
    }

    /**
     * Line endings
     * @enum {string}
     */
    var LINE_ENDINGS_CRLF = "CRLF",
        LINE_ENDINGS_LF   = "LF";

    /**
     * Returns the standard line endings for the current platform
     * @return {LINE_ENDINGS_CRLF|LINE_ENDINGS_LF}
     */
    function getPlatformLineEndings() {
        return brackets.platform === "win" ? LINE_ENDINGS_CRLF : LINE_ENDINGS_LF;
    }

    /**
     * Scans the first 1000 chars of the text to determine how it encodes line endings. Returns
     * null if usage is mixed or if no line endings found.
     * @param {!string} text
     * @return {null|LINE_ENDINGS_CRLF|LINE_ENDINGS_LF}
     */
    function sniffLineEndings(text) {
        var subset = text.substr(0, 1000);  // (length is clipped to text.length)
        var hasCRLF = /\r\n/.test(subset);
        var hasLF = /[^\r]\n/.test(subset);

        if ((hasCRLF && hasLF) || (!hasCRLF && !hasLF)) {
            return null;
        }
        return hasCRLF ? LINE_ENDINGS_CRLF : LINE_ENDINGS_LF;

    }

    /**
     * Translates any line ending types in the given text to the be the single form specified
     * @param {!string} text
     * @param {null|LINE_ENDINGS_CRLF|LINE_ENDINGS_LF} lineEndings
     * @return {string}
     */
    function translateLineEndings(text, lineEndings) {
        if (lineEndings !== LINE_ENDINGS_CRLF && lineEndings !== LINE_ENDINGS_LF) {
            lineEndings = getPlatformLineEndings();
        }

        var eolStr = (lineEndings === LINE_ENDINGS_CRLF ? "\r\n" : "\n");
        var findAnyEol = /\r\n|\r|\n/g;

        return text.replace(findAnyEol, eolStr);
    }

    /**
     * @param {!FileSystemError} name
     * @return {!string} User-friendly, localized error message
     */
    function getFileErrorString(name) {
        // There are a few error codes that we have specific error messages for. The rest are
        // displayed with a generic "(error N)" message.
        var result;

        if (name === FileSystemError.NOT_FOUND) {
            result = Strings.NOT_FOUND_ERR;
        } else if (name === FileSystemError.NOT_READABLE) {
            result = Strings.NOT_READABLE_ERR;
        } else if (name === FileSystemError.NOT_WRITABLE) {
            result = Strings.NO_MODIFICATION_ALLOWED_ERR_FILE;
        } else if (name === FileSystemError.CONTENTS_MODIFIED) {
            result = Strings.CONTENTS_MODIFIED_ERR;
        } else if (name === FileSystemError.UNSUPPORTED_ENCODING) {
            result = Strings.UNSUPPORTED_ENCODING_ERR;
        } else if (name === FileSystemError.EXCEEDS_MAX_FILE_SIZE) {
            result = StringUtils.format(Strings.EXCEEDS_MAX_FILE_SIZE, MAX_FILE_SIZE_MB);
        } else if (name === FileSystemError.ENCODE_FILE_FAILED) {
            result = Strings.ENCODE_FILE_FAILED_ERR;
        } else if (name === FileSystemError.DECODE_FILE_FAILED) {
            result = Strings.DECODE_FILE_FAILED_ERR;
        } else if (name === FileSystemError.UNSUPPORTED_UTF16_ENCODING) {
            result = Strings.UNSUPPORTED_UTF16_ENCODING_ERR;
        } else {
            result = StringUtils.format(Strings.GENERIC_ERROR, name);
        }

        return result;
    }

    /**
     * Shows an error dialog indicating that the given file could not be opened due to the given error
     * @deprecated Use DocumentCommandHandlers.showFileOpenError() instead
     *
     * @param {!FileSystemError} name
     * @return {!Dialog}
     */
    function showFileOpenError(name, path) {
        DeprecationWarning.deprecationWarning("FileUtils.showFileOpenError() has been deprecated. " +
                                              "Please use DocumentCommandHandlers.showFileOpenError() instead.");
        return DocumentCommandHandlers.showFileOpenError(name, path);
    }

    /**
     * Creates an HTML string for a list of files to be reported on, suitable for use in a dialog.
     * @param {Array.<string>} Array of filenames or paths to display.
     */
    function makeDialogFileList(paths) {
        var result = "<ul class='dialog-list'>";
        paths.forEach(function (path) {
            result += "<li><span class='dialog-filename'>";
            result += StringUtils.breakableUrl(path);
            result += "</span></li>";
        });
        result += "</ul>";
        return result;
    }

    /**
     * Convert a URI path to a native path.
     * On both platforms, this unescapes the URI
     * On windows, URI paths start with a "/", but have a drive letter ("C:"). In this
     * case, remove the initial "/".
     * @param {!string} path
     * @return {string}
     */
    function convertToNativePath(path) {
        path = unescape(path);
        if (path.indexOf(":") !== -1 && path[0] === "/") {
            return path.substr(1);
        }

        return path;
    }

    /**
     * Convert a Windows-native path to use Unix style slashes.
     * On Windows, this converts "C:\foo\bar\baz.txt" to "C:/foo/bar/baz.txt".
     * On Mac, this does nothing, since Mac paths are already in Unix syntax.
     * (Note that this does not add an initial forward-slash. Internally, our
     * APIs generally use the "C:/foo/bar/baz.txt" style for "native" paths.)
     * @param {string} path A native-style path.
     * @return {string} A Unix-style path.
     */
    function convertWindowsPathToUnixPath(path) {
        if (brackets.platform === "win") {
            path = path.replace(/\\/g, "/");
        }
        return path;
    }

    /**
     * Removes