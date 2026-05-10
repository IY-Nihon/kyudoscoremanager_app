/**
 * Module ID: 239
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const _r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 239);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"BaseRouter",{enumerable:!0,get:function(){return s}});var t=require("./module_240");const s={getStateForAction(s,n){switch(n.type){case'SET_PARAMS':case'REPLACE_PARAMS':{const t=n.source?s.routes.findIndex(t=>t.key===n.source):s.index;return-1===t?null:Object.assign({},s,{routes:s.routes.map((s,r)=>r===t?Object.assign({},s,{params:'REPLACE_PARAMS'===n.type?n.payload.params:Object.assign({},s.params,n.payload.params)}):s)})}case'RESET':{const r=n.payload;return 0===r.routes.length||r.routes.some(t=>!s.routeNames.includes(t.name))?null:!1===r.stale?s.routeNames.length!==r.routeNames.length||r.routeNames.some(t=>!s.routeNames.includes(t))?null:Object.assign({},r,{routes:r.routes.map(s=>s.key?s:Object.assign({},s,{key:`${s.name}-${(0,t.nanoid)()}`}))}):r}default:return null}},shouldActionChangeFocus:t=>'NAVIGATE'===t.type||'NAVIGATE_DEPRECATED'===t.type}