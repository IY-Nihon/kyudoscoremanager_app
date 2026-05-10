/**
 * Module ID: 730
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 730);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.closestTo=u;var t=require("./module_717"),n=require("./module_729"),o=require("./module_699");function u(u,c,s){const[f,...l]=(0,t.normalizeDates)(s?.in,u,...c),v=(0,n.closestIndexTo)(f,l);return"number"==typeof v&&isNaN(v)?(0,o.constructFrom)(f,NaN):void 0!==v?l[v]:void 0}var c=u