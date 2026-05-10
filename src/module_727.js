/**
 * Module ID: 727
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 727);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.max=o;var t=require("./module_699"),n=require("./module_701");function o(o,c){let u,f=c?.in;return o.forEach(o=>{f||"object"!=typeof o||(f=t.constructFrom.bind(null,o));const c=(0,n.toDate)(o,f);(!u||u<c||isNaN(+c))&&(u=c)}),(0,t.constructFrom)(f,u||NaN)}var c=o