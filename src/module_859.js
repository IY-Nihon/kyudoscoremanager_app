/**
 * Module ID: 859
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 859);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.transpose=n;var t=require("./module_699");function n(n,u){const s=o(u)?new u(0):(0,t.constructFrom)(u,0);return s.setFullYear(n.getFullYear(),n.getMonth(),n.getDate()),s.setHours(n.getHours(),n.getMinutes(),n.getSeconds(),n.getMilliseconds()),s}function o(t){return"function"==typeof t&&t.prototype?.constructor===t}var u=n