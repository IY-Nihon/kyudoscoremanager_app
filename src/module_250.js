/**
 * Module ID: 250
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 250);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.checkSerializable=function(n){return t(n,new Set,[])};const t=(n,i,o)=>{if(null==n||'boolean'==typeof n||'number'==typeof n||'string'==typeof n)return{serializable:!0};if('[object Object]'!==Object.prototype.toString.call(n)&&!Array.isArray(n))return{serializable:!1,location:o,reason:'function'==typeof n?'Function':String(n)};if(i.has(n))return{serializable:!1,reason:'Circular reference',location:o};if(i.add(n),Array.isArray(n))for(let l=0;l<n.length;l++){const c=t(n[l],new Set(i),[...o,l]);if(!c.serializable)return c}else for(const l in n){const c=t(n[l],new Set(i),[...o,l]);if(!c.serializable)return c}return{serializable:!0}}