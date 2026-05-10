/**
 * Module ID: 442
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 442);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["state"];Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"CHILD_STATE",{enumerable:!0,get:function(){return s}}),_e.useRouteCache=function(t){const n=c.useMemo(()=>({current:new Map}),[]);return n.current=t.reduce((t,c)=>{const f=n.current.get(c.key),{state:l}=c,d=(0,u.default)(c,e);let b;return b=f&&(0,o.isRecordEqual)(f,d)?f:d,Object.defineProperty(b,s,{enumerable:!1,configurable:!0,value:l}),t.set(c.key,b),t},new Map),Array.from(n.current.values())};var t,n=require("./module_130"),u=(t=n)&&t.__esModule?t:{default:t},c=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),o=require("./module_443");const s=Symbol('CHILD_STATE')