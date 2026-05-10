/**
 * Module ID: 279
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 279);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function t(t){if(t)return Object.entries(t).map(([t,o])=>[t,!0===o?[t]:o.split(".")])}Object.defineProperty(e,"__esModule",{value:!0}),e.getNormalizeConfig=function(o){const n=[];for(const[p,s]of Object.entries(o)){let o,l,c,u;s&&(!0===s?o=[p]:"string"==typeof s?o=[s]:!1===s.target?(o=[p],c=p,u=t(s.nativeStyleToProp)):(o=!0===s.target?[p]:s.target.split("."),u=t(s.nativeStyleToProp)),1===o.length&&o[0]!==p&&(l=o[0]),n.push({nativeStyleToProp:u,source:p,target:o,inlineProp:l,propToRemove:c}))}return n}