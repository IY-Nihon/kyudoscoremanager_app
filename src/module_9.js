/**
 * Module ID: 9
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 9);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.buildAsyncRequire=function(){const t=new Map;return async function(c){if(t.has(c))return t.get(c);const u=(0,n.loadBundleAsync)(c).catch(n=>{throw t.delete(c),n});return t.set(c,u),u}};var n=require("./module_10")