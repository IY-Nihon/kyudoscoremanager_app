/**
 * Module ID: 608
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 608);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.getAssetForSource=function(t){const e=f(t),o=c(t),n=l(t);e&&'string'==typeof e||y(e);return{uri:e,display:o,testString:n}},_e.loadSingleFontAsync=function(t,e){('object'!=typeof e||'string'!=typeof e.uri||e.downloadAsync)&&y(e);try{return u.default.loadAsync(t,e)}catch{}return Promise.resolve()};var t,e=require("./module_609"),o=require("./EventEmitter_100"),n=require("./default_605"),u=(t=n)&&t.__esModule?t:{default:t},s=require("./module_607");function f(t){return'string'==typeof t?t||null:'number'==typeof t?f(e.Asset.fromModule(t)):'object'==typeof t&&'number'==typeof t.uri?f(t.uri):'object'==typeof t&&(t.uri||t.localUri||t.default)||null}function c(t){return'object'==typeof t&&'display'in t&&t.display||s.FontDisplay.AUTO}function l(t){if('object'==typeof t&&'testString'in t)return t.testString??void 0}function y(t){let e=typeof t;throw'object'===e&&(e=JSON.stringify(t,null,2)),new o.CodedError("ERR_FONT_SOURCE",`Expected font asset of type \`string | FontResource | Asset\` instead got: ${e}`)}