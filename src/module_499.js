/**
 * Module ID: 499
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 499);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useDocumentTitle=function(t,{enabled:n=!0,formatter:u=(e,t)=>e?.title??t?.name}={}){e.useEffect(()=>{if(!n)return;const e=t.current;if(e){const t=u(e.getCurrentOptions(),e.getCurrentRoute());document.title=t}return e?.addListener('options',t=>{const n=u(t.data.options,e?.getCurrentRoute());document.title=n})})};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37"))