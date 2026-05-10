/**
 * Module ID: 742
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 742);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return l}}),e.differenceInCalendarQuarters=u;var t=require("./module_717"),n=require("./module_743");function u(u,l,c){const[f,o]=(0,t.normalizeDates)(c?.in,u,l);return 4*(f.getFullYear()-o.getFullYear())+((0,n.getQuarter)(f)-(0,n.getQuarter)(o))}var l=u