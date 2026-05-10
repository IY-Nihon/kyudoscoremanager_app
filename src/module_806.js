/**
 * Module ID: 806
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 806);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"lightFormatters",{enumerable:!0,get:function(){return n}});var t=require("./module_805");const n={y(n,s){const o=n.getFullYear(),u=o>0?o:1-o;return(0,t.addLeadingZeros)("yy"===s?u%100:u,s.length)},M(n,s){const o=n.getMonth();return"M"===s?String(o+1):(0,t.addLeadingZeros)(o+1,2)},d:(n,s)=>(0,t.addLeadingZeros)(n.getDate(),s.length),a(t,n){const s=t.getHours()/12>=1?"pm":"am";switch(n){case"a":case"aa":return s.toUpperCase();case"aaa":return s;case"aaaaa":return s[0];default:return"am"===s?"a.m.":"p.m."}},h:(n,s)=>(0,t.addLeadingZeros)(n.getHours()%12||12,s.length),H:(n,s)=>(0,t.addLeadingZeros)(n.getHours(),s.length),m:(n,s)=>(0,t.addLeadingZeros)(n.getMinutes(),s.length),s:(n,s)=>(0,t.addLeadingZeros)(n.getSeconds(),s.length),S(n,s){const o=s.length,u=n.getMilliseconds(),c=Math.trunc(u*Math.pow(10,o-3));return(0,t.addLeadingZeros)(c,s.length)}}