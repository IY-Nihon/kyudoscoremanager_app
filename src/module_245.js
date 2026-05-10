/**
 * Module ID: 245
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 245);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.createRouteFromAction=function({action:n,routeParamList:c}){const{name:u}=n.payload;return{key:`${u}-${(0,t.nanoid)()}`,name:u,params:(0,o.createParamsFromAction)({action:n,routeParamList:c})}};var t=require("./module_240"),o=require("./module_243")