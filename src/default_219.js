/**
 * Module ID: 219
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 219);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function n(n){return n&&n.__esModule?n:{default:n}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return b}});var e=require("./module_220"),t=n(require("./default_222")),u=n(require("./default_156")),l={},o={passive:!0},c='react-gui:hover:lock',f='react-gui:hover:unlock',v=()=>!('undefined'==typeof window||null==window.PointerEvent);function s(n,e,t){var u=document.createEvent('CustomEvent'),o=t||l,c=o.bubbles,f=void 0===c||c,v=o.cancelable,s=void 0===v||v,p=o.detail;u.initCustomEvent(e,f,s,p),n.dispatchEvent(u)}function p(n){var t=n.pointerType;return null!=t?t:(0,e.getModality)()}function b(n,e){var l=e.contain,b=e.disabled,h=e.onHoverStart,y=e.onHoverChange,E=e.onHoverUpdate,_=e.onHoverEnd,w=v(),H=(0,t.default)(w?'pointermove':'mousemove',o),C=(0,t.default)(w?'pointerenter':'mouseenter',o),M=(0,t.default)(w?'pointerleave':'mouseleave',o),P=(0,t.default)(c,o),j=(0,t.default)(f,o);(0,u.default)(()=>{var e=n.current;if(null!==e){var t=function(n){null!=_&&_(n),null!=y&&y(!1),H(e,null),M(e,null)},u=function(e){var u=n.current;null!=u&&'touch'!==p(e)&&(l&&s(u,f),t(e))},o=function(n){'touch'!==p(n)&&null!=E&&(null==n.x&&(n.x=n.clientX),null==n.y&&(n.y=n.clientY),E(n))},v=function(n){null!=h&&h(n),null!=y&&y(!0),null!=E&&H(e,b?null:o),M(e,b?null:u)};C(e,b?null:function(e){var u=n.current;if(null!=u&&'touch'!==p(e)){l&&s(u,c),v(e);P(u,b?null:function(n){n.target!==u&&t(e)}),j(u,b?null:function(n){n.target!==u&&v(e)})}})}},[C,H,M,P,j,l,b,h,y,E,_,n])}