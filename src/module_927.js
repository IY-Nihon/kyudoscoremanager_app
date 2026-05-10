/**
 * Module ID: 927
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 927);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.isYesterday=o;var t=require("./module_699"),n=require("./module_733"),u=require("./module_736"),c=require("./module_928");function o(o,s){return(0,u.isSameDay)((0,t.constructFrom)(s?.in||o,o),(0,c.subDays)((0,n.constructNow)(s?.in||o),1))}var s=o