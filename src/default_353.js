/**
 * Module ID: 353
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 353);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function t(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return s}});var e=t(require("./default_325")),a=t(require("./default_326"));class _ extends a.default{constructor(t,e,a){super(),this._a=t,this._min=e,this._max=a,this._value=this._lastValue=this._a.__getValue()}__makeNative(t){this._a.__makeNative(t),super.__makeNative(t)}interpolate(t){return new e.default(this,t)}__getValue(){var t=this._a.__getValue(),e=t-this._lastValue;return this._lastValue=t,this._value=Math.min(Math.max(this._value+e,this._min),this._max),this._value}__attach(){this._a.__addChild(this)}__detach(){this._a.__removeChild(this),super.__detach()}__getNativeConfig(){return{type:'diffclamp',input:this._a.__getNativeTag(),min:this._min,max:this._max}}}var s=_