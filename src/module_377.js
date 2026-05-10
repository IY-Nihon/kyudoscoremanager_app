/**
 * Module ID: 377
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 377);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return t}});var n={centroidDimension:function(t,i,o,u){var c=t.touchBank,f=0,s=0,h=1===t.numberActiveTouches?t.touchBank[t.indexOfSingleActiveTouch]:null;if(null!==h)h.touchActive&&h.currentTimeStamp>i&&(f+=u&&o?h.currentPageX:u&&!o?h.currentPageY:!u&&o?h.previousPageX:h.previousPageY,s=1);else for(var v=0;v<c.length;v++){var l=c[v];if(null!=l&&l.touchActive&&l.currentTimeStamp>=i){f+=u&&o?l.currentPageX:u&&!o?l.currentPageY:!u&&o?l.previousPageX:l.previousPageY,s++}}return s>0?f/s:n.noCentroid},currentCentroidXOfTouchesChangedAfter:function(t,i){return n.centroidDimension(t,i,!0,!0)},currentCentroidYOfTouchesChangedAfter:function(t,i){return n.centroidDimension(t,i,!1,!0)},previousCentroidXOfTouchesChangedAfter:function(t,i){return n.centroidDimension(t,i,!0,!1)},previousCentroidYOfTouchesChangedAfter:function(t,i){return n.centroidDimension(t,i,!1,!1)},currentCentroidX:function(t){return n.centroidDimension(t,0,!0,!0)},currentCentroidY:function(t){return n.centroidDimension(t,0,!1,!0)},noCentroid:-1},t=n