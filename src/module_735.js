/**
 * Module ID: 735
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 735);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return l}}),e.differenceInBusinessDays=o;var n=require("./module_717"),t=require("./module_698"),s=require("./module_715"),u=require("./module_736"),f=require("./module_737"),c=require("./module_706");function o(o,l,y){const[D,_]=(0,n.normalizeDates)(y?.in,o,l);if(!(0,f.isValid)(D)||!(0,f.isValid)(_))return NaN;const b=(0,s.differenceInCalendarDays)(D,_),v=b<0?-1:1,j=Math.trunc(b/7);let p=5*j,I=(0,t.addDays)(_,7*j);for(;!(0,u.isSameDay)(D,I);)p+=(0,c.isWeekend)(I,y)?0:v,I=(0,t.addDays)(I,v);return 0===p?0:p}var l=o