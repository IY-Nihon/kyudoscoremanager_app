/**
 * Module ID: 265
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 265);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useEventEmitter=function(t){const n=e.useRef(t);e.useEffect(()=>{n.current=t});const u=e.useRef(Object.create(null)),c=e.useCallback(e=>{const t=(t,n)=>{const c=u.current[t]?u.current[t][e]:void 0;if(!c)return;const o=c.indexOf(n);o>-1&&c.splice(o,1)};return{addListener:(n,c)=>{u.current[n]=u.current[n]||{},u.current[n][e]=u.current[n][e]||[],u.current[n][e].push(c);let o=!1;return()=>{o||(o=!0,t(n,c))}},removeListener:t}},[]),o=e.useCallback(({type:e,data:t,target:c,canPreventDefault:o})=>{const i=u.current[e]||{},s=void 0!==c?i[c]?.slice():[].concat(...Object.keys(i).map(e=>i[e])).filter((e,t,n)=>n.lastIndexOf(e)===t),f={get type(){return e}};if(void 0!==c&&Object.defineProperty(f,'target',{enumerable:!0,get:()=>c}),void 0!==t&&Object.defineProperty(f,'data',{enumerable:!0,get:()=>t}),o){let e=!1;Object.defineProperties(f,{defaultPrevented:{enumerable:!0,get:()=>e},preventDefault:{enumerable:!0,value(){e=!0}}})}return n.current?.(f),s?.forEach(e=>e(f)),f},[]);return e.useMemo(()=>({create:c,emit:o}),[c,o])};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37"))