/**
 * Module ID: 617
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 617);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.isImageType=function(n){return/^(jpeg|jpg|gif|png|bmp|webp|heic)$/i.test(n)},e.getImageInfoAsync=function(t){if('undefined'==typeof window)return Promise.resolve({name:(0,n.getFilename)(t),width:0,height:0});return new Promise((o,u)=>{const s=new Image;s.onerror=u,s.onload=()=>{o({name:(0,n.getFilename)(t),width:s.naturalWidth,height:s.naturalHeight})},s.src=t})};var n=require("./module_615")