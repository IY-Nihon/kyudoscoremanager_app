/**
 * Module ID: 955
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 955);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.previousDay=n;var t=require("./module_822"),u=require("./module_928");function n(n,o,c){let f=(0,t.getDay)(n,c)-o;return f<=0&&(f+=7),(0,u.subDays)(n,f,c)}var o=n