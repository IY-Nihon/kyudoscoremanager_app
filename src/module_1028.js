/**
 * Module ID: 1028
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 1028);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"FileSystemSessionType",{enumerable:!0,get:function(){return n}}),Object.defineProperty(e,"FileSystemUploadType",{enumerable:!0,get:function(){return t}}),Object.defineProperty(e,"EncodingType",{enumerable:!0,get:function(){return u}});let n=(function(n){return n[n.BACKGROUND=0]="BACKGROUND",n[n.FOREGROUND=1]="FOREGROUND",n})({}),t=(function(n){return n[n.BINARY_CONTENT=0]="BINARY_CONTENT",n[n.MULTIPART=1]="MULTIPART",n})({}),u=(function(n){return n.UTF8="utf8",n.Base64="base64",n})({})