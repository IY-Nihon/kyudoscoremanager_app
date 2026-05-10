/**
 * Module ID: 85
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 85);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(e,"__esModule",{value:!0}),e.default=function(t,i,o,u){if('string'==typeof i&&f.hasOwnProperty(t)){var l=s(i,u),p=l.split(/,(?![^()]*(?:\([^()]*\))?\))/g).filter(function(t){return!/-moz-|-ms-/.test(t)}).join(',');if(t.indexOf('Webkit')>-1)return p;var v=l.split(/,(?![^()]*(?:\([^()]*\))?\))/g).filter(function(t){return!/-webkit-|-ms-/.test(t)}).join(',');return t.indexOf('Moz')>-1?v:(o['Webkit'+(0,n.default)(t)]=p,o['Moz'+(0,n.default)(t)]=v,l)}};var t=o(require("./module_86")),i=o(require("./module_81")),n=o(require("./module_60"));function o(t){return t&&t.__esModule?t:{default:t}}var f={transition:!0,transitionProperty:!0,WebkitTransition:!0,WebkitTransitionProperty:!0,MozTransition:!0,MozTransitionProperty:!0},u={Webkit:'-webkit-',Moz:'-moz-',ms:'-ms-'};function s(n,o){if((0,i.default)(n))return n;for(var f=n.split(/,(?![^()]*(?:\([^()]*\))?\))/g),s=0,l=f.length;s<l;++s){var p=f[s],v=[p];for(var c in o){var b=(0,t.default)(c);if(p.indexOf(b)>-1&&'order'!==b)for(var k=o[c],z=0,M=k.length;z<M;++z)v.unshift(p.replace(b,u[k[z]]+b))}f[s]=v.join(',')}return f.join(',')}