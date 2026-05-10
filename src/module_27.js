/**
 * Module ID: 27
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 27);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';m.exports=function(n,o){for(var t=arguments.length,f=new Array(t>2?t-2:0),s=2;s<t;s++)f[s-2]=arguments[s];if(!n){var l;if(void 0===o)l=new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");else{var u=0;(l=new Error(o.replace(/%s/g,function(){return String(f[u++])}))).name='Invariant Violation'}throw l.framesToPop=1,l}}