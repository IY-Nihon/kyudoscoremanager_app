/**
 * Module ID: 513
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 513);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useScrollToTop=function(n){const c=t.useContext(e.NavigationContext),l=(0,e.useRoute)();if(void 0===c)throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");t.useEffect(()=>{const e=[];let t=c;for(;t;)'tab'===t.getState().type&&e.push(t),t=t.getParent();if(0===e.length)return;const s=e.map(t=>t.addListener('tabPress',t=>{const s=c.isFocused(),u=e.includes(c)||c.getState().routes[0].key===l.key;requestAnimationFrame(()=>{const e=o(n);s&&u&&e&&!t.defaultPrevented&&('scrollToTop'in e?e.scrollToTop():'scrollTo'in e?e.scrollTo({y:0,animated:!0}):'scrollToOffset'in e?e.scrollToOffset({offset:0,animated:!0}):'scrollResponderScrollTo'in e&&e.scrollResponderScrollTo({y:0,animated:!0}))})}));return()=>{s.forEach(e=>e())}},[c,n,l.key])};var e=require("./module_235"),t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(o){var n=Object.getOwnPropertyDescriptor(e,o);Object.defineProperty(t,o,n.get?n:{enumerable:!0,get:function(){return e[o]}})}),t.default=e,t})(require("./module_37"));function o(e){return null==e.current?null:'scrollToTop'in e.current||'scrollTo'in e.current||'scrollToOffset'in e.current||'scrollResponderScrollTo'in e.current?e.current:'getScrollResponder'in e.current?e.current.getScrollResponder():'getNode'in e.current?e.current.getNode():e.current}