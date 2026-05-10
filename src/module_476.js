/**
 * Module ID: 476
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 476);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useFocusEvents=function({state:u,emitter:n}){const o=e.useContext(t.NavigationContext),c=e.useRef(void 0),s=u.routes[u.index].key;e.useEffect(()=>o?.addListener('focus',()=>{c.current=s,n.emit({type:'focus',target:s})}),[s,n,o]),e.useEffect(()=>o?.addListener('blur',()=>{c.current=void 0,n.emit({type:'blur',target:s})}),[s,n,o]),e.useEffect(()=>{const e=c.current;c.current=s,void 0!==e||o||n.emit({type:'focus',target:s}),e===s||o&&!o.isFocused()||void 0!==e&&(n.emit({type:'blur',target:e}),n.emit({type:'focus',target:s}))},[s,n,o])};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(u){var n=Object.getOwnPropertyDescriptor(e,u);Object.defineProperty(t,u,n.get?n:{enumerable:!0,get:function(){return e[u]}})}),t.default=e,t})(require("./module_37")),t=require("./NavigationContext_436")