/**
 * Module ID: 747
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 747);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.differenceInHours=u;var n=require("./module_748"),t=require("./module_717"),o=require("./module_700");function u(u,c,f){const[s,l]=(0,t.normalizeDates)(f?.in,u,c),_=(+s-+l)/o.millisecondsInHour;return(0,n.getRoundingMethod)(f?.roundingMethod)(_)}var c=u