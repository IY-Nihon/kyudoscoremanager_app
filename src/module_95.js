/**
 * Module ID: 95
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 95);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

m.exports=function n(o,t,f){var i,s,c,u;for(i=0,s=o.length;i<s;i+=1)c=o[i],f||(u=t(c,i,o)),!1!==u&&"function"===c.type&&Array.isArray(c.nodes)&&n(c.nodes,t,f),f&&t(c,i,o)}