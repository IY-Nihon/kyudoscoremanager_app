/**
 * Module ID: 922
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 922);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.isToday=o;var t=require("./module_699"),n=require("./module_733"),u=require("./module_736");function o(o,c){return(0,u.isSameDay)((0,t.constructFrom)(c?.in||o,o),(0,n.constructNow)(c?.in||o))}var c=o