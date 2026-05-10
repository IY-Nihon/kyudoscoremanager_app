/**
 * Module ID: 460
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 460);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.PreventRemoveProvider=function({children:e}){const[o]=n.useState(()=>(0,t.nanoid)()),[l,p]=n.useState(()=>new Map),y=n.useContext(v.NavigationHelpersContext),R=n.useContext(s.NavigationRouteContext),P=n.useContext(d.PreventRemoveContext),C=P?.setPreventRemove,x=(0,u.default)((e,t,n)=>{if(n&&(null==y||y?.getState().routes.every(e=>e.key!==t)))throw new Error(`Couldn't find a route with the key ${t}. Is your component inside NavigationContent?`);p(o=>{if(t===o.get(e)?.routeKey&&n===o.get(e)?.preventRemove)return o;const u=new Map(o);return n?u.set(e,{routeKey:t,preventRemove:n}):u.delete(e),u})}),_=[...l.values()].some(({preventRemove:e})=>e);n.useEffect(()=>{if(void 0!==R?.key&&void 0!==C)return C(o,R.key,_),()=>{C(o,R.key,!1)}},[o,_,R?.key,C]);const k=n.useMemo(()=>({setPreventRemove:x,preventedRoutes:f(l)}),[x,l]);return(0,c.jsx)(d.PreventRemoveContext.Provider,{value:k,children:e})};var e,t=require("./module_240"),n=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),o=require("./default_247"),u=(e=o)&&e.__esModule?e:{default:e},v=require("./NavigationHelpersContext_456"),s=require("./NavigationRouteContext_435"),d=require("./PreventRemoveContext_459"),c=require("./module_254");const f=e=>[...e.values()].reduce((e,{routeKey:t,preventRemove:n})=>(e[t]={preventRemove:e[t]?.preventRemove||n},e),{})