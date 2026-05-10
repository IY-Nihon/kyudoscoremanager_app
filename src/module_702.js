/**
 * Module ID: 702
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 702);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.addMonths=o;var t=require("./module_699"),n=require("./module_701");function o(o,u,c){const s=(0,n.toDate)(o,c?.in);if(isNaN(u))return(0,t.constructFrom)(c?.in||o,NaN);if(!u)return s;const f=s.getDate(),l=(0,t.constructFrom)(c?.in||o,s.getTime());l.setMonth(s.getMonth()+u+1,0);return f>=l.getDate()?l:(s.setFullYear(l.getFullYear(),l.getMonth(),f),s)}var u=o