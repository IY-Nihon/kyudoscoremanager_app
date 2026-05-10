/**
 * Module ID: 45
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 45);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function t(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return S}});var e=t(require("./default_22")),n=t(require("./default_46")),i=require("./module_47"),o=require("./module_41"),l=require("./module_87"),u=require("./default_89"),c=require("./module_91");require("./module_92");var f=t(require("./module_42")),s=["writingDirection"],_=new WeakMap,v=(0,o.createSheet)(),O={shadow:!0,textShadow:!0};function w(t,i){void 0===i&&(i={});var o=i,f=o.writingDirection,v=(0,n.default)(o,s),w='rtl'===f;return c.styleq.factory({transform(t){var n=_.get(t);return null!=n?(0,l.localizeStyle)(n,w):(0,u.preprocess)(t,(0,e.default)((0,e.default)({},O),v))}})(t)}function h(t){t.forEach(t=>{var e=t[0],n=t[1];null!=v&&e.forEach(t=>{v.insert(t,n)})})}function p(t,e){var n=(0,i.classic)(t,e),o=n[0];return h(n[1]),o}var b={position:'absolute',left:0,right:0,top:0,bottom:0},y=A({x:(0,e.default)({},b)}).x;function A(t){return Object.keys(t).forEach(e=>{var n,o,l,c,f=t[e];null!=f&&!0!==f.$$css&&(e.indexOf('$raw')>-1?n=p(f,e.split('$raw')[0]):(o=f,l=(0,i.atomic)((0,u.preprocess)(o,O)),c=l[0],h(l[1]),n=c),_.set(f,n))}),t}function E(t,e){void 0===e&&(e={});var n='rtl'===e.writingDirection,o=w(t,e);return Array.isArray(o)&&null!=o[1]&&(o[1]=(0,i.inline)(o[1],n)),o}E.absoluteFill=y,E.absoluteFillObject=b,E.create=A,E.compose=function(t,e){return[t,e]},E.flatten=function(){for(var t=arguments.length,e=new Array(t),n=0;n<t;n++)e[n]=arguments[n];for(var i=e.flat(1/0),o={},l=0;l<i.length;l++){var u=i[l];null!=u&&'object'==typeof u&&Object.assign(o,u)}return o},E.getSheet=function(){return{id:v.id,textContent:v.getTextContent()}},E.hairlineWidth=1,f.default&&window.__REACT_DEVTOOLS_GLOBAL_HOOK__&&(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.resolveRNStyle=E.flatten);var S=E