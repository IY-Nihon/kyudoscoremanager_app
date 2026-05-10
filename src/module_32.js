/**
 * Module ID: 32
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 32);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.hydrate=function(u,o){return(0,n.createSheet)(o),(0,t.hydrateRoot)(o,u)};var t=require("./module_33"),n=require("./module_41");function u(u,o){(0,n.createSheet)(o);var c=(0,t.createRoot)(o);return c.render(u),c}