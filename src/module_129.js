/**
 * Module ID: 129
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 129);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["get","request"];Object.defineProperty(_e,'__esModule',{value:!0}),_e.createPermissionHook=function(e){return t=>c(e,t)};var t,u=require("./module_130"),n=(t=u)&&t.__esModule?t:{default:t},s=require("./module_37");function c(t,u){const c=(0,s.useRef)(!0),[o,l]=(0,s.useState)(null),f=u||{},{get:h=!0,request:M=!1}=f,_=(0,n.default)(f,e),b=(0,s.useCallback)(async()=>{let e;return e=Object.keys(_).length>0?await t.getMethod(_):await t.getMethod(),c.current&&l(e),e},[t.getMethod]),k=(0,s.useCallback)(async()=>{let e;return e=Object.keys(_).length>0?await t.requestMethod(_):await t.requestMethod(),c.current&&l(e),e},[t.requestMethod]);return(0,s.useEffect)(function(){M&&k(),!M&&h&&b()},[h,M,k,b]),(0,s.useEffect)(function(){return c.current=!0,()=>{c.current=!1}},[]),[o,k,b]}