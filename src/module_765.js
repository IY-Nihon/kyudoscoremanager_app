/**
 * Module ID: 765
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 765);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.eachMonthOfInterval=o;var t=require("./module_762"),n=require("./module_699");function o(o,s){const{start:u,end:c}=(0,t.normalizeInterval)(s?.in,o);let f=+u>+c;const l=f?+u:+c,v=f?c:u;v.setHours(0,0,0,0),v.setDate(1);let h=s?.step??1;if(!h)return[];h<0&&(h=-h,f=!f);const p=[];for(;+v<=l;)p.push((0,n.constructFrom)(u,v)),v.setMonth(v.getMonth()+h);return f?p.reverse():p}var s=o