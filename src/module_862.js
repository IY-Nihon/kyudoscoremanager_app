/**
 * Module ID: 862
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 862);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"Parser",{enumerable:!0,get:function(){return s}});var t=require("./u_858");class s{run(s,n,u,l){const o=this.parse(s,n,u,l);return o?{setter:new t.ValueSetter(o.value,this.validate,this.set,this.priority,this.subPriority),rest:o.rest}:null}validate(t,s,n){return!0}}