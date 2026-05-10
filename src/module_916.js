/**
 * Module ID: 916
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 916);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.isThisMonth=u;var t=require("./module_699"),n=require("./module_733"),o=require("./module_908");function u(u,c){return(0,o.isSameMonth)((0,t.constructFrom)(c?.in||u,u),(0,n.constructNow)(c?.in||u))}var c=u