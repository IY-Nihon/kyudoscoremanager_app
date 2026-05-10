/**
 * Module ID: 623
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 623);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.renderToImageAsync=async function(e,c){if(!t.default)throw new o.UnavailabilityError('expo-font','ExpoFontUtils.renderToImageAsync');return await t.default.renderToImageAsync(e,Object.assign({},c,{color:c?.color?(0,n.default)(c.color):void 0}))};var o=require("./EventEmitter_100"),n=e(require("./default_53")),t=e(require("./module_624"))