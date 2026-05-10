/**
 * Module ID: 473
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 473);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"StaticContainer",{enumerable:!0,get:function(){return e}});const e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var c=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,c.get?c:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")).memo(function(e){return e.children},(e,t)=>{const n=Object.keys(e),c=Object.keys(t);if(n.length!==c.length)return!1;for(const c of n)if('children'!==c&&e[c]!==t[c])return!1;return!0})