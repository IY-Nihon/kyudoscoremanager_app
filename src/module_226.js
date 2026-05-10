/**
 * Module ID: 226
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 226);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.forFade=function({current:t}){return{sceneStyle:{opacity:t.progress.interpolate({inputRange:[-1,0,1],outputRange:[0,1,0]})}}},e.forShift=function({current:t}){return{sceneStyle:{opacity:t.progress.interpolate({inputRange:[-1,0,1],outputRange:[0,1,0]}),transform:[{translateX:t.progress.interpolate({inputRange:[-1,0,1],outputRange:[-50,0,50]})}]}}}