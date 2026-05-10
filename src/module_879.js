/**
 * Module ID: 879
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 879);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"DayParser",{enumerable:!0,get:function(){return o}});var t=require("./module_880"),n=require("./module_862");class o extends n.Parser{priority=90;parse(t,n,o){switch(n){case"E":case"EE":case"EEE":return o.day(t,{width:"abbreviated",context:"formatting"})||o.day(t,{width:"short",context:"formatting"})||o.day(t,{width:"narrow",context:"formatting"});case"EEEEE":return o.day(t,{width:"narrow",context:"formatting"});case"EEEEEE":return o.day(t,{width:"short",context:"formatting"})||o.day(t,{width:"narrow",context:"formatting"});default:return o.day(t,{width:"wide",context:"formatting"})||o.day(t,{width:"abbreviated",context:"formatting"})||o.day(t,{width:"short",context:"formatting"})||o.day(t,{width:"narrow",context:"formatting"})}}validate(t,n){return n>=0&&n<=6}set(n,o,c,s){return(n=(0,t.setDay)(n,c,s)).setHours(0,0,0,0),n}incompatibleTokens=["D","i","e","c","t","T"]}