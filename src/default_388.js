/**
 * Module ID: 388
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 388);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return y}});var n=(function(e){if(e&&e.__esModule)return e;var n={};return e&&Object.keys(e).forEach(function(t){var o=Object.getOwnPropertyDescriptor(e,t);Object.defineProperty(n,t,o.get?o:{enumerable:!0,get:function(){return e[t]}})}),n.default=e,n})(require("./module_37")),t=e(require("./default_45")),o=e(require("./default_145"));function u(e,n){return'slide'===e?n?s:f:'fade'===e?n?d:l:n?c.container:c.hidden}var c=t.default.create({container:{position:'fixed',top:0,right:0,bottom:0,left:0,zIndex:9999},animatedIn:{animationDuration:"250ms",animationTimingFunction:'cubic-bezier(0.215, 0.61, 0.355, 1)'},animatedOut:{pointerEvents:'none',animationDuration:"250ms",animationTimingFunction:'cubic-bezier(0.47, 0, 0.745, 0.715)'},fadeIn:{opacity:1,animationKeyframes:{'0%':{opacity:0},'100%':{opacity:1}}},fadeOut:{opacity:0,animationKeyframes:{'0%':{opacity:1},'100%':{opacity:0}}},slideIn:{transform:'translateY(0%)',animationKeyframes:{'0%':{transform:'translateY(100%)'},'100%':{transform:'translateY(0%)'}}},slideOut:{transform:'translateY(100%)',animationKeyframes:{'0%':{transform:'translateY(0%)'},'100%':{transform:'translateY(100%)'}}},hidden:{opacity:0}}),s=[c.container,c.animatedIn,c.slideIn],f=[c.container,c.animatedOut,c.slideOut],d=[c.container,c.animatedIn,c.fadeIn],l=[c.container,c.animatedOut,c.fadeOut],y=function(e){var t=e.animationType,s=e.children,f=e.onDismiss,d=e.onShow,l=e.visible,y=n.useState(!1),p=y[0],b=y[1],O=n.useRef(!1),v=n.useRef(!1),h=t&&'none'!==t,I=n.useCallback(e=>{e&&e.currentTarget!==e.target||(l?d&&d():b(!1))},[d,l]);return n.useEffect(()=>{v.current&&!p&&f&&f(),v.current=p},[p,f]),n.useEffect(()=>{l&&b(!0),l===O.current||h||I(),O.current=l},[h,l,I]),p||l?(0,o.default)('div',{style:p?u(t,l):c.hidden,onAnimationEnd:I,children:s}):null}