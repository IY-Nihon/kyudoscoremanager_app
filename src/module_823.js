/**
 * Module ID: 823
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 823);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.getDaysInMonth=u;var t=require("./module_699"),n=require("./module_701");function u(u,o){const c=(0,n.toDate)(u,o?.in),s=c.getFullYear(),l=c.getMonth(),f=(0,t.constructFrom)(c,0);return f.setFullYear(s,l+1,0),f.setHours(0,0,0,0),f.getDate()}var o=u