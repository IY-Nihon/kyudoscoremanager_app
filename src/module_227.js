/**
 * Module ID: 227
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 227);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"FadeTransition",{enumerable:!0,get:function(){return o}}),Object.defineProperty(e,"ShiftTransition",{enumerable:!0,get:function(){return c}});var t=require("./module_226"),n=require("./FadeSpec_228");const o={transitionSpec:n.FadeSpec,sceneStyleInterpolator:t.forFade},c={transitionSpec:n.ShiftSpec,sceneStyleInterpolator:t.forShift}