/**
 * Module ID: 871
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 871);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"MonthParser",{enumerable:!0,get:function(){return s}});var t=require("./module_865"),n=require("./module_862"),o=require("./module_864");class s extends n.Parser{incompatibleTokens=["Y","R","q","Q","L","w","I","D","i","e","c","t","T"];priority=110;parse(n,s,u){const c=t=>t-1;switch(s){case"M":return(0,o.mapValue)((0,o.parseNumericPattern)(t.numericPatterns.month,n),c);case"MM":return(0,o.mapValue)((0,o.parseNDigits)(2,n),c);case"Mo":return(0,o.mapValue)(u.ordinalNumber(n,{unit:"month"}),c);case"MMM":return u.month(n,{width:"abbreviated",context:"formatting"})||u.month(n,{width:"narrow",context:"formatting"});case"MMMMM":return u.month(n,{width:"narrow",context:"formatting"});default:return u.month(n,{width:"wide",context:"formatting"})||u.month(n,{width:"abbreviated",context:"formatting"})||u.month(n,{width:"narrow",context:"formatting"})}}validate(t,n){return n>=0&&n<=11}set(t,n,o){return t.setMonth(o,1),t.setHours(0,0,0,0),t}}