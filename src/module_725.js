/**
 * Module ID: 725
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 725);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return a}}),e.areIntervalsOverlapping=n;var t=require("./module_701");function n(n,a,o){const[u,s]=[+(0,t.toDate)(n.start,o?.in),+(0,t.toDate)(n.end,o?.in)].sort((t,n)=>t-n),[c,l]=[+(0,t.toDate)(a.start,o?.in),+(0,t.toDate)(a.end,o?.in)].sort((t,n)=>t-n);return o?.inclusive?u<=l&&c<=s:u<l&&c<s}var a=n