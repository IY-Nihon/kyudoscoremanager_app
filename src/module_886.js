/**
 * Module ID: 886
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 886);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"AMPMMidnightParser",{enumerable:!0,get:function(){return n}});var t=require("./module_862"),o=require("./module_864");class n extends t.Parser{priority=80;parse(t,o,n){switch(o){case"b":case"bb":case"bbb":return n.dayPeriod(t,{width:"abbreviated",context:"formatting"})||n.dayPeriod(t,{width:"narrow",context:"formatting"});case"bbbbb":return n.dayPeriod(t,{width:"narrow",context:"formatting"});default:return n.dayPeriod(t,{width:"wide",context:"formatting"})||n.dayPeriod(t,{width:"abbreviated",context:"formatting"})||n.dayPeriod(t,{width:"narrow",context:"formatting"})}}set(t,n,b){return t.setHours((0,o.dayPeriodEnumToHours)(b),0,0,0),t}incompatibleTokens=["a","B","H","k","t","T"]}