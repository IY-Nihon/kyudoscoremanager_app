/**
 * Module ID: 423
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const _r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 423);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const t=["style","mode","edges"];function e(t){return t&&t.__esModule?t:{default:t}}function r(t){if(t&&t.__esModule)return t;var e={};return t&&Object.keys(t).forEach(function(r){var n=Object.getOwnPropertyDescriptor(t,r);Object.defineProperty(e,r,n.get?n:{enumerable:!0,get:function(){return t[r]}})}),e.default=t,e}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"SafeAreaView",{enumerable:!0,get:function(){return b}});var n=e(require("./module_130")),o=r(require("./module_272")),d=r(require("./module_37")),f=e(require("./default_45")),u=e(require("./default_144")),l=require("./SafeAreaInsetsContext_421");function c(){return c=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var n in r)({}).hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t},c.apply(null,arguments)}const s={top:'additive',left:'additive',bottom:'additive',right:'additive'};function p(t,e,r){switch(r){case'off':return e;case'maximum':return Math.max(e,t);default:return e+t}}const b=d.forwardRef((e,r)=>{let{style:b={},mode:h,edges:v}=e,y=(0,n.default)(e,t);const O=(0,l.useSafeAreaInsets)(),_=d.useMemo(()=>null==v?s:Array.isArray(v)?v.reduce((t,e)=>(t[e]='additive',t),{}):v,[v]),j=d.useMemo(()=>{const t=f.default.flatten(b);if('margin'===h){const{margin:e=0,marginVertical:r=e,marginHorizontal:n=e,marginTop:o=r,marginRight:d=n,marginBottom:f=r,marginLeft:u=n}=t,l={marginTop:p(O.top,o,_.top),marginRight:p(O.right,d,_.right),marginBottom:p(O.bottom,f,_.bottom),marginLeft:p(O.left,u,_.left)};return[b,l]}{const{padding:e=0,paddingVertical:r=e,paddingHorizontal:n=e,paddingTop:o=r,paddingRight:d=n,paddingBottom:f=r,paddingLeft:u=n}=t,l={paddingTop:p(O.top,o,_.top),paddingRight:p(O.right,d,_.right),paddingBottom:p(O.bottom,f,_.bottom),paddingLeft:p(O.left,u,_.left)};return[b,l]}},[_.bottom,_.left,_.right,_.top,O.bottom,O.left,O.right,O.top,h,b]);return o.createInteropElement(u.default,c({style:j},y,{ref:r}))})