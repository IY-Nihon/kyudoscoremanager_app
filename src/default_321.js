/**
 * Module ID: 321
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 321);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return _}});var t=e(require("./default_22")),u=e(require("./default_322")),n=require("./AnimatedEvent_323"),l=e(require("./module_336")),c=e(require("./default_328")),f=require("./module_37"),o=e(require("./default_156"));function _(e){var t=(0,f.useReducer)(e=>e+1,0)[1],c=(0,f.useRef)(null),o=(0,f.useMemo)(()=>new u.default(e,()=>null==c.current?void 0:c.current()),[e]);v(o);var _=(0,f.useCallback)(u=>{o.setNativeView(u),c.current=()=>{t()};var l=b(u),f=[];for(var _ in e){var s=e[_];s instanceof n.AnimatedEvent&&s.__isNative&&(s.__attach(l,_),f.push([_,s]))}return()=>{c.current=null;for(var e=0,t=f;e<t.length;e++){var u=t[e],n=u[0];u[1].__detach(l,n)}}},[e,o]),h=(0,l.default)(_);return[s(o),h]}function s(e){return(0,t.default)((0,t.default)({},e.__getValue()),{},{collapsable:!1})}function v(e){var t=(0,f.useRef)(null),u=(0,f.useRef)(!1);(0,f.useEffect)(()=>{c.default.API.flushQueue()}),(0,o.default)(()=>(u.current=!1,()=>{u.current=!0}),[]),(0,o.default)(()=>{if(e.__attach(),null!=t.current){var n=t.current;n.__restoreDefaultValues(),n.__detach(),t.current=null}return()=>{u.current?e.__detach():t.current=e}},[e])}function b(e){return'object'==typeof e&&'function'==typeof(null==e?void 0:e.getScrollableNode)?e.getScrollableNode():e}