/**
 * Module ID: 980
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 980);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.setWeekYear=u;var t=require("./module_713"),n=require("./module_699"),s=require("./module_715"),o=require("./module_803"),f=require("./module_701");function u(u,c,l){const D=(0,t.getDefaultOptions)(),k=l?.firstWeekContainsDate??l?.locale?.options?.firstWeekContainsDate??D.firstWeekContainsDate??D.locale?.options?.firstWeekContainsDate??1,W=(0,s.differenceInCalendarDays)((0,f.toDate)(u,l?.in),(0,o.startOfWeekYear)(u,l),l),p=(0,n.constructFrom)(l?.in||u,0);p.setFullYear(c,0,k),p.setHours(0,0,0,0);const C=(0,o.startOfWeekYear)(p,l);return C.setDate(C.getDate()+W),C}var c=u