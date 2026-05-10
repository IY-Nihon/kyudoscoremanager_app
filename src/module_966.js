/**
 * Module ID: 966
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 966);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.roundToNearestMinutes=u;var t=require("./module_748"),n=require("./module_699"),o=require("./module_701");function u(u,s){const c=s?.nearestTo??1;if(c<1||c>30)return(0,n.constructFrom)(u,NaN);const f=(0,o.toDate)(u,s?.in),M=f.getSeconds()/60,l=f.getMilliseconds()/1e3/60,_=f.getMinutes()+M+l,b=s?.roundingMethod??"round",v=(0,t.getRoundingMethod)(b)(_/c)*c;return f.setMinutes(v,0,0),f}var s=u