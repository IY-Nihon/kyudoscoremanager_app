/**
 * Module ID: 628
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 628);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}});const t='value',n='error';function u(){const u=new Map;return{setValue:(n,s)=>u.set(n,{type:t,data:s}),setError:(t,s)=>u.set(t,{type:n,data:s}),has:t=>u.has(t),get:t=>{if(!u.has(t))return;const{type:s,data:o}=u.get(t);if(s===n)throw o;return o}}}