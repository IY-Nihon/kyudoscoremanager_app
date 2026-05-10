/**
 * Module ID: 142
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 142);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.useEvent=function(u,s,c=null){const[o,f]=(0,t.useState)(c);return n(u,s,t=>f(t)),o},e.useEventListener=n;var t=require("./module_37");function n(n,u,s){const c=(0,t.useRef)(s);c.current=s,(0,t.useEffect)(()=>{const t=n.addListener(u,(...t)=>c.current(...t));return()=>t.remove()},[n,u,c])}