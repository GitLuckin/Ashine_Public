/*!
 * JSHint, by JSHint Community.
 *
 * Licensed under the same slightly modified MIT license that JSLint is.
 * It stops evil-doers everywhere.
 *
 * JSHint is a derivative work of JSLint:
 *
 *   Copyright (c) 2002 Douglas Crockford  (www.JSLint.com)
 *
 *   Permission is hereby granted, free of charge, to any person obtaining
 *   a copy of this software and associated documentation files (the "Software"),
 *   to deal in the Software without restriction, including without limitation
 *   the rights to use, copy, modify, merge, publish, distribute, sublicense,
 *   and/or sell copies of the Software, and to permit persons to whom
 *   the Software is furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included
 *   in all copies or substantial portions of the Software.
 *
 *   The Software shall be used for Good, not Evil.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 *   FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 *   DEALINGS IN THE SOFTWARE.
 *
 * JSHint was forked from 2010-12-16 edition of JSLint.
 *
 */

/*
 JSHINT is a global function. It takes two parameters.

     var myResult = JSHINT(source, option);

 The first parameter is either a string or an array of strings. If it is a
 string, it will be split on '\n' or '\r'. If it is an array of strings, it
 is assumed that each string represents one line. The source can be a
 JavaScript text or a JSON text.

 The second parameter is an optional object of options which control the
 operation of JSHINT. Most of the options are booleans: They are all
 optional and have a default value of false. One of the options, predef,
 can be an array of names, which will be used to declare global variables,
 or an object whose keys are used as global names, with a boolean value
 that determines if they are assignable.

 If it checks out, JSHINT returns true. Otherwise, it returns false.

 If false, you can inspect JSHINT.errors to find out the problems.
 JSHINT.errors is an array of objects containing these members:

 {
     line      : The line (relative to 0) at which the lint was found
     character : The character (relative to 0) at which the lint was found
     reason    : The problem
     evidence  : The text line in which the problem occurred
     raw       : The raw message before the details were inserted
     a         : The first detail
     b         : The second detail
     c         : The third detail
     d         : The fourth detail
 }

 If a fatal error was found, a null will be the last element of the
 JSHINT.errors array.

 You can request a Function Report, which shows all of the functions
 and the parameters and vars that they use. This can be used to find
 implied global variables and other problems. The report is in HTML and
 can be inserted in an HTML <body>.

     var myReport = JSHINT.report(limited);

 If limited is true, then the report will be limited to only errors.

 You can request a data structure which contains JSHint's results.

     var myData = JSHINT.data();

 It returns a structure with this form:

 {
     errors: [
         {
             line: NUMBER,
             character: NUMBER,
             reason: STRING,
             evidence: STRING
         }
     ],
     functions: [
         name: STRING,
         line: NUMBER,
         last: NUMBER,
         param: [
             STRING
         ],
         closure: [
             STRING
         ],
         var: [
             STRING
         ],
         exception: [
             STRING
         ],
         outer: [
             STRING
         ],
         unused: [
             STRING
         ],
         global: [
             STRING
         ],
         label: [
             STRING
         ]
     ],
     globals: [
         STRING
     ],
     member: {
         STRING: NUMBER
     },
     unused: [
         {
             name: STRING,
             line: NUMBER
         }
     ],
     implieds: [
         {
             name: STRING,
             line: NUMBER
         }
     ],
     urls: [
         STRING
     ],
     json: BOOLEAN
 }

 Empty arrays will not be included.

*/

/*jshint
 evil: true, nomen: false, onevar: false, regexp: false, strict: true, boss: true,
 undef: true, maxlen: 100, indent:4
*/

