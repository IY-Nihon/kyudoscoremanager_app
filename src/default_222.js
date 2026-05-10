/**
 * Module ID: 222
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 222);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return l}});var t=require("./module_221"),n=e(require("./default_156")),u=e(require("./default_165"));function l(e,l){var f=(0,u.default)(()=>new Map),c=(0,u.default)(()=>(n,u)=>{var c=f.get(n);null!=c&&c(),null==u&&(f.delete(n),u=()=>{});var o=(0,t.addEventListener)(n,e,u,l);return f.set(n,o),o});return(0,n.default)(()=>()=>{f.forEach(e=>{e()}),f.clear()},[f]),c}