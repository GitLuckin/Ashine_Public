/*
 * Copyright (c) 2019 - present Adobe. All rights reserved.
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

/*global exports, process, Promise, __dirname, global*/
/*eslint no-console: 0*/
/*eslint no-fallthrough: 0*/
/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */
(function () {


    var protocol = require("vscode-languageserver-protocol"),
        cp = require("child_process"),
        fs = require("fs");

    var CommunicationTypes = {
            NodeIPC: {
                type: "ipc",
                flag: "--node-ipc"
            },
            StandardIO: {
                type: "stdio",
                flag: "--stdio"
            },
            Pipe: {
                type: "pipe",
                flag: "--pipe"
            },
            Socket: {
                type: "socket",
                flag: "--socket"
            }
        },
        CLIENT_PROCESS_ID_FLAG = "--clientProcessId";

    function addCommunicationArgs(communication, processArgs, isRuntime) {
        switch (communication) {
        case CommunicationTypes.NodeIPC.type:
            {
                if (isRuntime) {
                    processArgs.options.stdio = [null, null, null, 'ipc'];
                    processArgs.args.push(CommunicationTypes.NodeIPC.flag);
                } else {
                    processArgs.args.push(CommunicationTypes.NodeIPC.flag);
                }
                break;
            }
        case CommunicationTypes.StandardIO.type:
            {
                processArgs.args.push(CommunicationTypes.StandardIO.flag);
                break;
            }
        case CommunicationTypes.Pipe.type:
            {
                var pipeName = protocol.generateRandomPipeName(),
                    pipeflag = CommunicationTypes.Pipe.flag + "=" + pipeName.toString();

                processArgs.args.push(pipeflag);
                processArgs.pipeName = pipeName;
                break;
            }
        default:
            {
                if (communication && communication.type === CommunicationTypes.Socket.type) {
                    var socketFlag = CommunicationTypes.Socket.flag + "=" + communication.port.toString();
                    processArgs.args.push(socketFlag);
                }
            }
        }

        var clientProcessIdFlag = CLIENT_PROCESS_ID_FLAG + "=" + process.pid.toString();
        processArgs.args.push(clientProcessIdFlag);
    }

    function _getEnvironment(env) {
        if (!env) {
            return process.env;
        }

        //Combine env vars
        var result = Object.assign({}, process.env, env);
        return result;
    }

    function _createReaderAndWriteByCommunicationType(resp, type) {
        var retval = null;

        switch (type) {
        case CommunicationTyp