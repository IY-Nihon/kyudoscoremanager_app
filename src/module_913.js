/**
 * Module ID: 913
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 913);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.isThisHour=o;var t=require("./module_733"),n=require("./module_901"),u=require("./module_701");function o(o,c){return(0,n.isSameHour)((0,u.toDate)(o,c?.in),(0,t.constructNow)(c?.in||o))}var c=o