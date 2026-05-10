/**
 * Module ID: 386
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 386);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return _}});var t=e(require("./default_30")),n=e(require("./default_46")),u=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),o=e(require("./default_387")),l=e(require("./default_388")),s=e(require("./default_389")),f=e(require("./default_390")),c=["animationType","children","onDismiss","onRequestClose","onShow","transparent","visible"],d=0,v=[],p={};function b(){if(0!==v.length){var e=v[v.length-1];v.forEach(t=>{t in p&&p[t](t===e)})}}function h(e){e in p&&(p[e](!1),delete p[e]);var t=v.indexOf(e);-1!==t&&(v.splice(t,1),b())}function y(e,t){h(e),v.push(e),p[e]=t,b()}var _=u.forwardRef((e,v)=>{var p=e.animationType,b=e.children,_=e.onDismiss,E=e.onRequestClose,O=e.onShow,j=e.transparent,w=e.visible,C=void 0===w||w,D=(0,n.default)(e,c),M=u.useMemo(()=>d++,[]),P=u.useState(!1),R=P[0],S=P[1],k=u.useCallback(()=>{h(M),_&&_()},[M,_]),q=u.useCallback(()=>{y(M,S),O&&O()},[M,O]);return u.useEffect(()=>()=>h(M),[M]),u.createElement(o.default,null,u.createElement(l.default,{animationType:p,onDismiss:k,onShow:q,visible:C},u.createElement(f.default,{active:R},u.createElement(s.default,(0,t.default)({},D,{active:R,onRequestClose:E,ref:v,transparent:j}),b))))})