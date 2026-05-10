/**
 * Module ID: 352
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 352);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return s}});var t=e(require("./default_325")),_=e(require("./default_324")),a=e(require("./default_326"));class u extends a.default{constructor(e,t){super(),this._a='number'==typeof e?new _.default(e):e,this._b='number'==typeof t?new _.default(t):t}__makeNative(e){this._a.__makeNative(e),this._b.__makeNative(e),super.__makeNative(e)}__getValue(){return this._a.__getValue()+this._b.__getValue()}interpolate(e){return new t.default(this,e)}__attach(){this._a.__addChild(this),this._b.__addChild(this)}__detach(){this._a.__removeChild(this),this._b.__removeChild(this),super.__detach()}__getNativeConfig(){return{type:'addition',input:[this._a.__getNativeTag(),this._b.__getNativeTag()]}}}var s=u