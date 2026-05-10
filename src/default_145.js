/**
 * Module ID: 145
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 145);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return o}});var t=e(require("./default_146")),n=e(require("./default_150")),l=e(require("./module_37")),u=require("./module_151"),o=(e,o,c)=>{var f;e&&e.constructor===String&&(f=t.default.propsToAccessibilityComponent(o));var s=f||e,_=(0,n.default)(s,o,c),p=l.default.createElement(s,_);return _.dir?l.default.createElement(u.LocaleProvider,{children:p,direction:_.dir,locale:_.lang}):p}