/*members "\b", "\t", "\n", "\f", "\r", "!=", "!==", "\"", "%", "(begin)",
 "(breakage)", "(context)", "(error)", "(global)", "(identifier)", "(last)",
 "(line)", "(loopage)", "(name)", "(onevar)", "(params)", "(scope)",
 "(statement)", "(verb)", "*", "+", "++", "-", "--", "\/", "<", "<=", "==",
 "===", ">", ">=", $, $$, $A, $F, $H, $R, $break, $continue, $w, Abstract, Ajax,
 __filename, __dirname, ActiveXObject, Array, ArrayBuffer, ArrayBufferView, Audio,
 Autocompleter, Assets, Boolean, Builder, Buffer, Browser, COM, CScript, Canvas,
 CustomAnimation, Class, Control, Chain, Color, Cookie, Core, DataView, Date,
 Debug, Draggable, Draggables, Droppables, Document, DomReady, DOMReady, Drag,
 E, Enumerator, Enumerable, Element, Elements, Error, Effect, EvalError, Event,
 Events, FadeAnimation, Field, Flash, Float32Array, Float64Array, Form,
 FormField, Frame, FormData, Function, Fx, GetObject, Group, Hash, HotKey,
 HTMLElement, HTMLAnchorElement, HTMLBaseElement, HTMLBlockquoteElement,
 HTMLBodyElement, HTMLBRElement, HTMLButtonElement, HTMLCanvasElement, HTMLDirectoryElement,
 HTMLDivElement, HTMLDListElement, HTMLFieldSetElement,
 HTMLFontElement, HTMLFormElement, HTMLFrameElement, HTMLFrameSetElement,
 HTMLHeadElement, HTMLHeadingElement, HTMLHRElement, HTMLHtmlElement,
 HTMLIFrameElement, HTMLImageElement, HTMLInputElement, HTMLIsIndexElement,
 HTMLLabelElement, HTMLLayerElement, HTMLLegendElement, HTMLLIElement,
 HTMLLinkElement, HTMLMapElement, HTMLMenuElement, HTMLMetaElement,
 HTMLModElement, HTMLObjectElement, HTMLOListElement, HTMLOptGroupElement,
 HTMLOptionElement, HTMLParagraphElement, HTMLParamElement, HTMLPreElement,
 HTMLQuoteElement, HTMLScriptElement, HTMLSelectElement, HTMLStyleElement,
 HtmlTable, HTMLTableCaptionElement, HTMLTableCellElement, HTMLTableColElement,
 HTMLTableElement, HTMLTableRowElement, HTMLTableSectionElement,
 HTMLTextAreaElement, HTMLTitleElement, HTMLUListElement, HTMLVideoElement,
 Iframe, IframeShim, Image, Int16Array, Int32Array, Int8Array,
 Insertion, InputValidator, JSON, Keyboard, Locale, LN10, LN2, LOG10E, LOG2E,
 MAX_VALUE, MIN_VALUE, Mask, Math, MenuItem, MoveAnimation, MooTools, Native,
 NEGATIVE_INFINITY, Number, Object, ObjectRange, Option, Options, OverText, PI,
 POSITIVE_INFINITY, PeriodicalExecuter, Point, Position, Prototype, RangeError,
 Rectangle, ReferenceError, RegExp, ResizeAnimation, Request, RotateAnimation,
 SQRT1_2, SQRT2, ScrollBar, ScriptEngine, ScriptEngineBuildVersion,
 ScriptEngineMajorVersion, ScriptEngineMinorVersion, Scriptaculous, Scroller,
 Slick, Slider, Selector, SharedWorker, String, Style, SyntaxError, Sortable, Sortables,
 SortableObserver, Sound, Spinner, System, Swiff, Text, TextArea, Template,
 Timer, Tips, Type, TypeError, Toggle, Try, "use strict", unescape, URI, URIError, URL,
 VBArray, WSH, WScript, XDomainRequest, Web, Window, XMLDOM, XMLHttpRequest, XPathEvaluator,
 XPathException, XPathExpression, XPathNamespace, XPathNSResolver, XPathResult, "\\", a,
 addEventListener, address, alert, apply, applicationCache, arguments, arity,
 asi, b, basic, basicToken, bitwise, block, blur, boolOptions, boss, browser, c, call, callee,
 caller, cases, charAt, charCodeAt, character, clearInterval, clearTimeout,
 close, closed, closure, comment, condition, confirm, console, constructor,
 content, couch, create, css, curly, d, data, datalist, dd, debug, decodeURI,
 decodeURIComponent, defaultStatus, defineClass, deserialize, devel, document,
 dojo, dijit, dojox, define, else, emit, encodeURI, encodeURIComponent,
 entityify, eqeqeq, eqnull, errors, es5, escape, esnext, eval, event, evidence, evil,
 ex, exception, exec, exps, expr, exports, FileReader, first, floor, focus,
 forin, fragment, frames, from, fromCharCode, fud, funcscope, funct, function, functions,
 g, gc, getComputedStyle, getRow, getter, getterToken, GLOBAL, global, globals, globalstrict,
 hasOwnProperty, help, history, i, id, identifier, immed, implieds, importPackage, include,
 indent, indexOf, init, ins, instanceOf, isAlpha, isApplicationRunning, isArray,
 isDigit, isFinite, isNaN, iterator, java, join, jshint,
 JSHINT, json, jquery, jQuery, keys, label, labelled, last, lastsemic, laxbreak, laxcomma,
 latedef, lbp, led, left, length, line, load, loadClass, localStorage, location,
 log, loopfunc, m, match, maxerr, maxlen, member,message, meta, module, moveBy,
 moveTo, mootools, multistr, name, navigator, new, newcap, noarg, node, noempty, nomen,
 nonew, nonstandard, nud, onbeforeunload, onblur, onerror, onevar, onecase, onfocus,
 onload, onresize, onunload, open, openDatabase, openURL, opener, opera, options, outer, param,
 parent, parseFloat, parseInt, passfail, plusplus, predef, print, process, prompt,
 proto, prototype, prototypejs, provides, push, quit, range, raw, reach, reason, regexp,
 readFile, readUrl, regexdash, removeEventListener, replace, report, require,
 reserved, resizeBy, resizeTo, resolvePath, resumeUpdates, respond, rhino, right,
 runCommand, scroll, screen, scripturl, scrollBy, scrollTo, scrollbar, search, seal,
 send, serialize, sessionStorage, setInterval, setTimeout, setter, setterToken, shift, slice,
 smarttabs, sort, spawn, split, stack, status, start, strict, sub, substr, supernew, shadow,
 supplant, sum, sync, test, toLowerCase, toString, toUpperCase, toint32, token, top, trailing,
 type, typeOf, Uint16Array, Uint32Array, Uint8Array, undef, undefs, unused, urls, validthis,
 value, valueOf, var, version, WebSocket, white, window, Worker, wsh*/

