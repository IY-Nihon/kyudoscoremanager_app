/**
 * Module ID: 984
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 984);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.startOfTomorrow=o;var t=require("./module_699"),n=require("./module_733");function o(o){const u=(0,n.constructNow)(o?.in),c=u.getFullYear(),s=u.getMonth(),l=u.getDate(),f=(0,t.constructFrom)(o?.in,0);return f.setFullYear(c,s,l+1),f.setHours(0,0,0,0),f}var u=o