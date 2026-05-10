/**
 * Module ID: 715
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 715);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return l}}),e.differenceInCalendarDays=o;var n=require("./module_716"),t=require("./module_717"),s=require("./module_700"),f=require("./module_718");function o(o,l,c){const[u,y]=(0,t.normalizeDates)(c?.in,o,l),O=(0,f.startOfDay)(u),D=(0,f.startOfDay)(y),I=+O-(0,n.getTimezoneOffsetInMilliseconds)(O),M=+D-(0,n.getTimezoneOffsetInMilliseconds)(D);return Math.round((I-M)/s.millisecondsInDay)}var l=o