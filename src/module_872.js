/**
 * Module ID: 872
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 872);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"StandAloneMonthParser",{enumerable:!0,get:function(){return s}});var t=require("./module_865"),n=require("./module_862"),o=require("./module_864");class s extends n.Parser{priority=110;parse(n,s,u){const c=t=>t-1;switch(s){case"L":return(0,o.mapValue)((0,o.parseNumericPattern)(t.numericPatterns.month,n),c);case"LL":return(0,o.mapValue)((0,o.parseNDigits)(2,n),c);case"Lo":return(0,o.mapValue)(u.ordinalNumber(n,{unit:"month"}),c);case"LLL":return u.month(n,{width:"abbreviated",context:"standalone"})||u.month(n,{width:"narrow",context:"standalone"});case"LLLLL":return u.month(n,{width:"narrow",context:"standalone"});default:return u.month(n,{width:"wide",context:"standalone"})||u.month(n,{width:"abbreviated",context:"standalone"})||u.month(n,{width:"narrow",context:"standalone"})}}validate(t,n){return n>=0&&n<=11}set(t,n,o){return t.setMonth(o,1),t.setHours(0,0,0,0),t}incompatibleTokens=["Y","R","q","Q","M","w","I","D","i","e","c","t","T"]}