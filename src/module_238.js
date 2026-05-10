/**
 * Module ID: 238
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 238);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.goBack=function(){return{type:'GO_BACK'}},e.navigate=function(...t){if('string'==typeof t[0]){const[n,o,p]=t;return'boolean'==typeof p&&console.warn("Passing a boolean as the third argument to 'navigate' is deprecated. Pass '{ merge: true }' instead."),{type:'NAVIGATE',payload:{name:n,params:o,merge:'boolean'==typeof p?p:p?.merge,pop:p?.pop}}}{const n=t[0]||{};if(!('name'in n))throw new Error('You need to specify a name when calling navigate with an object as the argument. See https://reactnavigation.org/docs/navigation-actions#navigate for usage.');return{type:'NAVIGATE',payload:n}}},e.navigateDeprecated=function(...t){if('string'==typeof t[0])return{type:'NAVIGATE_DEPRECATED',payload:{name:t[0],params:t[1]}};{const n=t[0]||{};if(!('name'in n))throw new Error('You need to specify a name when calling navigateDeprecated with an object as the argument. See https://reactnavigation.org/docs/navigation-actions#navigatelegacy for usage.');return{type:'NAVIGATE_DEPRECATED',payload:n}}},e.reset=function(t){return{type:'RESET',payload:t}},e.setParams=function(t){return{type:'SET_PARAMS',payload:{params:t}}},e.replaceParams=function(t){return{type:'REPLACE_PARAMS',payload:{params:t}}},e.preload=function(t,n){return{type:'PRELOAD',payload:{name:t,params:n}}}