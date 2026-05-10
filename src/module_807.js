/**
 * Module ID: 807
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 807);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"longFormatters",{enumerable:!0,get:function(){return n}});const t=(t,u)=>{switch(t){case"P":return u.date({width:"short"});case"PP":return u.date({width:"medium"});case"PPP":return u.date({width:"long"});default:return u.date({width:"full"})}},u=(t,u)=>{switch(t){case"p":return u.time({width:"short"});case"pp":return u.time({width:"medium"});case"ppp":return u.time({width:"long"});default:return u.time({width:"full"})}},n={p:u,P:(n,c)=>{const s=n.match(/(P+)(p+)?/)||[],h=s[1],l=s[2];if(!l)return t(n,c);let P;switch(h){case"P":P=c.dateTime({width:"short"});break;case"PP":P=c.dateTime({width:"medium"});break;case"PPP":P=c.dateTime({width:"long"});break;default:P=c.dateTime({width:"full"})}return P.replace("{{date}}",t(h,c)).replace("{{time}}",u(l,c))}}