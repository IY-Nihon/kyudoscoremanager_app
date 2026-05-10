/**
 * Module ID: 870
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 870);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"StandAloneQuarterParser",{enumerable:!0,get:function(){return o}});var t=require("./module_862"),n=require("./module_864");class o extends t.Parser{priority=120;parse(t,o,s){switch(o){case"q":case"qq":return(0,n.parseNDigits)(o.length,t);case"qo":return s.ordinalNumber(t,{unit:"quarter"});case"qqq":return s.quarter(t,{width:"abbreviated",context:"standalone"})||s.quarter(t,{width:"narrow",context:"standalone"});case"qqqqq":return s.quarter(t,{width:"narrow",context:"standalone"});default:return s.quarter(t,{width:"wide",context:"standalone"})||s.quarter(t,{width:"abbreviated",context:"standalone"})||s.quarter(t,{width:"narrow",context:"standalone"})}}validate(t,n){return n>=1&&n<=4}set(t,n,o){return t.setMonth(3*(o-1),1),t.setHours(0,0,0,0),t}incompatibleTokens=["Y","R","Q","M","L","w","I","d","D","i","e","c","t","T"]}