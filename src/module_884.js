/**
 * Module ID: 884
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 884);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}}),e.setISODay=o;var t=require("./module_698"),n=require("./module_829"),u=require("./module_701");function o(o,c,f){const s=(0,u.toDate)(o,f?.in),y=c-(0,n.getISODay)(s,f);return(0,t.addDays)(s,y,f)}var c=o