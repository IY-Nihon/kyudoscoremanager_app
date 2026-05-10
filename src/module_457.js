/**
 * Module ID: 457
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 457);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.NavigationIndependentTree=function({children:l}){return(0,u.jsx)(o.NavigationRouteContext.Provider,{value:void 0,children:(0,u.jsx)(n.NavigationContext.Provider,{value:void 0,children:(0,u.jsx)(v.IsFocusedContext.Provider,{value:void 0,children:(0,u.jsx)(t.NavigationIndependentTreeContext.Provider,{value:!0,children:l})})})})},require("./module_37");var n=require("./NavigationContext_436"),t=require("./NavigationIndependentTreeContext_259"),o=require("./NavigationRouteContext_435"),v=require("./FocusedRouteKeyContext_437"),u=require("./module_254")