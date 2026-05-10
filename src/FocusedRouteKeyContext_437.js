/**
 * Module ID: 437
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 437);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"FocusedRouteKeyContext",{enumerable:!0,get:function(){return n}}),Object.defineProperty(_e,"IsFocusedContext",{enumerable:!0,get:function(){return o}}),_e.useIsFocused=function(){const n=e.useContext(o),u=(0,t.useNavigation)(),c=void 0!==n,s=e.useCallback(e=>{if(c)return()=>{};const t=u.addListener('focus',e),n=u.addListener('blur',e);return()=>{t(),n()}},[c,u]),d=e.useSyncExternalStore(s,u.isFocused,u.isFocused);return n??d};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),t=require("./module_438");const n=e.createContext(void 0),o=e.createContext(void 0)