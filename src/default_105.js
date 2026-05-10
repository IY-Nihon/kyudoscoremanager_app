/**
 * Module ID: 105
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 105);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function _interopDefault(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return _default}});var _libSha=require("./default_106"),sha1=_interopDefault(_libSha),_libV=require("./default_107"),v35=_interopDefault(_libV),_uuidTypes=require("./module_109");function uuidv4(){return'undefined'==typeof crypto&&'undefined'==typeof window?eval('require')('node:crypto').randomUUID():crypto.randomUUID()}const uuid={v4:uuidv4,v5:(0,v35.default)('v5',80,sha1.default),namespace:_uuidTypes.Uuidv5Namespace};var _default=uuid