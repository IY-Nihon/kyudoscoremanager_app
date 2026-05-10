/**
 * Module ID: 858
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 858);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"Setter",{enumerable:!0,get:function(){return u}}),Object.defineProperty(e,"ValueSetter",{enumerable:!0,get:function(){return n}}),Object.defineProperty(e,"DateTimezoneSetter",{enumerable:!0,get:function(){return o}});var t=require("./module_699"),s=require("./module_859");class u{subPriority=0;validate(t,s){return!0}}class n extends u{constructor(t,s,u,n,o){super(),this.value=t,this.validateValue=s,this.setValue=u,this.priority=n,o&&(this.subPriority=o)}validate(t,s){return this.validateValue(t,this.value,s)}set(t,s,u){return this.setValue(t,s,this.value,u)}}class o extends u{priority=10;subPriority=-1;constructor(s,u){super(),this.context=s||(s=>(0,t.constructFrom)(u,s))}set(u,n){return n.timestampIsSet?u:(0,t.constructFrom)(u,(0,s.transpose)(u,this.context))}}