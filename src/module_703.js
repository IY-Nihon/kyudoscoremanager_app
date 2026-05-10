/**
 * Module ID: 703
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 703);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return D}}),e.addBusinessDays=c;var t=require("./module_699"),s=require("./module_704"),n=require("./module_705"),u=require("./module_706"),o=require("./module_701");function c(c,D,f){const l=(0,o.toDate)(c,f?.in),y=(0,u.isWeekend)(l,f);if(isNaN(D))return(0,t.constructFrom)(f?.in,NaN);const b=l.getHours(),N=D<0?-1:1,_=Math.trunc(D/5);l.setDate(l.getDate()+7*_);let k=Math.abs(D%5);for(;k>0;)l.setDate(l.getDate()+N),(0,u.isWeekend)(l,f)||(k-=1);return y&&(0,u.isWeekend)(l,f)&&0!==D&&((0,s.isSaturday)(l,f)&&l.setDate(l.getDate()+(N<0?2:-1)),(0,n.isSunday)(l,f)&&l.setDate(l.getDate()+(N<0?1:-2))),l.setHours(b),l}var D=c