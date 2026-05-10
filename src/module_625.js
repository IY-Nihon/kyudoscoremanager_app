/**
 * Module ID: 625
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 625);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"useFonts",{enumerable:!0,get:function(){return o}});var t=require("./module_37"),n=require("./FontDisplay_604");function u(t){return'string'==typeof t?(0,n.isLoaded)(t):Object.keys(t).every(t=>(0,n.isLoaded)(t))}const o='undefined'==typeof window?function(t){return(0,n.loadAsync)(t),[!0,null]}:function(o){const[c,s]=(0,t.useState)(u(o)),[f,l]=(0,t.useState)(null);return(0,t.useEffect)(()=>{let t=!0;return(0,n.loadAsync)(o).then(()=>{t&&s(!0)}).catch(n=>{t&&l(n)}),()=>{t=!1}},[]),[c,f]}