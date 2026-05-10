/**
 * Module ID: 931
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 931);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.lastDayOfWeek=o;var t=require("./module_713"),n=require("./module_701");function o(o,s){const u=(0,t.getDefaultOptions)(),l=s?.weekStartsOn??s?.locale?.options?.weekStartsOn??u.weekStartsOn??u.locale?.options?.weekStartsOn??0,c=(0,n.toDate)(o,s?.in),f=c.getDay(),O=6+(f<l?-7:0)-(f-l);return c.setHours(0,0,0,0),c.setDate(c.getDate()+O),c}var s=o