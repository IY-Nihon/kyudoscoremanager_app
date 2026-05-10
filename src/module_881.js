/**
 * Module ID: 881
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 881);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"LocalDayParser",{enumerable:!0,get:function(){return s}});var t=require("./module_880"),n=require("./module_862"),o=require("./module_864");class s extends n.Parser{priority=90;parse(t,n,s,c){const u=t=>{const n=7*Math.floor((t-1)/7);return(t+c.weekStartsOn+6)%7+n};switch(n){case"e":case"ee":return(0,o.mapValue)((0,o.parseNDigits)(n.length,t),u);case"eo":return(0,o.mapValue)(s.ordinalNumber(t,{unit:"day"}),u);case"eee":return s.day(t,{width:"abbreviated",context:"formatting"})||s.day(t,{width:"short",context:"formatting"})||s.day(t,{width:"narrow",context:"formatting"});case"eeeee":return s.day(t,{width:"narrow",context:"formatting"});case"eeeeee":return s.day(t,{width:"short",context:"formatting"})||s.day(t,{width:"narrow",context:"formatting"});default:return s.day(t,{width:"wide",context:"formatting"})||s.day(t,{width:"abbreviated",context:"formatting"})||s.day(t,{width:"short",context:"formatting"})||s.day(t,{width:"narrow",context:"formatting"})}}validate(t,n){return n>=0&&n<=6}set(n,o,s,c){return(n=(0,t.setDay)(n,s,c)).setHours(0,0,0,0),n}incompatibleTokens=["y","R","u","q","Q","M","L","I","d","D","E","i","c","t","T"]}