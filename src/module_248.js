/**
 * Module ID: 248
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 248);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";var t=require("./module_37"),n='undefined'!=typeof document||'undefined'!=typeof navigator&&'ReactNative'===navigator.product?t.useLayoutEffect:t.useEffect;m.exports=function(u){var f=t.useRef(u),c=t.useRef(function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];return f.current.apply(this,t)}).current;return n(function(){f.current=u}),c}