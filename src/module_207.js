/**
 * Module ID: 207
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 207);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useAsyncStorage=function(e){return{getItem:(...t)=>u.default.getItem(e,...t),setItem:(...t)=>u.default.setItem(e,...t),mergeItem:(...t)=>u.default.mergeItem(e,...t),removeItem:(...t)=>u.default.removeItem(e,...t)}};var e,t=require("./default_203"),u=(e=t)&&e.__esModule?e:{default:e}