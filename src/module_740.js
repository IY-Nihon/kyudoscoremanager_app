/**
 * Module ID: 740
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 740);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return l}}),e.differenceInCalendarISOWeeks=o;var n=require("./module_716"),t=require("./module_717"),s=require("./module_700"),f=require("./module_711");function o(o,l,c){const[u,O]=(0,t.normalizeDates)(c?.in,o,l),I=(0,f.startOfISOWeek)(u),k=(0,f.startOfISOWeek)(O),M=+I-(0,n.getTimezoneOffsetInMilliseconds)(I),W=+k-(0,n.getTimezoneOffsetInMilliseconds)(k);return Math.round((M-W)/s.millisecondsInWeek)}var l=o