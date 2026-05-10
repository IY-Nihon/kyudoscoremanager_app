/**
 * Module ID: 271
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 271);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.createNavigatorFactory=function(c){const u=c.displayName??c.name??'Navigator';return function(f){if(null!=f){const p=(0,o.createComponentForStaticNavigation)({Navigator:c,Screen:n.Screen,Group:t.Group,config:f},u);return{config:f,with(t){const n=()=>e.createInteropElement(t,{Navigator:p});return n.displayName=`${u}With`,{config:f,getComponent:()=>n}},getComponent:()=>p}}return{Navigator:c,Screen:n.Screen,Group:t.Group}}};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_272"));require("./module_37");var t=require("./module_429"),n=require("./module_430"),o=require("./module_431")