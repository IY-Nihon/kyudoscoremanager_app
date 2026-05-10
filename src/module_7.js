/**
 * Module ID: 7
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 7);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.getBundleUrl=function(){let n=null;n='undefined'==typeof window?'file://'+__filename:document.currentScript?.src;if(null==n)return null;const t=new URL(n);return`${t.protocol}//${t.host}${t.pathname}`}