/**
 * Module ID: 912
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 912);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.isSameYear=n;var t=require("./module_717");function n(n,u,l){const[o,c]=(0,t.normalizeDates)(l?.in,n,u);return o.getFullYear()===c.getFullYear()}var u=n