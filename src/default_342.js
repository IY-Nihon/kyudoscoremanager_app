/**
 * Module ID: 342
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 342);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return n}});var e,t=require("./default_298"),u=(e=t)&&e.__esModule?e:{default:e};class n{static get(){return u.default.get('window').scale}static getFontScale(){return u.default.get('window').fontScale||n.get()}static getPixelSizeForLayoutSize(e){return Math.round(e*n.get())}static roundToNearestPixel(e){var t=n.get();return Math.round(e*t)/t}}