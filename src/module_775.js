/**
 * Module ID: 775
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 775);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.eachYearOfInterval=u;var t=require("./module_762"),n=require("./module_699");function u(u,o){const{start:s,end:l}=(0,t.normalizeInterval)(o?.in,u);let c=+s>+l;const f=c?+s:+l,v=c?l:s;v.setHours(0,0,0,0),v.setMonth(0,1);let p=o?.step??1;if(!p)return[];p<0&&(p=-p,c=!c);const _=[];for(;+v<=f;)_.push((0,n.constructFrom)(s,v)),v.setFullYear(v.getFullYear()+p);return c?_.reverse():_}var o=u