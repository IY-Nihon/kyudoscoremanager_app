/**
 * Module ID: 770
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 770);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.eachWeekendOfMonth=o;var t=require("./module_769"),n=require("./module_756"),f=require("./module_771");function o(o,u){const c=(0,f.startOfMonth)(o,u),s=(0,n.endOfMonth)(o,u);return(0,t.eachWeekendOfInterval)({start:c,end:s},u)}var u=o