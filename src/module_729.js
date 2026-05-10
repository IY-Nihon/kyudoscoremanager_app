/**
 * Module ID: 729
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 729);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.closestIndexTo=n;var t=require("./module_701");function n(n,o){const u=+(0,t.toDate)(n);if(isNaN(u))return NaN;let c,s;return o.forEach((n,o)=>{const N=(0,t.toDate)(n);if(isNaN(+N))return c=NaN,void(s=NaN);const f=Math.abs(u-+N);(null==c||f<s)&&(c=o,s=f)}),c}var o=n