/**
 * Module ID: 323
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 323);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.attachNativeEvent=v,Object.defineProperty(_e,"AnimatedEvent",{enumerable:!0,get:function(){return _}});var t=e(require("./default_324")),n=require("./default_328"),s=e(n),l=e(require("./module_27"));function v(e,n,v){var _=[],o=(e,n)=>{if(e instanceof t.default)e.__makeNative(),_.push({nativeEventPath:n,animatedValueTag:e.__getNativeTag()});else if('object'==typeof e)for(var s in e)o(e[s],n.concat(s))};return(0,l.default)(v[0]&&v[0].nativeEvent,'Native driven events only support animated values contained inside `nativeEvent`.'),o(v[0].nativeEvent,[]),null!=e&&_.forEach(t=>{s.default.API.addAnimatedEventToView(e,n,t)}),{detach(){null!=e&&_.forEach(t=>{s.default.API.removeAnimatedEventFromView(e,n,t.animatedValueTag)})}}}class _{constructor(e,t){this._listeners=[],this._argMapping=e,null==t&&(console.warn('Animated.event now requires a second argument for options'),t={useNativeDriver:!1}),t.listener&&this.__addListener(t.listener),this._callListeners=this._callListeners.bind(this),this._attachedEvent=null,this.__isNative=(0,n.shouldUseNativeDriver)(t)}__addListener(e){this._listeners.push(e)}__removeListener(e){this._listeners=this._listeners.filter(t=>t!==e)}__attach(e,t){(0,l.default)(this.__isNative,'Only native driven events need to be attached.'),this._attachedEvent=v(e,t,this._argMapping)}__detach(e,t){(0,l.default)(this.__isNative,'Only native driven events need to be detached.'),this._attachedEvent&&this._attachedEvent.detach()}__getHandler(){var e=this;if(this.__isNative)return this._callListeners;return function(){for(var n=arguments.length,s=new Array(n),l=0;l<n;l++)s[l]=arguments[l];var v=(e,n,s)=>{if(e instanceof t.default)'number'==typeof n&&e.setValue(n);else if('object'==typeof e)for(var l in e)v(e[l],n[l],l)};e._argMapping.forEach((e,t)=>{v(e,s[t],'arg'+t)}),e._callListeners(...s)}}_callListeners(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];this._listeners.forEach(e=>e(...t))}}