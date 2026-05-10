/**
 * Module ID: 767
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 767);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.startOfQuarter=n;var t=require("./module_701");function n(n,u){const o=(0,t.toDate)(n,u?.in),s=o.getMonth(),c=s-s%3;return o.setMonth(c,1),o.setHours(0,0,0,0),o}var u=n