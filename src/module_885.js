/**
 * Module ID: 885
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 885);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"AMPMParser",{enumerable:!0,get:function(){return n}});var t=require("./module_862"),o=require("./module_864");class n extends t.Parser{priority=80;parse(t,o,n){switch(o){case"a":case"aa":case"aaa":return n.dayPeriod(t,{width:"abbreviated",context:"formatting"})||n.dayPeriod(t,{width:"narrow",context:"formatting"});case"aaaaa":return n.dayPeriod(t,{width:"narrow",context:"formatting"});default:return n.dayPeriod(t,{width:"wide",context:"formatting"})||n.dayPeriod(t,{width:"abbreviated",context:"formatting"})||n.dayPeriod(t,{width:"narrow",context:"formatting"})}}set(t,n,s){return t.setHours((0,o.dayPeriodEnumToHours)(s),0,0,0),t}incompatibleTokens=["b","B","H","k","t","T"]}