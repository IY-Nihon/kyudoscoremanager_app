/**
 * Module ID: 365
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 365);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function t(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return h}}),require("./default_324"),require("./default_359"),require("./default_325");var e,s=t(require("./default_229")),n=t(require("./default_361")),o=require("./default_328");require("./default_364");class _ extends n.default{constructor(t){var n,_,h,u,l;super(),this._toValue=t.toValue,this._easing=null!==(n=t.easing)&&void 0!==n?n:(e||(e=s.default.inOut(s.default.ease)),e),this._duration=null!==(_=t.duration)&&void 0!==_?_:500,this._delay=null!==(h=t.delay)&&void 0!==h?h:0,this.__iterations=null!==(u=t.iterations)&&void 0!==u?u:1,this._useNativeDriver=(0,o.shouldUseNativeDriver)(t),this._platformConfig=t.platformConfig,this.__isInteraction=null!==(l=t.isInteraction)&&void 0!==l?l:!this._useNativeDriver}__getNativeAnimationConfig(){for(var t=[],e=Math.round(this._duration/16.666666666666668),s=0;s<e;s++)t.push(this._easing(s/e));return t.push(this._easing(1)),{type:'frames',frames:t,toValue:this._toValue,iterations:this.__iterations,platformConfig:this._platformConfig}}start(t,e,s,n,o){this.__active=!0,this._fromValue=t,this._onUpdate=e,this.__onEnd=s;var _=()=>{0!==this._duration||this._useNativeDriver?(this._startTime=Date.now(),this._useNativeDriver?this.__startNativeAnimation(o):this._animationFrame=requestAnimationFrame(this.onUpdate.bind(this))):(this._onUpdate(this._toValue),this.__debouncedOnEnd({finished:!0}))};this._delay?this._timeout=setTimeout(_,this._delay):_()}onUpdate(){var t=Date.now();if(t>=this._startTime+this._duration)return 0===this._duration?this._onUpdate(this._toValue):this._onUpdate(this._fromValue+this._easing(1)*(this._toValue-this._fromValue)),void this.__debouncedOnEnd({finished:!0});this._onUpdate(this._fromValue+this._easing((t-this._startTime)/this._duration)*(this._toValue-this._fromValue)),this.__active&&(this._animationFrame=requestAnimationFrame(this.onUpdate.bind(this)))}stop(){super.stop(),this.__active=!1,clearTimeout(this._timeout),g.cancelAnimationFrame(this._animationFrame),this.__debouncedOnEnd({finished:!1})}}var h=_