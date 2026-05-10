/**
 * Module ID: 10
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 10);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.loadBundleAsync=async function(t){const u=(0,n.buildUrlForBundle)(t);return(0,c.fetchThenEvalAsync)(u)};var n=require("./module_11"),c=require("./module_14")