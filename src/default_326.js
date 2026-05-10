/**
 * Module ID: 326
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 326);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return l}});var t=e(require("./default_293")),_=e(require("./default_327")),s=e(require("./default_328"));class n extends _.default{constructor(){super(),this._children=[]}__makeNative(e){if(!this.__isNative){this.__isNative=!0;for(var _,n=(0,t.default)(this._children);!(_=n()).done;){var l=_.value;l.__makeNative(e),s.default.API.connectAnimatedNodes(this.__getNativeTag(),l.__getNativeTag())}}super.__makeNative(e)}__addChild(e){0===this._children.length&&this.__attach(),this._children.push(e),this.__isNative&&(e.__makeNative(this.__getPlatformConfig()),s.default.API.connectAnimatedNodes(this.__getNativeTag(),e.__getNativeTag()))}__removeChild(e){var t=this._children.indexOf(e);-1!==t?(this.__isNative&&e.__isNative&&s.default.API.disconnectAnimatedNodes(this.__getNativeTag(),e.__getNativeTag()),this._children.splice(t,1),0===this._children.length&&this.__detach()):console.warn("Trying to remove a child that doesn't exist")}__getChildren(){return this._children}__callListeners(e){if(super.__callListeners(e),!this.__isNative)for(var _,s=(0,t.default)(this._children);!(_=s()).done;){var n=_.value;n.__getValue&&n.__callListeners(n.__getValue())}}}var l=n