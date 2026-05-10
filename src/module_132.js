/**
 * Module ID: 132
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 132);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.useReleasingSharedObject=function(n,t){const c=(0,u.useRef)(null),s=(0,u.useRef)(null),l=(0,u.useRef)(!1),f=(0,u.useRef)(t);null==c.current&&(c.current=n());const o=(0,u.useMemo)(()=>{let u=c.current;const l=f.current?.length===t.length&&t.every((u,n)=>u===f.current[n]);return u&&l||(s.current=c.current,u=n(),c.current=u,f.current=t),u},t);return(0,u.useEffect)(()=>{s.current&&(s.current.release(),s.current=null)},[o]),(0,u.useMemo)(()=>{l.current=!0},[]),(0,u.useEffect)(()=>(l.current=!1,()=>{!l.current&&c.current&&c.current.release()}),[]),o};var u=require("./module_37")