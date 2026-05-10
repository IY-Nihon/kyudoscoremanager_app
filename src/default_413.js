/**
 * Module ID: 413
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 413);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return f}});var e,t=require("./default_298"),n=(e=t)&&e.__esModule?e:{default:e},u=require("./module_37");function f(){var e=(0,u.useState)(()=>n.default.get('window')),t=e[0],f=e[1];return(0,u.useEffect)(()=>{function e(e){var t=e.window;null!=t&&f(t)}return n.default.addEventListener('change',e),f(n.default.get('window')),()=>{n.default.removeEventListener('change',e)}},[]),t}