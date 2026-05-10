/**
 * Module ID: 422
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 422);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function t(t){if(t&&t.__esModule)return t;var e={};return t&&Object.keys(t).forEach(function(n){var o=Object.getOwnPropertyDescriptor(t,n);Object.defineProperty(e,n,o.get?o:{enumerable:!0,get:function(){return t[n]}})}),e.default=t,e}Object.defineProperty(_e,'__esModule',{value:!0}),_e.NativeSafeAreaProvider=function({children:t,style:e,onInsetsChange:d}){return o.useEffect(()=>{if('undefined'==typeof document)return;const t=v();document.body.appendChild(t);const e=()=>{const{paddingTop:e,paddingBottom:n,paddingLeft:o,paddingRight:s}=window.getComputedStyle(t),u={top:e?parseInt(e,10):0,bottom:n?parseInt(n,10):0,left:o?parseInt(o,10):0,right:s?parseInt(s,10):0},c={x:0,y:0,width:document.documentElement.offsetWidth,height:document.documentElement.offsetHeight};d({nativeEvent:{insets:u,frame:c}})};return t.addEventListener(f(),e),e(),()=>{document.body.removeChild(t),t.removeEventListener(f(),e)}},[d]),n.createInteropElement(s.default,{style:e},t)};var e,n=t(require("./module_272")),o=t(require("./module_37")),d=require("./default_144"),s=(e=d)&&e.__esModule?e:{default:e};const u={WebkitTransition:'webkitTransitionEnd',Transition:'transitionEnd',MozTransition:'transitionend',MSTransition:'msTransitionEnd',OTransition:'oTransitionEnd'};let c=null;function f(){if(null!=c)return c;const t=document.createElement('invalidtype');c=u.Transition;for(const e in u)if(void 0!==t.style[e]){c=u[e];break}return c}let l=null;function p(){if(null!==l)return l;const{CSS:t}=window;return l=t&&t.supports&&t.supports('top: constant(safe-area-inset-top)')?'constant':'env',l}function h(t){return`${p()}(safe-area-inset-${t})`}function v(){const t=document.createElement('div'),{style:e}=t;return e.position='fixed',e.left='0',e.top='0',e.width='0',e.height='0',e.zIndex='-1',e.overflow='hidden',e.visibility='hidden',e.transitionDuration='0.05s',e.transitionProperty='padding',e.transitionDelay='0s',e.paddingTop=h('top'),e.paddingBottom=h('bottom'),e.paddingLeft=h('left'),e.paddingRight=h('right'),t}