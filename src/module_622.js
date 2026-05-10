/**
 * Module ID: 622
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 622);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.getServerResources=function(){if(!n.default.getServerResources)throw new t.UnavailabilityError('expo-font','getServerResources');return n.default.getServerResources()},_e.resetServerContext=function(){if(!n.default.resetServerContext)throw new t.UnavailabilityError('expo-font','resetServerContext');return n.default.resetServerContext()},_e.registerStaticFont=function(e,o){if(!o)throw new t.CodedError("ERR_FONT_SOURCE",`Cannot load null or undefined font source: { "${e}": ${o} }. Expected asset of type \`FontSource\` for fontFamily of name: "${e}"`);const n=(0,s.getAssetForSource)(o);(0,s.loadSingleFontAsync)(e,n)};var e,t=require("./EventEmitter_100"),o=require("./default_605"),n=(e=o)&&e.__esModule?e:{default:e},s=require("./module_608")