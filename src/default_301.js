/**
 * Module ID: 301
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 301);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return v}});var t=e(require("./default_30")),o=e(require("./default_46")),n=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(o){var n=Object.getOwnPropertyDescriptor(e,o);Object.defineProperty(t,o,n.get?n:{enumerable:!0,get:function(){return e[o]}})}),t.default=e,t})(require("./module_37")),l=e(require("./default_45")),c=e(require("./default_144")),u=e(require("./default_162")),s=["onScroll","onTouchMove","onWheel","scrollEnabled","scrollEventThrottle","showsHorizontalScrollIndicator","showsVerticalScrollIndicator","style"];function f(e){return{nativeEvent:{contentOffset:{get x(){return e.target.scrollLeft},get y(){return e.target.scrollTop}},contentSize:{get height(){return e.target.scrollHeight},get width(){return e.target.scrollWidth}},layoutMeasurement:{get height(){return e.target.offsetHeight},get width(){return e.target.offsetWidth}}},timeStamp:Date.now()}}var d=n.forwardRef((e,l)=>{var d=e.onScroll,v=e.onTouchMove,S=e.onWheel,b=e.scrollEnabled,w=void 0===b||b,T=e.scrollEventThrottle,p=void 0===T?0:T,y=e.showsHorizontalScrollIndicator,_=e.showsVerticalScrollIndicator,E=e.style,M=(0,o.default)(e,s),O=n.useRef({isScrolling:!1,scrollLastTick:0}),D=n.useRef(null),W=n.useRef(null);function j(e){return t=>{w&&e&&e(t)}}function P(e){O.current.isScrolling=!0,k(e)}function k(e){O.current.scrollLastTick=Date.now(),d&&d(f(e))}function H(e){O.current.isScrolling=!1,d&&d(f(e))}var I=!1===y||!1===_;return n.createElement(c.default,(0,t.default)({},M,{onScroll:function(e){var t,o,n;e.stopPropagation(),e.target===W.current&&(e.persist(),null!=D.current&&clearTimeout(D.current),D.current=setTimeout(()=>{H(e)},100),O.current.isScrolling?(t=O.current.scrollLastTick,o=p,n=Date.now()-t,o>0&&n>=o&&k(e)):P(e))},onTouchMove:j(v),onWheel:j(S),ref:(0,u.default)(W,l),style:[E,!w&&h.scrollDisabled,I&&h.hideScrollbar]}))}),h=l.default.create({scrollDisabled:{overflowX:'hidden',overflowY:'hidden',touchAction:'none'},hideScrollbar:{scrollbarWidth:'none'}}),v=d