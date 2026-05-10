/**
 * Module ID: 934
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 934);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.lastDayOfYear=n;var t=require("./module_701");function n(n,u){const l=(0,t.toDate)(n,u?.in),o=l.getFullYear();return l.setFullYear(o+1,0,0),l.setHours(0,0,0,0),l}var u=n