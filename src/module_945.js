/**
 * Module ID: 945
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 945);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.nextDay=u;var t=require("./module_698"),n=require("./module_822");function u(u,c,f){let o=c-(0,n.getDay)(u,f);return o<=0&&(o+=7),(0,t.addDays)(u,o,f)}var c=u