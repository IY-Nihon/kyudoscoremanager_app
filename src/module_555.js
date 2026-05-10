/**
 * Module ID: 555
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 555);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["visible","children","style"];function t(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.ResourceSavingView=function(t){let{visible:l,children:u,style:f}=t,v=(0,n.default)(t,e);return(0,c.jsx)(o.default,Object.assign({hidden:!l,style:[{display:l?'flex':'none'},s.container,f],pointerEvents:l?'auto':'none'},v,{children:u}))};var n=t(require("./module_130"));require("./module_37"),require("./module_98");var l=t(require("./default_45")),o=t(require("./default_144")),c=require("./module_254");const s=l.default.create({container:{flex:1,overflow:'hidden'},attached:{flex:1},detached:{flex:1,top:3e4}})