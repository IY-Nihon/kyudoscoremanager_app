/**
 * Module ID: 14
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 14);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.fetchThenEvalAsync=function(o,{scriptType:c,nonce:s,crossOrigin:u}={}){if('undefined'==typeof window)return require("./module_15").fetchThenEvalAsync(o);return new Promise((p,l)=>{const f=document.createElement('script');c&&(f.type=c),s&&f.setAttribute('nonce',s),f.src=o,u&&0!==f.src.indexOf(window.location.origin+'/')&&(f.crossOrigin=u),f.onload=()=>{f.parentNode&&f.parentNode.removeChild(f),p()};const y=new t;f.onerror=n=>{let t;t='string'==typeof n?{type:'error',target:{src:t}}:n;const c=t&&('load'===t.type?'missing':t.type),s=t?.target?.src;y.message='Loading module '+o+' failed.\n('+c+': '+s+')',y.type=c,y.request=s,f.parentNode&&f.parentNode.removeChild(f),l(y)},f.src===n?p():document.head.appendChild(f)})};const n='undefined'!=typeof document&&document.currentScript&&'src'in document.currentScript&&document.currentScript.src||null;class t extends Error{name='AsyncRequireError'}