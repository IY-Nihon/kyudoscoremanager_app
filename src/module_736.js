/**
 * Module ID: 736
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 736);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}}),e.isSameDay=u;var t=require("./module_717"),n=require("./module_718");function u(u,f,o){const[s,c]=(0,t.normalizeDates)(o?.in,u,f);return+(0,n.startOfDay)(s)===+(0,n.startOfDay)(c)}var f=u