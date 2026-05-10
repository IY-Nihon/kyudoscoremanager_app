/**
 * Module ID: 585
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 585);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"isSearchBarAvailableForCurrentPlatform",{enumerable:!0,get:function(){return o}}),Object.defineProperty(_e,"isHeaderBarButtonsAvailableForCurrentPlatform",{enumerable:!0,get:function(){return u}}),_e.executeNativeBackPress=function(){return n.default.exitApp(),!0},_e.parseBooleanToOptionalBooleanNativeProp=function(e){switch(e){case void 0:return'undefined';case!0:return'true';case!1:return'false'}};var e,t=require("./module_368"),n=(e=t)&&e.__esModule?e:{default:e};require("./module_98");const o=['ios','android'].includes("web"),u=!1