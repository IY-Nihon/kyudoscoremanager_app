/**
 * Module ID: 876
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 876);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.setISOWeek=u;var t=require("./module_801"),n=require("./module_701");function u(u,o,c){const f=(0,n.toDate)(u,c?.in),s=(0,t.getISOWeek)(f,c)-o;return f.setDate(f.getDate()-7*s),f}var o=u