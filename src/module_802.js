/**
 * Module ID: 802
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 802);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}}),e.getWeek=c;var t=require("./module_700"),n=require("./module_712"),u=require("./module_803"),o=require("./module_701");function c(c,f){const s=(0,o.toDate)(c,f?.in),l=+(0,n.startOfWeek)(s,f)-+(0,u.startOfWeekYear)(s,f);return Math.round(l/t.millisecondsInWeek)+1}var f=c