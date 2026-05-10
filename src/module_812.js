/**
 * Module ID: 812
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 812);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.formatDistanceToNowStrict=c;var t=require("./module_733"),n=require("./module_810");function c(c,o){return(0,n.formatDistanceStrict)(c,(0,t.constructNow)(c),o)}var o=c