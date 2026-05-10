/**
 * Module ID: 795
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 795);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.buildLocalizeFn=function(t){return(n,l)=>{let u;if("formatting"===(l?.context?String(l.context):"standalone")&&t.formattingValues){const n=t.defaultFormattingWidth||t.defaultWidth,o=l?.width?String(l.width):n;u=t.formattingValues[o]||t.formattingValues[n]}else{const n=t.defaultWidth,o=l?.width?String(l.width):t.defaultWidth;u=t.values[o]||t.values[n]}return u[t.argumentCallback?t.argumentCallback(n):n]}}