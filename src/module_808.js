/**
 * Module ID: 808
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 808);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.isProtectedDayOfYearToken=function(n){return t.test(n)},e.isProtectedWeekYearToken=function(t){return n.test(t)},e.warnOrThrowProtectedError=function(t,n,c){const u=s(t,n,c);if(console.warn(u),o.includes(t))throw new RangeError(u)};const t=/^D+$/,n=/^Y+$/,o=["D","DD","YY","YYYY"];function s(t,n,o){const s="Y"===t[0]?"years":"days of the month";return`Use \`${t.toLowerCase()}\` instead of \`${t}\` (in \`${n}\`) for formatting ${s} to the input \`${o}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`}