/**
 * Module ID: 830
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 830);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}}),e.getISOWeeksInYear=s;var t=require("./module_723"),n=require("./module_700"),u=require("./module_719");function s(s,o){const c=(0,u.startOfISOWeekYear)(s,o),f=+(0,u.startOfISOWeekYear)((0,t.addWeeks)(c,60))-+c;return Math.round(f/n.millisecondsInWeek)}var o=s