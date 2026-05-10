/**
 * Module ID: 817
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 817);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.formatRFC3339=s;var t=require("./module_805"),n=require("./module_737"),o=require("./module_701");function s(s,c){const u=(0,o.toDate)(s,c?.in);if(!(0,n.isValid)(u))throw new RangeError("Invalid time value");const l=c?.fractionDigits??0,f=(0,t.addLeadingZeros)(u.getDate(),2),$=(0,t.addLeadingZeros)(u.getMonth()+1,2),Z=u.getFullYear(),L=(0,t.addLeadingZeros)(u.getHours(),2),M=(0,t.addLeadingZeros)(u.getMinutes(),2),h=(0,t.addLeadingZeros)(u.getSeconds(),2);let v="";if(l>0){const n=u.getMilliseconds(),o=Math.trunc(n*Math.pow(10,l-3));v="."+(0,t.addLeadingZeros)(o,l)}let b="";const _=u.getTimezoneOffset();if(0!==_){const n=Math.abs(_);b=`${_<0?"+":"-"}${(0,t.addLeadingZeros)(Math.trunc(n/60),2)}:${(0,t.addLeadingZeros)(n%60,2)}`}else b="Z";return`${Z}-${$}-${f}T${L}:${M}:${h}${v}${b}`}var c=s