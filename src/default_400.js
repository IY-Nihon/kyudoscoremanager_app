/**
 * Module ID: 400
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 400);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return l}});var e,t=require("./module_401"),o=(e=t)&&e.__esModule?e:{default:e},n=o.default.twoArgumentPooler;function u(e,t){this.width=e,this.height=t}u.prototype.destructor=function(){this.width=null,this.height=null},u.getPooledFromElement=function(e){return u.getPooled(e.offsetWidth,e.offsetHeight)},o.default.addPoolingTo(u,n);var l=u