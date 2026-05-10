/**
 * Module ID: 889
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 889);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"Hour0to23Parser",{enumerable:!0,get:function(){return s}});var t=require("./module_865"),n=require("./module_862"),u=require("./module_864");class s extends n.Parser{priority=70;parse(n,s,o){switch(s){case"H":return(0,u.parseNumericPattern)(t.numericPatterns.hour23h,n);case"Ho":return o.ordinalNumber(n,{unit:"hour"});default:return(0,u.parseNDigits)(s.length,n)}}validate(t,n){return n>=0&&n<=23}set(t,n,u){return t.setHours(u,0,0,0),t}incompatibleTokens=["a","b","h","K","k","t","T"]}