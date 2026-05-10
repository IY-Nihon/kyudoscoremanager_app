/**
 * Module ID: 563
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 563);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useIsKeyboardShown=function(){const[e,n]=t.useState(!1);return t.useEffect(()=>{const e=()=>n(!0),t=()=>n(!1);let o;return o=[u.default.addListener('keyboardDidShow',e),u.default.addListener('keyboardDidHide',t)],()=>{o.forEach(e=>e.remove())}},[]),e};var e,t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),n=require("./default_371"),u=(e=n)&&e.__esModule?e:{default:e};require("./module_98")