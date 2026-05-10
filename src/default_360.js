/**
 * Module ID: 360
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 360);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return _}});var t,e=require("./default_361"),s=(t=e)&&t.__esModule?t:{default:t},n=require("./default_328");class o extends s.default{constructor(t){var e,s,o;super(),this._deceleration=null!==(e=t.deceleration)&&void 0!==e?e:.998,this._velocity=t.velocity,this._useNativeDriver=(0,n.shouldUseNativeDriver)(t),this.__isInteraction=null!==(s=t.isInteraction)&&void 0!==s?s:!this._useNativeDriver,this.__iterations=null!==(o=t.iterations)&&void 0!==o?o:1}__getNativeAnimationConfig(){return{type:'decay',deceleration:this._deceleration,velocity:this._velocity,iterations:this.__iterations}}start(t,e,s,n,o){this.__active=!0,this._lastValue=t,this._fromValue=t,this._onUpdate=e,this.__onEnd=s,this._startTime=Date.now(),this._useNativeDriver?this.__startNativeAnimation(o):this._animationFrame=requestAnimationFrame(this.onUpdate.bind(this))}onUpdate(){var t=Date.now(),e=this._fromValue+this._velocity/(1-this._deceleration)*(1-Math.exp(-(1-this._deceleration)*(t-this._startTime)));this._onUpdate(e),Math.abs(this._lastValue-e)<.1?this.__debouncedOnEnd({finished:!0}):(this._lastValue=e,this.__active&&(this._animationFrame=requestAnimationFrame(this.onUpdate.bind(this))))}stop(){super.stop(),this.__active=!1,g.cancelAnimationFrame(this._animationFrame),this.__debouncedOnEnd({finished:!1})}}var _=o