/**
 * Module ID: 868
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 868);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"ExtendedYearParser",{enumerable:!0,get:function(){return n}});var t=require("./module_862"),s=require("./module_864");class n extends t.Parser{priority=130;parse(t,n){return"u"===n?(0,s.parseNDigitsSigned)(4,t):(0,s.parseNDigitsSigned)(n.length,t)}set(t,s,n){return t.setFullYear(n,0,1),t.setHours(0,0,0,0),t}incompatibleTokens=["G","y","Y","R","w","I","i","e","c","t","T"]}