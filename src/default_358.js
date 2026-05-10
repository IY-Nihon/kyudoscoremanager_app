/**
 * Module ID: 358
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 358);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function t(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return u}});var e=t(require("./default_22"));require("./default_324");var _=t(require("./default_327")),n=require("./default_328");class s extends _.default{constructor(t,e,_,s,u){super(),this._value=t,this._parent=e,this._animationClass=_,this._animationConfig=s,this._useNativeDriver=(0,n.shouldUseNativeDriver)(s),this._callback=u,this.__attach()}__makeNative(){this.__isNative=!0,this._parent.__makeNative(),super.__makeNative(),this._value.__makeNative()}__getValue(){return this._parent.__getValue()}__attach(){this._parent.__addChild(this),this._useNativeDriver&&this.__makeNative()}__detach(){this._parent.__removeChild(this),super.__detach()}update(){this._value.animate(new this._animationClass((0,e.default)((0,e.default)({},this._animationConfig),{},{toValue:this._animationConfig.toValue.__getValue()})),this._callback)}__getNativeConfig(){var t=new this._animationClass((0,e.default)((0,e.default)({},this._animationConfig),{},{toValue:void 0})).__getNativeAnimationConfig();return{type:'tracking',animationId:(0,n.generateNewAnimationId)(),animationConfig:t,toValue:this._parent.__getNativeTag(),value:this._value.__getNativeTag()}}}var u=s