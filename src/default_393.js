/**
 * Module ID: 393
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 393);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return f}});var t=e(require("./default_30")),n=e(require("./default_46")),o=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),l=e(require("./default_45")),u=e(require("./default_144")),d=["color","indeterminate","progress","trackColor","style"],s=o.forwardRef((e,l)=>{var s=e.color,f=void 0===s?'#1976D2':s,v=e.indeterminate,p=void 0!==v&&v,y=e.progress,b=void 0===y?0:y,_=e.trackColor,h=void 0===_?'transparent':_,j=e.style,k=(0,n.default)(e,d),C=100*b,O=p?'25%':C+"%";return o.createElement(u.default,(0,t.default)({},k,{"aria-valuemax":100,"aria-valuemin":0,"aria-valuenow":p?null:C,ref:l,role:"progressbar",style:[c.track,j,{backgroundColor:h}]}),o.createElement(u.default,{style:[{backgroundColor:f,width:O},c.progress,p&&c.animation]}))});s.displayName='ProgressBar';var c=l.default.create({track:{forcedColorAdjust:'none',height:5,overflow:'hidden',userSelect:'none',zIndex:0},progress:{forcedColorAdjust:'none',height:'100%',zIndex:-1},animation:{animationDuration:'1s',animationKeyframes:[{'0%':{transform:'translateX(-100%)'},'100%':{transform:'translateX(400%)'}}],animationTimingFunction:'linear',animationIterationCount:'infinite'}}),f=s