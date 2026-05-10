/**
 * Module ID: 307
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 307);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return o}}),Object.defineProperty(_e,"cancelIdleCallback",{enumerable:!0,get:function(){return u}});var e,t=require("./module_42"),n=((e=t)&&e.__esModule?e:{default:e}).default&&void 0!==window.requestIdleCallback,l=n?window.requestIdleCallback:function(e,t){return setTimeout(()=>{var t=Date.now();e({didTimeout:!1,timeRemaining:()=>Math.max(0,50-(Date.now()-t))})},1)},u=n?window.cancelIdleCallback:function(e){clearTimeout(e)},o=l