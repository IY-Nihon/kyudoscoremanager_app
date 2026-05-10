/**
 * Module ID: 401
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 401);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return l}}),require("./module_27");var o=function(o,n){var t=this;if(t.instancePool.length){var l=t.instancePool.pop();return t.call(l,o,n),l}return new t(o,n)},n=function(o){var n=this;o.destructor(),n.instancePool.length<n.poolSize&&n.instancePool.push(o)},t=o,l={addPoolingTo:function(o,l){var u=o;return u.instancePool=[],u.getPooled=l||t,u.poolSize||(u.poolSize=10),u.release=n,u},twoArgumentPooler:o}