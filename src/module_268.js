/**
 * Module ID: 268
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 268);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useOptionsGetters=function({key:u,options:c,navigation:o}){const s=e.useRef(c),l=e.useRef({}),{onOptionsChange:f}=e.useContext(t.NavigationBuilderContext),{addOptionsGetter:d}=e.useContext(n.NavigationStateContext),O=e.useCallback(()=>{const e=o?.isFocused()??!0,t=Object.keys(l.current).length;e&&!t&&f(s.current??{})},[o,f]);e.useEffect(()=>(s.current=c,O(),o?.addListener('focus',O)),[o,c,O]);const b=e.useCallback(()=>{for(const e in l.current)if(e in l.current){const t=l.current[e]?.();if(null!==t)return t}return null},[]),p=e.useCallback(()=>{if(!(o?.isFocused()??!0))return null;const e=b();return null!==e?e:s.current},[o,b]);e.useEffect(()=>d?.(u,p),[p,d,u]);return{addOptionsGetter:e.useCallback((e,t)=>(l.current[e]=t,O(),()=>{delete l.current[e],O()}),[O]),getCurrentOptions:p}};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),t=require("./NavigationBuilderContext_257"),n=require("./NavigationStateContext_260")