/**
 * Module ID: 773
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 773);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.endOfYear=n;var t=require("./module_701");function n(n,u){const o=(0,t.toDate)(n,u?.in),l=o.getFullYear();return o.setFullYear(l+1,0,0),o.setHours(23,59,59,999),o}var u=n