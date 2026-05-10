/**
 * Module ID: 877
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 877);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"DateParser",{enumerable:!0,get:function(){return o}});var t=require("./module_865"),n=require("./module_862"),s=require("./module_864");const u=[31,28,31,30,31,30,31,31,30,31,30,31],c=[31,29,31,30,31,30,31,31,30,31,30,31];class o extends n.Parser{priority=90;subPriority=1;parse(n,u,c){switch(u){case"d":return(0,s.parseNumericPattern)(t.numericPatterns.date,n);case"do":return c.ordinalNumber(n,{unit:"date"});default:return(0,s.parseNDigits)(u.length,n)}}validate(t,n){const o=t.getFullYear(),l=(0,s.isLeapYearIndex)(o),p=t.getMonth();return l?n>=1&&n<=c[p]:n>=1&&n<=u[p]}set(t,n,s){return t.setDate(s),t.setHours(0,0,0,0),t}incompatibleTokens=["Y","R","q","Q","w","I","D","i","e","c","t","T"]}