/**
 * Module ID: 752
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 752);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.differenceInMinutes=o;var n=require("./module_748"),t=require("./module_700"),u=require("./module_751");function o(o,c,f){const s=(0,u.differenceInMilliseconds)(o,c)/t.millisecondsInMinute;return(0,n.getRoundingMethod)(f?.roundingMethod)(s)}var c=o