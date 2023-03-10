
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE
// Based on http://codemirror.net/addon/fold/foldgutter.js
// Modified by Patrick Oladimeji for Brackets

define(function (require, exports, module) {

    var CodeMirror      = brackets.getModule("thirdparty/CodeMirror/lib/codemirror"),
        prefs           = require("Prefs");

    function State(options) {
        this.options = options;
        this.from = this.to = 0;
    }

    function parseOptions(opts) {
        if (opts === true) { opts = {}; }
        if (!opts.gutter) { opts.gutter = "CodeMirror-foldgutter"; }
        if (!opts.indicatorOpen) { opts.indicatorOpen = "CodeMirror-foldgutter-open"; }
        if (!opts.indicatorFolded) { opts.indicatorFolded = "CodeMirror-foldgutter-folded"; }
        return opts;
    }

    /**
      * Utility for creating fold markers in fold gutter
      * @param {string} spec the className for the marker
      * @return {HTMLElement} a htmlelement representing the fold marker
      */
    function marker(spec) {
        var elt = window.document.createElement("div");
        elt.className = spec;
        return elt;
    }

    /**
     * Checks whether or not a marker is a code-folding marker
     * @param   {Object}   m a CodeMirror TextMarker object
     * @returns {boolean} true if the marker is a codefolding range marker or false otherwise
     */
    function isFold(m) {
        return m.__isFold;
    }

    /**
      * Updates the gutter markers for the specified range
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      * @param {!number} from the starting line for the update
      * @param {!number} to the ending line for the update
      */
    function updateFoldInfo(cm, from, to) {
        var minFoldSize = prefs.getSetting("minFoldSize") || 2;
        var opts = cm.state.foldGutter.options;
        var fade = prefs.getSetting("hideUntilMouseover");
        var $gutter = $(cm.getGutterElement());
        var i = from;

        function clear(m) {
            return m.clear();
        }

        /**
          * @private
          * helper function to check if the given line is in a folded region in the editor.
          * @param {number} line the
          * @return {Object} the range that hides the specified line or undefine if the line is not hidden
          */
        function _isCurrentlyFolded(line) {
            var keys = Object.keys(cm._lineFolds), i = 0, range;
            while (i < keys.length) {
                range = cm._lineFolds[keys[i]];
                if (range.from.line < line && range.to.line >= line) {
                    return range;
                }
                i++;
            }
        }

        /**
            This case is needed when unfolding a region that does not cause the viewport to change.
            For instance in a file with about 15 lines, if some code regions are folded and unfolded, the
            viewport change event isn't fired by CodeMirror. The setTimeout is a workaround to trigger the
            gutter update after the viewport has been drawn.
        */
        if (i === to) {
            window.setTimeout(function () {
                var vp = cm.getViewport();
                updateFoldInfo(cm, vp.from, vp.to);
            }, 200);
        }

        while (i < to) {
            var sr = _isCurrentlyFolded(i), // surrounding range for the current line if one exists
                range;
            var mark = marker("CodeMirror-foldgutter-blank");
            var pos = CodeMirror.Pos(i, 0),
                func = opts.rangeFinder || CodeMirror.fold.auto;
            // don't look inside collapsed ranges
            if (sr) {
                i = sr.to.line + 1;
            } else {
                range = cm._lineFolds[i] || (func && func(cm, pos));

                if (!fade || (fade && $gutter.is(":hover"))) {
                    if (cm.isFolded(i)) {
                        // expand fold if invalid
                        if (range) {
                            mark = marker(opts.indicatorFolded);
                        } else {
                            cm.findMarksAt(pos).filter(isFold)
                                .forEach(clear);
                        }
                    } else {
                        if (range && range.to.line - range.from.line >= minFoldSize) {
                            mark = marker(opts.indicatorOpen);
                        }
                    }
                }
                cm.setGutterMarker(i, opts.gutter, mark);
                i++;
            }
        }
    }

    /**
      * Updates the fold information in the viewport for the specified range
      * @param {CodeMirror} cm the instance of the CodeMirror object
      * @param {?number} from the starting line number for the update
      * @param {?number} to the end line number for the update
      */
    function updateInViewport(cm, from, to) {
        var vp = cm.getViewport(), state = cm.state.foldGutter;
        from = isNaN(from) ? vp.from : from;
        to = isNaN(to) ? vp.to : to;

        if (!state) { return; }
        cm.operation(function () {
            updateFoldInfo(cm, from, to);
        });
        state.from = from;
        state.to = to;
    }

    /**
     * Helper function to return the fold text marker on a line in an editor
     * @param   {CodeMirror} cm   The CodeMirror instance for the active editor
     * @param   {Number}     line The line number representing the position of the fold marker
     * @returns {TextMarker} A CodeMirror TextMarker object
     */
    function getFoldOnLine(cm, line) {
        var pos = CodeMirror.Pos(line, 0);
        var folds = cm.findMarksAt(pos) || [];
        folds = folds.filter(isFold);
        return folds.length ? folds[0] : undefined;
    }

    /**
     * Synchronises the code folding states in the CM doc to cm._lineFolds cache.
     * When an undo operation is done, if folded code fragments are restored, then
     * we need to update cm._lineFolds with the fragments
     * @param {Object}   cm       cm the CodeMirror instance for the active  editor
     * @param {Object}   from     starting position in the doc to sync the fold states from
     * @param {[[Type]]} lineAdded a number to show how many lines where added to the document
     */
    function syncDocToFoldsCache(cm, from, lineAdded) {
        var minFoldSize = prefs.getSetting("minFoldSize") || 2;
        var i, fold, range;
        if (lineAdded <= 0) {
            return;
        }

        for (i = from; i <= from + lineAdded; i = i + 1) {
            fold = getFoldOnLine(cm, i);
            if (fold) {
                range = fold.find();
                if (range && range.to.line - range.from.line >= minFoldSize) {
                    cm._lineFolds[i] = range;
                    i = range.to.line;
                } else {
                    delete cm._lineFolds[i];
                }
            }
        }
    }

    /**
     * Helper function to move a fold range object by the specified number of lines
     * @param {Object} range    An object specifying the fold range to move. It contains {from, to} which are CodeMirror.Pos objects.
     * @param {Number} numLines A positive or negative number representing the numbe of lines to move the range by
     */
    function moveRange(range, numLines) {
        return {from: CodeMirror.Pos(range.from.line + numLines, range.from.ch),
            to: CodeMirror.Pos(range.to.line + numLines, range.to.ch)};
    }

    /**
      * Updates the line folds cache usually when the document changes.
      * The following cases are accounted for:
      * 1.  When the change does not add a new line to the document we check if the line being modified
      *     is folded. If that is the case, changes to this line might affect the range stored in the cache
      *     so we update the range using the range finder function.
      * 2.  If lines have been added, we need to update the records for all lines in the folds cache
      *     which are greater than the line position at which we are adding the new line(s). When existing
      *     folds are above the addition we keep the original position in the cache.
      * 3.  If lines are being removed, we need to update the records for all lines in the folds cache which are
      *     greater than the line position at which we are removing the new lines, while making sure to
      *     not include any folded lines in the cache that are part of the removed chunk.
      * @param {!CodeMirror} cm        the CodeMirror instance for the active editor
      * @param {!number}     from      the line number designating the start position of the change
      * @param {!number}     linesDiff a number to show how many lines where removed or added to the document.
      *                                This value is negative for deletions and positive for additions.
      */
    function updateFoldsCache(cm, from, linesDiff) {
        var oldRange, newRange;
        var minFoldSize = prefs.getSetting("minFoldSize") || 2;
        var foldedLines = Object.keys(cm._lineFolds).map(function (d) {
            return +d;
        });
        var opts = cm.state.foldGutter.options || {};
        var rf = opts.rangeFinder || CodeMirror.fold.auto;

        if (linesDiff === 0) {
            if (foldedLines.indexOf(from) >= 0) {
                newRange = rf(cm, CodeMirror.Pos(from, 0));
                if (newRange && newRange.to.line - newRange.from.line >= minFoldSize) {
                    cm._lineFolds[from] = newRange;
                } else {
                    delete cm._lineFolds[from];
                }
            }
        } else if (foldedLines.length) {
            var newFolds = {};
            foldedLines.forEach(function (line) {
                oldRange = cm._lineFolds[line];
                //update range with lines-diff
                newRange = moveRange(oldRange, linesDiff);
                // for removed lines we want to check lines that lie outside the deleted range
                if (linesDiff < 0) {
                    if (line < from) {
                        newFolds[line] = oldRange;
                    } else if (line >= from + Math.abs(linesDiff)) {
                        newFolds[line + linesDiff] = newRange;
                    }
                } else {
                    if (line < from) {
                        newFolds[line] = oldRange;
                    } else if (line >= from) {
                        newFolds[line + linesDiff] = newRange;
                    }
                }
            });
            cm._lineFolds = newFolds;
        }
    }

    /**
      * Triggered when the content of the document changes. When the entire content of the document
      * is changed - e.g., changes made from a different editor, the same lineFolds are kept only if
      * they are still valid in the context of the new document content.
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      * @param {!Object} changeObj detailed information about the change that occurred in the document
      */
    function onChange(cm, changeObj) {
        if (changeObj.origin === "setValue") { //text content has changed outside of brackets
            var folds = cm.getValidFolds(cm._lineFolds);
            cm._lineFolds = folds;
            Object.keys(folds).forEach(function (line) {
                cm.foldCode(+line);
            });
        } else {
            var state = cm.state.foldGutter;
            var lineChanges = changeObj.text.length - changeObj.removed.length;
            // for undo actions that add new line(s) to the document first update the folds cache as normal
            // and then update the folds cache with any line folds that exist in the new lines
            if (changeObj.origin === "undo" && lineChanges > 0) {
                updateFoldsCache(cm, changeObj.from.line, lineChanges);
                syncDocToFoldsCache(cm, changeObj.from.line, lineChanges);
            } else {
                updateFoldsCache(cm, changeObj.from.line, lineChanges);
            }
            if (lineChanges !== 0) {
                updateFoldInfo(cm, Math.max(0, changeObj.from.line + lineChanges), Math.max(0, changeObj.from.line + lineChanges) + 1);
            }
            state.from = changeObj.from.line;
            state.to = 0;
            window.clearTimeout(state.changeUpdate);
            state.changeUpdate = window.setTimeout(function () {
                updateInViewport(cm);
            }, 600);
        }
    }

    /**
      * Triggered on viewport changes e.g., user scrolls or resizes the viewport.
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      */
    function onViewportChange(cm) {
        var state = cm.state.foldGutter;
        window.clearTimeout(state.changeUpdate);
        state.changeUpdate = window.setTimeout(function () {
            var vp = cm.getViewport();
            if (state.from === state.to || vp.from - state.to > 20 || state.from - vp.to > 20) {
                updateInViewport(cm);
            } else {
                cm.operation(function () {
                    if (vp.from < state.from) {
                        updateFoldInfo(cm, vp.from, state.from);
                        state.from = vp.from;
                    }
                    if (vp.to > state.to) {
                        updateFoldInfo(cm, state.to, vp.to);
                        state.to = vp.to;
                    } else {
                        updateFoldInfo(cm, vp.from, vp.to);
                        state.to = vp.to;
                        state.from = vp.from;
                    }
                });
            }
        }, 400);
    }

    /**
     * Triggered when the cursor moves in the editor and used to detect text selection changes
     * in the editor.
     * @param {!CodeMirror} cm the CodeMirror instance for the active editor
     */
    function onCursorActivity(cm) {
        var state = cm.state.foldGutter;
        var vp = cm.getViewport();
        window.clearTimeout(state.changeUpdate);
        state.changeUpdate = window.setTimeout(function () {
            //need to render the entire visible viewport to remove fold marks rendered from previous selections if any
            updateInViewport(cm, vp.from, vp.to);
        }, 400);
    }

    /**
      * Triggered when a code segment is folded.
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      * @param {!Object} from  the ch and line position that designates the start of the region
      * @param {!Object} to the ch and line position that designates the end of the region
      */
    function onFold(cm, from, to) {
        var state = cm.state.foldGutter;
        updateFoldInfo(cm, from.line, from.line + 1);
    }

    /**
      * Triggered when a folded code segment is unfolded.
      * @param {!CodeMirror} cm the CodeMirror instance for the active editor
      * @param {!{line:number, ch:number}} from  the ch and line position that designates the start of the region
      * @param {!{line:number, ch:number}} to the ch and line position that designates the end of the region
      */
    function onUnFold(cm, from, to) {
        var state = cm.state.foldGutter;
        var vp = cm.getViewport();
        delete cm._lineFolds[from.line];
        updateFoldInfo(cm, from.line, to.line || vp.to);
    }

    /**
      * Initialises the fold gutter and registers event handlers for changes to document, viewport
      * and user interactions.
      */
    function init() {
        CodeMirror.defineOption("foldGutter", false, function (cm, val, old) {
            if (old && old !== CodeMirror.Init) {
                cm.clearGutter(cm.state.foldGutter.options.gutter);
                cm.state.foldGutter = null;
                cm.off("gutterClick", old.onGutterClick);
                cm.off("change", onChange);
                cm.off("viewportChange", onViewportChange);
                cm.off("cursorActivity", onCursorActivity);

                cm.off("fold", onFold);
                cm.off("unfold", onUnFold);
                cm.off("swapDoc", updateInViewport);
            }
            if (val) {
                cm.state.foldGutter = new State(parseOptions(val));
                updateInViewport(cm);
                cm.on("gutterClick", val.onGutterClick);
                cm.on("change", onChange);
                cm.on("viewportChange", onViewportChange);
                cm.on("cursorActivity", onCursorActivity);
                cm.on("fold", onFold);
                cm.on("unfold", onUnFold);
                cm.on("swapDoc", updateInViewport);
            }
        });
    }

    exports.init = init;
    exports.updateInViewport = updateInViewport;

});