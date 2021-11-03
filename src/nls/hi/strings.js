/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
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
  "SYSTEM_DEFAULT": "प्रणालीगत चूक",
  "PROJECT_BUSY": "परियोजना संचालन प्रगति पर",
  "DUPLICATING": "डुप्लीकेटिंग {0}",
  "MOVING": "चल रहा है {0}",
  "COPYING": "{0} कॉपी किया जा रहा है",
  "DELETING": "{0} को हटाया जा रहा है",
  "RENAMING": "नाम",
  "GENERIC_ERROR": "(त्रुटि {0})",
  "NOT_FOUND_ERR": "फ़ाइल/निर्देशिका नहीं मिली।",
  "NOT_READABLE_ERR": "फ़ाइल/निर्देशिका को पढ़ा नहीं जा सका।",
  "EXCEEDS_MAX_FILE_SIZE": "{APP_NAME} में {0}MB से बड़ी फ़ाइलें नहीं खोली जा सकतीं।",
  "NO_MODIFICATION_ALLOWED_ERR": "लक्ष्य निर्देशिका को संशोधित नहीं किया जा सकता है।",
  "NO_MODIFICATION_ALLOWED_ERR_FILE": "अनुमतियाँ आपको संशोधन करने की अनुमति नहीं देती हैं।",
  "CONTENTS_MODIFIED_ERR": "फ़ाइल को {APP_NAME} के बाहर संशोधित किया गया है।",
  "UNSUPPORTED_ENCODING_ERR": "अज्ञात एन्कोडिंग प्रारूप",
  "ENCODE_FILE_FAILED_ERR": "{APP_NAME} फ़ाइल की सामग्री को एन्कोड करने में सक्षम नहीं था।",
  "DECODE_FILE_FAILED_ERR": "{APP_NAME} फ़ाइल की सामग्री को डीकोड करने में सक्षम नहीं था।",
  "UNSUPPORTED_UTF16_ENCODING_ERR": "{APP_NAME} वर्तमान में UTF-16 एन्कोडेड टेक्स्ट फ़ाइलों का समर्थन नहीं करता है।",
  "FILE_EXISTS_ERR": "फ़ाइल या निर्देशिका पहले से मौजूद है।",
  "FILE": "फ़ाइल",
  "FILE_TITLE": "फ़ाइल",
  "DIRECTORY": "निर्देशिका",
  "DIRECTORY_TITLE": "निर्देशिका",
  "DIRECTORY_NAMES_LEDE": "निर्देशिका नाम",
  "FILENAMES_LEDE": "फ़ाइल नाम",
  "FILENAME": "फ़ाइल का नाम",
  "DIRECTORY_NAME": "निर्देशिका का नाम",
  "ERROR_LOADING_PROJECT": "प्रोजेक्ट लोड करने में त्रुटि",
  "OPEN_DIALOG_ERROR": "फ़ाइल खोलें संवाद दिखाते समय कोई त्रुटि उत्पन्न हुई। (त्रुटि {0})",
  "REQUEST_NATIVE_FILE_SYSTEM_ERROR": "निर्देशिका <span class='dialog-filename'>{0}</span> को लोड करने का प्रयास करते समय एक त्रुटि उत्पन्न हुई। (त्रुटि {1})",
  "READ_DIRECTORY_ENTRIES_ERROR": "निर्देशिका <span class='dialog-filename'>{0}</span> की सामग्री को पढ़ते समय एक त्रुटि उत्पन्न हुई। (त्रुटि {1})",
  "ERROR_OPENING_FILE_TITLE": "फ़ाइल खोलने में त्रुटि",
  "ERROR_OPENING_FILE": "फ़ाइल को खोलने का प्रयास करते समय एक त्रुटि हुई <span class='dialog-filename'>{0}</span> . {1}",
  "ERROR_OPENING_FILES": "निम्न फ़ाइलें खोलने का प्रयास करते समय कोई त्रुटि उत्पन्न हुई:",
  "ERROR_RELOADING_FILE_TITLE": "डिस्क से परिवर्तन पुनः लोड करने में त्रुटि",
  "ERROR_RELOADING_FILE": "फ़ाइल <span class='dialog-filename'>{0}</span> को पुनः लोड करने का प्रयास करते समय एक त्रुटि उत्पन्न हुई। {1}",
  "ERROR_SAVING_FILE_TITLE": "फ़ाइल सहेजने में त्रुटि",
  "ERROR_SAVING_FILE": "फ़ाइल को सहेजने का प्रयास करते समय एक त्रुटि हुई <span class='dialog-filename'>{0}</span> . {1}",
  "ERROR_RENAMING_FILE_TITLE": "नाम बदलने में त्रुटि {0}",
  "ERROR_RENAMING_FILE": "{2} <span class='dialog-filename'>{0}</span> का नाम बदलने का प्रयास करते समय एक त्रुटि उत्पन्न हुई। {1}",
  "ERROR_RENAMING_NOT_IN_PROJECT": "फ़ाइल या निर्देशिका वर्तमान में खोले गए प्रोजेक्ट का हिस्सा नहीं है। दुर्भाग्य से, इस बिंदु पर केवल प्रोजेक्ट फ़ाइलों का नाम बदला जा सकता है।",
  "ERROR_MOVING_FILE_TITLE": "स्थानांतरित करने में त्रुटि {0}",
  "ERROR_MOVING_FILE": "{2} <span class='dialog-filename'>{0}</span> को स्थानांतरित करने का प्रयास करते समय एक त्रुटि उत्पन्न हुई। {1}",
  "ERROR_MOVING_NOT_IN_PROJECT": "फ़ाइल/फ़ोल्डर को स्थानांतरित नहीं किया जा सकता, क्योंकि वे वर्तमान प्रोजेक्ट का हिस्सा नहीं हैं।",
  "ERROR_DELETING_FILE_TITLE": "{0} को हटाने में त्रुटि",
  "ERROR_DELETING_FILE": "{2} <span class='dialog-filename'>{0}</span> को हटाने का प्रयास करते समय एक त्रुटि उत्पन्न हुई। {1}",
  "INVALID_FILENAME_TITLE": "अमान्य {0}",
  "CANNOT_PASTE_TITLE": "चिपकाया नहीं जा सकता {0}",
  "CANNOT_DOWNLOAD_TITLE": "{0} डाउनलोड नहीं कर सकता",
  "ERR_TYPE_DOWNLOAD_FAILED": "<span class='dialog-filename'>{0}</span> को डाउनलोड करते समय एक त्रुटि हुई",
  "ERR_TYPE_PASTE_FAILED": "<span class='dialog-filename'>{0}</span> से <span class='dialog-filename'>{1}</span> को चिपकाते समय एक त्रुटि हुई",
  "CANNOT_DUPLICATE_TITLE": "नकल नहीं कर सकते",
  "ERR_TYPE_DUPLICATE_FAILED": "<span class='dialog-filename'>{0}</span> की नकल करते समय एक त्रुटि हुई",
  "INVALID_FILENAME_MESSAGE": "{0} किसी भी सिस्टम आरक्षित शब्दों का उपयोग नहीं कर सकता, बिंदुओं (.) के साथ समाप्त हो सकता है या निम्न में से किसी भी वर्ण का उपयोग नहीं कर सकता: <code class='emphasized'>{1}</code>",
  "ENTRY_WITH_SAME_NAME_EXISTS": "<span class='dialog-filename'>{0}</span> नाम की फ़ाइल या निर्देशिका पहले से मौजूद है।",
  "ERROR_CREATING_FILE_TITLE": "बनाने में त्रुटि {0}",
  "ERROR_CREATING_FILE": "{0} <span class='dialog-filename'>{1}</span> बनाने का प्रयास करते समय एक त्रुटि उत्पन्न हुई। {2}",
  "ERROR_MIXED_DRAGDROP": "एक ही समय में अन्य फाइलों को खोलने के रूप में एक फ़ोल्डर नहीं खोल सकता।",
  "ERROR_KEYMAP_TITLE": "उपयोगकर्ता कुंजी मानचित्र पढ़ने में त्रुटि",
  "ERROR_KEYMAP_CORRUPT": "आपकी मुख्य मानचित्र फ़ाइल मान्य JSON नहीं है। फ़ाइल खोली जाएगी ताकि आप प्रारूप को सही कर सकें।",
  "ERROR_LOADING_KEYMAP": "आपकी मुख्य मानचित्र फ़ाइल एक मान्य UTF-8 एन्कोडेड टेक्स्ट फ़ाइल नहीं है और इसे लोड नहीं किया जा सकता",
  "ERROR_RESTRICTED_COMMANDS": "आप इन आदेशों के लिए शॉर्टकट पुन: असाइन नहीं कर सकते: {0}",
  "ERROR_RESTRICTED_SHORTCUTS": "आप इन शॉर्टकट को पुन: असाइन नहीं कर सकते: {0}",
  "ERROR_MULTIPLE_SHORTCUTS": "आप इन आदेशों के लिए अनेक शॉर्टकट पुन: असाइन कर रहे हैं: {0}",
  "ERROR_DUPLICATE_SHORTCUTS": "आपके पास इन शॉर्टकट्स की अनेक बाइंडिंग हैं: {0}",
  "ERROR_INVALID_SHORTCUTS": "ये शॉर्टकट अमान्य हैं: {0}",
  "ERROR_NONEXISTENT_COMMANDS": "आप गैर-मौजूद आदेशों के लिए शॉर्टकट निर्दिष्ट कर रहे हैं: {0}",
  "ERROR_PREFS_CORRUPT_TITLE": "वरीयताएँ पढ़ने में त्रुटि",
  "ERROR_PREFS_CORRUPT": "आपकी वरीयता फ़ाइल मान्य JSON नहीं है। फ़ाइल खोली जाएगी ताकि आप प्रारूप को सही कर सकें। परिवर्तनों को प्रभावी करने के लिए आपको {APP_NAME} को फिर से शुरू करना होगा।",
  "ERROR_PROJ_PREFS_CORRUPT": "आपकी परियोजना वरीयता फ़ाइल मान्य JSON नहीं है। फ़ाइल खोली जाएगी ताकि आप प्रारूप को सही कर सकें। परिवर्तनों को प्रभावी करने के लिए आपको प्रोजेक्ट को फिर से लोड करना होगा।",
  "ERROR_IN_BROWSER_TITLE": "उफ़! {APP_NAME} अभी तक ब्राउज़र में नहीं चलता है।",
  "ERROR_IN_BROWSER": "{APP_NAME} HTML में बनाया गया है, लेकिन अभी यह एक डेस्कटॉप ऐप के रूप में चलता है ताकि आप इसका उपयोग स्थानीय फ़ाइलों को संपादित करने के लिए कर सकें। {APP_NAME} को चलाने के लिए कृपया <b>github.com/adobe/brackets-shell</b> रेपो में एप्लिकेशन शेल का उपयोग करें।",
  "ERROR_MAX_FILES_TITLE": "फ़ाइलों को अनुक्रमित करने में त्रुटि",
  "ERROR_MAX_FILES": "इस परियोजना में 30,000 से अधिक फाइलें हैं। कई फाइलों में काम करने वाली सुविधाओं को अक्षम किया जा सकता है या ऐसा व्यवहार किया जा सकता है जैसे कि प्रोजेक्ट खाली है। <a href='https://github.com/adobe/brackets/wiki/Large-Projects'>बड़ी परियोजनाओं के साथ काम करने के बारे में और पढ़ें</a> ।",
  "ERROR_LAUNCHING_BROWSER_TITLE": "ब्राउज़र लॉन्च करने में त्रुटि",
  "ERROR_CANT_FIND_CHROME": "गूगल क्रोम ब्राउज़र नहीं मिला। कृपया सुनिश्चित करें कि यह स्थापित है।",
  "ERROR_LAUNCHING_BROWSER": "ब्राउज़र लॉन्च करते समय एक त्रुटि हुई। (त्रुटि {0})",
  "LIVE_DEVELOPMENT_ERROR_TITLE": "लाइव पूर्वावलोकन त्रुटि",
  "LIVE_DEVELOPMENT_RELAUNCH_TITLE": "ब्राउज़र से जुड़ना",
  "LIVE_DEVELOPMENT_ERROR_MESSAGE": "कनेक्ट करने के लिए लाइव पूर्वावलोकन के लिए, क्रोम को दूरस्थ डिबगिंग सक्षम के साथ फिर से लॉन्च करने की आवश्यकता है।<br /><br /> क्‍या आप Chrome को पुन: लॉन्‍च करना और दूरस्थ डीबगिंग सक्षम करना चाहते हैं?<br /><br />",
  "LIVE_DEV_LOADING_ERROR_MESSAGE": "लाइव पूर्वावलोकन पृष्ठ लोड करने में असमर्थ.",
  "LIVE_DEV_NEED_BASEURL_MESSAGE": "सर्वर-साइड फ़ाइल के साथ लाइव पूर्वावलोकन लॉन्च करने के लिए, आपको इस प्रोजेक्ट के लिए एक आधार URL निर्दिष्ट करना होगा।",
  "LIVE_DEV_SERVER_NOT_READY_MESSAGE": "लाइव पूर्वावलोकन फ़ाइलों के लिए HTTP सर्वर प्रारंभ करने में त्रुटि. कृपया पुन: प्रयास करें।",
  "LIVE_DEVELOPMENT_TROUBLESHOOTING": "अधिक जानकारी के लिए, <a href='{0}' title=\"{0}\">लाइव पूर्वावलोकन कनेक्शन त्रुटियों का समस्या निवारण</a> देखें।",
  "LIVE_DEV_STATUS_TIP_NOT_CONNECTED": "सजीव पूर्वावलोकन",
  "LIVE_DEV_STATUS_TIP_PROGRESS1": "लाइव पूर्वावलोकन: कनेक्ट हो रहा है…",
  "LIVE_DEV_STATUS_TIP_PROGRESS2": "लाइव पूर्वावलोकन: प्रारंभ किया जा रहा है...",
  "LIVE_DEV_STATUS_TIP_CONNECTED": "लाइव पूर्वावलोकन डिस्कनेक्ट करें",
  "LIVE_DEV_STATUS_TIP_OUT_OF_SYNC": "सजीव पूर्वावलोकन",
  "LIVE_DEV_SELECT_FILE_TO_PREVIEW": "लाइव पूर्वावलोकन के लिए फ़ाइल का चयन करें",
  "LIVE_DEV_CLICK_TO_RELOAD_PAGE": "पृष्ठ पुनः लोड करें",
  "LIVE_DEV_TOGGLE_LIVE_HIGHLIGHT": "लाइव पूर्वावलोकन हाइलाइट्स को टॉगल करें",
  "LIVE_DEV_CLICK_POPOUT": "नई विंडो में पॉपआउट लाइव पूर्वावलोकन",
  "LIVE_DEV_CLICK_TO_PIN_UNPIN": "पूर्वावलोकन पृष्ठ को अनपिन करें पर पिन करें",
  "LIVE_DEV_STATUS_TIP_SYNC_ERROR": "लाइव पूर्वावलोकन (सिंटैक्स त्रुटि के कारण अपडेट नहीं हो रहा है)",
  "LIVE_DEV_DETACHED_REPLACED_WITH_DEVTOOLS": "लाइव पूर्वावलोकन रद्द कर दिया गया क्योंकि ब्राउज़र के डेवलपर टूल खोले गए थे",
  "LIVE_DEV_DETACHED_TARGET_CLOSED": "लाइव पूर्वावलोकन रद्द कर दिया गया क्योंकि पृष्ठ ब्राउज़र में बंद था",
  "LIVE_DEV_NAVIGATED_AWAY": "लाइव पूर्वावलोकन रद्द कर दिया गया था क्योंकि ब्राउज़र एक ऐसे पृष्ठ पर नेविगेट करता है जो वर्तमान प्रोजेक्ट का हिस्सा नहीं है",
  "LIVE_DEV_CLOSED_UNKNOWN_REASON": "किसी अज्ञात कारण से लाइव पूर्वावलोकन रद्द कर दिया गया था ({0})",
  "SAVE_CLOSE_TITLE": "परिवर्तनों को सुरक्षित करें",
  "SAVE_CLOSE_MESSAGE": "क्या आप दस्तावेज़ में किए गए परिवर्तनों को सहेजना चाहते हैं <span class='dialog-filename'>{0}</span> ?",
  "SAVE_CLOSE_MULTI_MESSAGE": "क्या आप अपने परिवर्तनों को निम्न फाइलों में सहेजना चाहते हैं?",
  "EXT_MODIFIED_TITLE": "बाहरी परिवर्तन",
  "CONFIRM_DELETE_TITLE": "हटाने की पुष्टि करें",
  "CONFIRM_FILE_DELETE": "क्या आप वाकई फ़ाइल <span class='dialog-filename'>{0}</span> को हटाना चाहते हैं?",
  "CONFIRM_FOLDER_DELETE": "क्या आप वाकई <span class='dialog-filename'>{0}</span> फ़ोल्डर को हटाना चाहते हैं?",
  "FILE_DELETED_TITLE": "फ़ाइल हटाई गई",
  "EXT_MODIFIED_WARNING": "<span class='dialog-filename'>{0}</span> को {APP_NAME} के बाहर डिस्क पर संशोधित किया गया है।<br /><br /> क्या आप फ़ाइल को सहेजना और उन परिवर्तनों को अधिलेखित करना चाहते हैं?",
  "EXT_MODIFIED_MESSAGE": "<span class='dialog-filename'>{0}</span> को {APP_NAME} के बाहर डिस्क पर संशोधित किया गया है, लेकिन {APP_NAME} में भी सहेजे नहीं गए परिवर्तन हैं।<br /><br /> आप कौन सा संस्करण रखना चाहते हैं?",
  "EXT_DELETED_MESSAGE": "<span class='dialog-filename'>{0}</span> को {APP_NAME} के बाहर डिस्क पर हटा दिया गया है, लेकिन {APP_NAME} में सहेजे नहीं गए परिवर्तन हैं।<br /><br /> क्या आप अपने परिवर्तन रखना चाहते हैं?",
  "WINDOW_UNLOAD_WARNING": "क्या आप वाकई किसी भिन्न URL पर नेविगेट करना चाहते हैं और ब्रैकेट छोड़ना चाहते हैं?",
  "WINDOW_UNLOAD_WARNING_WITH_UNSAVED_CHANGES": "आपके पास सहेजे नहीं गए परिवर्तन हैं! क्या आप वाकई किसी भिन्न URL पर नेविगेट करना चाहते हैं और ब्रैकेट छोड़ना चाहते हैं?",
  "DONE": "पूर्ण",
  "OK": "ठीक है",
  "CANCEL": "रद्द करना",
  "DONT_SAVE": "सेव न करें",
  "SAVE": "बचाना",
  "SAVE_AS": "के रूप रक्षित करें…",
  "SAVE_AND_OVERWRITE": "ओवरराइट",
  "DELETE": "मिटाना",
  "BUTTON_YES": "हाँ",
  "BUTTON_NO": "नहीं",
  "FIND_MATCH_INDEX": "{1} में से {0}",
  "FIND_NO_RESULTS": "कोई परिणाम नहीं",
  "FIND_QUERY_PLACEHOLDER": "पाना…",
  "FIND_HISTORY_MAX_COUNT": "खोज इतिहास में खोज मदों की अधिकतम संख्या",
  "REPLACE_PLACEHOLDER": "के साथ बदलें…",
  "BUTTON_REPLACE_ALL": "सबको बदली करें",
  "BUTTON_REPLACE_BATCH": "बैच…",
  "BUTTON_REPLACE_ALL_IN_FILES": "बदलने के…",
  "BUTTON_REPLACE": "बदलने के",
  "BUTTON_NEXT": "मैं",
  "BUTTON_PREV": "मैं",
  "BUTTON_NEXT_HINT": "अगला मिलान",
  "BUTTON_PREV_HINT": "पिछला मैच",
  "BUTTON_CASESENSITIVE_HINT": "माचिस की डिबिया",
  "BUTTON_REGEXP_HINT": "नियमित अभिव्यक्ति",
  "REPLACE_WITHOUT_UNDO_WARNING_TITLE": "पूर्ववत किए बिना बदलें",
  "REPLACE_WITHOUT_UNDO_WARNING": "क्योंकि {0} से अधिक फ़ाइलों को बदलने की आवश्यकता है, {APP_NAME} डिस्क पर न खोली गई फ़ाइलों को संशोधित करेगा।<br /> आप उन फ़ाइलों में प्रतिस्थापन पूर्ववत नहीं कर पाएंगे।",
  "BUTTON_REPLACE_WITHOUT_UNDO": "पूर्ववत किए बिना बदलें",
  "OPEN_FILE": "खुली फाइल",
  "SAVE_FILE_AS": "फाइल सुरक्षित करें",
  "CHOOSE_FOLDER": "एक फ़ोल्डर चुनें",
  "RELEASE_NOTES": "रिलीज नोट्स",
  "NO_UPDATE_TITLE": "आप अप टू डेट हैं!",
  "NO_UPDATE_MESSAGE": "आप {APP_NAME} का नवीनतम संस्करण चला रहे हैं।",
  "FIND_REPLACE_TITLE_LABEL": "बदलने के",
  "FIND_REPLACE_TITLE_WITH": "साथ",
  "FIND_TITLE_LABEL": "मिल गया",
  "FIND_TITLE_SUMMARY": "&mdash; {0} {1} {2} {3} में",
  "FIND_NUM_FILES": "{0} {1}",
  "FIND_IN_FILES_SCOPED": "में <span class='dialog-filename'>{0}</span>",
  "FIND_IN_FILES_NO_SCOPE": "परियोजना में",
  "FIND_IN_FILES_ZERO_FILES": "फ़िल्टर में सभी फ़ाइलें शामिल नहीं हैं {0}",
  "FIND_IN_FILES_FILE": "फ़ाइल",
  "FIND_IN_FILES_FILES": "फ़ाइलें",
  "FIND_IN_FILES_MATCH": "मिलान",
  "FIND_IN_FILES_MATCHES": "माचिस",
  "FIND_IN_FILES_MORE_THAN": "ऊपर",
  "FIND_IN_FILES_PAGING": "{0}&mdash;{1}",
  "FIND_IN_FILES_FILE_PATH": "<span class='dialog-filename'>{0}</span> {2} <span class='dialog-path'>{1}</span>",
  "FIND_IN_FILES_EXPAND_COLLAPSE": "Ctrl/Cmd सभी को विस्तृत/संक्षिप्त करने के लिए क्लिक करें",
  "FIND_IN_FILES_INDEXING": "त्वरित खोज के लिए अनुक्रमणित किया जा रहा है…",
  "FIND_IN_FILES_INDEXING_PROGRESS": "तत्काल खोज के लिए {1} फाइलों में से {0} को अनुक्रमित किया जा रहा है…",
  "REPLACE_IN_FILES_ERRORS_TITLE": "त्रुटियों को बदलें",
  "REPLACE_IN_FILES_ERRORS": "निम्न फ़ाइलें संशोधित नहीं की गईं क्योंकि वे खोज के बाद बदल गईं या लिखी नहीं जा सकीं।",
  "ERROR_FETCHING_UPDATE_INFO_TITLE": "अद्यतन जानकारी प्राप्त करने में त्रुटि",
  "ERROR_FETCHING_UPDATE_INFO_MSG": "सर्वर से नवीनतम अद्यतन जानकारी प्राप्त करने में एक समस्या थी। कृपया सुनिश्चित करें कि आप इंटरनेट से कनेक्ट हैं और पुनः प्रयास करें।",
  "NEW_FILE_FILTER": "नया बहिष्करण सेट…",
  "CLEAR_FILE_FILTER": "फ़ाइलें बहिष्कृत न करें",
  "NO_FILE_FILTER": "कोई फ़ाइल बहिष्कृत नहीं",
  "EXCLUDE_FILE_FILTER": "बहिष्कृत करें {0}",
  "EDIT_FILE_FILTER": "संपादन करना…",
  "FILE_FILTER_DIALOG": "बहिष्करण सेट संपादित करें",
  "FILE_FILTER_INSTRUCTIONS": "निम्नलिखित में से किसी भी स्ट्रिंग / सबस्ट्रिंग या <a href='{0}' title=\"{0}\">वाइल्डकार्ड</a> से मेल खाने वाली फ़ाइलों और फ़ोल्डरों को बाहर करें। प्रत्येक स्ट्रिंग को एक नई लाइन पर दर्ज करें।",
  "FILTER_NAME_PLACEHOLDER": "इस बहिष्करण सेट को नाम दें (वैकल्पिक)",
  "FILTER_NAME_REMAINING": "{0} वर्ण शेष",
  "FILE_FILTER_CLIPPED_SUFFIX": "और {0} और",
  "FILTER_COUNTING_FILES": "फ़ाइलों की गणना की जा रही है…",
  "FILTER_FILE_COUNT": "{1} में से {0} फ़ाइलों को {2} की अनुमति देता है",
  "FILTER_FILE_COUNT_ALL": "सभी {0} फ़ाइलों को {1} की अनुमति देता है",
  "ERROR_QUICK_EDIT_PROVIDER_NOT_FOUND": "वर्तमान कर्सर स्थिति के लिए कोई त्वरित संपादन उपलब्ध नहीं है",
  "ERROR_CSSQUICKEDIT_BETWEENCLASSES": "CSS क्विक एडिट: कर्सर को सिंगल क्लास के नाम पर रखें",
  "ERROR_CSSQUICKEDIT_CLASSNOTFOUND": "सीएसएस त्वरित संपादन: अपूर्ण वर्ग विशेषता",
  "ERROR_CSSQUICKEDIT_IDNOTFOUND": "सीएसएस त्वरित संपादन: अपूर्ण आईडी विशेषता",
  "ERROR_CSSQUICKEDIT_UNSUPPORTEDATTR": "CSS क्विक एडिट: कर्सर को टैग, क्लास या आईडी में रखें",
  "ERROR_TIMINGQUICKEDIT_INVALIDSYNTAX": "CSS टाइमिंग फ़ंक्शन त्वरित संपादन: अमान्य सिंटैक्स",
  "ERROR_JSQUICKEDIT_FUNCTIONNOTFOUND": "जेएस त्वरित संपादन: कर्सर को फ़ंक्शन नाम में रखें",
  "ERROR_QUICK_DOCS_PROVIDER_NOT_FOUND": "वर्तमान कर्सर स्थिति के लिए कोई त्वरित दस्तावेज़ उपलब्ध नहीं है",
  "PROJECT_LOADING": "लोड हो रहा है…",
  "UNTITLED": "शीर्षकहीन",
  "WORKING_FILES": "कार्य फ़ाइलें",
  "TOP": "ऊपर",
  "BOTTOM": "नीचे",
  "LEFT": "बाएं",
  "RIGHT": "सही",
  "CMD_SPLITVIEW_NONE": "विभाजित नहीं",
  "CMD_SPLITVIEW_VERTICAL": "लंबवत विभाजन",
  "CMD_SPLITVIEW_HORIZONTAL": "क्षैतिज विभाजन",
  "SPLITVIEW_MENU_TOOLTIP": "संपादक को लंबवत या क्षैतिज रूप से विभाजित करें",
  "GEAR_MENU_TOOLTIP": "कार्य सेट कॉन्फ़िगर करें",
  "SPLITVIEW_INFO_TITLE": "पहले से ही खुला",
  "SPLITVIEW_MULTIPANE_WARNING": "फ़ाइल पहले से ही दूसरे फलक में खुली है। {APP_NAME} जल्द ही एक ही फ़ाइल को एक से अधिक फलकों में खोलने का समर्थन करेगा। तब तक, फ़ाइल उस फलक में दिखाई देगी जिसमें वह पहले से खुली है।<br /><br /> (आप इस संदेश को केवल एक बार देखेंगे।)",
  "STATUSBAR_CURSOR_POSITION": "लाइन {0}, कॉलम {1}",
  "STATUSBAR_SELECTION_CH_SINGULAR": " — चयनित {0} कॉलम",
  "STATUSBAR_SELECTION_CH_PLURAL": " — चयनित {0} कॉलम",
  "STATUSBAR_SELECTION_LINE_SINGULAR": " — चयनित {0} लाइन",
  "STATUSBAR_SELECTION_LINE_PLURAL": " — चयनित {0} पंक्तियाँ",
  "STATUSBAR_SELECTION_MULTIPLE": " — {0} चयन",
  "STATUSBAR_INDENT_TOOLTIP_SPACES": "इंडेंटेशन को रिक्त स्थान पर स्विच करने के लिए क्लिक करें",
  "STATUSBAR_INDENT_TOOLTIP_TABS": "इंडेंटेशन को टैब में बदलने के लिए क्लिक करें",
  "STATUSBAR_INDENT_SIZE_TOOLTIP_SPACES": "इंडेंट करते समय उपयोग किए गए रिक्त स्थान की संख्या बदलने के लिए क्लिक करें",
  "STATUSBAR_INDENT_SIZE_TOOLTIP_TABS": "टैब वर्ण चौड़ाई बदलने के लिए क्लिक करें",
  "STATUSBAR_SPACES": "रिक्त स्थान:",
  "STATUSBAR_TAB_SIZE": "टैब आकार:",
  "STATUSBAR_LINE_COUNT_SINGULAR": "— {0} रेखा",
  "STATUSBAR_LINE_COUNT_PLURAL": "— {0} पंक्तियाँ",
  "STATUSBAR_USER_EXTENSIONS_DISABLED": "एक्सटेंशन अक्षम",
  "STATUSBAR_INSERT": "इन की",
  "STATUSBAR_OVERWRITE": "ओवीआर",
  "STATUSBAR_INSOVR_TOOLTIP": "इंसर्ट (INS) और ओवरराइट (OVR) मोड के बीच कर्सर को टॉगल करने के लिए क्लिक करें",
  "STATUSBAR_LANG_TOOLTIP": "फ़ाइल प्रकार बदलने के लिए क्लिक करें",
  "STATUSBAR_CODE_INSPECTION_TOOLTIP": "{0}. रिपोर्ट पैनल टॉगल करने के लिए क्लिक करें।",
  "STATUSBAR_DEFAULT_LANG": "(चूक)",
  "STATUSBAR_SET_DEFAULT_LANG": ".{0} फ़ाइलें . के लिए डिफ़ॉल्ट के रूप में सेट करें",
  "STATUSBAR_ENCODING_TOOLTIP": "एन्कोडिंग का चयन करें",
  "ERRORS_PANEL_TITLE_MULTIPLE": "{0} समस्याएं",
  "SINGLE_ERROR": "1 {0} समस्या",
  "MULTIPLE_ERRORS": "{1} {0} समस्याएं",
  "NO_ERRORS": "कोई {0} समस्या नहीं मिली - अच्छा काम!",
  "NO_ERRORS_MULTIPLE_PROVIDER": "कोई समस्या नहीं मिली - अच्छा काम!",
  "LINT_DISABLED": "अस्तर अक्षम है",
  "NO_LINT_AVAILABLE": "{0} के लिए कोई लिंटर उपलब्ध नहीं है",
  "NOTHING_TO_LINT": "लिंट करने के लिए कुछ भी नहीं",
  "LINTER_TIMED_OUT": "{1} ms . की प्रतीक्षा के बाद {0} का समय समाप्त हो गया है",
  "LINTER_FAILED": "{0} त्रुटि के साथ समाप्त: {1}",
  "FILE_MENU": "फ़ाइल",
  "CMD_FILE_NEW_UNTITLED": "नया",
  "CMD_FILE_NEW": "नई फ़ाइल",
  "CMD_FILE_DUPLICATE": "डुप्लिकेट",
  "CMD_FILE_DOWNLOAD_PROJECT": "प्रोजेक्ट डाउनलोड करें",
  "CMD_FILE_DOWNLO