/**
 * Module ID: 894
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 894);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"FractionOfSecondParser",{enumerable:!0,get:function(){return s}});var t=require("./module_862"),n=require("./module_864");class s extends t.Parser{priority=30;parse(t,s){return(0,n.mapValue)((0,n.parseNDigits)(s.length,t),t=>Math.trunc(t*Math.pow(10,3-s.length)))}set(t,n,s){return t.setMilliseconds(s),t}incompatibleTokens=["t","T"]}