/**
 * Module ID: 954
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 954);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.parseJSON=n;var t=require("./module_701");function n(n,u){const o=n.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{0,7}))?(?:Z|(.)(\d{2}):?(\d{2})?)?/);return o?(0,t.toDate)(Date.UTC(+o[1],+o[2]-1,+o[3],+o[4]-(+o[9]||0)*("-"==o[8]?-1:1),+o[5]-(+o[10]||0)*("-"==o[8]?-1:1),+o[6],+((o[7]||"0")+"00").substring(0,3)),u?.in):(0,t.toDate)(NaN,u?.in)}var u=n