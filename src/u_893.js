/**
 * Module ID: 893
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 893);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"SecondParser",{enumerable:!0,get:function(){return u}});var t=require("./module_865"),n=require("./module_862"),s=require("./module_864");class u extends n.Parser{priority=50;parse(n,u,c){switch(u){case"s":return(0,s.parseNumericPattern)(t.numericPatterns.second,n);case"so":return c.ordinalNumber(n,{unit:"second"});default:return(0,s.parseNDigits)(u.length,n)}}validate(t,n){return n>=0&&n<=59}set(t,n,s){return t.setSeconds(s,0),t}incompatibleTokens=["t","T"]}