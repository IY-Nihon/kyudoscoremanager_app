/**
 * Module ID: 782
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 782);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.endOfQuarter=n;var t=require("./module_701");function n(n,u){const o=(0,t.toDate)(n,u?.in),c=o.getMonth(),f=c-c%3+3;return o.setMonth(f,0),o.setHours(23,59,59,999),o}var u=n