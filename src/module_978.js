/**
 * Module ID: 978
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 978);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.setQuarter=u;var t=require("./module_971"),n=require("./module_701");function u(u,o,c){const f=(0,n.toDate)(u,c?.in),s=o-(Math.trunc(f.getMonth()/3)+1);return(0,t.setMonth)(f,f.getMonth()+3*s)}var o=u