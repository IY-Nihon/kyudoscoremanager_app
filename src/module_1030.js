/**
 * Module ID: 1030
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 1030);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useIncomingShare=function(){const[e,a]=(0,t.useState)((0,o.getSharedPayloads)()),[l,c]=(0,t.useState)([]),[u,f]=(0,t.useState)(!1),[h,y]=(0,t.useState)(null),S=(0,t.useRef)([]),v=(0,t.useCallback)(async()=>{try{const e=(0,o.getSharedPayloads)();if(s(e,S.current))return;if(S.current=e,a(e),c([]),y(null),e.length>0){f(!0);try{const e=await(0,o.getResolvedSharedPayloadsAsync)();c(e)}catch(e){y(e instanceof Error?e:new Error('Unknown error during shared payload resolution'))}finally{f(!1)}}}catch(e){y(e instanceof Error?e:new Error('Failed to resolve data'))}},[]);return(0,t.useEffect)(()=>{v();const e=n.default.addEventListener('change',e=>{'active'===e&&v()});return()=>{e.remove()}},[v]),{sharedPayloads:e,resolvedSharedPayloads:l,clearSharedPayloads:o.clearSharedPayloads,isResolving:u,error:h,refreshSharePayloads:v}};var e,t=require("./module_37"),a=require("./default_367"),n=(e=a)&&e.__esModule?e:{default:e},o=require("./module_1031");function s(e,t){if(e.length!==t.length)return!1;const a=new Map,n=e=>`${e.value}|${e.mimeType}|${e.shareType}`;for(const t of e){const e=n(t);a.set(e,(a.get(e)||0)+1)}for(const e of t){const t=n(e),o=a.get(t);if(!o)return!1;a.set(t,o-1)}return!0}