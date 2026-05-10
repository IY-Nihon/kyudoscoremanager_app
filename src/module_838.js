/**
 * Module ID: 838
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 838);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return l}}),e.getWeekOfMonth=c;var t=require("./module_713"),n=require("./module_821"),o=require("./module_822"),s=require("./module_771"),u=require("./module_701");function c(c,l){const f=(0,t.getDefaultOptions)(),O=l?.weekStartsOn??l?.locale?.options?.weekStartsOn??f.weekStartsOn??f.locale?.options?.weekStartsOn??0,k=(0,n.getDate)((0,u.toDate)(c,l?.in));if(isNaN(k))return NaN;let p=O-(0,o.getDay)((0,s.startOfMonth)(c,l));p<=0&&(p+=7);const w=k-p;return Math.ceil(w/7)+1}var l=c