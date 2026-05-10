/**
 * Module ID: 208
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 208);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return j}}),_e.configure=h,_e.fetch=y,_e.refresh=p,_e.addEventListener=O,_e.useNetInfo=v,_e.useNetInfoInstance=I;var t=require("./module_37");require("./module_98");var n=e(require("./module_209"));require("./default_210");var u=e(require("./default_214")),f=require("./module_213");Object.keys(f).forEach(function(e){'default'===e||Object.prototype.hasOwnProperty.call(_e,e)||Object.defineProperty(_e,e,{enumerable:!0,get:function(){return f[e]}})});var o=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(f);let c=n.default,l=null;const s=()=>new u.default(c);let d=!1,b=[];function h(e){c=Object.assign({},n.default,e),l&&(l.tearDown(),l=s())}function y(e){return l||(l=s()),l.latest(e)}function p(){return l||(l=s()),d?new Promise(e=>{b.push(e)}):(d=!0,l._fetchCurrentState().then(e=>(b.forEach(t=>t(e)),b=[],e)).finally(()=>{d=!1}))}function O(e){return l||(l=s()),l.add(e),()=>{l&&l.remove(e)}}function v(e){e&&h(e);const[n,u]=(0,t.useState)({type:o.NetInfoStateType.unknown,isConnected:null,isInternetReachable:null,details:null});return(0,t.useEffect)(()=>{const e=O(u);return()=>e()},[]),n}function I(e=!1,f){const[c,l]=(0,t.useState)(),[s,b]=(0,t.useState)({type:o.NetInfoStateType.unknown,isConnected:null,isInternetReachable:null,details:null});(0,t.useEffect)(()=>{if(e)return;const t=Object.assign({},n.default,f),o=new u.default(t);return l(o),o.add(b),o.tearDown},[e,f]);return{netInfo:s,refresh:(0,t.useCallback)(()=>{c&&!d&&(d=!0,c._fetchCurrentState().finally(()=>{d=!1}))},[c])}}var j={configure:h,fetch:y,refresh:p,addEventListener:O,useNetInfo:v,useNetInfoInstance:I}