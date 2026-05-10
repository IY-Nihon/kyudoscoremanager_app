/**
 * Module ID: 898
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 898);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"TimestampMillisecondsParser",{enumerable:!0,get:function(){return o}});var t=require("./module_699"),s=require("./module_862"),n=require("./module_864");class o extends s.Parser{priority=20;parse(t){return(0,n.parseAnyDigitsSigned)(t)}set(s,n,o){return[(0,t.constructFrom)(s,o),{timestampIsSet:!0}]}incompatibleTokens="*"}