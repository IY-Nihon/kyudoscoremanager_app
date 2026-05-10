/**
 * Module ID: 474
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 474);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["emit"];Object.defineProperty(_e,'__esModule',{value:!0}),_e.useNavigationCache=function({state:t,getState:n,navigation:d,setOptions:f,router:y,emitter:l}){const{stackRef:O}=c.useContext(u.NavigationBuilderContext),b=c.useMemo(()=>{const t=(0,s.default)(d,e),n=Object.assign({},y.actionCreators,o.CommonActions),c=()=>{throw new Error('Actions cannot be dispatched from a placeholder screen.')},u=Object.keys(n).reduce((e,t)=>(e[t]=c,e),{});return Object.assign({},t,u,{addListener:()=>()=>{},removeListener:()=>{},dispatch:c,getParent:e=>void 0!==e&&e===t.getId()?b:t.getParent(e),setOptions:()=>{throw new Error('Options cannot be set from a placeholder screen.')},isFocused:()=>!1})},[d,y.actionCreators]),p=c.useMemo(()=>({current:{}}),[b,n,d,f,l]);return p.current=t.routes.reduce((e,t)=>{const s=p.current[t.key];if(s)e[t.key]=s;else{const s=e=>{const s='function'==typeof e?e(n()):e;null!=s&&d.dispatch(Object.assign({source:t.key},s))},c=e=>{try{e()}finally{}},u=Object.assign({},y.actionCreators,o.CommonActions),O=Object.keys(u).reduce((e,t)=>(e[t]=(...e)=>c(()=>s(u[t](...e))),e),{});e[t.key]=Object.assign({},b,O,l.create(t.key),{dispatch:e=>c(()=>s(e)),getParent:n=>void 0!==n&&n===b.getId()?e[t.key]:b.getParent(n),setOptions:e=>{f(n=>Object.assign({},n,{[t.key]:Object.assign({},n[t.key],e)}))},isFocused:()=>{const e=b.getState();return e.routes[e.index].key===t.key&&(!d||d.isFocused())}})}return e},{}),{base:b,navigations:p.current}};var t,n=require("./module_130"),s=(t=n)&&t.__esModule?t:{default:t},o=require("./BaseRouter_237"),c=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var s=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,s.get?s:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),u=require("./NavigationBuilderContext_257")