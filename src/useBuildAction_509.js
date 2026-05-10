/**
 * Module ID: 509
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const _r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 509);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useBuildHref=r,Object.defineProperty(_e,"useBuildAction",{enumerable:!0,get:function(){return o}}),_e.useLinkBuilder=function(){const t=r(),e=o();return{buildHref:t,buildAction:e}};var t=require("./module_235"),e=(function(t){if(t&&t.__esModule)return t;var e={};return t&&Object.keys(t).forEach(function(n){var r=Object.getOwnPropertyDescriptor(t,n);Object.defineProperty(e,n,r.get?r:{enumerable:!0,get:function(){return t[n]}})}),e.default=t,e})(require("./module_37")),n=require("./LinkingContext_493");function r(){const r=e.useContext(t.NavigationHelpersContext),o=e.useContext(t.NavigationRouteContext),{options:u}=e.useContext(n.LinkingContext),s=(0,t.useStateForPath)(),c=u?.getPathFromState??t.getPathFromState;return e.useCallback((e,n)=>{if(!1===u?.enabled)return;const f=!!(r&&o?.key&&s)&&(o.key===(0,t.findFocusedRoute)(s)?.key&&r.getState().routes.some(t=>t.key===o.key)),l={routes:[{name:e,params:n}]},d=t=>{if(t){const e=t.routes[0];return f&&!e.state?l:{routes:[Object.assign({},e,{state:d(e.state)})]}}return l},b=d(s);return c(b,u?.config)},[u?.enabled,u?.config,o?.key,r,s,c])}const o=()=>{const{options:r}=e.useContext(n.LinkingContext),o=r?.getStateFromPath??t.getStateFromPath,u=r?.getActionFromState??t.getActionFromState;return e.useCallback(e=>{if(!e.startsWith('/'))throw new Error(`The href must start with '/' (${e}).`);const n=o(e,r?.config);if(n){return u(n,r?.config)??t.CommonActions.reset(n)}throw new Error('Failed to parse the href to a navigation state.')},[r?.config,o,u])}