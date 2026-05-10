/**
 * Module ID: 932
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 932);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.lastDayOfISOWeekYear=s;var t=require("./module_699"),n=require("./module_710"),u=require("./module_711");function s(s,o){const c=(0,n.getISOWeekYear)(s,o),f=(0,t.constructFrom)(o?.in||s,0);f.setFullYear(c+1,0,4),f.setHours(0,0,0,0);const l=(0,u.startOfISOWeek)(f,o);return l.setDate(l.getDate()-1),l}var o=s