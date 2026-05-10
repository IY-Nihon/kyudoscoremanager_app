/**
 * Module ID: 908
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 908);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.isSameMonth=n;var t=require("./module_717");function n(n,u,o){const[l,c]=(0,t.normalizeDates)(o?.in,n,u);return l.getFullYear()===c.getFullYear()&&l.getMonth()===c.getMonth()}var u=n