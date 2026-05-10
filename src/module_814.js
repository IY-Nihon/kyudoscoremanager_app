/**
 * Module ID: 814
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 814);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.formatISO=o;var t=require("./module_805"),n=require("./module_701");function o(o,s){const c=(0,n.toDate)(o,s?.in);if(isNaN(+c))throw new RangeError("Invalid time value");const u=s?.format??"extended",f=s?.representation??"complete";let $="",l="";const Z="extended"===u?"-":"",L="extended"===u?":":"";if("time"!==f){const n=(0,t.addLeadingZeros)(c.getDate(),2),o=(0,t.addLeadingZeros)(c.getMonth()+1,2);$=`${(0,t.addLeadingZeros)(c.getFullYear(),4)}${Z}${o}${Z}${n}`}if("date"!==f){const n=c.getTimezoneOffset();if(0!==n){const o=Math.abs(n);l=`${n<0?"+":"-"}${(0,t.addLeadingZeros)(Math.trunc(o/60),2)}:${(0,t.addLeadingZeros)(o%60,2)}`}else l="Z";$=`${$}${""===$?"":"T"}${[(0,t.addLeadingZeros)(c.getHours(),2),(0,t.addLeadingZeros)(c.getMinutes(),2),(0,t.addLeadingZeros)(c.getSeconds(),2)].join(L)}${l}`}return $}var s=o