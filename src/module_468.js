/**
 * Module ID: 468
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 468);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useComponent=function(u){const c=e.useRef(u);return c.current=u,e.useEffect(()=>{c.current=null}),e.useRef(({children:e})=>{const u=c.current;if(null===u)throw new Error('The returned component must be rendered in the same render phase as the hook.');return(0,n.jsx)(t,{render:u,children:e})}).current};var e=(function(e){if(e&&e.__esModule)return e;var n={};return e&&Object.keys(e).forEach(function(t){var u=Object.getOwnPropertyDescriptor(e,t);Object.defineProperty(n,t,u.get?u:{enumerable:!0,get:function(){return e[t]}})}),n.default=e,n})(require("./module_37")),n=require("./module_254");const t=({render:e,children:n})=>e(n)