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

/**
 * Button that opens a dropdown list when clicked. More akin to a popup menu than a combobox. Compared to a
 * simple <select> element:
 *  - There's no "selected" state
 *  - The button's label is not automatically changed when an item in the list is clicked
 *  - Its width is not the max of all the dropdown items' labels
 *  - The button & dropdown's appearance can be customized far more
 * Events
 *  - listRendered -- This event is dispatched after the entire list is rendered so that custom event handlers can be
 *                    set up for any custom UI in the list.
 *
 * TODO: merge DropdownEventHandler into this? Are there any other widgets that might want to use it separately?
 *
 */
define(function (require, exports, module) {


    // Load dependent modules
    var DropdownEventHandler    = require("utils/DropdownEventHandler").DropdownEventHandler,
        EventDispatcher         = require("utils/EventDispatcher"),
        WorkspaceManager        = require("view/WorkspaceManager"),
        Menus                   = require("command/Menus"),
        ViewUtils               = require("utils/ViewUtils"),
        _                       = require("thirdparty/lodash");

    /**
     * Creates a single dropdown-button instance. The DOM node is created but not attached to
     * the document anywhere - clients should append this.$button to the appropriate location.
     *
     * DropdownButton dispatches the following events:
     *  - "select" - when an option in the dropdown is clicked. Passed item object and index.
     *
     * @param {!string} label  Label to display on the button
     * @param {!Array.<*>} items  Items in the dropdown list. It generally doesn't matter what type/value the
     *          items have, except that any item === "---" will be treated as a divider. Such items are not
     *          clickable and itemRenderer() will not be called for them.
     * @param {?function(*, number):!string|{html:string, enabled:boolean} itemRenderer  Optional function to
     *          convert a single item to HTML (see itemRenderer() docs below). If not provided, items are
     *          assumed to be plain text strings.
     */
    function DropdownButton(label, items, itemRenderer) {
        this.items = items;

        this.itemRenderer = itemRenderer || this.itemRenderer;

        this._onClick        = this._onClick.bind(this);
        this.closeDropdown   = this.closeDropdown.bind(this);
        this._onClickOutside = this._onClickOutside.bind(this);

        this.$button = $("<button class='btn btn-dropdown'/>")
            .text(label)
            .on("click", this._onClick);
    }
    EventDispatcher.makeEventDispatcher(DropdownButton.prototype);

    /**
     * Items in dropdown list - may be changed any time dropdown isn't open
     * @type {!Array.<*>}
     */
    DropdownButton.prototype.items = null;

    /**
     * The clickable button. Available as soon as the DropdownButton is constructed.
     * @type {!jQueryObject}
     */
    DropdownButton.prototype.$button = null;

    /**
     * The dropdown element. Only non-null while open.
     * @type {?jQueryObject}
     */
    DropdownButton.prototype.$dropdown = null;

    /**
     * Extra CSS class(es) to apply to $dropdown
     * @type {?string}
     */
    DropdownButton.prototype.dropdownExtraClasses = null;

    /**
     * @private
     * Where to restore focus when dropdown closed
     * @type {?HTMLElement}
     */
    DropdownButton.prototype._lastFocus = null;

    /**
     * @private
     * Helper object for dropdown. Only non-null while open.
     * @type {?DropdownEventHandler}
     */
    DropdownButton.prototype._dropdownEventHandler = null;


    /**
     * @private
     * Handle clicking button
     */
    DropdownButton.prototype._onClick = function (event) {
        if (!this.$button.hasClass("disabled")) {
            this.toggleDropdown();
        }
        // Indicate click was handled (e.g. to shield from MultiRangeInlineEditor._onClick())
        event.stopPropagation();
    };

    /**
     * Update the button label.
     * @param {string} label
     */
    DropdownButton.prototype.setButtonLabel = function (label) {
        if (!this.$button) {
            return;
        }
        $(this.$button).text(label);
    };

    /**
     * Called for each item when rendering the dropdown.
     * @param {*