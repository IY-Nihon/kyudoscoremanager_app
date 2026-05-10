/**
 * Module ID: 936
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 936);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.milliseconds=n;var t=require("./module_700");function n({years:n,months:s,weeks:u,days:o,hours:c,minutes:l,seconds:f}){let y=0;n&&(y+=n*t.daysInYear),s&&(y+=s*(t.daysInYear/12)),u&&(y+=7*u),o&&(y+=o);let _=24*y*60*60;return c&&(_+=60*c*60),l&&(_+=60*l),f&&(_+=f),Math.trunc(1e3*_)}var s=n