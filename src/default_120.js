/**
 * Module ID: 120
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 120);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return u}});var e,n=require("./module_98"),t=(e=n)&&e.__esModule?e:{default:e},s=require("./module_121");var u={OS:"web",select:'undefined'!=typeof window?t.default.select:function(e){return e.hasOwnProperty("web")?e.web:e.hasOwnProperty('default')?e.default:void 0},isDOMAvailable:s.isDOMAvailable,canUseEventListeners:s.canUseEventListeners,canUseViewport:s.canUseViewport,isAsyncDebugging:s.isAsyncDebugging}