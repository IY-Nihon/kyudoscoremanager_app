/**
 * Module ID: 882
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 882);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"StandAloneLocalDayParser",{enumerable:!0,get:function(){return o}});var t=require("./module_880"),n=require("./module_862"),c=require("./module_864");class o extends n.Parser{priority=90;parse(t,n,o,s){const l=t=>{const n=7*Math.floor((t-1)/7);return(t+s.weekStartsOn+6)%7+n};switch(n){case"c":case"cc":return(0,c.mapValue)((0,c.parseNDigits)(n.length,t),l);case"co":return(0,c.mapValue)(o.ordinalNumber(t,{unit:"day"}),l);case"ccc":return o.day(t,{width:"abbreviated",context:"standalone"})||o.day(t,{width:"short",context:"standalone"})||o.day(t,{width:"narrow",context:"standalone"});case"ccccc":return o.day(t,{width:"narrow",context:"standalone"});case"cccccc":return o.day(t,{width:"short",context:"standalone"})||o.day(t,{width:"narrow",context:"standalone"});default:return o.day(t,{width:"wide",context:"standalone"})||o.day(t,{width:"abbreviated",context:"standalone"})||o.day(t,{width:"short",context:"standalone"})||o.day(t,{width:"narrow",context:"standalone"})}}validate(t,n){return n>=0&&n<=6}set(n,c,o,s){return(n=(0,t.setDay)(n,o,s)).setHours(0,0,0,0),n}incompatibleTokens=["y","R","u","q","Q","M","L","I","d","D","E","i","e","t","T"]}