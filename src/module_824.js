/**
 * Module ID: 824
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 824);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.getDaysInYear=u;var t=require("./module_825"),n=require("./module_701");function u(u,o){const c=(0,n.toDate)(u,o?.in);return Number.isNaN(+c)?NaN:(0,t.isLeapYear)(c)?366:365}var o=u