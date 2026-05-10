/**
 * Module ID: 417
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 417);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.useColorScheme=function(){const[t,n]=(0,o.useState)(()=>({run:()=>n(o=>Object.assign({},o)),dependencies:new Set}));return{colorScheme:c.colorScheme.get(t),setColorScheme:c.colorScheme.set,toggleColorScheme:c.colorScheme.toggle}};const o=require("./module_37"),c=require("./module_414")