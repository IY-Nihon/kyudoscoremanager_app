/**
 * Module ID: 121
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 121);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"isDOMAvailable",{enumerable:!0,get:function(){return n}}),Object.defineProperty(e,"canUseEventListeners",{enumerable:!0,get:function(){return t}}),Object.defineProperty(e,"canUseViewport",{enumerable:!0,get:function(){return o}}),Object.defineProperty(e,"isAsyncDebugging",{enumerable:!0,get:function(){return c}});const n='undefined'!=typeof window&&!!window.document?.createElement,t=n&&!(!window.addEventListener&&!window.attachEvent),o=n&&!!window.screen,c=!1