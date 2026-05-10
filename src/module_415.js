/**
 * Module ID: 415
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 415);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.observable=function(n,{fallback:t,name:c}={}){const o=new Set;return{name:c,get:c=>(c&&(o.add(c),c.dependencies.add(()=>o.delete(c))),n??t?.get(c)),set(t){if(!Object.is(t,n)){n=t;for(const n of Array.from(o))n.run()}}}},e.cleanupEffect=function(n){for(const t of Array.from(n.dependencies))t();n.dependencies.clear()}