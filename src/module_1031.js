/**
 * Module ID: 1031
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 1031);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.isAvailableAsync=async function(){if(l.default)return!l.default.isAvailableAsync||await l.default.isAvailableAsync();return!1},_e.shareAsync=async function(e,n={}){if(!l.default||!l.default.shareAsync)throw new t.UnavailabilityError('Sharing','shareAsync');return await l.default.shareAsync(e,n)},_e.getSharedPayloads=function(){return l.default.getSharedPayloads()},_e.getResolvedSharedPayloadsAsync=async function(){return await l.default.getResolvedSharedPayloadsAsync()},_e.clearSharedPayloads=function(){l.default.clearSharedPayloads()};var e,t=require("./EventEmitter_100"),n=require("./module_1032"),l=(e=n)&&e.__esModule?e:{default:e}