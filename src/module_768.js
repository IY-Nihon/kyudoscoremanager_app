/**
 * Module ID: 768
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 768);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.eachWeekOfInterval=u;var t=require("./module_762"),s=require("./module_723"),n=require("./module_699"),o=require("./module_712");function u(u,c){const{start:f,end:l}=(0,t.normalizeInterval)(c?.in,u);let O=+f>+l;const k=O?(0,o.startOfWeek)(l,c):(0,o.startOfWeek)(f,c),v=O?(0,o.startOfWeek)(f,c):(0,o.startOfWeek)(l,c);k.setHours(15),v.setHours(15);const W=+v.getTime();let p=k,H=c?.step??1;if(!H)return[];H<0&&(H=-H,O=!O);const _=[];for(;+p<=W;)p.setHours(0),_.push((0,n.constructFrom)(f,p)),p=(0,s.addWeeks)(p,H),p.setHours(15);return O?_.reverse():_}var c=u