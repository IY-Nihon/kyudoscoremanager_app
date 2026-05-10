/**
 * Module ID: 760
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 760);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}}),e.differenceInYears=s;var n=require("./module_717"),t=require("./module_731"),c=require("./module_745");function s(s,u,o){const[f,l]=(0,n.normalizeDates)(o?.in,s,u),b=(0,t.compareAsc)(f,l),p=Math.abs((0,c.differenceInCalendarYears)(f,l));f.setFullYear(1584),l.setFullYear(1584);const Y=b*(p-+((0,t.compareAsc)(f,l)===-b));return 0===Y?0:Y}var u=s