/**
 * Module ID: 720
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 720);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.addMinutes=u;var t=require("./module_700"),n=require("./module_701");function u(u,o,c){const s=(0,n.toDate)(u,c?.in);return s.setTime(s.getTime()+o*t.millisecondsInMinute),s}var o=u