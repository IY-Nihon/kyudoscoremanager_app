/**
 * Module ID: 435
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 435);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"NavigationRouteContext",{enumerable:!0,get:function(){return u}}),Object.defineProperty(_e,"NamedRouteContextListContext",{enumerable:!0,get:function(){return c}}),_e.NavigationProvider=function({route:c,navigation:d,children:s}){const v=e.useContext(n.IsFocusedContext),l=e.useContext(n.FocusedRouteKeyContext),f=!(null!=v&&!v)&&l===c.key;return(0,o.jsx)(u.Provider,{value:c,children:(0,o.jsx)(t.NavigationContext.Provider,{value:d,children:(0,o.jsx)(n.IsFocusedContext.Provider,{value:f,children:s})})})};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),t=require("./NavigationContext_436"),n=require("./FocusedRouteKeyContext_437"),o=require("./module_254");const u=e.createContext(void 0),c=e.createContext(void 0)