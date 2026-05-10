/**
 * Module ID: 880
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 880);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.setDay=s;var t=require("./module_713"),n=require("./module_698"),o=require("./module_701");function s(s,u,c){const l=(0,t.getDefaultOptions)(),f=c?.weekStartsOn??c?.locale?.options?.weekStartsOn??l.weekStartsOn??l.locale?.options?.weekStartsOn??0,O=(0,o.toDate)(s,c?.in),p=O.getDay(),y=7-f,D=u<0||u>6?u-(p+y)%7:((u%7+7)%7+y)%7-(p+y)%7;return(0,n.addDays)(O,D,c)}var u=s