/*global exports: false */

// We build the application inside a function so that we produce only a single
// global variable. That function will be invoked immediately, and its return
// value is the JSHINT function itself.

var JSHINT = (function () {
    "use strict";

    var anonname,       // The guessed name for anonymous functions.

// These are operators that should not be used with the ! operator.

        bang = {
            '<'  : true,
            '<=' : true,
            '==' : true,
            '===': true,
            '!==': true,
            '!=' : true,
            '>'  : true,
            '>=' : true,
            '+'  : true,
            '-'  : true,
            '*'  : true,
            '/'  : true,
            '%'  : true
        },

        // These are the JSHint boolean options.
        boolOptions = {
            asi         : true, // if automatic semicolon insertion should be tolerated
            bitwise     : true, // if bitwise operators should not be allowed
            boss        : true, // if advanced usage of assignments should be allowed
            browser     : true, // if the standard browser globals should be predefined
            couch       : true, // if CouchDB globals should be predefined
            curly       : true, // if curly braces around all blocks should be required
            debug       : true, // if debugger statements should be allowed
            devel       : true, // if logging globals should be predefined (console,
                                // alert, etc.)
            dojo        : true, // if Dojo Toolkit globals should be predefined
            eqeqeq      : true, // if === should be required
            eqnull      : true, // if == null comparisons should be tolerated
            es5         : true, // if ES5 syntax should be allowed
            esnext      : true, // if es.next specific syntax should be allowed
            evil        : true, // if eval should be allowed
            expr        : true, // if ExpressionStatement should be allowed as Programs
            forin       : true, // if for in statements must filter
            funcscope   : true, // if only function scope should be used for scope tests
            globalstrict: true, // if global "use strict"; should be allowed (also
                                // enables 'strict')
            immed       : true, // if immediate invocations must be wrapped in parens
            iterator    : true, // if the `__iterator__` property should be allowed
            jquery      : true, // if jQuery globals should be predefined
            lastsemic   : true, // if semicolons may be ommitted for the trailing
                                // statements inside of a one-line blocks.
            latedef     : true, // if the use before definition should not be tolerated
            laxbreak    : true, // if line breaks should not be checked
            laxcomma    : true, // if line breaks should not be checked around commas
            loopfunc    : true, // if functions should be allowed to be defined within
                                // loops
            mootools    : true, // if MooTools globals should be predefined
            multistr    : true, // allow multiline strings
            newcap      : true, // if constructor names must be capitalized
            noarg       : true, // if arguments.caller and arguments.callee should be
                                // disallowed
            node        : true, // if the Node.js environment globals should be
                                // predefined
            noempty     : true, // if empty blocks should be disallowed
            nonew       : true, // if using `new` for side-effects should be disallowed
            nonstandard : true, // if non-standard (but widely adopted) globals should
                                // be predefined
            nomen       : true, // if names should be checked
            onevar      : true, // if only one var statement per function should be
                                // allowed
            onecase     : true, // if one case switch statements should be allowed
            passfail    : true, // if the scan should stop on first error
            plusplus    : true, // if increment/decrement should not be allowed
            proto       : true, // if the `__proto__` property should be allowed
            prototypejs : true, // if Prototype and Scriptaculous globals should be
                                // predefined
            regexdash   : true, // if unescaped first/last dash (-) inside brackets
                                // should be tolerated
            regexp      : true, // if the . should not be allowed in regexp literals
            rhino       : true, // if the Rhino environment globals should be predefined
            undef       : true, // if variables should be declared before used
            scripturl   : true, // if script-targeted URLs should be tolerated
            shadow      : true, // if variable shadowing should be tolerated
            smarttabs   : true, // if smarttabs should be tolerated
                                // (http://www.emacswiki.org/emacs/SmartTabs)
            strict      : true, // require the "use strict"; pragma
            sub         : true, // if all forms of subscript notation are tolerated
            supernew    : true, // if `new function () { ... };` and `new Object;`
                                // should be tolerated
            trailing    : true, // if trailing whitespace rules apply
            validthis   : true, // if 'this' inside a non-constructor function is valid.
                                // This is a function scoped option only.
            white       : true, // if strict whitespace rules apply
            wsh         : true  // if the Windows Scripting Host environment globals
                                // should be predefined
        },

        // browser contains a set of global names which are commonly provided by a
        // web browser environment.
        browser = {
            ArrayBuffer              :  false,
            ArrayBufferView          :  false,
            Audio                    :  false,
            addEventListener         :  false,
            applicationCache         :  false,
            blur                     :  false,
            clearInterval            :  false,
            clearTimeout             :  false,
            close                    :  false,
            closed                   :  false,
            DataView                 :  false,
            defaultStatus            :  false,
            document                 :  false,
            event                    :  false,
            FileReader               :  false,
            Float32Array             :  false,
            Float64Array             :  false,
            FormData                 :  false,
            focus                    :  false,
            frames                   :  false,
            getComputedStyle         :  false,
            HTMLElement              :  false,
            HTMLAnchorElement        :  false,
            HTMLBaseElement          :  false,
            HTMLBlockquoteElement    :  false,
            HTMLBodyElement          :  false,
            HTMLBRElement            :  false,
            HTMLButtonElement        :  false,
            HTMLCanvasElement        :  false,
            HTMLDirectoryElement     :  false,
            HTMLDivElement           :  false,
            HTMLDListElement         :  false,
            HTMLFieldSetElement      :  false,
            HTMLFontElement          :  false,
            HTMLFormElement          :  false,
            HTMLFrameElement         :  false,
            HTMLFrameSetElement      :  false,
            HTMLHeadElement          :  false,
            HTMLHeadingElement       :  false,
            HTMLHRElement            :  false,
            HTMLHtmlElement          :  false,
            HTMLIFrameElement        :  false,
            HTMLImageElement         :  false,
            HTMLInputElement         :  false,
            HTMLIsIndexElement       :  false,
            HTMLLabelElement         :  false,
            HTMLLayerElement         :  false,
            HTMLLegendElement        :  false,
            HTMLLIElement            :  false,
            HTMLLinkElement          :  false,
            HTMLMapElement           :  false,
            HTMLMenuElement          :  false,
            HTMLMetaElement          :  false,
            HTMLModElement           :  false,
            HTMLObjectElement        :  false,
            HTMLOListElement         :  false,
            HTMLOptGroupElement      :  false,
            HTMLOptionElement        :  false,
            HTMLParagraphElement     :  false,
            HTMLParamElement         :  false,
            HTMLPreElement           :  false,
            HTMLQuoteElement         :  false,
            HTMLScriptElement        :  false,
            HTMLSelectElement        :  false,
            HTMLStyleElement         :  false,
            HTMLTableCaptionElement  :  false,
            HTMLTableCellElement     :  false,
            HTMLTableColElement      :  false,
            HTMLTableElement         :  false,
            HTMLTableRowElement      :  false,
            HTMLTableSectionElement  :  false,
            HTMLTextAreaElement      :  false,
            HTMLTitleElement         :  false,
            HTMLUListElement         :  false,
            HTMLVideoElement         :  false,
            history                  :  false,
            Int16Array               :  false,
            Int32Array               :  false,
            Int8Array                :  false,
            Image                    :  false,
            length                   :  false,
            localStorage             :  false,
            location                 :  false,
            moveBy                   :  false,
            moveTo                   :  false,
            name                     :  false,
            navigator                :  false,
            onbeforeunload           :  true,
            onblur                   :  true,
            onerror                  :  true,
            onfocus                  :  true,
            onload                   :  true,
            onresize                 :  true,
            onunload                 :  true,
            open                     :  false,
            openDatabase             :  false,
            opener                   :  false,
            Option                   :  false,
            parent                   :  false,
            print                    :  false,
            removeEventListener      :  false,
            resizeBy                 :  false,
            resizeTo                 :  false,
            screen                   :  false,
            scroll                   :  false,
            scrollBy                 :  false,
            scrollTo                 :  false,
            sessionStorage           :  false,
            setInterval              :  false,
            setTimeout               :  false,
            SharedWorker             :  false,
            status                   :  false,
            top                      :  false,
            Uint16Array              :  false,
            Uint32Array              :  false,
            Uint8Array               :  false,
            WebSocket                :  false,
            window                   :  false,
            Worker                   :  false,
            XMLHttpRequest           :  false,
            XPathEvaluator           :  false,
            XPathException           :  false,
            XPathExpression          :  false,
            XPathNamespace           :  false,
            XPathNSResolver          :  false,
            XPathResult              :  false
        },

        couch = {
            "require" : false,
            respond   : false,
            getRow    : false,
            emit      : false,
            send      : false,
            start     : false,
            sum       : false,
            log       : false,
            exports   : false,
            module    : false,
            provides  : false
        },

        devel = {
            alert   : false,
            confirm : false,
            console : false,
            Debug   : false,
            opera   : false,
            prompt  : false
        },

        dojo = {
            dojo      : false,
            dijit     : false,
            dojox     : false,
            define    : false,
            "require" : false
        },

        escapes = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '/' : '\\/',
            '\\': '\\\\'
        },

        funct,          // The current function

        functionicity = [
            'closure', 'exception', 'global', 'label',
            'outer', 'unused', 'var'
        ],

        functions,      // All of the functions

        global,         // The global scope
        implied,        // Implied globals
        inblock,
        indent,
        jsonmode,

        jquery = {
            '$'    : false,
            jQuery : false
        },

        lines,
        lookahead,
        member,
        membersOnly,

        mootools = {
            '$'             : false,
            '$$'            : false,
            Assets          : false,
            Browser         : false,
            Chain           : false,
            Class           : false,
            Color           : false,
            Cookie          : false,
            Core            : false,
            Document        : false,
            DomReady        : false,
            DOMReady        : false,
            Drag            : false,
            Element         : false,
            Elements        : false,
            Event           : false,
            Events          : false,
            Fx              : false,
            Group           : false,
            Hash            : false,
            HtmlTable       : false,
            Iframe          : false,
            IframeShim      : false,
            InputValidator  : false,
            instanceOf      : false,
            Keyboard        : false,
            Locale          : false,
            Mask            : false,
            MooTools        : false,
            Native          : false,
            Options         : false,
            OverText        : false,
            Request         : false,
            Scroller        : false,
            Slick           : false,
            Slider          : false,
            Sortables       : false,
            Spinner         : false,
            Swiff           : false,
            Tips            : false,
            Type            : false,
            typeOf          : false,
            URI             : false,
            Window          : false
        },

        nexttoken,

        node = {
            __filename    : false,
            __dirname     : false,
            Buffer        : false,
            console       : false,
            exports       : false,
            GLOBAL        : false,
            global        : false,
            module        : false,
            process       : false,
            require       : false,
            setTimeout    : false,
            clearTimeout  : false,
            setInterval   : false,
            clearInterval : false
        },

        noreach,
        option,
        predefined,     // Global variables defined by option
        prereg,
        prevtoken,

        prototypejs = {
            '$'               : false,
            '$$'              : false,
            '$A'              : false,
            '$F'              : false,
            '$H'              : false,
            '$R'              : false,
            '$break'          : false,
            '$continue'       : false,
            '$w'              : false,
            Abstract          : false,
            Ajax              : false,
            Class             : false,
            Enumerable        : false,
            Element           : false,
            Event             : false,
            Field             : false,
            Form              : false,
            Hash              : false,
            Insertion         : false,
            ObjectRange       : false,
            PeriodicalExecuter: false,
            Position          : false,
            Prototype         : false,
            Selector          : false,
            Template          : false,
            Toggle            : false,
            Try               : false,
            Autocompleter     : false,
            Builder           : false,
            Control           : false,
            Draggable         : false,
            Draggables        : false,
            Droppables        : false,
            Effect            : false,
            Sortable          : false,
            SortableObserver  : false,
            Sound             : false,
            Scriptaculous     : false
        },

        rhino = {
            defineClass  : false,
            deserialize  : false,
            gc           : false,
            help         : false,
            importPackage: false,
            "java"       : false,
            load         : false,
            loadClass    : false,
            print        : false,
            quit         : false,
            readFile     : false,
            readUrl      : false,
            runCommand   : false,
            seal         : false,
            serialize    : false,
            spawn        : false,
            sync         : false,
            toint32      : false,
            version      : false
        },

        scope,      // The current scope
        stack,

        // standard contains the global names that are provided by the
        // ECMAScript standard.
        standard = {
            Array               : false,
            Boolean             : false,
            Date                : false,
            decodeURI           : false,
            decodeURIComponent  : false,
            encodeURI           : false,
            encodeURIComponent  : false,
            Error               : false,
            'eval'              : false,
            EvalError           : false,
            Function            : false,
            hasOwnProperty      : false,
            isFinite            : false,
            isNaN               : false,
            JSON                : false,
            Math                : false,
            Number              : false,
            Object              : false,
            parseInt            : false,
            parseFloat          : false,
            RangeError          : false,
            ReferenceError      : false,
            RegExp              : false,
            String              : false,
            SyntaxError         : false,
            TypeError           : false,
            URIError            : false
        },

        // widely adopted global names that are not part of ECMAScript standard
        nonstandard = {
            escape              : false,
            unescape            : false
        },

        standard_member = {
            E                   : true,
            LN2                 : true,
            LN10                : true,
            LOG2E               : true,
            LOG10E              : true,
            MAX_VALUE           : true,
            MIN_VALUE           : true,
            NEGATIVE_INFINITY   : true,
            PI                  : true,
            POSITIVE_INFINITY   : true,
            SQRT1_2             : true,
            SQRT2               : true
        },

        directive,
        syntax = {},
        tab,
        token,
        urls,
        useESNextSyntax,
        warnings,

        wsh = {
            ActiveXObject             : true,
            Enumerator                : true,
            GetObject                 : true,
            ScriptEngine              : true,
            ScriptEngineBuildVersion  : true,
            ScriptEngineMajorVersion  : true,
            ScriptEngineMinorVersion  : true,
            VBArray                   : true,
            WSH                       : true,
            WScript                   : true,
            XDomainRequest            : true
        };

    // Regular expressions. Some of these are stupidly long.
    var ax, cx, tx, nx, nxg, lx, ix, jx, ft;
    (function () {
        /*jshint maxlen:300 */

        // unsafe comment or string
        ax = /@cc|<\/?|script|\]\s*\]|<\s*!|&lt/i;

        // unsafe characters that are silently deleted by one or more browsers
        cx = /[\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/;

        // token
        tx = /^\s*([(){}\[.,:;'"~\?\]#@]|==?=?|\/(\*(jshint|jslint|members?|global)?|=|\/)?|\*[\/=]?|\+(?:=|\++)?|-(?:=|-+)?|%=?|&[&=]?|\|[|=]?|>>?>?=?|<([\/=!]|\!(\[|--)?|<=?)?|\^=?|\!=?=?|[a-zA-Z_$][a-zA-Z0-9_$]*|[0-9]+([xX][0-9a-fA-F]+|\.[0-9]*)?([eE][+\-]?[0-9]+)?)/;

        // characters in strings that need escapement
        nx = /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/;
        nxg = /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

        // star slash
        lx = /\*\/|\/\*/;

        // identifier
        ix = /^([a-zA-Z_$][a-zA-Z0-9_$]*)$/;

        // javascript url
        jx = /^(?:javascript|jscript|ecmascript|vbscript|mocha|livescript)\s*:/i;

        // catches /* falls through */ comments
        ft = /^\s*\/\*\s*falls\sthrough\s*\*\/\s*$/;
    }());

    function F() {}     // Used by Object.create

    function is_own(object, name) {

// The object.hasOwnProperty method fails when the property under consideration
// is named 'hasOwnProperty'. So we have to use this more convoluted form.

        return Object.prototype.hasOwnProperty.call(object, name);
    }

// Provide critical ES5 functions to ES3.

    if (typeof Array.isArray !== 'function') {
        Array.isArray = function (o) {
            return Object.prototype.toString.apply(o) === '[object Array]';
        };
    }

    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            F.prototype = o;
            return new F();
        };
    }

    if (typeof Object.keys !== 'function') {
        Object.keys = function (o) {
            var a = [], k;
            for (k in o) {
                if (is_own(o, k)) {
                    a.push(k);
                }
            }
            return a;
        };
    }

// Non standard methods

    if (typeof String.prototype.entityify !== 'function') {
        String.prototype.entityify = function () {
            return this
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };
    }

    if (typeof String.prototype.isAlpha !== 'function') {
        String.prototype.isAlpha = function () {
            return (this >= 'a' && this <= 'z\uffff') ||
                (this >= 'A' && this <= 'Z\uffff');
        };
    }

    if (typeof String.prototype.isDigit !== 'function') {
        String.prototype.isDigit = function () {
            return (this >= '0' && this <= '9');
        };
    }

    if (typeof String.prototype.supplant !== 'function') {
        String.prototype.supplant = function (o) {
            return this.replace(/\{([^{}]*)\}/g, function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeo