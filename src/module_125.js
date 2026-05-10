/**
 * Module ID: 125
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 125);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function o(o){return'object'==typeof globalThis.ExpoDomWebView&&null!=globalThis?.expo?.modules?globalThis.expo?.modules?.[o]??null:null}Object.defineProperty(e,'__esModule',{value:!0}),e.requireNativeModule=function(n){const l=o(n);if(null!=l)return l;if('undefined'==typeof window)return{};throw new Error(`Cannot find native module '${n}'`)},e.requireOptionalNativeModule=o