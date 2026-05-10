/**
 * Module ID: 896
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 896);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"ISOTimezoneParser",{enumerable:!0,get:function(){return u}});var t=require("./module_699"),n=require("./module_716"),s=require("./module_865"),o=require("./module_862"),c=require("./module_864");class u extends o.Parser{priority=10;parse(t,n){switch(n){case"x":return(0,c.parseTimezonePattern)(s.timezonePatterns.basicOptionalMinutes,t);case"xx":return(0,c.parseTimezonePattern)(s.timezonePatterns.basic,t);case"xxxx":return(0,c.parseTimezonePattern)(s.timezonePatterns.basicOptionalSeconds,t);case"xxxxx":return(0,c.parseTimezonePattern)(s.timezonePatterns.extendedOptionalSeconds,t);default:return(0,c.parseTimezonePattern)(s.timezonePatterns.extended,t)}}set(s,o,c){return o.timestampIsSet?s:(0,t.constructFrom)(s,s.getTime()-(0,n.getTimezoneOffsetInMilliseconds)(s)-c)}incompatibleTokens=["t","T","X"]}