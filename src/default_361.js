/**
 * Module ID: 361
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 361);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return _}});var t,e=require("./default_328"),n=(t=e)&&t.__esModule?t:{default:t},o=1;var _=class{start(t,e,n,o,_){}stop(){this.__nativeId&&n.default.API.stopAnimation(this.__nativeId)}__getNativeAnimationConfig(){throw new Error('This animation type cannot be offloaded to native')}__debouncedOnEnd(t){var e=this.__onEnd;this.__onEnd=null,e&&e(t)}__startNativeAnimation(t){var e=o+":startAnimation";o+=1,n.default.API.setWaitingForIdentifier(e);try{var _=this.__getNativeAnimationConfig();t.__makeNative(_.platformConfig),this.__nativeId=n.default.generateNewAnimationId(),n.default.API.startAnimatingNode(this.__nativeId,t.__getNativeTag(),_,this.__debouncedOnEnd.bind(this))}catch(t){throw t}finally{n.default.API.unsetWaitingForIdentifier(e)}}}