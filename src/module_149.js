/**
 * Module ID: 149
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 149);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return t}});var n={adjustable:'slider',button:'button',header:'heading',image:'img',imagebutton:null,keyboardkey:null,label:null,link:'link',none:'presentation',search:'search',summary:'region',text:null},t=t=>{var l=t.accessibilityRole,u=t.role||l;if(u){var o=n[u];if(null!==o)return o||u}}