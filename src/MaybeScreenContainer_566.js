/**
 * Module ID: 566
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 566);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["enabled"],n=["enabled","active"];function t(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"MaybeScreenContainer",{enumerable:!0,get:function(){return b}}),_e.MaybeScreen=function(e){let{enabled:t,active:b}=e,f=(0,c.default)(e,n);if(u?.screensEnabled?.())return(0,l.jsx)(u.Screen,Object.assign({enabled:t,activityState:b},f));return(0,l.jsx)(s.default,Object.assign({},f))};var c=t(require("./module_130"));require("./module_37");var s=t(require("./default_144")),l=require("./module_254");let u;try{u=require("react-native-screens")}catch(e){}const b=n=>{let{enabled:t}=n,b=(0,c.default)(n,e);return u?.screensEnabled?.()?(0,l.jsx)(u.ScreenContainer,Object.assign({enabled:t},b)):(0,l.jsx)(s.default,Object.assign({},b))}