/**
 * Module ID: 93
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 93);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

var t=require("./module_94"),n=require("./module_95"),o=require("./module_96");function s(n){return this instanceof s?(this.nodes=t(n),this):new s(n)}s.prototype.toString=function(){return Array.isArray(this.nodes)?o(this.nodes):""},s.prototype.walk=function(t,o){return n(this.nodes,t,o),this},s.unit=require("./module_97"),s.walk=n,s.stringify=o,m.exports=s