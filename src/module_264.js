/**
 * Module ID: 264
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 264);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useChildListeners=function(){const{current:t}=e.useRef({action:[],focus:[]}),n=e.useCallback((e,n)=>{t[e].push(n);let u=!1;return()=>{const c=t[e].indexOf(n);!u&&c>-1&&(u=!0,t[e].splice(c,1))}},[t]);return{listeners:t,addListener:n}};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37"))