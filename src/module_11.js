/**
 * Module ID: 11
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 11);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.buildUrlForBundle=function(e){if(/^https?:\/\//.test(e))return e;const{url:t}=(0,u.default)();return t?new URL(e,t).toString():`//${e.replace(/^\/+/,'')}`};var e,t=require("./module_12"),u=(e=t)&&e.__esModule?e:{default:e}