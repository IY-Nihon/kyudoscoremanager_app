/**
 * Module ID: 213
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 213);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"NetInfoStateType",{enumerable:!0,get:function(){return n}}),Object.defineProperty(e,"NetInfoCellularGeneration",{enumerable:!0,get:function(){return t}});let n=(function(n){return n.unknown="unknown",n.none="none",n.cellular="cellular",n.wifi="wifi",n.bluetooth="bluetooth",n.ethernet="ethernet",n.wimax="wimax",n.vpn="vpn",n.other="other",n})({}),t=(function(n){return n["2g"]="2g",n["3g"]="3g",n["4g"]="4g",n["5g"]="5g",n})({})