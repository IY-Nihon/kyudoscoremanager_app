/**
 * Module ID: 904
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 904);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}}),e.isSameWeek=u;var t=require("./module_717"),n=require("./module_712");function u(u,f,o){const[s,c]=(0,t.normalizeDates)(o?.in,u,f);return+(0,n.startOfWeek)(s,o)===+(0,n.startOfWeek)(c,o)}var f=u