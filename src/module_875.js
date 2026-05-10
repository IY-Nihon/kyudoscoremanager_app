/**
 * Module ID: 875
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 875);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"ISOWeekParser",{enumerable:!0,get:function(){return o}});var t=require("./module_876"),n=require("./module_711"),s=require("./module_865"),u=require("./module_862"),c=require("./module_864");class o extends u.Parser{priority=100;parse(t,n,u){switch(n){case"I":return(0,c.parseNumericPattern)(s.numericPatterns.week,t);case"Io":return u.ordinalNumber(t,{unit:"week"});default:return(0,c.parseNDigits)(n.length,t)}}validate(t,n){return n>=1&&n<=53}set(s,u,c){return(0,n.startOfISOWeek)((0,t.setISOWeek)(s,c))}incompatibleTokens=["y","Y","u","q","Q","M","L","w","d","D","e","c","t","T"]}