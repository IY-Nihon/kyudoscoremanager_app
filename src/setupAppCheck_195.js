/**
 * Module ID: 195
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 195);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"setupAppCheck",{enumerable:!0,get:function(){return e}}),require("./module_196"),require("./module_98");const e=e=>{try{console.log('[AppCheck] Initialized for Web (Disabled due to missing ReCAPTCHA key)')}catch(e){console.warn('[AppCheck] Web initialization failed:',e)}}