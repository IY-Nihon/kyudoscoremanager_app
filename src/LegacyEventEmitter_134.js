/**
 * Module ID: 134
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 134);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"LegacyEventEmitter",{enumerable:!0,get:function(){return o}});var t=e(require("./module_135")),n=e(require("./default_136"));require("./module_98");const s='@@nativeEmitterSubscription@@';class o{_listenerCount=0;constructor(e){if(e.__expo_module_name__)return e;this._nativeModule=e,this._eventEmitter=new n.default(e)}addListener(e,t){!this._listenerCount&&this._nativeModule.startObserving&&this._nativeModule.startObserving(),this._listenerCount++;const n=this._eventEmitter.addListener(e,t),o={[s]:n,remove:()=>{this.removeSubscription(o)}};return o}removeAllListeners(e){const n=this._eventEmitter.listenerCount?this._eventEmitter.listenerCount(e):this._eventEmitter.listeners(e).length;this._eventEmitter.removeAllListeners(e),this._listenerCount-=n,(0,t.default)(this._listenerCount>=0,"EventEmitter must have a non-negative number of listeners"),!this._listenerCount&&this._nativeModule.stopObserving&&this._nativeModule.stopObserving()}removeSubscription(e){const t=e,n=t[s];n&&('remove'in n&&n.remove?.(),this._listenerCount--,delete t[s],e.remove=()=>{},!this._listenerCount&&this._nativeModule.stopObserving&&this._nativeModule.stopObserving())}emit(e,...t){this._eventEmitter.emit(e,...t)}}