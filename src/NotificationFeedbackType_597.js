/**
 * Module ID: 597
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 597);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.notificationAsync=async function(e=o.NotificationFeedbackType.Success){if(!c.default?.notificationAsync)throw new t.UnavailabilityError('Haptics','notificationAsync');await c.default.notificationAsync(e)},_e.impactAsync=async function(e=o.ImpactFeedbackStyle.Medium){if(!c.default?.impactAsync)throw new t.UnavailabilityError('Haptic','impactAsync');await c.default.impactAsync(e)},_e.selectionAsync=async function(){if(!c.default?.selectionAsync)throw new t.UnavailabilityError('Haptic','selectionAsync');await c.default.selectionAsync()},_e.performAndroidHapticsAsync=async function(e){return},Object.defineProperty(_e,"NotificationFeedbackType",{enumerable:!0,get:function(){return o.NotificationFeedbackType}}),Object.defineProperty(_e,"ImpactFeedbackStyle",{enumerable:!0,get:function(){return o.ImpactFeedbackStyle}}),Object.defineProperty(_e,"AndroidHaptics",{enumerable:!0,get:function(){return o.AndroidHaptics}});var e,t=require("./EventEmitter_100"),n=require("./module_598"),c=(e=n)&&e.__esModule?e:{default:e},o=require("./module_599")