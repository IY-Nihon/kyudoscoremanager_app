/**
 * Module ID: 1
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 1);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"disableErrorHandling",{enumerable:!0,get:function(){return t.disableErrorHandling}}),Object.defineProperty(_e,"registerRootComponent",{enumerable:!0,get:function(){return u.default}}),Object.defineProperty(_e,"isRunningInExpoGo",{enumerable:!0,get:function(){return o.isRunningInExpoGo}}),Object.defineProperty(_e,"getExpoGoProjectConfig",{enumerable:!0,get:function(){return o.getExpoGoProjectConfig}}),Object.defineProperty(_e,"EventEmitter",{enumerable:!0,get:function(){return c.EventEmitter}}),Object.defineProperty(_e,"SharedObject",{enumerable:!0,get:function(){return c.SharedObject}}),Object.defineProperty(_e,"SharedRef",{enumerable:!0,get:function(){return c.SharedRef}}),Object.defineProperty(_e,"NativeModule",{enumerable:!0,get:function(){return c.NativeModule}}),Object.defineProperty(_e,"requireNativeModule",{enumerable:!0,get:function(){return c.requireNativeModule}}),Object.defineProperty(_e,"requireOptionalNativeModule",{enumerable:!0,get:function(){return c.requireOptionalNativeModule}}),Object.defineProperty(_e,"requireNativeView",{enumerable:!0,get:function(){return c.requireNativeViewManager}}),Object.defineProperty(_e,"registerWebModule",{enumerable:!0,get:function(){return c.registerWebModule}}),Object.defineProperty(_e,"reloadAppAsync",{enumerable:!0,get:function(){return c.reloadAppAsync}}),Object.defineProperty(_e,"installOnUIRuntime",{enumerable:!0,get:function(){return c.installOnUIRuntime}}),Object.defineProperty(_e,"useEvent",{enumerable:!0,get:function(){return l.useEvent}}),Object.defineProperty(_e,"useEventListener",{enumerable:!0,get:function(){return l.useEventListener}}),require("./module_2");var e,t=require("./module_19"),n=require("./default_20"),u=(e=n)&&e.__esModule?e:{default:e},o=require("./module_99"),c=require("./EventEmitter_100"),l=require("./module_142")