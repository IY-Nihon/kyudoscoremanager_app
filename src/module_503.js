/**
 * Module ID: 503
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 503);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useThenable=function(t){const[n]=e.useState(t);let u=[!1,void 0];n.then(e=>{u=[!0,e]});const[c,o]=e.useState(u),[f]=c;return e.useEffect(()=>{let e=!1;return f||(async()=>{let t;try{t=await n}finally{e||o([!0,t])}})(),()=>{e=!0}},[n,f]),c};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37"))