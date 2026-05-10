/**
 * Module ID: 779
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 779);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.endOfWeek=o;var t=require("./module_713"),n=require("./module_701");function o(o,s){const u=(0,t.getDefaultOptions)(),c=s?.weekStartsOn??s?.locale?.options?.weekStartsOn??u.weekStartsOn??u.locale?.options?.weekStartsOn??0,l=(0,n.toDate)(o,s?.in),f=l.getDay(),O=6+(f<c?-7:0)-(f-c);return l.setDate(l.getDate()+O),l.setHours(23,59,59,999),l}var s=o