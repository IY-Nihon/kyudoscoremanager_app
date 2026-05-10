/**
 * Module ID: 123
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 123);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"UnavailabilityError",{enumerable:!0,get:function(){return o}});var t=require("./module_124");require("./default_120");class o extends t.CodedError{constructor(t,o){super('ERR_UNAVAILABLE',`The method or property ${t}.${o} is not available on web, are you sure you've linked all the native dependencies properly?`)}}