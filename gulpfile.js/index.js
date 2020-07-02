/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2022 - present core.ai . All rights reserved.
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

/* eslint-env node */

const del = require('del');
const _ = require('lodash');
const fs = require('fs');
const webserver = require('gulp-webserver');
const { src, dest, series } = require('gulp');
// removed require('merge-stream') node module. it gives wired glob behavior and some files goes missing
const zip = require('gulp-zip');
const jsDocGenerate = require('./jsDocGenerate');
const Translate = require("./translateStrings");
const copyThirdPartyLibs = require("./thirdparty-lib-copy");
const minify = require('gulp-minify');
const glob = require("glob");
const sourcemaps = require('gulp-sourcemaps');
const crypto = require("crypto");
const execSync = require('child_process').execSync;

function cleanDist() {
    return del(['dist']);
}

function cleanAll() {
    return del([
        'node_modules',
        'dist',
        // Test artifacts
        'test/spec/test_folders.zip'
    ]);
}

/**
 * TODO: Release scripts to merge and min src js/css/html resources into dist.
 * Links that might help:
 * for less compilation:
 * https://stackoverflow.com/questions/27627936/compiling-less-using-gulp-useref-and-gulp-less
 * https://www.npmjs.com/package/gulp-less
 * Minify multiple files into 1:
 * https://stackoverflow.com/questions/26719884/gulp-minify-multiple-js-files-to-one
 * https://stackoverflow.com/questions/53353266/minify-and-combine-all-js-files-from-an-html-file
 * @returns {*}
 */
function makeDistAll() {
    return src('src/**/*')
        .pipe(dest('dist'));
}

