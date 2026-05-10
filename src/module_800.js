/**
 * Module ID: 800
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 800);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.getDayOfYear=u;var t=require("./module_715"),n=require("./module_774"),f=require("./module_701");function u(u,c){const o=(0,f.toDate)(u,c?.in);return(0,t.differenceInCalendarDays)(o,(0,n.startOfYear)(o))+1}var c=u