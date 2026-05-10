/**
 * Module ID: 210
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 210);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return f}});var t=e(require("./default_136")),n=e(require("./module_211")),u=require("./module_212");const E=new t.default;n.default.addListener(u.DEVICE_CONNECTIVITY_EVENT,e=>{E.emit(u.DEVICE_CONNECTIVITY_EVENT,e)});var f=Object.assign({},n.default,{eventEmitter:E})