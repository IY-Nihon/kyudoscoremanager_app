/**
 * Module ID: 869
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 869);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"QuarterParser",{enumerable:!0,get:function(){return o}});var t=require("./module_862"),n=require("./module_864");class o extends t.Parser{priority=120;parse(t,o,u){switch(o){case"Q":case"QQ":return(0,n.parseNDigits)(o.length,t);case"Qo":return u.ordinalNumber(t,{unit:"quarter"});case"QQQ":return u.quarter(t,{width:"abbreviated",context:"formatting"})||u.quarter(t,{width:"narrow",context:"formatting"});case"QQQQQ":return u.quarter(t,{width:"narrow",context:"formatting"});default:return u.quarter(t,{width:"wide",context:"formatting"})||u.quarter(t,{width:"abbreviated",context:"formatting"})||u.quarter(t,{width:"narrow",context:"formatting"})}}validate(t,n){return n>=1&&n<=4}set(t,n,o){return t.setMonth(3*(o-1),1),t.setHours(0,0,0,0),t}incompatibleTokens=["Y","R","q","M","L","w","I","d","D","i","e","c","t","T"]}