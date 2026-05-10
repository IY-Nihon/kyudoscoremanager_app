/**
 * Module ID: 68
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 68);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}});var t=/-([a-z])/g,n=/^Ms/g,u={};function c(t){return t[1].toUpperCase()}function o(o){if(u.hasOwnProperty(o))return u[o];var f=o.replace(t,c).replace(n,'ms');return u[o]=f,f}