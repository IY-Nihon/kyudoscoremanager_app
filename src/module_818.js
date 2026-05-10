/**
 * Module ID: 818
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 818);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return l}}),e.formatRFC7231=c;var t=require("./module_805"),n=require("./module_737"),o=require("./module_701");const u=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],s=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function c(c){const l=(0,o.toDate)(c);if(!(0,n.isValid)(l))throw new RangeError("Invalid time value");return`${u[l.getUTCDay()]}, ${(0,t.addLeadingZeros)(l.getUTCDate(),2)} ${s[l.getUTCMonth()]} ${l.getUTCFullYear()} ${(0,t.addLeadingZeros)(l.getUTCHours(),2)}:${(0,t.addLeadingZeros)(l.getUTCMinutes(),2)}:${(0,t.addLeadingZeros)(l.getUTCSeconds(),2)} GMT`}var l=c