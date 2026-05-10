/**
 * Module ID: 986
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 986);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.sub=u;var t=require("./module_699"),n=require("./module_928"),s=require("./module_987");function u(u,o,c){const{years:b=0,months:f=0,weeks:y=0,days:l=0,hours:_=0,minutes:h=0,seconds:v=0}=o,j=(0,s.subMonths)(u,f+12*b,c),p=(0,n.subDays)(j,l+7*y,c),M=1e3*(v+60*(h+60*_));return(0,t.constructFrom)(c?.in||u,+p-M)}var o=u