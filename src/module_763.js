/**
 * Module ID: 763
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 763);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.eachHourOfInterval=u;var t=require("./module_762"),n=require("./module_699");function u(u,o){const{start:s,end:c}=(0,t.normalizeInterval)(o?.in,u);let f=+s>+c;const l=f?+s:+c,v=f?c:s;v.setMinutes(0,0,0);let p=o?.step??1;if(!p)return[];p<0&&(p=-p,f=!f);const _=[];for(;+v<=l;)_.push((0,n.constructFrom)(s,v)),v.setHours(v.getHours()+p);return f?_.reverse():_}var o=u