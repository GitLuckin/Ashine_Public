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

/*unittests: FileTreeView*/

/**
 * This is the view layer (template) for the file tree in the sidebar. It takes a FileTreeViewModel
 * and renders it to the given element using Preact. User actions are signaled via an ActionCreator
 * (in the Flux sense).
 */
define(function (require, exports, module) {


    var Preact            = require("thirdparty/preact"),
        Classnames        = require("thirdparty/classnames"),
        Immutable         = require("thirdparty/immutable"),
        _                 = require("thirdparty/lodash"),
        FileUtils         = require("file/FileUtils"),
        LanguageManager   = require("language/LanguageManager"),
        FileTreeViewModel = require("project/FileTreeViewModel"),
        ViewUtils         = require("utils/ViewUtils"),
        KeyEvent          = require("utils/KeyEvent"),
        PreferencesManager  = require("preferences/PreferencesManager");

    var DOM = Preact.DOM;

    /**
     * @private
     * @type {Immutable.Map}
     *
     * Stores the file tree extensions for adding classes and icons. The keys of the map
     * are the "categories" of the extensions and values are vectors of the callback functions.
     */
    var _extensions = Immutable.Map();

     /**
     * @private
     * @type {string}
     *
     * Stores the path of the currently dragged item in the filetree.
     */
    var _draggedItemPath;


    // Constants

    // Time range from first click to second click to invoke renaming.
    var CLICK_RENAME_MINIMUM  = 500,
        RIGHT_MOUSE_BUTTON    = 2,
        LEFT_MOUSE_BUTTON     = 0;

    var INDENTATION_WIDTH     = 10;

    /**
     * @private
     *
     * Returns the name of a file without its extension.
     *
     * @param {string} fullname The complete name of the file (not including the rest of the path)
     * @param {string} extension The file extension
     * @return {string} The fullname without the extension
     */
    function _getName(fullname, extension) {
        return extension !== "" ? fullname.substring(0, fullname.length - extension.length - 1) : fullname;
    }

    /**
     * Mixin that allows a component to compute the full path to its directory entry.
     */
    var pathComputer = {
        /**
         * Computes the full path of the file represented by this input.
         */
        myPath: function () {
            var result = this.props.parentPath + this.props.name;

            // Add trailing slash for directories
            if (!FileTreeViewModel.isFile(this.props.entry) && _.last(result) !== "/") {
                result += "/";
            }

            return result;
        }
    };

    /**
     * @private
     *
     * Gets an appropriate width given the text provided.
     *
     * @param {string} text Text to measure
     * @return {int} Width to use
     */
    function _measureText(text) {
        var measuringElement = $("<span />", { css: { "position": "absolute", "top": "-200px", "left": "-1000px", "visibility": "hidden", "white-space": "pre" } }).appendTo("body");
        measuringElement.text("pW" + text);
        var width = measuringElement.width();
        measuringElement.remove();
        return width;
    }

    /**
     * @private
     *
     * Create an appropriate div based "thickness" to indent the tree correctly.
     *
     * @param {int} depth The depth of the current node.
     * @return {PreactComponent} The resulting div.
     */
    function _createThickness(depth) {
        return DOM.div({
            style: {
                display: "inline-block",
                width: INDENTATION_WIDTH * depth
            }
        });
    }

    /**
     * @private
     *
     * Create, and indent correctly, the arrow icons used for the folders.
     *
     * @param {int} depth The depth of the current node.
     * @return {PreactComponent} The resulting ins.
     */
    function _createAlignedIns(depth) {
        return DOM.ins({
            className: "jstree-icon",
            style: {
                marginLeft: INDENTATION_WIDTH * depth
            }
        });
    }

    /**
     * This is a mixin that provides rename input behavior. It is responsible for taking keyboard input
     * and invoking the correct action based on that input.
     */
    var renameBehavior = {
        /**
         * Stop clicks from propagating so that clicking on the rename input doesn't
         * cause directories to collapse.
         */
        handleClick: function (e) {
            e.stopPropagation();
            if (e.button !== LEFT_MOUSE_BUTTON) {
                e.preventDefault();
            }
        },

        /**
         * If the user presses enter or escape, we either successfully complete or cancel, respectively,
         * the rename or create operation that is underway.
         */
        handleKeyDown: function (e) {
            this.props.actions.setRenameValue(this.props.parentPath + this.refs.name.value.trim());
            if (e.keyCode === KeyEvent.DOM_VK_ESCAPE) {
                this.props.actions.cancelRename();
            } else if (e.keyCode === KeyEvent.DOM_VK_RETURN) {
                this.props.actions.performRename();
            }
        },

        /**
         * The rename or create operation can be completed or canceled by actions outside of
         * this component, so we keep the model up to date by sending every update via an action.
         */
        handleInput: function (e) {
            this.props.actions.setRenameValue(this.props.parentPath + this.refs.name.value.trim());

            if (e.keyCode !== KeyEvent.DOM_VK_LEFT &&
                    e.keyCode !== KeyEvent.DOM_VK_RIGHT) {
                // update the width of the input field
                var node = this.refs.name,
                    newWidth = _measureText(node.value);
                $(node).width(newWidth);
            }
        },

        /**
         * If we leave the field for any reason, complete the rename.
         */
        handleBlur: function () {
            this.props.actions.performRename();
        }
    };

    /**
     * This is a mixin that provides drag and drop move function.
     */
    var dragAndDrop = {
        handleDrag: function(e) {
            // Disable drag when renaming
            if (this.props.entry.get("rename")) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // In newer CEF versions, the drag and drop data from the event
            // (i.e. e.dataTransfer.getData) cannot be used to read data in dragOver event,
            // so store the drag and drop data in a global variable to read it in the dragOver
            // event.
            _draggedItemPath = this.myPath();

            // Pass the dragged item path.
            e.dataTransfer.setData("text", JSON.stringify({
                path: _draggedItemPath
            }));

            this.props.actions.dragItem(this.myPath());

            this.setDragImage(e);
            e.stopPropagation();
        },
        handleDrop: function(e) {
            var data = JSON.parse(e.dataTransfer.getData("text"));

            this.props.actions.moveItem(data.path, this.myPath());
            this.setDraggedOver(false);

            this.clearDragTimeout();
            e.stopPropagation();
        },

        handleDragEnd: function(e) {
            this.clearDragTimeout();
        },

        handleDragOver: function(e) {
            var data = e.dataTransfer.getData("text"),
                path;

            if (data) {
                path = JSON.parse(data).path;
            } else {
                path = _draggedItemPath;
            }

            if (path === this.myPath() || FileUtils.getParentPath(path) === this.myPath()) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            var self = this;
            this.setDraggedOver(true);

            // Open the directory tree when item is dragged over a directory
            if (!this.dragOverTimeout) {
                this.dragOverTimeout = window.setTimeout(function() {
                    self.props.actions.setDirectoryOpen(self.myPath(), true);
                    self.dragOverTimeout = null;
                }, 800);
            }

            e.preventDefault(); // Allow the drop
            e.stopPropagation();
        },

        handleDragLeave: function(e) {
            this.setDraggedOver(false);
            this.clearDragTimeout();
        },

        clearDragTimeout: function() {
            if (this.dragOverTimeout) {
                clearTimeout(this.dragOverTimeout);
                this.dragOverTimeout = null;
            }
        },
        setDraggedOver: function(draggedOver) {
            if (this.state.draggedOver !== draggedOver) {
                this.setState({
                    draggedOver: draggedOver
                });
            }
        },

        setDragImage: function(e) {
            var div = window.document.createElement('div');
            div.textContent = this.props.name;
            div.classList.add('jstree-dragImage');
            window.document.body.appendChild(div);
            e.dataTransfer.setDragImage(div, -10, -10);
            setTimeout(function() {
                window.document.body.removeChild(div);
            }, 0);
        }
    };

    /**
     * @private
     *
     * This component presents an input field to the user for renaming a file.
     *
     * Props:
     * * parentPath: the full path of the directory containing this file
     * * name: the name of the file, including the extension
     * * actions: the action creator responsible for communicating actions the user has taken
     */
    var fileRenameInput = Preact.createFactory(Preact.createClass({
        mixins: [renameBehavior],

        /**
         * When this component is displayed, we scroll it into view and select the portion
         * of the filename that excludes the extension.
         */
        componentDidMount: function () {
            var fullname = this.props.name,
                extension = LanguageManager.getCompoundFileExtension(fullname);

            var node = this.refs.name;
            node.setSelectionRange(0, _getName(fullname, extension).length);
            node.focus(); // set focus on the rename input
            ViewUtils.scrollElementIntoView($("#project-files-container"), $(node), true);
        },

        render: function () {
            var width = _measureText(this.props.name);

            return DOM.input({
                className: "jstree-rename-input",
                type: "text",
                defaultValue: this.props.name,
                autoFocus: true,
                onKeyDown: this.handleKeyDown,
                onInput: this.handleInput,
                onClick: this.handleClick,
                onBlur: this.handleBlur,
                style: {
                    width: width
                },
                ref: "name"
            });
        }
    }));

    /**
     * @private
     *
     * This mixin handles right click (or control click on Mac) action to make a file
     * the "context" object for performing operations like rename.
     */
    var contextSettable = {

        /**
         * Send matching mouseDown events to the action creator as a setContext action.
         */
        handleMouseDown: function (e) {
            e.stopPropagation();
            if (e.button === RIGHT_MOUSE_BUTTON ||
                    (this.props.platform === "mac" && e.button === LEFT_MOUSE_BUTTON && e.ctrlKey)) {
                this.props.actions.setContext(this.myPath());
                e.preventDefault();
                return;
            }
            // Return true only for mouse down in rename mode.
            if (this.props.entry.get("rename")) {
                return;
            }
            this.selectNode(e);
        }
    };

    /**
     * @private
     *
     * Returns true if the value is defined (used in `.filter`)
     *
     * @param {Object} value value to test
     * @return {boolean} true if value is defined
     */
    function isDefined(value) {
        return value !== undefined;
    }

    /**
     * Mixin for components that support the "icons" and "addClass" extension points.
     * `fileNode` and `directoryNode` support this.
     */
    var extendable = {

        /**
         * Calls the icon providers to get the collection of icons (most likely just one) for
         * the current file or directory.
         *
         * @return {Array.<PreactComponent>} icon components to render
         */
        getIcons: function () {
            let result= [],
                extensions = this.props.extensions;
            if (extensions && extensions.get("icons")) {
                let data = this.getDataForExtension();
                let iconProviders = extensions.get("icons").toArray();
                // the iconProviders list is sorted by priority at insertion
                for(let iconProviderCB of iconProviders){
                    try {
                        let iconResult = iconProviderCB(data);
                        if (iconResult && !Preact.isValidElement(iconResult)) {
                            iconResult = Preact.DOM.span({
                                dangerouslySetInnerHTML: {
                                    __html: $(iconResult)[0].outerHTML
                                }
                            });
                        }
                        // by this point, returns either undefined or a Preact object
                        if(iconResult){
                            result.push(iconResult);
                            break;
                        }
                    } catch (e) {
                        console.error("Exception thrown in FileTreeView icon provider: " + e, e.stack);
                    }
                }
            }

            if (!result || result.length === 0) {
                result = [DOM.ins({
                    className: "jstree-icon"
                }, " ")];
            }
            return result;
        },

        /**
         * Calls the addClass providers to get the classes (in string form) to add for the current
         * file or directory.
         *
         * @param {string} classes Initial classes for this node
         * @return {string} classes for the current node
         */
        getClasses: function (classes) {
            let extensions = this.props.extensions;

            if (extensions && extensions.get("addClass")) {
                let data = this.getDataForExtension();
                let classProviders = extensions.get("addClass").toArray();
                let succeededPriority = null;
                // the classProviders list is sorted by priority at insertion
                for(let classProviderCB of classProviders){
                    if(succeededPriority !== null && (succeededPriority !== classProviderCB.priority)){
                        // we need to append all class of the same priority and break once we shift to lower priority.
                        break;
                    }
                    try{
                        let classResult = classProviderCB(data);
                        if(classResult){
                            classes = classes + " " + classResult;
                            succeededPriority = classProviderCB.priority;
                        }
                    } catch (e) {
                        console.error("Exception thrown in FileTreeView addClass provider: " + e, e.stack);
                    }
                }
            }

            return classes;
        }
    };

    /**
     * @private
     *
     * Component to display a file in the tree.
     *
     * Props:
     * * parentPath: the full path of the directory containing this file
     * * name: the name of the file, including the extension
     * * entry: the object with the relevant metadata for the file (whether it's selected or is the context file)
     * * actions: the action creator responsible for communicating actions the user has taken
     * * extensions: registered extensions for the file tree
     * * forceRender: causes the component to run render
     */
    var fileNode = Preact.createFactory(Preact.createClass({
        mixins: [contextSettable, pathComputer, extendable, dragAndDrop],

        /**
         * Ensures that we always have a state object.
         */
        getInitialState: function () {
            return {
                clickTimer: null
            };
        },

        /**
         * Thanks to immutable objects, we can just do a start object identity check to know
         * whether or not we need to re-render.
         */
        shouldComponentUpdate: function (nextProps, nextState) {
            return nextProps.forceRender ||
                this.props.entry !== nextProps.entry ||
                this.props.extensions !== nextProps.extensions;
        },

        /**
         * If this node is newly selected, scroll it into view. Also, move the selection or
         * context boxes as appropriate.
         */
        componentDidUpdate: function (prevProps, prevState) {
            var wasSelected = prevProps.entry.get("selected"),
                isSelected  = this.props.entry.get("selected");

            if (isSelected && !wasSelected) {
                // TODO: This shouldn't really know about project-files-container
                // directly. It is probably the case that our Preact tree should actually
                // start with project-files-container instead of just the interior of
                // project-files-container and then the file tree will be one self-contained
                // functional unit.
                ViewUtils.scrollElementIntoView($("#project-files-container"), $(Preact.findDOMNode(this)), true);
            } else if (!isSelected && wasSelected && this.state.clickTimer !== null) {
                this.clearTimer();
            }
        },

        clearTimer: function () {
            if (this.state.clickTimer !== null) {
                window.clearTimeout(this.state.clickTimer);
                this.setState({
                    clickTimer: null
                });
            }
        },

        startRename: function () {
            if (!this.props.entry.get("rename")) {
                this.props.actions.startRename(this.myPath());
            }
            this.clearTimer();
        },

        /**
         * When the user clicks on the node, we'll either select it or, if they've clicked twice
         * with a bit of delay in between, we'll invoke the `startRename` action.
         */
        handleClick: function (e) {
            // If we're renaming, allow the click to go through to the rename input.
            if (this.props.entry.get("rename")) {
                e.stopPropagation();
                return;
            }

            if (e.button !== LEFT_MOUSE_BUTTON) {
                return;
            }

            if (this.props.entry.get("selected") && !e.ctrlKey) {
                if (this.state.clickTimer === null && !this.props.entry.get("rename")) {
                    var timer = window.setTimeout(this.startRename, CLICK_RENAME_MINIMUM);
                    this.setState({
                        clickTimer: timer
                    });
                }
            } else {
                var language = LanguageManager.getLanguageForPath(this.myPath()),
                    doNotOpen = false;
                if (language && language.isBinary() && "image" !== language.getId() &&
                        FileUtils.shouldOpenInExternalApplication(
                            FileUtils.getFileExtension(this.myPath()).toLowerCase()
                        )
                    ) {
                    doNotOpen = true;
                }
                this.props.actions.setSelected(this.myPath(), doNotOpen);
            }
            e.stopPropagation();
            e.preventDefault();
        },

        /**
         * select the current node in the file tree on mouse down event on files.
         * This is to increase click responsiveness of file tree.
         */
        selectNode: function (e) {
            if (e.button !== LEFT_MOUSE_BUTTON) {
                return;
            }

            var language = LanguageManager.getLanguageForPath(this.myPath()),
                doNotOpen = false;
            if (language && language.isBinary() && "image" !== language.getId() &&
                FileUtils.shouldOpenInExternalApplication(
                    FileUtils.getFileExtension(this.myPath()).toLowerCase()
                )
            ) {
                doNotOpen = true;
            }
            this.props.actions.setSelected(this.myPath(), doNotOpen);
            render();
        },

        /**
         * When the user double clicks, we will select this file and add it to the working
         * set (via the `selectInWorkingSet` action.)
         */
        handleDoubleClick: function () {
            if (!this.props.entry.get("rename")) {
                if (this.state.clickTimer !== null) {
                    this.clearTimer();
                }
                if (FileUtils.shouldOpenInExternalApplication(
                        FileUtils.getFileExtension(this.myPath()).toLowerCase()
                      )) {
                    this.props.actions.openWithExternalApplication(this.myPath());
                    return;
                }
                this.props.actions.selectInWorkingSet(this.myPath());
            }
        },

        /**
         * Create the data object to pass to extensions.
         *
         * @return {!{name:string, isFile:boolean, fullPath:string}} Data for extensions
         */
        getDataForExtension: function () {
            return {
                name: this.props.name,
                isFile: true,
                fullPath: this.myPath()
            };
        },

        render: function () {
            var fullname = this.props.name,
                extension = LanguageManager.getCompoundFileExtension(fullname),
                name = _getName(fullname, extension);

            // React automatically wraps content in a span element whereas preact doesn't, so do it manually
            if (name) {
                name = DOM.span({}, name);
  