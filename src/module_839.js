/**
 * Module ID: 839
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 839);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.getWeeksInMonth=u;var t=require("./module_744"),n=require("./module_840"),o=require("./module_771"),f=require("./module_701");function u(u,c){const s=(0,f.toDate)(u,c?.in);return(0,t.differenceInCalendarWeeks)((0,n.lastDayOfMonth)(s,c),(0,o.startOfMonth)(s,c),c)+1}var c=u