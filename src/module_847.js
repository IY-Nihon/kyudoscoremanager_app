/**
 * Module ID: 847
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 847);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.intlFormat=n;var t=require("./module_701");function n(n,o,l){let u;var c;return void 0===(c=o)||"locale"in c?l=o:u=o,new Intl.DateTimeFormat(l?.locale,u).format((0,t.toDate)(n))}var o=n