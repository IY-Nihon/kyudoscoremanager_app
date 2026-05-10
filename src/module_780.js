/**
 * Module ID: 780
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 780);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.endOfISOWeekYear=o;var t=require("./module_699"),n=require("./module_710"),s=require("./module_711");function o(o,u){const c=(0,n.getISOWeekYear)(o,u),l=(0,t.constructFrom)(u?.in||o,0);l.setFullYear(c+1,0,4),l.setHours(0,0,0,0);const f=(0,s.startOfISOWeek)(l,u);return f.setMilliseconds(f.getMilliseconds()-1),f}var u=o