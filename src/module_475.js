/**
 * Module ID: 475
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 475);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useFocusedListenersChildrenAdapter=function({navigation:n,focusedListeners:u}){const{addListener:s}=e.useContext(t.NavigationBuilderContext),o=e.useCallback(e=>{if(n.isFocused()){for(const t of u){const{handled:n,result:u}=t(e);if(n)return{handled:n,result:u}}return{handled:!0,result:e(n)}}return{handled:!1,result:null}},[u,n]);e.useEffect(()=>s?.('focus',o),[s,o])};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),t=require("./NavigationBuilderContext_257")