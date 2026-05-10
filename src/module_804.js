/**
 * Module ID: 804
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 804);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.getWeekYear=u;var t=require("./module_713"),n=require("./module_699"),o=require("./module_712"),s=require("./module_701");function u(u,c){const l=(0,s.toDate)(u,c?.in),f=l.getFullYear(),k=(0,t.getDefaultOptions)(),W=c?.firstWeekContainsDate??c?.locale?.options?.firstWeekContainsDate??k.firstWeekContainsDate??k.locale?.options?.firstWeekContainsDate??1,D=(0,n.constructFrom)(c?.in||u,0);D.setFullYear(f+1,0,W),D.setHours(0,0,0,0);const p=(0,o.startOfWeek)(D,c),F=(0,n.constructFrom)(c?.in||u,0);F.setFullYear(f,0,W),F.setHours(0,0,0,0);const O=(0,o.startOfWeek)(F,c);return+l>=+p?f+1:+l>=+O?f:f-1}var c=u