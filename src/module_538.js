/**
 * Module ID: 538
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 538);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useFrameSize=function(t,n){const u=e.useContext(s);if(null==u)throw new Error('useFrameSize must be used within a FrameSizeProvider');return(0,o.useSyncExternalStoreWithSelector)(n?u.subscribeThrottled:u.subscribe,u.getCurrent,u.getCurrent,t)},_e.FrameSizeProvider=function({initialFrame:t,render:n}){const o=e.useRef({width:t.width,height:t.height}),d=e.useRef(new Set),l=(0,u.default)(()=>o.current),f=(0,u.default)(e=>(d.current.add(e),()=>{d.current.delete(e)})),b=(0,u.default)(e=>{let t,n=!1,u=!1;const o=f(()=>{clearTimeout(t),n=!0,u?t=setTimeout(()=>{n&&(n=!1,e())},100):(u=!0,setTimeout(function(){u=!1},100),n=!1,e())});return()=>{o(),clearTimeout(t)}}),w=e.useMemo(()=>({getCurrent:l,subscribe:f,subscribeThrottled:b}),[f,b,l]),v=(0,u.default)(e=>{o.current.height===e.height&&o.current.width===e.width||(o.current={width:e.width,height:e.height},d.current.forEach(e=>e()))}),y=e.useRef(null);e.useEffect(()=>{},[v]);return(0,c.jsxs)(s.Provider,{value:w,children:[(0,c.jsx)(h,{onChange:v}),n({ref:y,onLayout:e=>{const{width:t,height:n}=e.nativeEvent.layout;v({width:t,height:n})}})]})};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37"));require("./module_98");var t,n=require("./default_247"),u=(t=n)&&t.__esModule?t:{default:t},o=require("./module_480"),c=require("./module_254");const s=e.createContext(void 0);function h({onChange:t}){const n=e.useRef(null);return e.useEffect(()=>{if(null==n.current)return;const e=n.current.getBoundingClientRect();t({width:e.width,height:e.height});const u=new ResizeObserver(e=>{const n=e[0];if(n){const{width:e,height:u}=n.contentRect;t({width:e,height:u})}});return u.observe(n.current),()=>{u.disconnect()}},[t]),(0,c.jsx)("div",{ref:n,style:{position:'absolute',left:0,right:0,top:0,bottom:0,pointerEvents:'none',visibility:'hidden'}})}