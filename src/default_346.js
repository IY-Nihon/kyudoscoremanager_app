/**
 * Module ID: 346
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 346);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return l}});var t=e(require("./default_30")),s=e(require("./default_46"));require("./module_98");var n=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(s){var n=Object.getOwnPropertyDescriptor(e,s);Object.defineProperty(t,s,n.get?n:{enumerable:!0,get:function(){return e[s]}})}),t.default=e,t})(require("./module_37")),o=e(require("./default_347")),c=["stickySectionHeadersEnabled"];class l extends n.PureComponent{constructor(){super(...arguments),this._captureRef=e=>{this._wrapperListRef=e}}scrollToLocation(e){null!=this._wrapperListRef&&this._wrapperListRef.scrollToLocation(e)}recordInteraction(){var e=this._wrapperListRef&&this._wrapperListRef.getListRef();e&&e.recordInteraction()}flashScrollIndicators(){var e=this._wrapperListRef&&this._wrapperListRef.getListRef();e&&e.flashScrollIndicators()}getScrollResponder(){var e=this._wrapperListRef&&this._wrapperListRef.getListRef();if(e)return e.getScrollResponder()}getScrollableNode(){var e=this._wrapperListRef&&this._wrapperListRef.getListRef();if(e)return e.getScrollableNode()}render(){var e=this.props,l=e.stickySectionHeadersEnabled,f=(0,s.default)(e,c),p=null!=l&&l;return n.createElement(o.default,(0,t.default)({},f,{stickySectionHeadersEnabled:p,ref:this._captureRef,getItemCount:e=>e.length,getItem:(e,t)=>e[t]}))}}