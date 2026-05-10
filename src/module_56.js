/**
 * Module ID: 56
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 56);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}});var t=/[A-Z]/g,n=/^ms-/,u={};function o(t){return'-'+t.toLowerCase()}var c=function(c){if(c in u)return u[c];var f=c.replace(t,o);return u[c]=n.test(f)?'-'+f:f}