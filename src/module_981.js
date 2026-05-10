/**
 * Module ID: 981
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 981);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.setYear=u;var t=require("./module_699"),n=require("./module_701");function u(u,o,c){const s=(0,n.toDate)(u,c?.in);return isNaN(+s)?(0,t.constructFrom)(c?.in||u,NaN):(s.setFullYear(o),s)}var o=u