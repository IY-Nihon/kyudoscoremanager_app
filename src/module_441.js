/**
 * Module ID: 441
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 441);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.getFocusedRouteNameFromRoute=function(n){const o=n[t.CHILD_STATE]??n.state,s=n.params;return o?o.routes[o.index??('string'==typeof o.type&&'stack'!==o.type?0:o.routes.length-1)].name:'string'==typeof s?.screen?s.screen:void 0};var t=require("./CHILD_STATE_442")