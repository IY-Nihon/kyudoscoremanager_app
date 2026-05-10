/**
 * Module ID: 385
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 385);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return c}});var t=e(require("./default_30")),n=e(require("./default_46")),o=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),u=e(require("./default_144")),f=["behavior","contentContainerStyle","keyboardVerticalOffset"];class s extends o.Component{constructor(){super(...arguments),this.frame=null,this.onLayout=e=>{this.frame=e.nativeEvent.layout}}relativeKeyboardHeight(e){var t=this.frame;if(!t||!e)return 0;var n=e.screenY-(this.props.keyboardVerticalOffset||0);return Math.max(t.y+t.height-n,0)}onKeyboardChange(e){}render(){var e=this.props,s=(e.behavior,e.contentContainerStyle,e.keyboardVerticalOffset,(0,n.default)(e,f));return o.createElement(u.default,(0,t.default)({onLayout:this.onLayout},s))}}var c=s