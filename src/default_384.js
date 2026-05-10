/**
 * Module ID: 384
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 384);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return h}});var t=e(require("./default_30")),n=e(require("./default_46")),l=require("./module_37"),u=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var l=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,l.get?l:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(l),f=e(require("./default_339")),d=e(require("./default_45")),c=e(require("./default_144")),o=["children","style","imageStyle","imageRef"],s={},y=(0,l.forwardRef)((e,l)=>{var y=e.children,h=e.style,b=void 0===h?s:h,_=e.imageStyle,v=e.imageRef,p=(0,n.default)(e,o),O=d.default.flatten(b),j=O.height,w=O.width;return u.createElement(c.default,{ref:l,style:b},u.createElement(f.default,(0,t.default)({},p,{ref:v,style:[{width:w,height:j,zIndex:-1},d.default.absoluteFill,_]})),y)});y.displayName='ImageBackground';var h=y