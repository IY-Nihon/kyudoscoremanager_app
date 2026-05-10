/**
 * Module ID: 759
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 759);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.differenceInWeeks=u;var n=require("./module_748"),t=require("./module_746");function u(u,o,f){const c=(0,t.differenceInDays)(u,o,f)/7;return(0,n.getRoundingMethod)(f?.roundingMethod)(c)}var o=u