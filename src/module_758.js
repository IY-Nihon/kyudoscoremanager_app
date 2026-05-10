/**
 * Module ID: 758
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 758);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.differenceInSeconds=o;var n=require("./module_748"),t=require("./module_751");function o(o,u,c){const f=(0,t.differenceInMilliseconds)(o,u)/1e3;return(0,n.getRoundingMethod)(c?.roundingMethod)(f)}var u=o