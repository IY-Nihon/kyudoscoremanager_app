/**
 * Module ID: 874
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 874);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.setWeek=u;var t=require("./module_802"),n=require("./module_701");function u(u,o,c){const f=(0,n.toDate)(u,c?.in),s=(0,t.getWeek)(f,c)-o;return f.setDate(f.getDate()-7*s),(0,n.toDate)(f,c?.in)}var o=u