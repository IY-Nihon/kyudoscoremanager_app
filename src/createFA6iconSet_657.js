/**
 * Module ID: 657
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 657);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"createFA6iconSet",{enumerable:!0,get:function(){return l}}),Object.defineProperty(_e,"FA6Style",{enumerable:!0,get:function(){return o}}),require("./module_98");var e,t=require("./default_650"),n=(e=t)&&e.__esModule?e:{default:e};const o={regular:'regular',light:'light',solid:'solid',brand:'brand',sharp:'sharp',sharpLight:'sharpLight',sharpSolid:'sharpSolid',duotone:'duotone',thin:'thin'};function l(e,t={},o,l=!1){const i=Object.keys(t),u="FontAwesome6"+(l?'Pro':'Free');function s(t,n,l=u){let i=t;const s=o[i];return'Brands'===i&&(i='Regular'),'Duotone'===i&&(i='Solid'),i=i.replace('Sharp_',''),{fontFamily:`${l}-${i}`,fontFile:s,fontStyle:{},glyphMap:e}}const h=s('Brands',0,'FontAwesome6Brands'),p=s('Light'),f=s('Regular'),c=s('Solid'),S=s('Sharp_Light',0,'FontAwesome6Sharp'),b=s('Sharp_Regular',0,'FontAwesome6Sharp'),F=s('Sharp_Solid',0,'FontAwesome6Sharp'),y=s('Duotone',0,'FontAwesome6Duotone'),_=s('Thin');return(0,n.default)({brand:h,light:p,regular:f,solid:c,sharp:b,sharpLight:S,sharpSolid:F,duotone:y,thin:_},{defaultStyle:'regular',fallbackFamily:function(e){for(let n=0;n<i.length;n+=1){const o=i[n];if(-1!==t[o].indexOf(e))return'brands'===o?'brand':o}return'regular'},glyphValidator:function(e,n){let o='brand'===n?'brands':n;return o='sharpSolid'===n?'sharp-solid':o,-1!==i.indexOf(o)&&-1!==t[o].indexOf(e)}})}