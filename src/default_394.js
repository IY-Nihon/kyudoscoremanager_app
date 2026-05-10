/**
 * Module ID: 394
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 394);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return w}});var t=e(require("./default_30")),n=e(require("./default_46")),o=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),f=e(require("./default_45")),u=e(require("./default_144")),d=e(require("./module_42")),s=["style"],l=d.default&&window.CSS&&window.CSS.supports&&window.CSS.supports('top: constant(safe-area-inset-top)')?'constant':'env',c=o.forwardRef((e,f)=>{var d=e.style,l=(0,n.default)(e,s);return o.createElement(u.default,(0,t.default)({},l,{ref:f,style:[p.root,d]}))});c.displayName='SafeAreaView';var p=f.default.create({root:{paddingTop:l+"(safe-area-inset-top)",paddingRight:l+"(safe-area-inset-right)",paddingBottom:l+"(safe-area-inset-bottom)",paddingLeft:l+"(safe-area-inset-left)"}}),w=c