/**
 * Module ID: 786
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 786);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.endOfYesterday=u;var t=require("./module_699"),n=require("./module_733");function u(u){const o=(0,n.constructNow)(u?.in),c=(0,t.constructFrom)(u?.in,0);return c.setFullYear(o.getFullYear(),o.getMonth(),o.getDate()-1),c.setHours(23,59,59,999),c}var o=u