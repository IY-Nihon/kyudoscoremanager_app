/**
 * Module ID: 249
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 249);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.checkDuplicateRouteNames=function(t){const n=[],s=(t,c)=>{c.routes.forEach(c=>{const o=t?`${t} > ${c.name}`:c.name;c.state?.routeNames?.forEach(t=>{t===c.name&&n.push([o,`${o} > ${c.name}`])}),c.state&&s(o,c.state)})};return s('',t),n}