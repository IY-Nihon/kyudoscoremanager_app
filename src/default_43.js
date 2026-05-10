/**
 * Module ID: 43
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 43);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return u}});var e,t=require("./module_42"),n=(e=t)&&e.__esModule?e:{default:e};function u(e,t,u){if(n.default){var l=null!=t?t:document,o=l.getElementById(e);if(null==o)if((o=document.createElement('style')).setAttribute('id',e),'string'==typeof u&&o.appendChild(document.createTextNode(u)),l instanceof ShadowRoot)l.insertBefore(o,l.firstChild);else{var f=l.head;f&&f.insertBefore(o,f.firstChild)}return o.sheet}return null}