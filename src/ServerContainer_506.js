/**
 * Module ID: 506
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 506);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"ServerContainer",{enumerable:!0,get:function(){return c}});var e=require("./module_235"),t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),n=require("./ServerContext_502"),o=require("./module_254");const c=t.forwardRef(function({children:c,location:u},f){t.useEffect(()=>{console.error("'ServerContainer' should only be used on the server with 'react-dom/server' for SSR.")},[]);const s={};if(f){const e={getCurrentOptions:()=>s.options};'function'==typeof f?f(e):f.current=e}return(0,o.jsx)(n.ServerContext.Provider,{value:{location:u},children:(0,o.jsx)(e.CurrentRenderContext.Provider,{value:s,children:c})})})