/**
 * Module ID: 275
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 275);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";var t=require("./module_276");Object.defineProperty(e,"__esModule",{value:!0}),e.useUnstableNativeVariable=e.remapProps=e.cssInterop=e.useColorScheme=e.rem=e.colorScheme=e.StyleSheet=void 0,e.vars=function(t){const n={};for(const[o,s]of Object.entries(t))o.startsWith("--")?n[o]=s.toString():n[`--${o}`]=s.toString();return n},e.useSafeAreaEnv=function(){return};const n=require("./module_37"),o=require("./module_277"),s=require("./module_279"),c=require("./module_280");var f=require("./module_281");Object.defineProperty(e,"StyleSheet",{enumerable:!0,get:function(){return f.StyleSheet}});var u=require("./module_414");Object.defineProperty(e,"colorScheme",{enumerable:!0,get:function(){return u.colorScheme}});var l=require("./module_416");Object.defineProperty(e,"rem",{enumerable:!0,get:function(){return l.rem}});const p=Symbol.for("react.forward_ref");var y=require("./module_417");Object.defineProperty(e,"useColorScheme",{enumerable:!0,get:function(){return y.useColorScheme}});e.cssInterop=(f,u)=>{const l=(0,s.getNormalizeConfig)(u),y=(0,n.forwardRef)(function(s,c){let u=Object.assign({},(t(s),s));if(!1===u.cssInterop)return(0,n.createElement)(f,u);u=Object.assign({},u,{ref:c});for(const t of l){const n=u[t.source];"string"==typeof n&&n&&(0,o.assignToTarget)(u,{$$css:!0,[n]:n},t,{objectMergeStyle:"toArray"}),delete u[t.source]}return"$$typeof"in f&&"function"==typeof f&&f.$$typeof===p?(delete u.cssInterop,f.render(u,u.ref)):"function"!=typeof f||f.prototype instanceof n.Component?(0,n.createElement)(f,u):(delete u.cssInterop,f(u))});return y.displayName=`CssInterop.${f.displayName??f.name??"unknown"}`,c.interopComponents.set(f,y),y},e.remapProps=e.cssInterop;e.useUnstableNativeVariable=t=>{}