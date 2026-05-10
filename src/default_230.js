/**
 * Module ID: 230
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 230);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return s}});var t,e,u=require("./module_231"),c=(t=u)&&t.__esModule?t:{default:t};class n{static step0(t){return t>0?1:0}static step1(t){return t>=1?1:0}static linear(t){return t}static ease(t){return e||(e=n.bezier(.42,0,1,1)),e(t)}static quad(t){return t*t}static cubic(t){return t*t*t}static poly(t){return e=>Math.pow(e,t)}static sin(t){return 1-Math.cos(t*Math.PI/2)}static circle(t){return 1-Math.sqrt(1-t*t)}static exp(t){return Math.pow(2,10*(t-1))}static elastic(t){void 0===t&&(t=1);var e=t*Math.PI;return t=>1-Math.pow(Math.cos(t*Math.PI/2),3)*Math.cos(t*e)}static back(t){return void 0===t&&(t=1.70158),e=>e*e*((t+1)*e-t)}static bounce(t){if(t<.36363636363636365)return 7.5625*t*t;if(t<.7272727272727273){var e=t-.5454545454545454;return 7.5625*e*e+.75}if(t<.9090909090909091){var u=t-.8181818181818182;return 7.5625*u*u+.9375}var c=t-.9545454545454546;return 7.5625*c*c+.984375}static bezier(t,e,u,n){return(0,c.default)(t,e,u,n)}static in(t){return t}static out(t){return e=>1-t(1-e)}static inOut(t){return e=>e<.5?t(2*e)/2:1-t(2*(1-e))/2}}var s=n