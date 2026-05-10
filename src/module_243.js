/**
 * Module ID: 243
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 243);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.createParamsFromAction=function({action:t,routeParamList:n}){const{name:o,params:c}=t.payload;return void 0!==n[o]?Object.assign({},n[o],c):c}