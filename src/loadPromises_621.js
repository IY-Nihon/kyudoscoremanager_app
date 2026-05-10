/**
 * Module ID: 621
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 621);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"loadPromises",{enumerable:!0,get:function(){return o}}),_e.markLoaded=function(e){u[e]=!0},_e.isLoadedInCache=c,_e.isLoadedNative=function(e){if(c(e))return!0;{const n=t.default.getLoadedFonts();return!!n?.length&&(n.forEach(e=>{u[e]=!0}),e in u)}},_e.purgeFontFamilyFromCache=function(e){delete u[e]},_e.purgeCache=function(){u={}};var e,n=require("./default_605"),t=(e=n)&&e.__esModule?e:{default:e};const o={};let u={};function c(e){return e in u}