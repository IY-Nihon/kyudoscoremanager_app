/**
 * Module ID: 971
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 971);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.setMonth=u;var t=require("./module_699"),n=require("./module_823"),o=require("./module_701");function u(u,s,c){const l=(0,o.toDate)(u,c?.in),f=l.getFullYear(),M=l.getDate(),h=(0,t.constructFrom)(c?.in||u,0);h.setFullYear(f,s,15),h.setHours(0,0,0,0);const _=(0,n.getDaysInMonth)(h);return l.setMonth(s,Math.min(M,_)),l}var s=u