/**
 * Module ID: 478
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 478);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useNavigationHelpers=function({id:o,onAction:c,onUnhandledAction:u,getState:s,emitter:d,router:f,stateRef:l}){const b=t.useContext(n.NavigationContext);return t.useMemo(()=>{const t=e=>{const t='function'==typeof e?e(s()):e;c(t)||u?.(t)},n=Object.assign({},f.actionCreators,e.CommonActions),v=Object.keys(n).reduce((e,o)=>(e[o]=(...e)=>t(n[o](...e)),e),{}),O=Object.assign({},b,v,{dispatch:t,emit:d.emit,isFocused:b?b.isFocused:()=>!0,canGoBack:()=>{const t=s();return null!==f.getStateForAction(t,e.CommonActions.goBack(),{routeNames:t.routeNames,routeParamList:{},routeGetIdList:{}})||b?.canGoBack()||!1},getId:()=>o,getParent:e=>{if(void 0!==e){let t=O;for(;t&&e!==t.getId();)t=t.getParent();return t}return b},getState:()=>null!=l.current?l.current:s()});return O},[f,b,d.emit,s,c,u,o,l])};var e=require("./BaseRouter_237"),t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),n=require("./NavigationContext_436");require("./module_462").PrivateValueStore