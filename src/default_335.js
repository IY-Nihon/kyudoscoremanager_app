/**
 * Module ID: 335
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 335);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function t(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return o}});var e=t(require("./default_327")),n=t(require("./default_326")),s=t(require("./default_328"));class f extends n.default{constructor(t){super(),this._transforms=t}__makeNative(){this._transforms.forEach(t=>{for(var n in t){var s=t[n];s instanceof e.default&&s.__makeNative()}}),super.__makeNative()}__getValue(){return this._transforms.map(t=>{var n={};for(var s in t){var f=t[s];f instanceof e.default?n[s]=f.__getValue():n[s]=f}return n})}__getAnimatedValue(){return this._transforms.map(t=>{var n={};for(var s in t){var f=t[s];f instanceof e.default?n[s]=f.__getAnimatedValue():n[s]=f}return n})}__attach(){this._transforms.forEach(t=>{for(var n in t){var s=t[n];s instanceof e.default&&s.__addChild(this)}})}__detach(){this._transforms.forEach(t=>{for(var n in t){var s=t[n];s instanceof e.default&&s.__removeChild(this)}}),super.__detach()}__getNativeConfig(){var t=[];return this._transforms.forEach(n=>{for(var f in n){var o=n[f];o instanceof e.default?t.push({type:'animated',property:f,nodeTag:o.__getNativeTag()}):t.push({type:'static',property:f,value:s.default.transformDataType(o)})}}),s.default.validateTransform(t),{type:'transform',transforms:t}}}var o=f