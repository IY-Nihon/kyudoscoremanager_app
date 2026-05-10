/**
 * Module ID: 861
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 861);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"EraParser",{enumerable:!0,get:function(){return s}});var t=require("./module_862");class s extends t.Parser{priority=140;parse(t,s,n){switch(s){case"G":case"GG":case"GGG":return n.era(t,{width:"abbreviated"})||n.era(t,{width:"narrow"});case"GGGGG":return n.era(t,{width:"narrow"});default:return n.era(t,{width:"wide"})||n.era(t,{width:"abbreviated"})||n.era(t,{width:"narrow"})}}set(t,s,n){return s.era=n,t.setFullYear(n,0,1),t.setHours(0,0,0,0),t}incompatibleTokens=["R","u","t","T"]}