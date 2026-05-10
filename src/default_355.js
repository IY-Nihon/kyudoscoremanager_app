/**
 * Module ID: 355
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 355);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return a}});var t=e(require("./default_325")),_=e(require("./default_326"));class u extends _.default{constructor(e,t){super(),this._a=e,this._modulus=t}__makeNative(e){this._a.__makeNative(e),super.__makeNative(e)}__getValue(){return(this._a.__getValue()%this._modulus+this._modulus)%this._modulus}interpolate(e){return new t.default(this,e)}__attach(){this._a.__addChild(this)}__detach(){this._a.__removeChild(this),super.__detach()}__getNativeConfig(){return{type:'modulus',input:this._a.__getNativeTag(),modulus:this._modulus}}}var a=u