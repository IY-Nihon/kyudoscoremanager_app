/**
 * Module ID: 709
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 709);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.addISOWeekYears=u;var t=require("./module_710"),n=require("./module_714");function u(u,c,f){return(0,n.setISOWeekYear)(u,(0,t.getISOWeekYear)(u,f)+c,f)}var c=u