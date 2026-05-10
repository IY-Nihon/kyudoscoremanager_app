/**
 * Module ID: 17
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 17);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.fetchAsync=async function(t){const s=await fetch(t,{method:'GET',headers:{'expo-platform':'web'}});return{body:await s.text(),status:s.status,headers:s.headers}}