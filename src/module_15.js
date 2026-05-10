/**
 * Module ID: 15
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 15);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.fetchThenEvalAsync=fetchThenEvalAsync,require("./module_16");var _fetchAsync=require("./module_17");function fetchThenEvalAsync(url){return(0,_fetchAsync.fetchAsync)(url).then(({body:body,status:status,headers:headers})=>{if(null!=headers?.has?.('Content-Type')&&headers.get('Content-Type').includes('application/json'))throw new Error(JSON.parse(body).message||`Unknown error fetching '${url}'`);if(200===status)return eval(body);throw new Error(`Failed to load split bundle from URL: ${url}\n${body}`)})}