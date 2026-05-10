/**
 * Module ID: 16
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 16);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"MetroServerError",{enumerable:!0,get:function(){return t}});class t extends Error{code='METRO_SERVER_ERROR';constructor(t,o){super(t.message),this.name='MetroServerError',this.url=o;for(const o in t)this[o]=t[o]}}