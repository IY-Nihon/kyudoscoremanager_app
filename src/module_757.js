/**
 * Module ID: 757
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 757);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.differenceInQuarters=u;var n=require("./module_748"),t=require("./module_753");function u(u,o,f){const c=(0,t.differenceInMonths)(u,o,f)/3;return(0,n.getRoundingMethod)(f?.roundingMethod)(c)}var o=u