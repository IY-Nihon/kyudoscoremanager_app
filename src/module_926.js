/**
 * Module ID: 926
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 926);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.isWithinInterval=n;var t=require("./module_701");function n(n,o,a){const u=+(0,t.toDate)(n,a?.in),[c,s]=[+(0,t.toDate)(o.start,a?.in),+(0,t.toDate)(o.end,a?.in)].sort((t,n)=>t-n);return u>=c&&u<=s}var o=n