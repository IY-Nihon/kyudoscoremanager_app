/**
 * Module ID: 749
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 749);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}}),e.differenceInISOWeekYears=u;var n=require("./module_717"),t=require("./module_731"),c=require("./module_739"),s=require("./module_750");function u(u,f,o){const[b,l]=(0,n.normalizeDates)(o?.in,u,f),I=(0,t.compareAsc)(b,l),O=Math.abs((0,c.differenceInCalendarISOWeekYears)(b,l,o)),p=(0,s.subISOWeekYears)(b,I*O,o),_=I*(O-Number((0,t.compareAsc)(p,l)===-I));return 0===_?0:_}var f=u