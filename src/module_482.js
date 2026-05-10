/**
 * Module ID: 482
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 482);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useOnAction=function({router:i,getState:u,setState:s,key:c,actionListeners:f,beforeRemoveListeners:d,routerConfigOptions:l,emitter:v}){const{onAction:y,onRouteFocus:p,addListener:C,onDispatchAction:b}=e.useContext(n.NavigationBuilderContext),h=e.useContext(t.DeprecatedNavigationInChildContext),A=e.useRef(l);e.useEffect(()=>{A.current=l});const O=e.useCallback((e,t=new Set)=>{const n=u();if(t.has(n.key))return!1;if(t.add(n.key),'string'!=typeof e.target||e.target===n.key){let t=i.getStateForAction(n,e,A.current);if(t=null===t&&e.target===n.key?n:t,null!==t){if(b(e,n===t),n!==t){if((0,o.shouldPreventRemove)(v,d,n.routes,t.routes,e))return!0;s(t)}if(void 0!==p){i.shouldActionChangeFocus(e)&&void 0!==c&&p(c)}return!0}}if(void 0!==y&&y(e,t))return!0;if('string'==typeof e.target||'NAVIGATE_DEPRECATED'===e.type||h)for(let n=f.length-1;n>=0;n--){if((0,f[n])(e,t))return!0}return!1},[f,d,v,u,h,c,y,b,p,i,s]);return(0,o.useOnPreventRemove)({getState:u,emitter:v,beforeRemoveListeners:d}),e.useEffect(()=>C?.('action',O),[C,O]),O};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),t=require("./DeprecatedNavigationInChildContext_252"),n=require("./NavigationBuilderContext_257"),o=require("./shouldPreventRemove_483")