/**
 * Module ID: 726
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 726);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.clamp=c;var t=require("./module_717"),n=require("./module_727"),u=require("./module_728");function c(c,o,f){const[l,s,_]=(0,t.normalizeDates)(f?.in,c,o.start,o.end);return(0,u.min)([(0,n.max)([l,s],f),_],f)}var o=c