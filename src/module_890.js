/**
 * Module ID: 890
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 890);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"Hour0To11Parser",{enumerable:!0,get:function(){return n}});var t=require("./module_865"),s=require("./module_862"),u=require("./module_864");class n extends s.Parser{priority=70;parse(s,n,o){switch(n){case"K":return(0,u.parseNumericPattern)(t.numericPatterns.hour11h,s);case"Ko":return o.ordinalNumber(s,{unit:"hour"});default:return(0,u.parseNDigits)(n.length,s)}}validate(t,s){return s>=0&&s<=11}set(t,s,u){return t.getHours()>=12&&u<12?t.setHours(u+12,0,0,0):t.setHours(u,0,0,0),t}incompatibleTokens=["h","H","k","t","T"]}