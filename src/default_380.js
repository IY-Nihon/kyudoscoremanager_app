/**
 * Module ID: 380
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 380);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return y}});var t=e(require("./default_30")),n=e(require("./default_46")),o=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),l=e(require("./default_45")),d=e(require("./default_144")),s=["animating","color","hidesWhenStopped","size","style"],u=e=>o.createElement("circle",{cx:"16",cy:"16",fill:"none",r:"14",strokeWidth:"4",style:e}),c=o.forwardRef((e,l)=>{var c=e.animating,y=void 0===c||c,p=e.color,v=void 0===p?'#1976D2':p,b=e.hidesWhenStopped,_=void 0===b||b,w=e.size,P=void 0===w?'small':w,j=e.style,k=(0,n.default)(e,s),O=o.createElement("svg",{height:"100%",viewBox:"0 0 32 32",width:"100%"},u({stroke:v,opacity:.2}),u({stroke:v,strokeDasharray:80,strokeDashoffset:60}));return o.createElement(d.default,(0,t.default)({},k,{"aria-valuemax":1,"aria-valuemin":0,ref:l,role:"progressbar",style:[f.container,j]}),o.createElement(d.default,{children:O,style:['number'==typeof P?{height:P,width:P}:h[P],f.animation,!y&&f.animationPause,!y&&_&&f.hidesWhenStopped]}))});c.displayName='ActivityIndicator';var f=l.default.create({container:{alignItems:'center',justifyContent:'center'},hidesWhenStopped:{visibility:'hidden'},animation:{animationDuration:'0.75s',animationKeyframes:[{'0%':{transform:'rotate(0deg)'},'100%':{transform:'rotate(360deg)'}}],animationTimingFunction:'linear',animationIterationCount:'infinite'},animationPause:{animationPlayState:'paused'}}),h=l.default.create({small:{width:20,height:20},large:{width:36,height:36}}),y=c