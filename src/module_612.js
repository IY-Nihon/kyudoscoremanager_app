/**
 * Module ID: 612
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 612);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.selectAssetSource=function(e){const c=n.default.pickScale(e.scales,t.default.get()),f=e.scales.findIndex(e=>e===c),l=e.fileHashes?e.fileHashes[f]??e.fileHashes[0]:e.hash,u=e.fileUris?e.fileUris[f]??e.fileUris[0]:e.uri;if(u)return{uri:o(u),hash:l};const p=1===c?'':`@${c}x`,U=e.type?`.${encodeURIComponent(e.type)}`:'',v=`/${encodeURIComponent(e.name)}${p}${U}`,x=new URLSearchParams({platform:"web",hash:e.hash});if(/^https?:\/\//.test(e.httpServerLocation)){return{uri:e.httpServerLocation+v+'?'+x,hash:l}}const L=(0,h.getManifest2)(),R=h.manifestBaseUrl?.startsWith('https://')?'https://':'http://',S=L?.extra?.expoGo?.developer?R+L.extra.expoGo.debuggerHost:null;if(S){const t=new URL(e.httpServerLocation+v,S);return t.searchParams.set('platform',"web"),t.searchParams.set('hash',e.hash),{uri:t.href,hash:l}}if(s.default.ExponentKernel)return{uri:`https://classic-assets.eascdn.net/~assets/${encodeURIComponent(l)}`,hash:l};return{uri:'',hash:l}},_e.resolveUri=o,require("./EventEmitter_100");var t=e(require("./default_342")),s=e(require("./default_284")),n=e(require("./default_613")),h=require("./module_614");function o(e){return h.manifestBaseUrl?new URL(e,h.manifestBaseUrl).href:e}