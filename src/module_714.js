/**
 * Module ID: 714
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 714);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.setISOWeekYear=o;var t=require("./module_699"),n=require("./module_715"),s=require("./module_719"),u=require("./module_701");function o(o,c,f){let l=(0,u.toDate)(o,f?.in);const O=(0,n.differenceInCalendarDays)(l,(0,s.startOfISOWeekYear)(l,f)),D=(0,t.constructFrom)(f?.in||o,0);return D.setFullYear(c,0,4),D.setHours(0,0,0,0),l=(0,s.startOfISOWeekYear)(D),l.setDate(l.getDate()+O),l}var c=o