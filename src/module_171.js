/**
 * Module ID: 171
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 171);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function n(){var n=window.getSelection(),o=n.toString(),t=n.anchorNode,u=n.focusNode,c=t&&t.nodeType===window.Node.TEXT_NODE||u&&u.nodeType===window.Node.TEXT_NODE;return o.length>=1&&'\n'!==o&&c}Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return n}})