/**
 * Module ID: 649
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 649);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"FA5Style",{enumerable:!0,get:function(){return l}}),_e.createFA5iconSet=function(e,t={},l,o=!1){const i=Object.keys(t),u="FontAwesome5"+(o?'Pro':'Free');function f(t,n,o=u){return{fontFamily:`${o}-${t}`,fontFile:l[t],fontStyle:{},glyphMap:e}}const c=f('Brand'),s=f('Light'),b=f('Regular'),y=f('Solid');return(0,n.default)({brand:c,light:s,regular:b,solid:y},{defaultStyle:'regular',fallbackFamily:function(e){for(let n=0;n<i.length;n+=1){const l=i[n];if(-1!==t[l].indexOf(e))return'brands'===l?'brand':l}return'regular'},glyphValidator:function(e,n){const l='brand'===n?'brands':n;return-1!==i.indexOf(l)&&-1!==t[l].indexOf(e)}})},require("./module_98");var e,t=require("./default_650"),n=(e=t)&&e.__esModule?e:{default:e};const l={regular:'regular',light:'light',solid:'solid',brand:'brand'}