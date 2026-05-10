/**
 * Module ID: 970
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 970);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.set=l;var t=require("./module_699"),n=require("./module_971"),s=require("./module_701");function l(l,u,o){let c=(0,s.toDate)(l,o?.in);return isNaN(+c)?(0,t.constructFrom)(o?.in||l,NaN):(null!=u.year&&c.setFullYear(u.year),null!=u.month&&(c=(0,n.setMonth)(c,u.month)),null!=u.date&&c.setDate(u.date),null!=u.hours&&c.setHours(u.hours),null!=u.minutes&&c.setMinutes(u.minutes),null!=u.seconds&&c.setSeconds(u.seconds),null!=u.milliseconds&&c.setMilliseconds(u.milliseconds),c)}var u=l