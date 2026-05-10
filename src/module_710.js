/**
 * Module ID: 710
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 710);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.getISOWeekYear=o;var t=require("./module_699"),n=require("./module_711"),u=require("./module_701");function o(o,s){const c=(0,u.toDate)(o,s?.in),l=c.getFullYear(),f=(0,t.constructFrom)(c,0);f.setFullYear(l+1,0,4),f.setHours(0,0,0,0);const O=(0,n.startOfISOWeek)(f),F=(0,t.constructFrom)(c,0);F.setFullYear(l,0,4),F.setHours(0,0,0,0);const T=(0,n.startOfISOWeek)(F);return c.getTime()>=O.getTime()?l+1:c.getTime()>=T.getTime()?l:l-1}var s=o