/**
 * Module ID: 845
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 845);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.interval=n;var t=require("./module_717");function n(n,o,s){const[u,f]=(0,t.normalizeDates)(s?.in,n,o);if(isNaN(+u))throw new TypeError("Start date is invalid");if(isNaN(+f))throw new TypeError("End date is invalid");if(s?.assertPositive&&+u>+f)throw new TypeError("End date must be after start date");return{start:u,end:f}}var o=n