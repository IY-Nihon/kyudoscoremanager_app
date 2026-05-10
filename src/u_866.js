/**
 * Module ID: 866
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 866);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"LocalWeekYearParser",{enumerable:!0,get:function(){return u}});var t=require("./module_804"),s=require("./module_712"),n=require("./module_862"),o=require("./module_864");class u extends n.Parser{priority=130;parse(t,s,n){const u=t=>({year:t,isTwoDigitYear:"YY"===s});switch(s){case"Y":return(0,o.mapValue)((0,o.parseNDigits)(4,t),u);case"Yo":return(0,o.mapValue)(n.ordinalNumber(t,{unit:"year"}),u);default:return(0,o.mapValue)((0,o.parseNDigits)(s.length,t),u)}}validate(t,s){return s.isTwoDigitYear||s.year>0}set(n,u,l,c){const Y=(0,t.getWeekYear)(n,c);if(l.isTwoDigitYear){const t=(0,o.normalizeTwoDigitYear)(l.year,Y);return n.setFullYear(t,0,c.firstWeekContainsDate),n.setHours(0,0,0,0),(0,s.startOfWeek)(n,c)}const f="era"in u&&1!==u.era?1-l.year:l.year;return n.setFullYear(f,0,c.firstWeekContainsDate),n.setHours(0,0,0,0),(0,s.startOfWeek)(n,c)}incompatibleTokens=["y","R","u","Q","q","M","L","I","d","D","i","t","T"]}