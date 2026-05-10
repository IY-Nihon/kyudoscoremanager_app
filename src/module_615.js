/**
 * Module ID: 615
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 615);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function t(t){const{pathname:s,searchParams:o}=new URL(t,'https://e');return n(s)}function n(t){return t.substring(t.lastIndexOf('/')+1)}Object.defineProperty(e,'__esModule',{value:!0}),e.getFilename=t,e.getFileExtension=function(n){const s=t(n),o=s.lastIndexOf('.');return o>0?s.substring(o):''},e.getManifestBaseUrl=function(t){const n=new URL(t);let s=n.protocol;'exp:'===s?s='http:':'exps:'===s&&(s='https:');n.protocol=s;const o=n.pathname.substring(0,n.pathname.lastIndexOf('/')+1);return n.pathname=o,n.search='',n.hash='',n.protocol!==s?n.href.replace(n.protocol,s):n.href}