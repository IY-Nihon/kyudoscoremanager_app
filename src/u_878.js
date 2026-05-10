/**
 * Module ID: 878
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 878);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"DayOfYearParser",{enumerable:!0,get:function(){return u}});var t=require("./module_865"),n=require("./module_862"),s=require("./module_864");class u extends n.Parser{priority=90;subpriority=1;parse(n,u,c){switch(u){case"D":case"DD":return(0,s.parseNumericPattern)(t.numericPatterns.dayOfYear,n);case"Do":return c.ordinalNumber(n,{unit:"date"});default:return(0,s.parseNDigits)(u.length,n)}}validate(t,n){const u=t.getFullYear();return(0,s.isLeapYearIndex)(u)?n>=1&&n<=366:n>=1&&n<=365}set(t,n,s){return t.setMonth(0,s),t.setHours(0,0,0,0),t}incompatibleTokens=["Y","R","q","Q","M","L","w","I","d","E","i","e","c","t","T"]}