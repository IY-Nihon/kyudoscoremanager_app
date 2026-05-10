/**
 * Module ID: 483
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 483);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"shouldPreventRemove",{enumerable:!0,get:function(){return u}}),_e.useOnPreventRemove=function({getState:o,emitter:c,beforeRemoveListeners:f}){const{addKeyedListener:s}=e.useContext(t.NavigationBuilderContext),d=e.useContext(n.NavigationRouteContext),v=d?.key;e.useEffect(()=>{if(v)return s?.('beforeRemove',v,e=>{const t=o();return u(c,f,t.routes,[],e)})},[s,f,c,o,v])};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),t=require("./NavigationBuilderContext_257"),n=require("./NavigationRouteContext_435");const o=Symbol('VISITED_ROUTE_KEYS'),u=(e,t,n,u,c)=>{const f=u.map(e=>e.key),s=n.filter(e=>!f.includes(e.key)).reverse(),d=c[o]??new Set,v=Object.assign({},c,{[o]:d});for(const n of s){if(d.has(n.key))continue;const o=t[n.key]?.(v);if(o)return!0;d.add(n.key);if(e.emit({type:'beforeRemove',target:n.key,data:{action:v},canPreventDefault:!0}).defaultPrevented)return!0}return!1}