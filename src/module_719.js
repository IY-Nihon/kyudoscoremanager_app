/**
 * Module ID: 719
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 719);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.startOfISOWeekYear=o;var t=require("./module_699"),n=require("./module_710"),u=require("./module_711");function o(o,s){const c=(0,n.getISOWeekYear)(o,s),f=(0,t.constructFrom)(s?.in||o,0);return f.setFullYear(c,0,4),f.setHours(0,0,0,0),(0,u.startOfISOWeek)(f)}var s=o