/**
 * Module ID: 753
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 753);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}}),e.differenceInMonths=s;var t=require("./module_717"),n=require("./module_731"),o=require("./module_741"),c=require("./module_754");function s(s,f,u){const[M,h,l]=(0,t.normalizeDates)(u?.in,s,s,f),p=(0,n.compareAsc)(h,l),b=Math.abs((0,o.differenceInCalendarMonths)(h,l));if(b<1)return 0;1===h.getMonth()&&h.getDate()>27&&h.setDate(30),h.setMonth(h.getMonth()-p*b);let D=(0,n.compareAsc)(h,l)===-p;(0,c.isLastDayOfMonth)(M)&&1===b&&1===(0,n.compareAsc)(M,l)&&(D=!1);const _=p*(b-+D);return 0===_?0:_}var f=s