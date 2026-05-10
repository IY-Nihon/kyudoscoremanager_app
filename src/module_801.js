/**
 * Module ID: 801
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 801);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}}),e.getISOWeek=c;var t=require("./module_700"),n=require("./module_711"),u=require("./module_719"),o=require("./module_701");function c(c,f){const s=(0,o.toDate)(c,f?.in),O=+(0,n.startOfISOWeek)(s)-+(0,u.startOfISOWeekYear)(s);return Math.round(O/t.millisecondsInWeek)+1}var f=c