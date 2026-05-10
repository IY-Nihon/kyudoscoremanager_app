/**
 * Module ID: 737
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 737);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.isValid=u;var t=require("./module_738"),n=require("./module_701");function u(u){return!(!(0,t.isDate)(u)&&"number"!=typeof u||isNaN(+(0,n.toDate)(u)))}var o=u