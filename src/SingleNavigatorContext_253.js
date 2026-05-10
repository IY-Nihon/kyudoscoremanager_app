/**
 * Module ID: 253
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 253);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"SingleNavigatorContext",{enumerable:!0,get:function(){return o}}),_e.EnsureSingleNavigator=function({children:u}){const c=e.useRef(void 0),s=e.useMemo(()=>({register(e){const t=c.current;if(void 0!==t&&e!==t)throw new Error(n);c.current=e},unregister(e){e===c.current&&(c.current=void 0)}}),[]);return(0,t.jsx)(o.Provider,{value:s,children:u})};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),t=require("./module_254");const n="Another navigator is already registered for this container. You likely have multiple navigators under a single \"NavigationContainer\" or \"Screen\". Make sure each navigator is under a separate \"Screen\" container. See https://reactnavigation.org/docs/nesting-navigators for a guide on nesting.",o=e.createContext(void 0)