/**
 * Module ID: 561
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 561);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useAnimatedHashMap=function({routes:e,index:n}){const c=t.useRef({}),o=c.current,f=Object.keys(o);if(e.length===f.length&&e.every(e=>f.includes(e.key)))return o;return c.current={},e.forEach(({key:e},t)=>{c.current[e]=o[e]??new u.default.Value(t===n?0:t>=n?1:-1)}),c.current};var e,t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),n=require("./default_286"),u=(e=n)&&e.__esModule?e:{default:e}