/**
 * Module ID: 155
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 155);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return f}});var t=e(require("./default_156")),n=e(require("./default_157")),u=e(require("./module_42")),l='__reactLayoutHandler',o=(u.default,null);function f(e,f){var v=(u.default&&void 0!==window.ResizeObserver&&null==o&&(o=new window.ResizeObserver(function(e){e.forEach(e=>{var t=e.target,u=t[l];'function'==typeof u&&n.default.measure(t,(t,n,l,o,f,v)=>{var c={nativeEvent:{layout:{x:t,y:n,width:l,height:o,left:f,top:v}},timeStamp:Date.now()};Object.defineProperty(c.nativeEvent,'target',{enumerable:!0,get:()=>e.target}),u(c)})})})),o);(0,t.default)(()=>{var t=e.current;null!=t&&(t[l]=f)},[e,f]),(0,t.default)(()=>{var t=e.current;return null!=t&&null!=v&&('function'==typeof t[l]?v.observe(t):v.unobserve(t)),()=>{null!=t&&null!=v&&v.unobserve(t)}},[e,v])}