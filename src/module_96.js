/**
 * Module ID: 96
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 96);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

function n(n,t){var u,f,i=n.type,s=n.value;return t&&void 0!==(f=t(n))?f:"word"===i||"space"===i?s:"string"===i?(u=n.quote||"")+s+(n.unclosed?"":u):"comment"===i?"/*"+s+(n.unclosed?"":"*/"):"div"===i?(n.before||"")+s+(n.after||""):Array.isArray(n.nodes)?(u=o(n.nodes,t),"function"!==i?u:s+"("+(n.before||"")+u+(n.after||"")+(n.unclosed?"":")")):s}function o(o,t){var u,f;if(Array.isArray(o)){for(u="",f=o.length-1;~f;f-=1)u=n(o[f],t)+u;return u}return n(o,t)}m.exports=o