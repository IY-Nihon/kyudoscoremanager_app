/**
 * Module ID: 359
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 359);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function t(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return u}});var e=t(require("./default_324")),s=t(require("./default_326")),n=t(require("./module_27")),l=1;class f extends s.default{constructor(t){super();var s=t||{x:0,y:0};'number'==typeof s.x&&'number'==typeof s.y?(this.x=new e.default(s.x),this.y=new e.default(s.y)):((0,n.default)(s.x instanceof e.default&&s.y instanceof e.default,"AnimatedValueXY must be initialized with an object of numbers or AnimatedValues."),this.x=s.x,this.y=s.y),this._listeners={}}setValue(t){this.x.setValue(t.x),this.y.setValue(t.y)}setOffset(t){this.x.setOffset(t.x),this.y.setOffset(t.y)}flattenOffset(){this.x.flattenOffset(),this.y.flattenOffset()}extractOffset(){this.x.extractOffset(),this.y.extractOffset()}__getValue(){return{x:this.x.__getValue(),y:this.y.__getValue()}}resetAnimation(t){this.x.resetAnimation(),this.y.resetAnimation(),t&&t(this.__getValue())}stopAnimation(t){this.x.stopAnimation(),this.y.stopAnimation(),t&&t(this.__getValue())}addListener(t){var e=String(l++),s=e=>{e.value;t(this.__getValue())};return this._listeners[e]={x:this.x.addListener(s),y:this.y.addListener(s)},e}removeListener(t){this.x.removeListener(this._listeners[t].x),this.y.removeListener(this._listeners[t].y),delete this._listeners[t]}removeAllListeners(){this.x.removeAllListeners(),this.y.removeAllListeners(),this._listeners={}}getLayout(){return{left:this.x,top:this.y}}getTranslateTransform(){return[{translateX:this.x},{translateY:this.y}]}}var u=f