/**
 * Module ID: 65
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 65);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(e,"__esModule",{value:!0}),e.default=function(s,u){if('string'==typeof u&&!(0,t.isPrefixedValue)(u)&&-1!==u.indexOf('cross-fade('))return n.map(function(t){return u.replace(f,t+'cross-fade(')})};var t=require("./assignStyle_66"),f=/cross-fade\(/g,n=['-webkit-','']