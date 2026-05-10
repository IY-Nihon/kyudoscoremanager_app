/**
 * Module ID: 797
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 797);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function t(t,l){for(const n in t)if(Object.prototype.hasOwnProperty.call(t,n)&&l(t[n]))return n}function l(t,l){for(let n=0;n<t.length;n++)if(l(t[n]))return n}Object.defineProperty(e,'__esModule',{value:!0}),e.buildMatchFn=function(n){return(c,u={})=>{const s=u.width,o=s&&n.matchPatterns[s]||n.matchPatterns[n.defaultMatchWidth],f=c.match(o);if(!f)return null;const h=f[0],b=s&&n.parsePatterns[s]||n.parsePatterns[n.defaultParseWidth],P=Array.isArray(b)?l(b,t=>t.test(h)):t(b,t=>t.test(h));let p;p=n.valueCallback?n.valueCallback(P):P,p=u.valueCallback?u.valueCallback(p):p;return{value:p,rest:c.slice(h.length)}}}