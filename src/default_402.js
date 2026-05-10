/**
 * Module ID: 402
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 402);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return n}});var t,e=require("./module_401"),o=(t=e)&&t.__esModule?t:{default:t},u=o.default.twoArgumentPooler;function l(t,e){this.left=t,this.top=e}l.prototype.destructor=function(){this.left=null,this.top=null},o.default.addPoolingTo(l,u);var n=l