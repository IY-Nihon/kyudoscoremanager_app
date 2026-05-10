/**
 * Module ID: 863
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 863);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"YearParser",{enumerable:!0,get:function(){return n}});var t=require("./module_862"),s=require("./module_864");class n extends t.Parser{priority=130;incompatibleTokens=["Y","R","u","w","I","i","e","c","t","T"];parse(t,n,u){const o=t=>({year:t,isTwoDigitYear:"yy"===n});switch(n){case"y":return(0,s.mapValue)((0,s.parseNDigits)(4,t),o);case"yo":return(0,s.mapValue)(u.ordinalNumber(t,{unit:"year"}),o);default:return(0,s.mapValue)((0,s.parseNDigits)(n.length,t),o)}}validate(t,s){return s.isTwoDigitYear||s.year>0}set(t,n,u){const o=t.getFullYear();if(u.isTwoDigitYear){const n=(0,s.normalizeTwoDigitYear)(u.year,o);return t.setFullYear(n,0,1),t.setHours(0,0,0,0),t}const l="era"in n&&1!==n.era?1-u.year:u.year;return t.setFullYear(l,0,1),t.setHours(0,0,0,0),t}}