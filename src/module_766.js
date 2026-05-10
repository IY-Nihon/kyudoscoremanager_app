/**
 * Module ID: 766
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 766);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.eachQuarterOfInterval=f;var t=require("./module_762"),n=require("./module_721"),u=require("./module_699"),s=require("./module_767");function f(f,o){const{start:c,end:l}=(0,t.normalizeInterval)(o?.in,f);let O=+c>+l;const v=O?+(0,s.startOfQuarter)(c):+(0,s.startOfQuarter)(l);let Q=O?(0,s.startOfQuarter)(l):(0,s.startOfQuarter)(c),p=o?.step??1;if(!p)return[];p<0&&(p=-p,O=!O);const _=[];for(;+Q<=v;)_.push((0,u.constructFrom)(c,Q)),Q=(0,n.addQuarters)(Q,p);return O?_.reverse():_}var o=f