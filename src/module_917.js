/**
 * Module ID: 917
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 917);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.isThisQuarter=c;var t=require("./module_699"),n=require("./module_733"),u=require("./module_909");function c(c,o){return(0,u.isSameQuarter)((0,t.constructFrom)(o?.in||c,c),(0,n.constructNow)(o?.in||c))}var o=c