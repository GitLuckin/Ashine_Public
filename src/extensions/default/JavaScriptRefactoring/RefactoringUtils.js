
/*
*  Copyright (c) 2021 - present core.ai . All rights reserved.
 *  Original work Copyright (c) 2013 - 2021 Adobe Systems Incorporated. All rights reserved.
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

/*
 * Utilities functions related to refactoring
 */
define(function (require, exports, module) {


    var Acorn         = brackets.getModule("thirdparty/acorn/dist/acorn"),
        ASTWalker     = brackets.getModule("thirdparty/acorn/dist/walk"),
        MessageIds    = JSON.parse(brackets.getModule("text!JSUtils/MessageIds.json")),
        _             = brackets.getModule("thirdparty/lodash"),
        AcornLoose    = brackets.getModule("thirdparty/acorn/dist/acorn_loose"),
        ScopeManager  = brackets.getModule("JSUtils/ScopeManager");


    var templates = JSON.parse(require("text!Templates.json"));



    // Length of the function body used as function name for nameless functions
    var FUNCTION_BODY_PREFIX_LENGTH = 30;

    /**
     * Checks whether two ast nodes are equal
     * @param {!ASTNode} a
     * @param {!ASTNode} b
     * @return {boolean}
     */
    function isEqual(a, b) {
        return a.start === b.start && a.end === b.end;
    }

    /**
     * Gets a expression surrounding start and end (if any)
     * @param {!ASTNode} ast - the ast of the complete file
     * @param {!number} start - the start offset
     * @param {!number} end - the end offset
     * @param {!string} fileText - the entire file text
     * @return {ASTNode|boolean}
     */
    function getExpression(ast, start, end, fileText) {
        var expn = findSurroundExpression(ast, {start: start, end: end});
        if (!expn) {
            return false;
        }

        // Class Expression also includes the trailing semicolon
        // Add special case for it
        if (expn.type === "ClassExpression" && expn.start === start && expn.end - end <= 1) {
            expn.end = end;
            return expn;
        }        else if (expn.start === start && expn.end === end) {
            return expn;
        }

        // Subexpressions are possible only for BinaryExpression, LogicalExpression and SequenceExpression
        if (!(["BinaryExpression", "LogicalExpression", "SequenceExpression"].includes(expn.type))) {
            return false;
        }

        // Check subexpression
        var parentExpn = expn;
        var parentExpStr = fileText.substr(parentExpn.start, parentExpn.end - parentExpn.start);

        // Check whether the parentExpn forms a valid expression after replacing the sub expression
        var str = parentExpStr.substr(0, start - parentExpn.start) + "placeHolder" + parentExpStr.substr(end - parentExpn.start);
        var node = isStandAloneExpression(str);
        if (node && node.type === parentExpn.type) {
            return parentExpn;
        }

        return false;
    }

    function getAST(text) {
        var ast;
        try {
            ast = Acorn.parse(text, {ecmaVersion: 9});
        } catch(e) {
            ast = AcornLoose.parse(text, {ecmaVersion: 9});
        }
        return ast;
    }

    /*
     * Checks whether the text between start and end offsets form a valid set of statements
     * @param {!ASTNode} ast - the ast of the complete file
     * @param {!number} start - the start offset
     * @param {!number} end - the end offset
     * @param {!string} fileText - the entire file text
     * @return {boolean}
     */
    function checkStatement(ast, start, end, fileText) {
        // Do not allow function or class nodes
        var notStatement = false;
        ASTWalker.simple(getAST(fileText.substr(start, end - start)), {
            FunctionDeclaration: function (node) {
                notStatement = true;
            },
            ClassDeclaration: function (node) {
                notStatement = true;
            }
        });

        if (notStatement) {
            return false;
        }

        var startStatement = findSurroundASTNode(ast, {start: start}, ["Statement"]);
        var endStatement   = findSurroundASTNode(ast, {start: end}, ["Statement"]);

        return startStatement && endStatement && startStatement.start === start &&
            startStatement.end <= end && endStatement.start >= start &&
            endStatement.end === end;
    }

    /**
     * Gets a unique identifier name in the scope that starts with prefix
     * @param {!Scope} scopes - an array of all scopes returned from tern (each element contains 'props' with identifiers
     *  in that scope)
     * @param {!string} prefix - prefix of the identifier
     * @param {number} num - number to start checking for
     * @return {!string} identifier name
     */
    function getUniqueIdentifierName(scopes, prefix, num) {
        if (!scopes) {
            return prefix;
        }

        var props = scopes.reduce(function(props, scope) {
            return _.union(props, _.keys(scope.props));
        }, []);

        if (!props) {
            return prefix;
        }

        num = num || "1";
        var name;
        while (num < 100) { // limit search length
            name = prefix + num;
            if (props.indexOf(name) === -1) {
                break;
            }
            ++num;
        }
        return name;
    }

    /**