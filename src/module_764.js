/**
 * Module ID: 764
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 764);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.eachMinuteOfInterval=o;var t=require("./module_762"),n=require("./module_720"),u=require("./module_699");function o(o,s){const{start:c,end:f}=(0,t.normalizeInterval)(s?.in,o);c.setSeconds(0,0);let l=+c>+f;const v=l?+c:+f;let p=l?f:c,_=s?.step??1;if(!_)return[];_<0&&(_=-_,l=!l);const b=[];for(;+p<=v;)b.push((0,u.constructFrom)(c,p)),p=(0,n.addMinutes)(p,_);return l?b.reverse():b}var s=o