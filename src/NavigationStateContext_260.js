/**
 * Module ID: 260
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 260);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"NavigationStateContext",{enumerable:!0,get:function(){return n}});var t=(function(t){if(t&&t.__esModule)return t;var e={};return t&&Object.keys(t).forEach(function(n){var o=Object.getOwnPropertyDescriptor(t,n);Object.defineProperty(e,n,o.get?o:{enumerable:!0,get:function(){return t[n]}})}),e.default=t,e})(require("./module_37"));const e="Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'? See https://reactnavigation.org/docs/getting-started for setup instructions.",n=t.createContext({isDefault:!0,get getKey(){throw new Error(e)},get setKey(){throw new Error(e)},get getState(){throw new Error(e)},get setState(){throw new Error(e)},get getIsInitial(){throw new Error(e)}})