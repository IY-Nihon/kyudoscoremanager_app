/**
 * Module ID: 164
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 164);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return n}});var u=e(require("./default_157")),t=e(require("./default_165"));function n(e){e.pointerEvents,e.style;return(0,t.default)(()=>e=>{null!=e&&(e.measure=t=>u.default.measure(e,t),e.measureLayout=(t,n,l)=>u.default.measureLayout(e,t,l,n),e.measureInWindow=t=>u.default.measureInWindow(e,t))})}