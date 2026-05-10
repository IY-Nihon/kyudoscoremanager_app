/**
 * Module ID: 1032
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 1032);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return o}});var n=require("./EventEmitter_100"),o={isAvailableAsync:async()=>'undefined'!=typeof navigator&&!!navigator.share,async shareAsync(o,s={}){if(!navigator.share)throw new n.UnavailabilityError('navigator','share');await navigator.share(Object.assign({},s,{url:o}))},getSharedPayloads(){throw new Error('Receiving share payloads is not supported on web.')},async getResolvedSharedPayloadsAsync(){throw new Error('Receiving share payloads is not supported on web.')},clearSharedPayloads(){throw new Error('Receiving share payloads is not supported on web.')}}