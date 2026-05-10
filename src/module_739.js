/**
 * Module ID: 739
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 739);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.differenceInCalendarISOWeekYears=u;var n=require("./module_717"),t=require("./module_710");function u(u,c,f){const[o,l]=(0,n.normalizeDates)(f?.in,u,c);return(0,t.getISOWeekYear)(o,f)-(0,t.getISOWeekYear)(l,f)}var c=u