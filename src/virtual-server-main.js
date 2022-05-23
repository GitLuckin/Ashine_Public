/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * modified by core.ai, based on work by David Humphrey <david.humphrey@senecacolleage.ca> (@humphd)
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see https://opensource.org/licenses/AGPL-3.0.
 *
 */

/* global workbox, importScripts, Serve, HtmlFormatter, Config*/
importScripts('phoenix/virtualfs.js');
importScripts('phoenix/virtualServer/mime-types.js');
importScripts('phoenix/virtualServer/config.js');
importScripts('phoenix/virtualServer/content-type.js');
importScripts('phoenix/virtualServer/webserver.js');
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const _debugSWCacheLogs = false; // change debug to true to see more logs
const CACHE_FILE_NAME = "cacheManifest.json";
const CACHE_FS_PATH = `/${CACHE_FILE_NAME}`;

workbox.setConfig({debug: _debugSWCacheLogs});

const Route = workbox.routing.Route;
// other strategies include CacheFirst, NetworkFirst Etc..
const cacheFirst = workbox.strategies.CacheFirst;
const StaleWhileRevalidate = workbox.strategies.StaleWhileRevalidate;
const ExpirationPlugin = workbox.expiration.ExpirationPlugin;
const CacheExpiration = workbox.expiration.CacheExpiration;
const DAYS_30_IN_SEC = 60 * 60 * 24 * 30;
const CACHE_NAME_EVERYTHING = "everything"; // This is referenced in index.html as well if you are changing te name.
const CACHE_NAME_CORE_SCRIPTS = "coreScripts";
const CACHE_NAME_EXTERNAL = "external";
const ExpirationManager ={
    "everything": new CacheExpiration(CACHE_NAME_EVERYTHING, {
            maxAgeSeconds: DAYS_30_IN_SEC
        }),
    "coreScripts": new CacheExpiration(CACHE_NAME_CORE_SCRIPTS, {
            maxAgeSeconds: DAYS_30_IN_SEC
        }),
    "external": new CacheExpiration(CACHE_NAME_EXTERNAL, {
        maxAgeSeconds: DAYS_30_IN_SEC
    })
};

function _debugCacheLog(...args) {
    if(_debugSWCacheLogs){
        console.log(...args);
    }
}

self._debugLivePreviewLog = function (...args) {
    if(self._debugSWLivePreviewLogs){ // this is set from the debug menu
        console.log(...args);
    }
}

function _removeParams(url) {
    if(url.indexOf( "?")>-1){
        url = url.substring( 0, url.indexOf( "?")); // remove query string params
    }
    if(location.href.indexOf( "#")>-1){
        url = url.substring( 0, url.indexOf( "#")); // remove hrefs in page
    }
    return url;
}

// service worker controlling route base url. This will be something like https://phcode.dev/ or http://localhost:8000/
let baseURL = location.href;
baseURL = _removeParams(location.href);
if(location.href.indexOf( "/")>-1){
    // http://phcode.dev/index.html -> http://phcode.dev
    baseURL = baseURL.substring( 0, baseURL.lastIndexOf( "/"));
}
if(!baseURL.endsWith('/')){
    baseURL = baseURL + '/';
}
console.log("Service worker: base URL is: ", baseURL);

const CACHE_MANIFEST_URL = `${baseURL}${CACHE_FILE_NAME}`;
console.log("Service worker: cache manifest URL is: ", CACHE_MANIFEST_URL);

// this is the base url where our file system virtual server lives. http://phcode.dev/phoenix/vfs in phoenix or
// http://localhost:8000/phoenix/vfs in dev builds
const virtualServerBaseURL = `${baseURL}${Config.route}`;
console.log("Service worker: Virtual server base URL is: ", virtualServerBaseURL);

// Route with trailing slash (i.e., /path/into/filesystem)
const wwwRegex = new RegExp(`${Config.route}(/.*)`);
// Route minus the trailing slash

function _isVirtualServing(url) {
    return url.startsWith(virtualServerBaseURL);
}

function _shouldVirtualServe(request) {
    return _isVirtualServing(request.url.href);
}

workbox.routing.registerRoute(
  