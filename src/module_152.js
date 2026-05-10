/**
 * Module ID: 152
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 152);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.isLocaleRTL=function(s){var l=c.get(s);if(l)return l;var o=!1;if(Intl.Locale)try{var u=new Intl.Locale(s).maximize().script;o=t.has(u)}catch(t){var h=s.split('-')[0];o=n.has(h)}else{var v=s.split('-')[0];o=n.has(v)}return c.set(s,o),o};var t=new Set(['Arab','Syrc','Samr','Mand','Thaa','Mend','Nkoo','Adlm','Rohg','Hebr']),n=new Set(['ae','ar','arc','bcc','bqi','ckb','dv','fa','far','glk','he','iw','khw','ks','ku','mzn','nqo','pnb','ps','sd','ug','ur','yi']),c=new Map