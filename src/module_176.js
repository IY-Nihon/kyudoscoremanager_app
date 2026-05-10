/**
 * Module ID: 176
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 176);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"createStore",{enumerable:!0,get:function(){return n}});const t=t=>{let n;const c=new Set,o=(t,o)=>{const s="function"==typeof t?t(n):t;if(!Object.is(s,n)){const t=n;n=(null!=o?o:"object"!=typeof s||null===s)?s:Object.assign({},n,s),c.forEach(c=>c(n,t))}},s=()=>n,u={setState:o,getState:s,getInitialState:()=>l,subscribe:t=>(c.add(t),()=>c.delete(t))},l=n=t(o,s,u);return u},n=n=>n?t(n):t