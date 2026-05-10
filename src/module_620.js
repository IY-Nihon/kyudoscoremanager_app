/**
 * Module ID: 620
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 620);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.useAssets=function(u){const[c,n]=(0,t.useState)(),[o,f]=(0,t.useState)();return(0,t.useEffect)(()=>{s.Asset.loadAsync(u).then(n).catch(f)},[]),[c,o]};var t=require("./module_37"),s=require("./ANDROID_EMBEDDED_URL_BASE_RESOURCE_611")