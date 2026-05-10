/**
 * Module ID: 1018
 */
"use strict";

const _g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const _r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 1018);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.convertInt32ColorToRGBA=function(t){const o=t>>16&255,n=t>>8&255,r=255&t,c=((t>>24&255)/255).toFixed(2);return`rgba(${o},${n},${r},${c})`}