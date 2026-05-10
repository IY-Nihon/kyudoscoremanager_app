/**
 * Module ID: 177
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 177);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"create",{enumerable:!0,get:function(){return o}}),Object.defineProperty(_e,"useStore",{enumerable:!0,get:function(){return l}});var e,t=require("./module_37"),u=(e=t)&&e.__esModule?e:{default:e},n=require("./module_176");const c=e=>e;function l(e,t=c){const n=u.default.useSyncExternalStore(e.subscribe,u.default.useCallback(()=>t(e.getState()),[e,t]),u.default.useCallback(()=>t(e.getInitialState()),[e,t]));return u.default.useDebugValue(n),n}const s=e=>{const t=(0,n.createStore)(e),u=e=>l(t,e);return Object.assign(u,t),u},o=e=>e?s(e):s