function makeJSDist() {
    return src(['src/**/*.js', '!src/**/unittest-files/**/*'])
        .pipe(sourcemaps.init())
        .pipe(minify({
            ext:{
                min:'.js'
            },
            noSource: true,
            mangle: false,
            compress: {
                unused: false
            }
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(dest('dist'));
}

function makeDistNonJS() {
    return src(['src/**/*', '!src/**/*.js'])
        .pipe(dest('dist'));
}

function serve() {
    return src('.')
        .pipe(webserver({
            livereload: false,
            directoryListing: true,
            open: true
        }));
}

function serveExternal() {
    return src('.')
        .pipe(webserver({
            host: '0.0.0.0',
            livereload: false,
            directoryListing: true,
            open: true
        }));
}

function zipTestFiles() {
    return src([
        'test/**',
        'test/**/.*',
        '!test/thirdparty/**',
        '!test/test_folders.zip'])
        .pipe(zip('test_folders.zip'))
        .pipe(dest('test/'));
}

function zipDefaultProjectFiles() {
    return src(['src/assets/default-project/en/**'])
        .pipe(zip('en.zip'))
        .pipe(dest('src/assets/default-project/'));
}

// sample projects
function zipSampleProjectBootstrapBlog() {
    return src(['src/assets/sample-projects/bootstrap-blog/**'])
        .pipe(zip('bootstrap-blog.zip'))
        .pipe(dest('src/assets/sample-projects/'));
}
function zipSampleProjectExplore() {
    return src(['src/assets/sample-projects/explore/**'])
        .pipe(zip('explore.zip'))
        .pipe(dest('src/assets/sample-projects/'));
}
function zipSampleProjectHTML5() {
    return src(['src/assets/sample-projects/HTML5/**'])
        .pipe(zip('HTML5.zip'))
        .pipe(dest('src/assets/sample-projects/'));
}
function zipSampleProjectDashboard() {
    return src(['src/assets/sample-projects/dashboard/**'])
        .pipe(zip('dashboard.zip'))
        .pipe(dest('src/assets/sample-projects/'));
}
function zipSampleProjectHomePages() {
    return src(['src/assets/sample-projects/home-pages/**'])
        .pipe(zip('home-pages.zip'))
        .pipe(dest('src/assets/sample-projects/'));
}
let zipSampleProjectFiles = series(zipSampleProjectBootstrapBlog, zipSampleProjectExplore, zipSampleProjectHTML5,
    zipSampleProjectDashboard, zipSampleProjectHomePages);

function _patchBumpConfigFile(fileName) {
    let config = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    let version = config.apiVersion .split("."); // ["3","0","0"]
    version[2] = "" + (parseInt(version[2]) + 1); // ["3","0","1"]
    config.apiVersion = version.join("."); // 3.0.1
    config.version = `${config.apiVersion}-0`; // 3.0.1-0 . The final build number is always "-0" as the build number
    // is generated by release scripts only and never checked in source.
    fs.writeFileSync(fileName, JSON.stringify(config, null, 4));
}

function patchVersionBump() {
    return new Promise((resolve)=> {
        _patchBumpConfigFile('./package.json');
        _patchBumpConfigFile('./src/config.json');
        resolve();
    });
}

function _getBuildNumber() {
    // we count the number of commits in branch. which should give a incrementing
    // build number counter if there are any changes. Provided no one does a force push deleting commits.
    return execSync('git rev-list --count HEAD').toString().trim();
}

function _getAppConfigJS(configJsonStr) {
    return "// Autogenerated by gulp scripts. Do not edit\n"+
        `window.AppConfig = ${configJsonStr};\n`;
}

function _updateConfigFile(config) {
    delete config.scripts;
    delete config.devDependencies;
    delete config.dependencies;
    delete config.dependencies;

    config.config.build_timestamp = new Date();
    let newVersionStr = config.version.split("-")[0]; // 3.0.0-0 to 3.0.0
    config.version = `${newVersionStr}-${_getBuildNumber()}`;

    console.log("using config: ", config);
    const configJsonStr = JSON.stringify(config, null, 4);
    fs.writeFileSync('dist/config.json', configJsonStr);
    fs.writeFileSync('dist/appConfig.js', _getAppConfigJS(configJsonStr));

}

function releaseDev() {
    return new Promise((resolve)=>{
        const configFile = require('../src/config.json');
        _updateConfigFile(configFile);

        resolve();
    });
}

function releaseStaging() {
    return new Promise((resolve)=>{
        const configFile = require('../src/config.json');
        const stageConfigFile = {
            config: require('../src/brackets.config.staging.json')
        };
        _updateConfigFile(_.merge(configFile, stageConfigFile));

        resolve();
    });
}

function releaseProd() {
    return new Promise((resolve)=>{
        const configFile = require('../src/config.json');
        const prodConfigFile = {
            config: require('../src/brackets.config.dist.json')
        };
        _updateConfigFile(_.merge(configFile, prodConfigFile));

        resolve();
    });
}

function cleanDocs() {
    return del(['docs/generatedApiDocs']);
}

function createJSDocs() {
    return src('src/**/*.js')
        // Instead of using gulp-uglify, you can create an inline plugin
        .pipe(jsDocGenerate.generateDocs())
        .pipe(dest('docs/generatedApiDocs'));
}

function generateDocIndex() {
    return new Promise(async (resolve)=>{ // eslint-disable-line
        await jsDocGenerate.generateDocIndex('docs/generatedApiDocs');
        resolve();
    });
}

function translateStrings() {
    return new Promise(async (resolve)=>{ // eslint-disable-line
        await Translate.translate();
        resolve();
    });
}

function _listFilesInDir(dir) {
    return new Promise((resolve, reject)=>{
        glob(dir + '/**/*', {
            nodir: true
        }, (err, res)=>{
            if(err){
                reject(err);
                return;
            }
            resolve(res);
        });
    });
}

const ALLOWED_EXTENSIONS_TO_CACHE = ["js", "html", "htm", "xhtml", "css", "less", "scss", "ttf", "woff", "woff2", "eot",
    "txt", "otf",
    "json", "config",
    "zip",
    "png", "svg", "jpg", "jpeg", "gif", "ico",
    "mustache", "md", "markdown"];
const DISALLOWED_EXTENSIONS_TO_CACHE = ["map", "nuspec", "pa