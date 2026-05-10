/**
 * Module ID: 697
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 697);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.add=u;var t=require("./module_698"),n=require("./module_702"),s=require("./module_699"),o=require("./module_701");function u(u,c,f){const{years:y=0,months:l=0,weeks:_=0,days:b=0,hours:h=0,minutes:v=0,seconds:j=0}=c,p=(0,o.toDate)(u,f?.in),D=l||y?(0,n.addMonths)(p,l+12*y):p,M=b||_?(0,t.addDays)(D,b+7*_):D,O=1e3*(j+60*(v+60*h));return(0,s.constructFrom)(f?.in||u,+M+O)}var c=u