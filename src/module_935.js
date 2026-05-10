/**
 * Module ID: 935
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 935);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return p}}),Object.defineProperty(e,"lightFormatters",{enumerable:!0,get:function(){return t.lightFormatters}}),e.lightFormat=l;var t=require("./module_806"),n=require("./module_737"),o=require("./module_701");const c=/(\w)\1*|''|'(''|[^'])+('|$)|./g,u=/^'([^]*?)'?$/,s=/''/g,f=/[a-zA-Z]/;function l(u,s){const l=(0,o.toDate)(u);if(!(0,n.isValid)(l))throw new RangeError("Invalid time value");const p=s.match(c);if(!p)return"";return p.map(n=>{if("''"===n)return"'";const o=n[0];if("'"===o)return h(n);const c=t.lightFormatters[o];if(c)return c(l,n);if(o.match(f))throw new RangeError("Format string contains an unescaped latin alphabet character `"+o+"`");return n}).join("")}function h(t){const n=t.match(u);return n?n[1].replace(s,"'"):t}var p=l