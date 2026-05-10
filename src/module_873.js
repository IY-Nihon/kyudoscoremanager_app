/**
 * Module ID: 873
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 873);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"LocalWeekParser",{enumerable:!0,get:function(){return o}});var t=require("./module_874"),n=require("./module_712"),s=require("./module_865"),u=require("./module_862"),c=require("./module_864");class o extends u.Parser{priority=100;parse(t,n,u){switch(n){case"w":return(0,c.parseNumericPattern)(s.numericPatterns.week,t);case"wo":return u.ordinalNumber(t,{unit:"week"});default:return(0,c.parseNDigits)(n.length,t)}}validate(t,n){return n>=1&&n<=53}set(s,u,c,o){return(0,n.startOfWeek)((0,t.setWeek)(s,c,o),o)}incompatibleTokens=["y","R","u","q","Q","M","L","I","d","D","i","t","T"]}