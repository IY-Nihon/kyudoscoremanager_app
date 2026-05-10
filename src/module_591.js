/**
 * Module ID: 591
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 591);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useBottomTabBarHeight=function(){const o=t.useContext(e.BottomTabBarHeightContext);if(void 0===o)throw new Error("Couldn't find the bottom tab bar height. Are you inside a screen in Bottom Tab Navigator?");return o};var t=(function(t){if(t&&t.__esModule)return t;var e={};return t&&Object.keys(t).forEach(function(o){var n=Object.getOwnPropertyDescriptor(t,o);Object.defineProperty(e,o,n.get?n:{enumerable:!0,get:function(){return t[o]}})}),e.default=t,e})(require("./module_37")),e=require("./BottomTabBarHeightContext_560")