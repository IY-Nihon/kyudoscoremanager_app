/**
 * Module ID: 256
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 256);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.findFocusedRoute=function(t){let n=t;for(;null!=n?.routes[n.index??0].state;)n=n.routes[n.index??0].state;const u=n?.routes[n?.index??0];return u}