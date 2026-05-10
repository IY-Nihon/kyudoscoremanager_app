/**
 * Module ID: 965
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 965);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return s}}),e.roundToNearestHours=u;var t=require("./module_748"),n=require("./module_699"),o=require("./module_701");function u(u,s){const c=s?.nearestTo??1;if(c<1||c>12)return(0,n.constructFrom)(s?.in||u,NaN);const f=(0,o.toDate)(u,s?.in),l=f.getMinutes()/60,M=f.getSeconds()/60/60,_=f.getMilliseconds()/1e3/60/60,b=f.getHours()+l+M+_,v=s?.roundingMethod??"round",H=(0,t.getRoundingMethod)(v)(b/c)*c;return f.setHours(H,0,0,0),f}var s=u