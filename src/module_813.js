/**
 * Module ID: 813
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 813);
const _m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.formatDuration=c;var t=require("./module_788"),o=require("./module_713");const n=["years","months","weeks","days","hours","minutes","seconds"];function c(c,s){const u=(0,o.getDefaultOptions)(),f=s?.locale??u.locale??t.defaultLocale,l=s?.format??n,m=s?.zero??!1,p=s?.delimiter??" ";if(!f.formatDistance)return"";return l.reduce((t,o)=>{const n=`x${o.replace(/(^.)/,t=>t.toUpperCase())}`,s=c[o];return void 0!==s&&(m||c[o])?t.concat(f.formatDistance(n,s)):t},[]).join(p)}var s=c