/**
 * Module ID: 905
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 905);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}}),e.isSameISOWeekYear=u;var t=require("./module_719"),n=require("./module_717");function u(u,f,o){const[s,c]=(0,n.normalizeDates)(o?.in,u,f);return+(0,t.startOfISOWeekYear)(s)===+(0,t.startOfISOWeekYear)(c)}var f=u