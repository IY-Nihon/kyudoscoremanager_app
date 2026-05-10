/**
 * Module ID: 556
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 556);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.SafeAreaProviderCompat=y;var t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),n=e(require("./default_298"));require("./module_98");var o=e(require("./default_45")),u=e(require("./default_144")),c=require("./module_420"),f=require("./module_538"),s=require("./module_254");const{width:d=0,height:l=0}=n.default.get('window'),h={frame:{x:0,y:0,width:d,height:l},insets:{top:0,left:0,right:0,bottom:0}};function y({children:e,style:n}){const o=t.useContext(c.SafeAreaInsetsContext);return(0,s.jsx)(f.FrameSizeProvider,{initialFrame:h.frame,render:({ref:t,onLayout:f})=>o?(0,s.jsx)(u.default,{ref:t,onLayout:f,style:[v.container,n],children:e}):(0,s.jsx)(c.SafeAreaProvider,{initialMetrics:h,style:n,onLayout:f,children:e})})}y.initialMetrics=h;const v=o.default.create({container:{flex:1}})