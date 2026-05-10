/**
 * Module ID: 816
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 816);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function t(t){const{years:n=0,months:u=0,days:o=0,hours:s=0,minutes:c=0,seconds:f=0}=t;return`P${n}Y${u}M${o}DT${s}H${c}M${f}S`}Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return n}}),e.formatISODuration=t;var n=t