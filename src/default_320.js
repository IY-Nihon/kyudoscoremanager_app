/**
 * Module ID: 320
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 320);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return c}});var t=e(require("./default_30")),u=e(require("./default_46")),n=e(require("./default_321")),f=e(require("./module_337"));require("./default_45"),require("./default_144");var l=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(u){var n=Object.getOwnPropertyDescriptor(e,u);Object.defineProperty(t,u,n.get?n:{enumerable:!0,get:function(){return e[u]}})}),t.default=e,t})(require("./module_37")),o=["style"];function c(e){return l.forwardRef((c,d)=>{var s=(0,n.default)(c),y=s[0],p=s[1],_=(0,f.default)(p,d),b=y.passthroughAnimatedPropExplicitValues,v=y.style,O=null!=b?b:{},j=O.style,P=(0,u.default)(O,o),h=[v,j];return l.createElement(e,(0,t.default)({},y,P,{style:h,ref:_}))})}