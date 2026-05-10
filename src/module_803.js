/**
 * Module ID: 803
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 803);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}}),e.startOfWeekYear=u;var t=require("./module_713"),n=require("./module_699"),o=require("./module_804"),s=require("./module_712");function u(u,f){const c=(0,t.getDefaultOptions)(),l=f?.firstWeekContainsDate??f?.locale?.options?.firstWeekContainsDate??c.firstWeekContainsDate??c.locale?.options?.firstWeekContainsDate??1,k=(0,o.getWeekYear)(u,f),W=(0,n.constructFrom)(f?.in||u,0);W.setFullYear(k,0,l),W.setHours(0,0,0,0);return(0,s.startOfWeek)(W,f)}var f=u