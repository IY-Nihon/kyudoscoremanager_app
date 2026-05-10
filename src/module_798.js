/**
 * Module ID: 798
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 798);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.buildMatchPatternFn=function(t){return(l,n={})=>{const u=l.match(t.matchPattern);if(!u)return null;const c=u[0],s=l.match(t.parsePattern);if(!s)return null;let b=t.valueCallback?t.valueCallback(s[0]):s[0];b=n.valueCallback?n.valueCallback(b):b;return{value:b,rest:l.slice(c.length)}}}