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

define({

    /**
     * Errors
     */
    // Generic strings
    "SYSTEM_DEFAULT": "System Default",
    "PROJECT_BUSY": "Project Operations In Progress",
    "DUPLICATING": "Duplicating {0}",
    "MOVING": "Moving {0}",
    "COPYING": "Copying {0}",
    "DELETING": "Deleting {0}",
    "RENAMING": "Renaming",
    // General file io error strings
    "GENERIC_ERROR": "(error {0})",
    "NOT_FOUND_ERR": "The file/directory could not be found.",
    "NOT_READABLE_ERR": "The file/directory could not be read.",
    "EXCEEDS_MAX_FILE_SIZE": "Files larger than {0} MB cannot be opened in {APP_NAME}.",
    "NO_MODIFICATION_ALLOWED_ERR": "The target directory cannot be modified.",
    "NO_MODIFICATION_ALLOWED_ERR_FILE": "The permissions do not allow you to make modifications.",
    "CONTENTS_MODIFIED_ERR": "The file has been modified outside of {APP_NAME}.",
    "UNSUPPORTED_ENCODING_ERR": "Unknown encoding format",
    "ENCODE_FILE_FAILED_ERR": "{APP_NAME} was not able to encode the contents of file.",
    "DECODE_FILE_FAILED_ERR": "{APP_NAME} was not able to decode the contents of file.",
    "UNSUPPORTED_UTF16_ENCODING_ERR": "{APP_NAME} currently doesn't support UTF-16 encoded text files.",
    "FILE_EXISTS_ERR": "The file or directory already exists.",
    "FILE": "file",
    "FILE_TITLE": "File",
    "DIRECTORY": "directory",
    "DIRECTORY_TITLE": "Directory",
    "DIRECTORY_NAMES_LEDE": "Directory names",
    "FILENAMES_LEDE": "Filenames",
    "FILENAME": "Filename",
    "DIRECTORY_NAME": "Directory Name",

    // Project error strings
    "ERROR_LOADING_PROJECT": "Error Loading Project",
    "OPEN_DIALOG_ERROR": "An error occurred when showing the open file dialog. (error {0})",
    "REQUEST_NATIVE_FILE_SYSTEM_ERROR": "An error occurred when trying to load the directory <span class='dialog-filename'>{0}</span>. (error {1})",
    "READ_DIRECTORY_ENTRIES_ERROR": "An error occurred when reading the contents of the directory <span class='dialog-filename'>{0}</span>. (error {1})",

    // File open/save error string
    "ERROR_OPENING_FILE_TITLE": "Error Opening File",
    "ERROR_OPENING_FILE": "An error occurred when trying to open the file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_OPENING_FILES": "An error occurred when trying to open the following files:",
    "ERROR_RELOADING_FILE_TITLE": "Error Reloading Changes From Disk",
    "ERROR_RELOADING_FILE": "An error occurred when trying to reload the file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_SAVING_FILE_TITLE": "Error Saving File",
    "ERROR_SAVING_FILE": "An error occurred when trying to save the file <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_FILE_TITLE": "Error Renaming {0}",
    "ERROR_RENAMING_FILE": "An error occurred when trying to rename the {2} <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_RENAMING_NOT_IN_PROJECT": "The file or directory is not part of the currently opened project. Unfortunately, only project files can be renamed at this point.",
    "ERROR_MOVING_FILE_TITLE": "Error Moving {0}",
    "ERROR_MOVING_FILE": "An error occurred when trying to move the {2} <span class='dialog-filename'>{0}</span>. {1}",
    "ERROR_MOVING_NOT_IN_PROJECT": "Cannot move the file/folder, as they are not part of the current project.",
    "ERROR_DELETING_FILE_TITLE": "Error Deleting {0}",
    "ERROR_DELETING_FILE": "An error occurred when trying to delete the {2} <span class='dialog-filename'>{0}</span>. {1}",
    "INVALID_FILENAME_TITLE": "Invalid {0}",
    "CANNOT_PASTE_TITLE": "Cannot Paste {0}",
    "CANNOT_DOWNLOAD_TITLE": "Cannot Download {0}",
    "ERR_TYPE_DOWNLOAD_FAILED": "An error occurred while downloading <span class='dialog-filename'>{0}</span>",
    "ERR_TYPE_PASTE_FAILED": "An error occurred while pasting <span class='dialog-filename'>{0}</span> to <span class='dialog-filename'>{1}</span>",
    "CANNOT_DUPLICATE_TITLE": "Cannot Duplicate",
    "ERR_TYPE_DUPLICATE_FAILED": "An error occurred while duplicating <span class='dialog-filename'>{0}</span>",
    "INVALID_FILENAME_MESSAGE": "{0} cannot use any system reserved words, end with dots (.) or use any of the following characters: <code class='emphasized'>{1}</code>",
    "ENTRY_WITH_SAME_NAME_EXISTS": "A file or directory with the name <span class='dialog-filename'>{0}</span> already exists.",
    "ERROR_CREATING_FILE_TITLE": "Error Creating {0}",
    "ERROR_CREATING_FILE": "An error occurred when trying to create the {0} <span class='dialog-filename'>{1}</span>. {2}",
    "ERROR_MIXED_DRAGDROP": "Cannot open a folder at the same time as opening other files.",

    // User key map error strings
    "ERROR_KEYMAP_TITLE": "Error Reading User Key Map",
    "ERROR_KEYMAP_CORRUPT": "Your key map file is not valid JSON. The file will be opened so that you can correct the format.",
    "ERROR_LOADING_KEYMAP": "Your key map file is not a valid UTF-8 encoded text file and cannot be loaded",
    "ERROR_RESTRICTED_COMMANDS": "You cannot reassign shortcuts to these commands: {0}",
    "ERROR_RESTRICTED_SHORTCUTS": "You cannot reassign these shortcuts: {0}",
    "ERROR_MULTIPLE_SHORTCUTS": "You are reassigning multiple shortcuts to these commands: {0}",
    "ERROR_DUPLICATE_SHORTCUTS": "You have multiple bindings of these shortcuts: {0}",
    "ERROR_INVALID_SHORTCUTS": "These shortcuts are invalid: {0}",
    "ERROR_NONEXISTENT_COMMANDS": "You are assigning shortcuts to nonexistent commands: {0}",

    // Application preferences corrupt error strings
    "ERROR_PREFS_CORRUPT_TITLE": "Error Reading Preferences",
    "ERROR_PREFS_CORRUPT": "Your preferences file is not valid JSON. The file will be opened so that you can correct the format. You will need to restart {APP_NAME} for the changes to take effect.",
    "ERROR_PROJ_PREFS_CORRUPT": "Your project preferences file is not valid JSON. The file will be opened so that you can correct the format. You will need to reload the project for the changes to take effect.",

    // Application error strings
    "ERROR_IN_BROWSER_TITLE": "Oops! {APP_NAME} Doesn't Run in Browsers Yet.",
    "ERROR_IN_BROWSER": "{APP_NAME} is built in HTML, but right now it runs as a desktop app so you can use it to edit local files. Please use the application shell in the <b>github.com/adobe/brackets-shell</b> repo to run {APP_NAME}.",

    // ProjectManager max files error string
    "ERROR_MAX_FILES_TITLE": "Error Indexing Files",
    "ERROR_MAX_FILES": "This project contains more than 30,000 files. Features that operate across multiple files may be disabled or behave as if the project is empty. <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>Read more about working with large projects</a>.",

    // Live Preview error strings
    "ERROR_LAUNCHING_BROWSER_TITLE": "Error Launching Browser",
    "ERROR_CANT_FIND_CHROME": "The Google Chrome browser could not be found. Please make sure it is installed.",
    "ERROR_LAUNCHING_BROWSER": "An error occurred when launching the browser. (error {0})",

    "LIVE_DEVELOPMENT_ERROR_TITLE": "Live Preview Error",
    "LIVE_DEVELOPMENT_RELAUNCH_TITLE": "Connecting to Browser",
    "LIVE_DEVELOPMENT_ERROR_MESSAGE": "In order for Live Preview to connect, Chrome needs to be relaunched with remote debugging enabled.<br /><br />Would you like to relaunch Chrome and enable remote debugging?<br /><br />",
    "LIVE_DEV_LOADING_ERROR_MESSAGE": "Unable to load Live Preview page.",
    "LIVE_DEV_NEED_BASEURL_MESSAGE": "To launch live preview with a server-side file, you need to specify a Base URL for this project.",
    "LIVE_DEV_SERVER_NOT_READY_MESSAGE": "Error starting up the HTTP server for live preview files. Please try again.",
    "LIVE_DEVELOPMENT_TROUBLESHOOTING": "For more information, see <a href='{0}' title='{0}'>Troubleshooting Live Preview connection errors</a>.",

    "LIVE_DEV_STATUS_TIP_NOT_CONNECTED": "Live Preview",
    "LIVE_DEV_STATUS_TIP_PROGRESS1": "Live Preview: Connecting\u2026",
    "LIVE_DEV_STATUS_TIP_PROGRESS2": "Live Preview: Initializing\u2026",
    "LIVE_DEV_STATUS_TIP_CONNECTED": "Disconnect Live Preview",
    "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC": "Live Preview",
    "LIVE_DEV_SELECT_FILE_TO_PREVIEW": "Select File To Live Preview",
    "LIVE_DEV_CLICK_TO_RELOAD_PAGE": "Reload Page",
    "LIVE_DEV_TOGGLE_LIVE_HIGHLIGHT": "Toggle Live Preview Highlights",
    "LIVE_DEV_CLICK_POPOUT": "Popout Live Preview To New Window",
    "LIVE_DEV_CLICK_TO_PIN_UNPIN": "Pin on Unpin Preview Page",
    "LIVE_DEV_STATUS_TIP_SYNC_ERROR": "Live Preview (not updating due to syntax error)",

    "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS": "Live Preview was canceled because the browser's developer tools were opened",
    "LIVE_DEV_DETACHED_TARGET_CLOSED": "Live Preview was canceled because the page was closed in the browser",
    "LIVE_DEV_NAVIGATED_AWAY": "Live Preview was canceled because the browser navigated to a page that is not part of the current project",
    "LIVE_DEV_CLOSED_UNKNOWN_REASON": "Live Preview was canceled for an unknown reason ({0})",

    "SAVE_CLOSE_TITLE": "Save Changes",
    "SAVE_CLOSE_MESSAGE": "Do you want to save the changes you made in the document <span class='dialog-filename'>{0}</span>?",
    "SAVE_CLOSE_MULTI_MESSAGE": "Do you want to save your changes to the following files?",
    "EXT_MODIFIED_TITLE": "External Changes",
    "CONFIRM_DELETE_TITLE": "Confirm Delete",
    "CONFIRM_FILE_DELETE": "Are you sure you want to delete the file <span class='dialog-filename'>{0}</span>?",
    "CONFIRM_FOLDER_DELETE": "Are you sure you want to delete the folder <span class='dialog-filename'>{0}</span>?",
    "FILE_DELETED_TITLE": "File Deleted",
    "EXT_MODIFIED_WARNING": "<span class='dialog-filename'>{0}</span> has been modified on disk outside of {APP_NAME}.<br /><br />Do you want to save the file and overwrite those changes?",
    "EXT_MODIFIED_MESSAGE": "<span class='dialog-filename'>{0}</span> has been modified on disk outside of {APP_NAME}, but also has unsaved changes in {APP_NAME}.<br /><br />Which version do you want to keep?",
    "EXT_DELETED_MESSAGE": "<span class='dialog-filename'>{0}</span> has been deleted on disk outside of {APP_NAME}, but has unsaved changes in {APP_NAME}.<br /><br />Do you want to keep your changes?",

    // Window unload warning messages
    "WINDOW_UNLOAD_WARNING": "Are you sure you want to navigate to a different URL and leave Brackets?",
    "WINDOW_UNLOAD_WARNING_WITH_UNSAVED_CHANGES": "You have unsaved changes! Are you sure you want to navigate to a different URL and leave Brackets?",

    // Generic dialog/button labels
    "DONE": "Done",
    "OK": "OK",
    "CANCEL": "Cancel",
    "DONT_SAVE": "Don't Save",
    "SAVE": "Save",
    "SAVE_AS": "Save As\u2026",
    "SAVE_AND_OVERWRITE": "Overwrite",
    "DELETE": "Delete",
    "BUTTON_YES": "Yes",
    "BUTTON_NO": "No",

    // Find, Replace, Find in Files
    "FIND_MATCH_INDEX": "{0} of {1}",
    "FIND_NO_RESULTS": "No results",
    "FIND_QUERY_PLACEHOLDER": "Find\u2026",
    "FIND_HISTORY_MAX_COUNT": "Maximum Number of Search Items in Search History",
    "REPLACE_PLACEHOLDER": "Replace with\u2026",
    "BUTTON_REPLACE_ALL": "Replace All",
    "BUTTON_REPLACE_BATCH": "Batch\u2026",
    "BUTTON_REPLACE_ALL_IN_FILES": "Replace\u2026",
    "BUTTON_REPLACE": "Replace",
    "BUTTON_NEXT": "\u25B6",
    "BUTTON_PREV": "\u25C0",
    "BUTTON_NEXT_HINT": "Next Match",
    "BUTTON_PREV_HINT": "Previous Match",
    "BUTTON_CASESENSITIVE_HINT": "Match Case",
    "BUTTON_REGEXP_HINT": "Regular Expression",
    "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "Replace Without Undo",
    "REPLACE_WITHOUT_UNDO_WARNING": "Because more than {0} files need to be changed, {APP_NAME} will modify unopened files on disk.<br />You won't be able to undo replacements in those files.",
    "BUTTON_REPLACE_WITHOUT_UNDO": "Replace Without Undo",

    "OPEN_FILE": "Open File",
    "SAVE_FILE_AS": "Save File",
    "CHOOSE_FOLDER": "Choose a folder",

    "RELEASE_NOTES": "Release Notes",
    "NO_UPDATE_TITLE": "You're Up to Date!",
    "NO_UPDATE_MESSAGE": "You are running the latest version of {APP_NAME}.",

    // Find and Replace
    "FIND_REPLACE_TITLE_LABEL": "Replace",
    "FIND_REPLACE_TITLE_WITH": "with",
    "FIND_TITLE_LABEL": "Found",
    "FIND_TITLE_SUMMARY": "&mdash; {0} {1} {2} in {3}",

    // Find in Files
    "FIND_NUM_FILES": "{0} {1}",
    "FIND_IN_FILES_SCOPED": "in <span class='dialog-filename'>{0}</span>",
    "FIND_IN_FILES_NO_SCOPE": "in project",
    "FIND_IN_FILES_ZERO_FILES": "Filter excludes all files {0}",
    "FIND_IN_FILES_FILE": "file",
    "FIND_IN_FILES_FILES": "files",
    "FIND_IN_FILES_MATCH": "match",
    "FIND_IN_FILES_MATCHES": "matches",
    "FIND_IN_FILES_MORE_THAN": "Over ",
    "FIND_IN_FILES_PAGING": "{0}&mdash;{1}",
    "FIND_IN_FILES_FILE_PATH": "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>", // We should use normal dashes on Windows instead of em dash eventually
    "FIND_IN_FILES_EXPAND_COLLAPSE": "Ctrl/Cmd click to expand/collapse all",
    "FIND_IN_FILES_INDEXING": "Indexing for Instant Search\u2026",
    "FIND_IN_FILES_INDEXING_PROGRESS": "Indexing {0} of {1} files for Instant Search\u2026",
    "REPLACE_IN_FILES_ERRORS_TITLE": "Replace Errors",
    "REPLACE_IN_FILES_ERRORS": "The following files weren't modified because they changed after the search or couldn't be written.",

    "ERROR_FETCHING_UPDATE_INFO_TITLE": "Error Getting Update Info",
    "ERROR_FETCHING_UPDATE_INFO_MSG": "There was a problem getting the latest update information from the server. Please make sure you are connected to the Internet and try again.",

    // File exclusion filters
    "NEW_FILE_FILTER": "New Exclusion Set\u2026",
    "CLEAR_FILE_FILTER": "Don't Exclude Files",
    "NO_FILE_FILTER": "No Files Excluded",
    "EXCLUDE_FILE_FILTER": "Exclude {0}",
    "EDIT_FILE_FILTER": "Edit\u2026",
    "FILE_FILTER_DIALOG": "Edit Exclusion Set",
    "FILE_FILTER_INSTRUCTIONS": "Exclude files and folders matching any of the following strings / substrings or <a href='{0}' title='{0}'>wildcards</a>. Enter each string on a new line.",
    "FILTER_NAME_PLACEHOLDER": "Name this exclusion set (optional)",
    "FILTER_NAME_REMAINING": "{0} characters remaining",
    "FILE_FILTER_CLIPPED_SUFFIX": "and {0} more",
    "FILTER_COUNTING_FILES": "Counting files\u2026",
    "FILTER_FILE_COUNT": "Allows {0} of {1} files {2}",
    "FILTER_FILE_COUNT_ALL": "Allows all {0} files {1}",

    // Quick Edit
    "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND": "No Quick Edit available for current cursor position",
    "ERROR_CSSQUICKEDIT_BETWEENCLASSES": "CSS Quick Edit: place cursor on a single class name",
    "ERROR_CSSQUICKEDIT_CLASSNOTFOUND": "CSS Quick Edit: incomplete class attribute",
    "ERROR_CSSQUICKEDIT_IDNOTFOUND": "CSS Quick Edit: incomplete id attribute",
    "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR": "CSS Quick Edit: place cursor in tag, class, or id",
    "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX": "CSS Timing Function Quick Edit: invalid syntax",
    "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND": "JS Quick Edit: place cursor in function name",

    // Quick Docs
    "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND": "No Quick Docs available for current cursor position",

    /**
     * ProjectManager
     */
    "PROJECT_LOADING": "Loading\u2026",
    "UNTITLED": "Untitled",
    "WORKING_FILES": "Working Files",

    /**
     * MainViewManager
     */
    "TOP": "Top",
    "BOTTOM": "Bottom",
    "LEFT": "Left",
    "RIGHT": "Right",

    "CMD_SPLITVIEW_NONE": "No Split",
    "CMD_SPLITVIEW_VERTICAL": "Vertical Split",
    "CMD_SPLITVIEW_HORIZONTAL": "Horizontal Split",
    "SPLITVIEW_MENU_TOOLTIP": "Split the editor vertically or horizontally",
    "GEAR_MENU_TOOLTIP": "Configure Working Set",

    "SPLITVIEW_INFO_TITLE": "Already Open",
    "SPLITVIEW_MULTIPANE_WARNING": "The file is already open in another pane. {APP_NAME} will soon support opening the same file in more than one pane. Until then, the file will be shown in the pane it's already open in.<br /><br />(You'll only see this message once.)",

    /**
     * Keyboard modifiers and special key names
     */
    "KEYBOARD_CTRL": "Ctrl",
    "KEYBOARD_CTRL_DO_NOT_TRANSLATE": "true",
    "KEYBOARD_SHIFT": "Shift",
    "KEYBOARD_SHIFT_DO_NOT_TRANSLATE": "true",
    "KEYBOARD_SPACE": "Space",
    "KEYBOARD_SPACE_DO_NOT_TRANSLATE": "true",
    "KEYBOARD_PAGE_UP": "Page Up",
    "KEYBOARD_PAGE_UP_DO_NOT_TRANSLATE": "true",
    "KEYBOARD_PAGE_DOWN": "Page Down",
    "KEYBOARD_PAGE_DOWN_DO_NOT_TRANSLATE": "true",
    "KEYBOARD_HOME": "Home",
    "KEYBOARD_HOME_DO_NOT_TRANSLATE": "true",
    "KEYBOARD_END": "End",
    "KEYBOARD_END_DO_NOT_TRANSLATE": "true",
    "KEYBOARD_INSERT": "Insert",
    "KEYBOARD_INSERT_DO_NOT_TRANSLATE": "true",
    "KEYBOARD_DELETE": "Delete",
    "KEYBOARD_DELETE_DO_NOT_TRANSLATE": "true",

    /**
     * StatusBar strings
     */
    "STATUSBAR_CURSOR_POSITION": "Line {0}, Column {1}",
    "STATUSBAR_SELECTION_CH_SINGULAR": " \u2014 Selected {0} column",
    "STATUSBAR_SELECTION_CH_P