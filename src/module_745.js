/**
 * Module ID: 745
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 745);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.differenceInCalendarYears=t;var n=require("./module_717");function t(t,u,l){const[c,f]=(0,n.normalizeDates)(l?.in,t,u);return c.getFullYear()-f.getFullYear()}var u=t