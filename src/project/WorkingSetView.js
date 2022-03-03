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

/**
 * WorkingSetView generates the UI for the list of the files user is editing based on the model provided by EditorManager.
 * The UI allows the user to see what files are open/dirty and allows them to close files and specify the current editor.
 *
 */
define(function (require, exports, module) {


    // Load dependent modules
    var AppInit               = require("utils/AppInit"),
        DocumentManager       = require("document/DocumentManager"),
        MainViewManager       = require("view/MainViewManager"),
        CommandManager        = require("command/CommandManager"),
        Commands              = require("command/Commands"),
        Menus                 = require("command/Menus"),
        FileViewController    = require("project/FileViewController"),
        ViewUtils             = require("utils/ViewUtils"),
        KeyEvent              = require("utils/KeyEvent"),
        paneListTemplate      = require("text!htmlContent/working-set.html"),
        Strings               = require("strings"),
        _                     = require("thirdparty/lodash"),
        Mustache              = require("thirdparty/mustache/mustache");

    /**
     * Open view dictionary
     * Maps PaneId to WorkingSetView
     * @private
     * @type {Object.<string, WorkingSetView>}
     */
    var _views = {};

    /**
     * Icon Providers
     * @see {@link #addIconProvider}
     * @private
     */
    var _iconProviders = [];

    /**
     * The file/folder object of the current context
     * @type {FileSystemEntry}
     * @private
     */
    var _contextEntry;

    /**
     * Class Providers
     * @see {@link #addClassProvider}
     * @private
     */
    var _classProviders = [];


    /**
     * #working-set-list-container
     * @type {jQuery}
     */
    var $workingFilesContainer;

    /**
     * Constants for event.which values
     * @enum {number}
     */
    var LEFT_BUTTON = 1,
        MIDDLE_BUTTON = 2;

    /**
     * Each list item in the working set stores a references to the related document in the list item's data.
     *  Use `listItem.data(_FILE_KEY)` to get the document reference
     * @type {string}
     * @private
     */
    var _FILE_KEY = "file";

    /**
     * Constants for hitTest.where
     * @enum {string}
     */
    var NOMANSLAND = "nomansland",
        NOMOVEITEM = "nomoveitem",
        ABOVEITEM  = "aboveitem",
        BELOWITEM  = "belowitem",
        TOPSCROLL  = "topscroll",
        BOTSCROLL  = "bottomscroll",
        BELOWVIEW  = "belowview",
        ABOVEVIEW  = "aboveview";

    /**
     * Drag an item has to move 3px before dragging starts
     * @constant
     */
    var _DRAG_MOVE_DETECTION_START = 3;

    /**
     * Refreshes all Pane View List Views
     */
    function refresh(rebuild) {
        _.forEach(_views, function (view) {
            var top = view.$openFilesContainer.scrollTop();
            if (rebuild) {
                view._rebuildViewList(true);
            } else {
                view._redraw();
            }
            view.$openFilesContainer.scrollTop(top);
        });
    }

    /**
     * Synchronizes the selection indicator for all views
     */
    function syncSelectionIndicator() {
        _.forEach(_views, function (view) {
            view.$openFilesContainer.triggerHandler("scroll");
        });
    }

    /**
     * Updates the appearance of the list element based on the parameters provided.
     * @private
     * @param {!HTMLLIElement} listElement
     * @param {?File} selectedFile
     */
    function _updateListItemSelection(listItem, selectedFile) {
        var shouldBeSelected = (selectedFile && $(listItem).data(_FILE_KEY).fullPath === selectedFile.fullPath);
        ViewUtils.toggleClass($(listItem), "selected", shouldBeSelected);
    }

    /**
     * Determines if a file is dirty
     * @private
     * @param {!File} file - file to test
     * @return {boolean} true if the file is dirty, false otherwise
     */
    function _isOpenAndDirty(file) {
        // working set item might never have been opened; if so, then it's definitely not dirty
        var docIfOpen = DocumentManager.getOpenDocumentForPath(file.fullPath);
        return (docIfOpen && docIfOpen.isDirty);
    }


    function _hasSelectionFocus() {
        return FileViewController.getFileSelectionFocus() === FileViewController.WORKING_SET_VIEW;
    }

    /**
     * Turns on/off the flag which suppresses rebuilding of the working set
     * when the "workingSetSort" event is dispatched from MainViewManager.
     * Only used while dragging things around in the working set to disable
     * rebuilding the list while dragging.
     * @private
     * @param {boolean} suppress - true suppress, false to allow sort redrawing
     */
    function _suppressSortRedrawForAllViews(suppress) {
        _.forEach(_views, function (view) {
            view.suppressSortRedraw = suppress;
        });
    }

    /**
     * turns off the scroll shadow on view containers so they don't interfere with dragging
     * @private
     * @param {Boolean} disable - true to disable, false to enable
     */
    function _suppressScrollShadowsOnAllViews(disable) {
        _.forEach(_views, function (view) {
            if (disable) {
                ViewUtils.removeScrollerShadow(view.$openFilesContainer[0], null);
            } else if (view.$openFilesContainer[0].scrollHeight > view.$openFilesContainer[0].clientHeight) {
                ViewUtils.addScrollerShadow(view.$openFilesContainer[0], null, true);
            }
        });
    }

    /**
     * Deactivates all views so the selection marker does not show
     * @private
     * @param {Boolean} deactivate - true to deactivate, false to reactivate
     */
    function _deactivateAllViews(deactivate) {
        _.forEach(_views, function (view) {
            if (deactivate) {
                if (view.$el.hasClass("active")) {
                    view.$el.removeClass("active").addClass("reactivate");
                    view.$openFilesList.trigger("selectionHide");
                }
            } else {
                if (view.$el.hasClass("reactivate")) {
                    view.$el.removeClass("reactivate").addClass("active");
                }
                // don't update the scroll pos
                view._fireSelectionChanged(false);
            }
        });
    }

    /**
     * Finds the WorkingSetView object for the specified element
     * @private
     * @param {jQuery} $el - the element to find the view for
     * @return {View} view object
     */
    function _viewFromEl($el) {
        if (!$el.hasClass("working-set-view")) {
            $el = $el.parents(".working-set-view");
        }

        var id = $el.attr("id").match(/working\-set\-list\-([\w]+[\w\d\-\.\:\_]*)/).pop();
        return _views[id];
    }

    /**
     * Makes the specified element draggable
     * @private
     * @param {jQuery} $el - the element to make draggable
     */
    function _makeDraggable($el) {
        var interval,
            sourceFile = $el.data(_FILE_KEY);

        // turn off the "hover-scroll"
        function endScroll($el) {
            if (interval) {
                window.clearInterval(interval);
                interval = undefined;
            }
        }

        //  We scroll the list while hovering over the first or last visible list element
        //  in the working set, so that positioning a working set item before or after one
        //  that has been scrolled out of view can be performed.
        //
        //  This function will call the drag interface repeatedly on an interval to allow
        //  the item to be dragged while scrolling the list until the mouse is moved off
        //  the first or last item or endScroll is called
        function scroll($container, $el, dir, callback) {
            var container = $container[0],
                maxScroll = container.scrollHeight - container.clientHeight;
            if (maxScroll && dir && !interval) {
                // Scroll view if the mouse is over the first or last pixels of the container
                interval = window.setInterval(function () {
                    var scrollTop = $container.scrollTop();
                    if ((dir === -1 && scrollTop <= 0) || (dir === 1 && scrollTop >= maxScroll)) {
                        endScroll($el);
                    } else {
                        $container.scrollTop(scrollTop + 7 * dir);
                        callback($el);
                    }
                }, 50);
            }
        }

        // The mouse down handler pretty much handles everything
        $el.mousedown(function (e) {
            var scrollDir = 0,
                dragged = false,
                startPageY = e.pageY,
                lastPageY = startPageY,
                lastHit = { where: NOMANSLAND },
                tryClosing = $(e.target).hasClass("can-close"),
                currentFile = MainViewManager.getCurrentlyViewedFile(),
                activePaneId = MainViewManager.getActivePaneId(),
                activeView = _views[activePaneId],
                sourceView = _viewFromEl($el),
                currentView = sourceView,
                startingIndex = $el.index(),
                itemHeight,
                offset,
                $copy,
                $ghost,
                draggingCurrentFile;

            function initDragging() {
                itemHeight = $el.height();
                offset = $el.offset();
                $copy = $el.clone();
                $ghost = $("<div class='open-files-container wsv-drag-ghost' style='overflow: hidden; display: inline-block;'>").append($("<ul>").append($copy).css("padding", "0"));
                draggingCurrentFile = ($el.hasClass("selected") && sourceView.paneId === activePaneId);

                // setup our ghost element as position absolute
                //  so we can put it wherever we want to while dragging
                if (draggingCurrentFile && _hasSelectionFocus()) {
                    $ghost.addClass("dragging-current-file");
                }

                $ghost.css({
                    top: offset.top,
                    left: offset.left,
                    width: $el.width() + 8
                });

                // this will give the element the appearence that it's ghosted if the user
                //  drags the element out of the view and goes off into no mans land
                $ghost.appendTo($("body"));
            }

            // Switches the view context to match the hit context
            function updateContext(hit) {
                // just set the container and update
                currentView = _viewFromEl(hit.which);
            }

            // Determines where the mouse hit was
            function hitTest(e) {
                var pageY = $ghost.offset().top,
                    direction =  e.pageY - lastPageY,
                    result = {
                        where: NOMANSLAND
                    },
                    lookCount = 0,
                    hasScroller = false,
                    onTopScroller = false,
                    onBottomScroller = false,
                    $container,
                    $hit,
                    $item,
                    $view,
                    gTop,
                    gHeight,
                    gBottom,
                    containerOffset,
                    scrollerTopArea,
                    scrollerBottomArea;

                // if the mouse is outside of the view then
                //  return nomansland -- this prevents some UI glitches
                //  that appear when dragging onto a second monitor
                if (e.pageX < 0 || e.pageX > $workingFilesContainer.width()) {
                    return result;
                }

                do {
                    // Turn off the ghost so elementFromPoint ignores it
                    $ghost.hide();

                    $hit = $(window.document.elementFromPoint(e.pageX, pageY));
                    $view = $hit.closest(".working-set-view");
                    $item = $hit.closest("#working-set-list-container li");

                    // Show the ghost again
                    $ghost.show();

                    $container = $view.children(".open-files-container");

                    if ($container.length) {
                        containerOffset = $container.offset();

                        // Compute "scrollMe" regions
                        scrollerTopArea = { top: containerOffset.top - 14,
                            bottom: containerOffset.top + 7};

                        scrollerBottomArea = { top: containerOffset.top + $container.height() - 7,
                            bottom: containerOffset.top + $container.height() + 14};
                    }

                    // If we hit ourself then look for another
                    //  element to insert before/after
                    if ($item[0] === $el[0]) {
                        if (direction > 0) {
                            $item = $item.next();
                            if ($item.length) {
                                pageY += itemHeight;
                            }
                        } else {
                            $item = $item.prev();
                            if ($item.length) {
                                pageY -= itemHeight;
                            }
                        }
                    }

                    // If we didn't hit anything then
                    //  back up and try again in the other direction
                    if (!$item.length) {
                        pageY += itemHeight;
                    }

                    // look one more time below the mouse
                    //  if we didn't get a hit
                } while (!$item.length && ++lookCount < 2);

                // if we hit a span or an anchor tag and didn't
                //  find an item then force the selection hit to
                //  the item so we can bail out on the scrollMe
                //  region at the top and bottom of the list
                if ($item.length === 0 && ($hit.is("a") || $hit.is("span"))) {
                    $item = $hit.parents("#working-set-list-container li");
                }

                // compute ghost location, we compute the insertion point based
                //  on where the ghost is, not where the  mouse is
                gTop = $ghost.offset().top;
                gHeight = $ghost.height();
                gBottom = gTop + gHeight;

                // data to help us determine if we have a scroller
                hasScroller = $item.length && $container.length && $container[0].scrollHeight > $container[0].clientHeight;

                // data to help determine if the ghost is in either of the scrollMe regions
                onTopScroller = hasScroller && scrollerTopArea && ((gTop >= scrollerTopArea.top && gTop <= scrollerTopArea.bottom)  ||
                                                    (gBottom >= scrollerTopArea.top && gBottom <= scrollerTopArea.bottom));
                onBottomScroller = hasScroller && scrollerBottomArea && ((gTop >= scrollerBottomArea.top && gTop <= scrollerBottomArea.bottom) ||
                                                         (gBottom >= scrollerBottomArea.top && gBottom <= scrollerBottomArea.bottom));


                // helpers
                function mouseIsInTopHalf($elem) {
                    var top = $elem.offset().top,
                        height = $elem.height();

                    return (pageY < top + (height / 2));
                }

                function ghostIsAbove($elem) {
                    var top = $elem.offset().top,
                        checkVal = gTop;

                    if (direction > 0) {
                        checkVal += gHeight;
                    }

                    return (checkVal <=  (top + (itemHeight / 2)));
                }

                function ghostIsBelow($elem) {
                    var top = $elem.offset().top,
                        checkVal = gTop;

                    if (direction > 0) {
                        checkVal += gHeight;
                    }

                    return (checkVal >= (top + (itemHeight / 2)));
                }

                function elIsClearBelow($a, $b) {
                    var aTop = $a.offset().top,
                        bTop = $b.offset().top;

                    return (aTop >= bTop + $b.height());
                }

                function draggingBelowWorkingSet() {
                    return ($hit.length === 0 || elIsClearBelow($hit, $workingFilesContainer));
                }

                function targetIsContainer() {
                    return ($hi