/**
 * Module ID: 416
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 416);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.rem=e._rem=void 0;const t=require("./module_277"),o=require("./module_415"),l=void 0===globalThis.window;e._rem=(0,o.observable)(l?16:Number.parseFloat(globalThis.window.getComputedStyle(globalThis.window.document.documentElement).fontSize)||16),e.rem={get:t=>e._rem.get(t),set(t){e._rem.set(t),l||(globalThis.window.document.documentElement.style.fontSize=`${t}px`)},[t.INTERNAL_RESET](t=16){e._rem.set(t)}}