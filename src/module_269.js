/**
 * Module ID: 269
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 269);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useSyncState=function(e){const u=t.useRef(c(e)).current,s=t.useSyncExternalStore(u.subscribe,u.getState,u.getState);t.useDebugValue(s);const o=t.useRef([]),f=(0,n.default)(e=>{o.current.push(e)}),d=(0,n.default)(()=>{const e=o.current;o.current=[],0!==e.length&&u.batchUpdates(()=>{for(const t of e)t()})});return{state:s,getState:u.getState,setState:u.setState,scheduleUpdate:f,flushUpdates:d}};var e,t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(u){var n=Object.getOwnPropertyDescriptor(e,u);Object.defineProperty(t,u,n.get?n:{enumerable:!0,get:function(){return e[u]}})}),t.default=e,t})(require("./module_37")),u=require("./default_247"),n=(e=u)&&e.__esModule?e:{default:e},s=require("./module_270");const c=e=>{const t=[];let u,n=!1;let c=!1,o=!1;return{getState:()=>(n||(n=!0,u=(0,s.deepFreeze)(e())),u),setState:e=>{u=(0,s.deepFreeze)(e),o=!0,c||t.forEach(e=>e())},batchUpdates:e=>{c=!0,e(),c=!1,o&&(o=!1,t.forEach(e=>e()))},subscribe:e=>(t.push(e),()=>{const u=t.indexOf(e);u>-1&&t.splice(u,1)})}}