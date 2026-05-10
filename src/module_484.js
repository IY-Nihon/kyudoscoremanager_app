/**
 * Module ID: 484
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 484);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useOnGetState=function({getState:s,getStateListeners:u}){const{addKeyedListener:c}=e.useContext(n.NavigationBuilderContext),f=e.useContext(o.NavigationRouteContext),d=f?f.key:'root',l=e.useCallback(()=>{const e=s(),n=e.routes.map(e=>{const t=u[e.key]?.();return e.state===t?e:Object.assign({},e,{state:t})});return(0,t.isArrayEqual)(e.routes,n)?e:Object.assign({},e,{routes:n})},[s,u]);e.useEffect(()=>c?.('getState',d,l),[c,l,d])};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),t=require("./module_455"),n=require("./NavigationBuilderContext_257"),o=require("./NavigationRouteContext_435")