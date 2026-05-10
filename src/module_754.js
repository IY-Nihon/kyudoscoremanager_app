/**
 * Module ID: 754
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 754);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}}),e.isLastDayOfMonth=u;var t=require("./module_755"),n=require("./module_756"),o=require("./module_701");function u(u,f){const c=(0,o.toDate)(u,f?.in);return+(0,t.endOfDay)(c,f)===+(0,n.endOfMonth)(c,f)}var f=u