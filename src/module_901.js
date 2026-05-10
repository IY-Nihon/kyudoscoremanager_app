/**
 * Module ID: 901
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 901);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.isSameHour=u;var t=require("./module_717"),n=require("./module_902");function u(u,o,f){const[s,c]=(0,t.normalizeDates)(f?.in,u,o);return+(0,n.startOfHour)(s)===+(0,n.startOfHour)(c)}var o=u