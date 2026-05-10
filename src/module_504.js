/**
 * Module ID: 504
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 504);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["screen","params","action","href","style"];function t(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.Link=function(t){let{screen:f,params:l,action:d,href:p,style:y}=t,P=(0,n.default)(t,e);const{colors:_,fonts:b}=(0,o.useTheme)(),v=(0,u.useLinkProps)({screen:f,params:l,action:d,href:p});return s.createInteropElement(c.default,Object.assign({},v,P,{onClick:e=>{'onPress'in P&&P.onPress?.(e),e.defaultPrevented||v.onPress(e)}},{style:[{color:_.primary},b.regular,y]}))};var n=t(require("./module_130")),s=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var s=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,s.get?s:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_272")),o=require("./module_235");require("./module_37"),require("./module_98");var c=t(require("./default_217")),u=require("./module_505")