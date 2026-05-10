/**
 * Module ID: 834
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 834);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return a}}),e.getOverlappingDaysInIntervals=s;var t=require("./module_716"),n=require("./module_700"),o=require("./module_701");function s(s,a){const[l,c]=[+(0,o.toDate)(s.start),+(0,o.toDate)(s.end)].sort((t,n)=>t-n),[f,u]=[+(0,o.toDate)(a.start),+(0,o.toDate)(a.end)].sort((t,n)=>t-n);if(!(l<u&&f<c))return 0;const D=f<l?l:f,v=D-(0,t.getTimezoneOffsetInMilliseconds)(D),I=u>c?c:u,O=I-(0,t.getTimezoneOffsetInMilliseconds)(I);return Math.ceil((O-v)/n.millisecondsInDay)}var a=s