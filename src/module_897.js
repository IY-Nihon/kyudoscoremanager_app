/**
 * Module ID: 897
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 897);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"TimestampSecondsParser",{enumerable:!0,get:function(){return o}});var t=require("./module_699"),s=require("./module_862"),n=require("./module_864");class o extends s.Parser{priority=40;parse(t){return(0,n.parseAnyDigitsSigned)(t)}set(s,n,o){return[(0,t.constructFrom)(s,1e3*o),{timestampIsSet:!0}]}incompatibleTokens="*"}