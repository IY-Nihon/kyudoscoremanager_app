/**
 * Module ID: 746
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 746);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.differenceInDays=s;var t=require("./module_717"),n=require("./module_715");function s(s,u,c){const[l,f]=(0,t.normalizeDates)(c?.in,s,u),M=o(l,f),D=Math.abs((0,n.differenceInCalendarDays)(l,f));l.setDate(l.getDate()-M*D);const b=M*(D-Number(o(l,f)===-M));return 0===b?0:b}function o(t,n){const s=t.getFullYear()-n.getFullYear()||t.getMonth()-n.getMonth()||t.getDate()-n.getDate()||t.getHours()-n.getHours()||t.getMinutes()-n.getMinutes()||t.getSeconds()-n.getSeconds()||t.getMilliseconds()-n.getMilliseconds();return s<0?-1:s>0?1:s}var u=s