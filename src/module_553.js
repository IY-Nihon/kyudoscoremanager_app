/**
 * Module ID: 553
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 553);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.Lazy=function({enabled:t,visible:n,children:u}){const[c,l]=e.useState(!!t&&n),f=!(t||n||c);if(e.useEffect(()=>{if(!1===f)return;const e=requestIdleCallback(()=>{l(!0)});return()=>cancelIdleCallback(e)},[f]),n&&!1===c)return l(!0),u;if(c)return u;return null};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37"))