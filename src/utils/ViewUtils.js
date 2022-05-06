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

define(function (require, exports, module) {


    var _                   = require("thirdparty/lodash"),
        LanguageManager     = require("language/LanguageManager");

    var SCROLL_SHADOW_HEIGHT = 5;

    /**
     * @private
     */
    var _resizeHandlers = [];

    /**
     * Positions shadow background elements to indicate vertical scrolling.
     * @param {!DOMElement} $displayElement the DOMElement that displays the shadow
     * @param {!Object} $scrollElement the object that is scrolled
     * @param {!DOMElement} $shadowTop div .scroller-shadow.top
     * @param {!DOMElement} $shadowBottom div .scroller-shadow.bottom
     * @param {boolean} isPositionFixed When using absolute position, top remains at 0.
     */
    function _updateScrollerShadow($displayElement, $scrollElement, $shadowTop, $shadowBottom, isPositionFixed) {
        var offsetTop           = 0,
            scrollElement       = $scrollElement.get(0),
            scrollTop           = scrollElement.scrollTop,
            topShadowOffset     = Math.min(scrollTop - SCROLL_SHADOW_HEIGHT, 0),
            displayElementWidth = $displayElement.width();

        if ($shadowTop) {
            $shadowTop.css("background-position", "0px " + topShadowOffset + "px");

            if (isPositionFixed) {
                offsetTop = $displayElement.offset().top;
                $shadowTop.css("top", offsetTop);
            }

            if (isPositionFixed) {
                $shadowTop.css("width", displayElementWidth);
            }
        }

        if ($shadowBottom) {
            var clientHeight        = scrollElement.clientHeight,
                outerHeight         = $displayElement.outerHeight(),
                scrollHeight        = scrollElement.scrollHeight,
                bottomShadowOffset  = SCROLL_SHADOW_HEIGHT; // outside of shadow div viewport

            if (scrollHeight > clientHeight) {
                bottomShadowOffset -= Math.min(SCROLL_SHADOW_HEIGHT, (scrollHeight - (scrollTop + clientHeight)));
            }

            $shadowBottom.css("background-position", "0px " + bottomShadowOffset + "px");
            $shadowBottom.css("top", offsetTop + outerHeight - SCROLL_SHADOW_HEIGHT);
            $shadowBottom.css("width", displayElementWidth);
        }
    }

    function getOrCreateShadow($displayElement, position, isPositionFixed) {
        var $findShadow = $displayElement.find(".scroller-shadow." + position);

        if ($findShadow.length === 0) {
            $findShadow = $(window.document.createElement("div")).addClass("scroller-shadow " + position);
            $displayElement.append($findShadow);
        }

        if (!isPositionFixed) {
            // position is fixed by default
            $findShadow.css("position", "absolute");
            $findShadow.css(position, "0");
        }

        return $findShadow;
    }

    /**
     * Installs event handlers for updatng shadow background elements to indicate vertical scrolling.
     * @param {!DOMElement} displayElement the DOMElement that displays the shadow. Must fire
     *  "contentChanged" events when the element is resized or repositioned.
     * @param {?Object} scrollElement the object that is scrolled. Must fire "scroll" events
     *  when the element is scrolled. If null, the displayElement is used.
     * @param {?boolean} showBottom optionally show the bottom shadow
     */
    function addScrollerShadow(displayElement, scrollElement, showBottom) {
        // use fixed positioning when the display and scroll elements are the same
        var isPositionFixed = false;

        if (!scrollElement) {
            scrollElement = displayElement;
            isPositionFixed = true;
        }

        // update shadows when the scrolling element is scrolled
        var $displayElement = $(displayElement),
            $scrollElement = $(scrollElement);

        var $shadowTop = getOrCreateShadow($displayElement, "top", isPositionFixed);
        var $shadowBottom = (showBottom) ? getOrCreateShadow($displayElement, "bottom", isPositionFixed) : null;

        var doUpdate = function () {
            _updateScrollerShadow($displayElement, $scrollElement, $shadowTop, $shadowBottom, isPositionFixed);
        };

        // remove any previously installed listeners on this node
        $scrollElement.off("scroll.scroller-shadow");
        $displayElement.off("contentChanged.scroller-shadow");

        // add new ones
        $scrollElement.on("scroll.scroller-shadow", doUpdate);
        $displayElement.on("contentChanged.scroller-shadow", doUpdate);

        // update immediately
        doUpdate();
    }

    /**
     * Remove scroller-shadow effect.
     * @param {!DOMElement} displayElement the DOMElement that displays the shadow
     * @param {?Object} scrollElement the object that is scrolled
     */
    function removeScrollerShadow(displayElement, scrollElement) {
        if (!scrollElement) {
            scrollElement = displayElement;
        }

        var $displayElement = $(displayElement),
            $scrollElement = $(scrollElement);

        // remove scrollerShadow elements from DOM
        $displayElement.find(".scroller-shadow.top").remove();
        $displayElement.find(".scroller-shadow.bottom").remove();

        // remove event handlers
        $scrollElement.off("scroll.scroller-shadow");
        $displayElement.off("contentChanged.scroller-shadow");
    }

    /**
     * Utility function to replace jQuery.toggleClass when used with the second argument, which needs to be a true boolean for jQuery
     * @param {!jQueryObject} $domElement The jQueryObject to toggle the Class on
     * @param {!string} className Class name or names (separated by spaces) to toggle
     * @param {!boolean} addClass A truthy value to add the class and a falsy value to remove the class
     */
    function toggleClass($domElement, className, addClass) {
        if (addClass) {
            $domElement.addClass(className);
        } else {
            $domElement.removeClass(className);
        }
    }

    /**
     * Within a scrolling DOMElement, creates and positions a styled selection
     * div to align a single selected list item from a ul list element.
     *
     * Assumptions:
     * - scrollerElement is a child of the #sidebar div
     * - ul list element fires a "selectionChanged" event after the
     *   selectedClassNam