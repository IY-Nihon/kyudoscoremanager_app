/**
 * Module ID: 479
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 479);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useNavigationState=function(e){const n=t.useContext(s);if(null==n)throw new Error("Couldn't get the navigation state. Is your component inside a navigator?");return(0,o.useSyncExternalStoreWithSelector)(n.subscribe,n.getState,n.getState,e)},_e.NavigationStateListenerProvider=function({state:e,children:n}){const o=t.useRef([]),f=t.useRef(e),l=(0,u.default)(()=>f.current),d=(0,u.default)(e=>(o.current.push(e),()=>{o.current=o.current.filter(t=>t!==e)}));t.useLayoutEffect(()=>{f.current=e,o.current.forEach(e=>e())},[e]);const v=t.useMemo(()=>({getState:l,subscribe:d}),[l,d]);return(0,c.jsx)(s.Provider,{value:v,children:n})};var e,t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),n=require("./default_247"),u=(e=n)&&e.__esModule?e:{default:e},o=require("./module_480"),c=require("./module_254");const s=t.createContext(void 0)