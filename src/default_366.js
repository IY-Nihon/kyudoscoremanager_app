/**
 * Module ID: 366
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 366);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return o}});var e,t=require("./module_42");var n=((e=t)&&e.__esModule?e:{default:e}).default&&null!=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null,l=new WeakMap,o={getColorScheme:()=>n&&n.matches?'dark':'light',addChangeListener(e){var t=l.get(e);return t||(t=t=>{var n=t.matches;e({colorScheme:n?'dark':'light'})},l.set(e,t)),n&&n.addListener(t),{remove:function(){var t=l.get(e);n&&t&&n.removeListener(t),l.delete(e)}}}}