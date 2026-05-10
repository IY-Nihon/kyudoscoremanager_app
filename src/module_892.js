/**
 * Module ID: 892
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 892);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"MinuteParser",{enumerable:!0,get:function(){return s}});var t=require("./module_865"),n=require("./module_862"),u=require("./module_864");class s extends n.Parser{priority=60;parse(n,s,c){switch(s){case"m":return(0,u.parseNumericPattern)(t.numericPatterns.minute,n);case"mo":return c.ordinalNumber(n,{unit:"minute"});default:return(0,u.parseNDigits)(s.length,n)}}validate(t,n){return n>=0&&n<=59}set(t,n,u){return t.setMinutes(u,0,0),t}incompatibleTokens=["t","T"]}