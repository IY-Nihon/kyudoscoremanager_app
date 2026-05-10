/**
 * Module ID: 923
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 923);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.isTomorrow=u;var t=require("./module_698"),n=require("./module_733"),o=require("./module_736");function u(u,c){return(0,o.isSameDay)(u,(0,t.addDays)((0,n.constructNow)(c?.in||u),1),c)}var c=u