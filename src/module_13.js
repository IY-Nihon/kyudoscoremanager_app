/**
 * Module ID: 13
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 13);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.getFullBundlerUrl=function(){const t=document?.currentScript,n=new URL(t&&'src'in t?t.src:location.href,location.href);n.searchParams.has('platform')||n.searchParams.set('platform',"web");return n.toString()}