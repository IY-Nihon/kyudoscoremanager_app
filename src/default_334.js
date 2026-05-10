/**
 * Module ID: 334
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 334);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return y}});var t=e(require("./default_327")),s=e(require("./default_335")),l=e(require("./default_326")),n=e(require("./default_328")),_=e(require("./default_45")).default.flatten;function u(e){var l=_(e),n={};for(var f in l){var y=l[f];'transform'===f&&Array.isArray(y)?n[f]=new s.default(y):y instanceof t.default?n[f]=y:y&&!Array.isArray(y)&&'object'==typeof y&&(n[f]=u(y))}return n}class f extends l.default{constructor(e){super(),this._inputStyle=e,this._style=u(e)}_walkStyleAndGetValues(e){var s={};for(var l in e){var n=e[l];n instanceof t.default?n.__isNative||(s[l]=n.__getValue()):n&&!Array.isArray(n)&&'object'==typeof n?s[l]=this._walkStyleAndGetValues(n):s[l]=n}return s}__getValue(){return[this._inputStyle,this._walkStyleAndGetValues(this._style)]}_walkStyleAndGetAnimatedValues(e){var s={};for(var l in e){var n=e[l];n instanceof t.default?s[l]=n.__getAnimatedValue():n&&!Array.isArray(n)&&'object'==typeof n&&(s[l]=this._walkStyleAndGetAnimatedValues(n))}return s}__getAnimatedValue(){return this._walkStyleAndGetAnimatedValues(this._style)}__attach(){for(var e in this._style){var s=this._style[e];s instanceof t.default&&s.__addChild(this)}}__detach(){for(var e in this._style){var s=this._style[e];s instanceof t.default&&s.__removeChild(this)}super.__detach()}__makeNative(){for(var e in this._style){var s=this._style[e];s instanceof t.default&&s.__makeNative()}super.__makeNative()}__getNativeConfig(){var e={};for(var s in this._style)if(this._style[s]instanceof t.default){var l=this._style[s];l.__makeNative(),e[s]=l.__getNativeTag()}return n.default.validateStyles(e),{type:'style',style:e}}}var y=f