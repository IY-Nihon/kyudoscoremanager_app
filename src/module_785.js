/**
 * Module ID: 785
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 785);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.endOfTomorrow=n;var t=require("./module_733");function n(n){const o=(0,t.constructNow)(n?.in),u=o.getFullYear(),c=o.getMonth(),s=o.getDate(),l=(0,t.constructNow)(n?.in);return l.setFullYear(u,c,s+1),l.setHours(23,59,59,999),n?.in?n.in(l):l}var o=n