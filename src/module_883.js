/**
 * Module ID: 883
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 883);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"ISODayParser",{enumerable:!0,get:function(){return s}});var t=require("./module_884"),n=require("./module_862"),o=require("./module_864");class s extends n.Parser{priority=90;parse(t,n,s){const c=t=>0===t?7:t;switch(n){case"i":case"ii":return(0,o.parseNDigits)(n.length,t);case"io":return s.ordinalNumber(t,{unit:"day"});case"iii":return(0,o.mapValue)(s.day(t,{width:"abbreviated",context:"formatting"})||s.day(t,{width:"short",context:"formatting"})||s.day(t,{width:"narrow",context:"formatting"}),c);case"iiiii":return(0,o.mapValue)(s.day(t,{width:"narrow",context:"formatting"}),c);case"iiiiii":return(0,o.mapValue)(s.day(t,{width:"short",context:"formatting"})||s.day(t,{width:"narrow",context:"formatting"}),c);default:return(0,o.mapValue)(s.day(t,{width:"wide",context:"formatting"})||s.day(t,{width:"abbreviated",context:"formatting"})||s.day(t,{width:"short",context:"formatting"})||s.day(t,{width:"narrow",context:"formatting"}),c)}}validate(t,n){return n>=1&&n<=7}set(n,o,s){return(n=(0,t.setISODay)(n,s)).setHours(0,0,0,0),n}incompatibleTokens=["y","Y","u","q","Q","M","L","w","d","D","E","e","c","t","T"]}