/**
 * Module ID: 137
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 137);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return l}}),require("./module_98");var t=e(require("./default_138")),n=e(require("./module_27"));class l{constructor(e){}addListener(e,n,l){var u;null==(u=this._nativeModule)||u.addListener(e);var s=t.default.addListener(e,n,l);return{remove:()=>{var e;null!=s&&(null==(e=this._nativeModule)||e.removeListeners(1),s.remove(),s=null)}}}removeListener(e,n){var l;null==(l=this._nativeModule)||l.removeListeners(1),t.default.removeListener(e,n)}emit(e){for(var n=arguments.length,l=new Array(n>1?n-1:0),u=1;u<n;u++)l[u-1]=arguments[u];t.default.emit(e,...l)}removeAllListeners(e){var l;(0,n.default)(null!=e,'`NativeEventEmitter.removeAllListener()` requires a non-null argument.'),null==(l=this._nativeModule)||l.removeListeners(this.listenerCount(e)),t.default.removeAllListeners(e)}listenerCount(e){return t.default.listenerCount(e)}}