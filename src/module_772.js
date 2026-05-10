/**
 * Module ID: 772
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 772);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.eachWeekendOfYear=u;var t=require("./module_769"),n=require("./module_773"),f=require("./module_774");function u(u,c){const o=(0,f.startOfYear)(u,c),s=(0,n.endOfYear)(u,c);return(0,t.eachWeekendOfInterval)({start:o,end:s},c)}var c=u