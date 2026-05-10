/**
 * Module ID: 1004
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 1004);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.fetchText=async function(n){if(!n)return null;return n.startsWith('data:image/svg+xml;utf8'),n.startsWith('data:image/svg+xml;base64')?t(n):s(n)},require("./module_98");const t=t=>{const s=decodeURIComponent(t).split(';')[1].split(',').slice(1).join(',');return atob(s)};async function s(t){const s=await fetch(t);if(s.ok||0===s.status&&t.startsWith('file://'))return await s.text();throw new Error(`Fetching ${t} failed with status ${s.status}`)}