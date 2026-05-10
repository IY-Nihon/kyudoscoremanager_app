/**
 * Module ID: 285
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 285);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return s}});var e,n=require("./module_42");function t(){return new Promise((e,n)=>{e(!0)})}var o=((e=n)&&e.__esModule?e:{default:e}).default&&'function'==typeof window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;var u={},c={isScreenReaderEnabled:t,isReduceMotionEnabled:function(){return new Promise((e,n)=>{e(!o||o.matches)})},fetch:t,addEventListener:function(e,n){if('reduceMotionChanged'===e){if(!o)return;var t=e=>{n(e.matches)};s=t,null!=o&&(null!=o.addEventListener?o.addEventListener('change',s):o.addListener(s)),u[n]=t}var s;return{remove:()=>c.removeEventListener(e,n)}},setAccessibilityFocus:function(e){},announceForAccessibility:function(e){},removeEventListener:function(e,n){if('reduceMotionChanged'===e){var t=u[n];if(!t||!o)return;c=t,null!=o&&(null!=o.removeEventListener?o.removeEventListener('change',c):o.removeListener(c))}var c}},s=c