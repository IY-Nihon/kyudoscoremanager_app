/**
 * Module ID: 769
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 769);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return l}}),e.eachWeekendOfInterval=u;var t=require("./module_762"),n=require("./module_699"),c=require("./module_761"),o=require("./module_706");function u(u,l){const{start:s,end:f}=(0,t.normalizeInterval)(l?.in,u),v=(0,c.eachDayOfInterval)({start:s,end:f},l),h=[];let O=0;for(;O<v.length;){const t=v[O++];(0,o.isWeekend)(t)&&h.push((0,n.constructFrom)(s,t))}return h}var l=u