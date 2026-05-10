/**
 * Module ID: 378
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 378);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return o}});var e,t=require("./module_27"),s=(e=t)&&e.__esModule?e:{default:e};var o=class{static share(e,t){return void 0===t&&(t={}),(0,s.default)('object'==typeof e&&null!==e,'Content to share must be a valid object'),(0,s.default)('string'==typeof e.url||'string'==typeof e.message,'At least one of URL and message is required'),(0,s.default)('object'==typeof t&&null!==t,'Options must be a valid object'),(0,s.default)(!e.title||'string'==typeof e.title,'Invalid title: title should be a string.'),void 0!==window.navigator.share?window.navigator.share({title:e.title,text:e.message,url:e.url}):Promise.reject(new Error('Share is not supported in this browser'))}static get sharedAction(){return'sharedAction'}static get dismissedAction(){return'dismissedAction'}}