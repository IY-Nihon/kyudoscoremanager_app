/**
 * Module ID: 497
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 497);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"UnhandledLinkingContext",{enumerable:!0,get:function(){return t}});var e=(function(e){if(e&&e.__esModule)return e;var n={};return e&&Object.keys(e).forEach(function(t){var o=Object.getOwnPropertyDescriptor(e,t);Object.defineProperty(n,t,o.get?o:{enumerable:!0,get:function(){return e[t]}})}),n.default=e,n})(require("./module_37"));const n="Couldn't find an UnhandledLinkingContext context.",t=e.createContext({get lastUnhandledLink(){throw new Error(n)},get setLastUnhandledLink(){throw new Error(n)}});t.displayName='UnhandledLinkingContext'