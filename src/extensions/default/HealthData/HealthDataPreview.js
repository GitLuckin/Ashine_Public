
/*
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2015 - 2021 Adobe Systems Incorporated. All rights reserved.
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
 *
 */

define(function (require, exports, module) {

    var _                       = brackets.getModule("thirdparty/lodash"),
        Mustache                = brackets.getModule("thirdparty/mustache/mustache"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        Strings                 = brackets.getModule("strings"),
        Dialogs                 = brackets.getModule("widgets/Dialogs"),
        ExtensionUtils          = brackets.getModule("utils/ExtensionUtils"),
        Metrics                 = brackets.getModule("utils/Metrics"),
        HealthDataPreviewDialog = require("text!htmlContent/healthdata-preview-dialog.html");

    var prefs = PreferencesManager.getExtensionPrefs("healthData");

    ExtensionUtils.loadStyleSheet(module, "styles.css");

    function _buildPreviewData() {
        let content;
        let auditData = Metrics.getLoggedDataForAudit();
        let sortedData = new Map([...auditData.entries()].sort());
        let displayData = [];
        for (const [key, value] of sortedData.entries()) {
            let valueString = "";
            if(value.count > 1) {
                valueString = `(${value.count})`;
            }
            if(value.eventType === Metrics.AUDIT_TYPE_COUNT){
                displayData.push(`${key}  total: ${value.sum} ${valueString}`);
            } else if(value.eventType === Metrics.AUDIT_TYPE_VALUE && value.count !== 0){
                displayData.push(`${key}  avg: ${value.sum/value.count} ${valueString}`);
            }
        }
        content = JSON.stringify(displayData, null, 2);
        content = _.escape(content);
        content = content.replace(/ /g, "&nbsp;");
        content = content.replace(/(?:\r\n|\r|\n)/g, "<br />");
        return content;
    }

    /**
     * Show the dialog for previewing the Health Data that will be sent.
     */
    function previewHealthData() {
        let hdPref   = prefs.get("healthDataTracking"),
            template = Mustache.render(HealthDataPreviewDialog,
                {Strings: Strings, content: _buildPreviewData(), hdPref: hdPref}),
            $template = $(template);

        Dialogs.addLinkTooltips($template);
        Dialogs.showModalDialogUsingTemplate($template).done(function (id) {

            if (id === "save") {
                var newHDPref = $template.find("[data-target]:checkbox").is(":checked");
                if (hdPref !== newHDPref) {
                    prefs.set("healthDataTracking", newHDPref);
                }
            } else if (id === 'clear'){
                Metrics.clearAuditData();
            }
        });
    }

    exports.previewHealthData = previewHealthData;
});