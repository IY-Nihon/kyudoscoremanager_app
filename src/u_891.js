/**
 * Module ID: 891
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 891);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"Hour1To24Parser",{enumerable:!0,get:function(){return u}});var t=require("./module_865"),n=require("./module_862"),s=require("./module_864");class u extends n.Parser{priority=70;parse(n,u,o){switch(u){case"k":return(0,s.parseNumericPattern)(t.numericPatterns.hour24h,n);case"ko":return o.ordinalNumber(n,{unit:"hour"});default:return(0,s.parseNDigits)(u.length,n)}}validate(t,n){return n>=1&&n<=24}set(t,n,s){const u=s<=24?s%24:s;return t.setHours(u,0,0,0),t}incompatibleTokens=["a","b","h","H","K","t","T"]}