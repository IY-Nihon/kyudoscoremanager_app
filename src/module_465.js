/**
 * Module ID: 465
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 465);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';m.exports=function t(n,o){if(n===o)return!0;if(n&&o&&'object'==typeof n&&'object'==typeof o){if(n.constructor!==o.constructor)return!1;var f,u,i;if(Array.isArray(n)){if((f=n.length)!=o.length)return!1;for(u=f;0!==u--;)if(!t(n[u],o[u]))return!1;return!0}if(n.constructor===RegExp)return n.source===o.source&&n.flags===o.flags;if(n.valueOf!==Object.prototype.valueOf)return n.valueOf()===o.valueOf();if(n.toString!==Object.prototype.toString)return n.toString()===o.toString();if((f=(i=Object.keys(n)).length)!==Object.keys(o).length)return!1;for(u=f;0!==u--;)if(!Object.prototype.hasOwnProperty.call(o,i[u]))return!1;for(u=f;0!==u--;){var c=i[u];if(!t(n[c],o[c]))return!1}return!0}return n!=n&&o!=o}