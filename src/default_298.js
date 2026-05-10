/**
 * Module ID: 298
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 298);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return w}});var t=e(require("./module_27")),n=e(require("./module_42")),s={window:{fontScale:1,height:0,scale:1,width:0},screen:{fontScale:1,height:0,scale:1,width:0}},o={},c=n.default;function l(){if(n.default){var e,t,o=window;if(o.visualViewport){var c=o.visualViewport;e=Math.round(c.height*c.scale),t=Math.round(c.width*c.scale)}else{var l=o.document.documentElement;e=l.clientHeight,t=l.clientWidth}s.window={fontScale:1,height:e,scale:o.devicePixelRatio||1,width:t},s.screen={fontScale:1,height:o.screen.height,scale:o.devicePixelRatio||1,width:o.screen.width}}}function u(){l(),Array.isArray(o.change)&&o.change.forEach(e=>e(s))}class w{static get(e){return c&&(c=!1,l()),(0,t.default)(s[e],"No dimension set for key "+e),s[e]}static set(e){e&&(n.default?(0,t.default)(!1,'Dimensions cannot be set in the browser'):(null!=e.screen&&(s.screen=e.screen),null!=e.window&&(s.window=e.window)))}static addEventListener(e,t){return o[e]=o[e]||[],o[e].push(t),{remove:()=>{this.removeEventListener(e,t)}}}static removeEventListener(e,t){Array.isArray(o[e])&&(o[e]=o[e].filter(e=>e!==t))}}n.default&&(window.visualViewport?window.visualViewport.addEventListener('resize',u,!1):window.addEventListener('resize',u,!1))