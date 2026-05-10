/**
 * Module ID: 58
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 58);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(e,"__esModule",{value:!0}),e.default=function(l){var i=l.prefixMap,o=l.plugins;return function l(s){for(var v in s){var c=s[v];if((0,n.default)(c))s[v]=l(c);else if(Array.isArray(c)){for(var _=[],p=0,y=c.length;p<y;++p){var M=(0,u.default)(o,v,c[p],s,i);(0,f.default)(_,M||c[p])}_.length>0&&(s[v]=_)}else{var h=(0,u.default)(o,v,c,s,i);h&&(s[v]=h),s=(0,t.default)(i,v,s)}}return s}};var t=l(require("./module_59")),u=l(require("./module_61")),f=l(require("./module_62")),n=l(require("./module_63"));function l(t){return t&&t.__esModule?t:{default:t}}