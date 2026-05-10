/**
 * Module ID: 159
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 159);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return f}});var e,t=require("./default_160"),n=(e=t)&&e.__esModule?e:{default:e};var f=function(e,t){var f=e.style;for(var o in t)if(t.hasOwnProperty(o)){var u=0===o.indexOf('--'),l=(0,n.default)(o,t[o],u);'float'===o&&(o='cssFloat'),u?f.setProperty(o,l):f[o]=l}}