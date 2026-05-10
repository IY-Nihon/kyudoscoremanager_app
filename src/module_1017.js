/**
 * Module ID: 1017
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 1017);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.resolveAssetUri=function(e){let t={};if('number'==typeof e){const n=(0,o.getAssetByID)(e);if(null==n)throw new Error(`Image: asset with ID "${e}" could not be found. Please check the image source or packager.`);if(t={width:n.width,height:n.height,scale:n.scales[0]},n.scales.length>1){const e=s.default.get();t.scale=n.scales.reduce((t,s)=>Math.abs(s-e)<Math.abs(t-e)?s:t)}const u=1!==t.scale?`@${t.scale}x`:'';t.uri=n?`${n.httpServerLocation}/${n.name}${u}.${n.type}`:''}else'string'==typeof e?t.uri=e:e&&!Array.isArray(e)&&'string'==typeof e.uri&&(t.uri=e.uri);if(t.uri){var u;const e=null===(u=t)||void 0===u||null===(u=u.uri)||void 0===u?void 0:u.match(n);if(e){const[,s,o]=e,n=encodeURIComponent(o);return t.uri=`${s}${n}`,t}}return t};var e,t=require("./default_342"),s=(e=t)&&e.__esModule?e:{default:e},o=require("./module_340");const n=/^(data:image\/svg\+xml;utf8,)(.*)/