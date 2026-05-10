/**
 * Module ID: 815
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 815);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.formatISO9075=s;var t=require("./module_805"),n=require("./module_737"),o=require("./module_701");function s(s,u){const c=(0,o.toDate)(s,u?.in);if(!(0,n.isValid)(c))throw new RangeError("Invalid time value");const $=u?.format??"extended",f=u?.representation??"complete";let l="";const L="extended"===$?"-":"",Z="extended"===$?":":"";if("time"!==f){const n=(0,t.addLeadingZeros)(c.getDate(),2),o=(0,t.addLeadingZeros)(c.getMonth()+1,2);l=`${(0,t.addLeadingZeros)(c.getFullYear(),4)}${L}${o}${L}${n}`}if("date"!==f){l=`${l}${""===l?"":" "}${(0,t.addLeadingZeros)(c.getHours(),2)}${Z}${(0,t.addLeadingZeros)(c.getMinutes(),2)}${Z}${(0,t.addLeadingZeros)(c.getSeconds(),2)}`}return l}var u=s