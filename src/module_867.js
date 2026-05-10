/**
 * Module ID: 867
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 867);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"ISOWeekYearParser",{enumerable:!0,get:function(){return o}});var t=require("./module_711"),s=require("./module_699"),n=require("./module_862"),u=require("./module_864");class o extends n.Parser{priority=130;parse(t,s){return"R"===s?(0,u.parseNDigitsSigned)(4,t):(0,u.parseNDigitsSigned)(s.length,t)}set(n,u,o){const c=(0,s.constructFrom)(n,0);return c.setFullYear(o,0,4),c.setHours(0,0,0,0),(0,t.startOfISOWeek)(c)}incompatibleTokens=["G","y","Y","u","Q","q","M","L","w","d","D","e","c","t","T"]}