/**
 * Module ID: 571
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const _r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 571);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["active","activityState","style","enabled"];function t(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return y}}),Object.defineProperty(_e,"InnerScreen",{enumerable:!0,get:function(){return f}}),Object.defineProperty(_e,"NativeScreen",{enumerable:!0,get:function(){return s}}),Object.defineProperty(_e,"ScreenContext",{enumerable:!0,get:function(){return p}});var n=t(require("./module_130")),r=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var r=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,r.get?r:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_272")),u=t(require("./default_286")),c=t(require("./default_144")),o=t(require("./module_37")),l=require("./isNativePlatformSupported_570");function d(){return d=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)({}).hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},d.apply(null,arguments)}const f=c.default;class s extends o.default.Component{render(){let t=this.props,{active:u,activityState:o,style:f,enabled:s=(0,l.screensEnabled)()}=t,b=(0,n.default)(t,e);return s?(void 0!==u&&void 0===o&&(o=0!==u?2:0),r.createInteropElement(c.default,d({hidden:0===o,style:[f,{display:0!==o?'flex':'none'}]},b))):r.createInteropElement(c.default,b)}}const b=u.default.createAnimatedComponent(s),p=o.default.createContext(b);var y=b