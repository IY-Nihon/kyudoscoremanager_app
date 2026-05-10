/**
 * Module ID: 311
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 311);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return n}});var l=e(require("./default_293")),t=e(require("./module_27"));class n{constructor(){this._cellKeyToChildren=new Map,this._childrenToCellKey=new Map}add(e,l){var n;(0,t.default)(!this._childrenToCellKey.has(e),'Trying to add already present child list');var o=null!==(n=this._cellKeyToChildren.get(l))&&void 0!==n?n:new Set;o.add(e),this._cellKeyToChildren.set(l,o),this._childrenToCellKey.set(e,l)}remove(e){var l=this._childrenToCellKey.get(e);(0,t.default)(null!=l,'Trying to remove non-present child list'),this._childrenToCellKey.delete(e);var n=this._cellKeyToChildren.get(l);(0,t.default)(n,'_cellKeyToChildren should contain cellKey'),n.delete(e),0===n.size&&this._cellKeyToChildren.delete(l)}forEach(e){for(var t,n=(0,l.default)(this._cellKeyToChildren.values());!(t=n()).done;)for(var o,h=t.value,s=(0,l.default)(h);!(o=s()).done;){e(o.value)}}forEachInCell(e,t){for(var n,o,h=null!==(n=this._cellKeyToChildren.get(e))&&void 0!==n?n:[],s=(0,l.default)(h);!(o=s()).done;){t(o.value)}}anyInCell(e,t){for(var n,o,h=null!==(n=this._cellKeyToChildren.get(e))&&void 0!==n?n:[],s=(0,l.default)(h);!(o=s()).done;){if(t(o.value))return!0}return!1}size(){return this._childrenToCellKey.size}}