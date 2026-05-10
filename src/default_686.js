/**
 * Module ID: 686
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 686);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return n}});var e,o=require("./DEFAULT_ICON_COLOR_602"),t=(e=o)&&e.__esModule?e:{default:e};function n(e,o,n){const s={};if('icons'in e)e.icons.forEach(e=>{e.properties.name.split(/\s*,\s*/g).forEach(o=>{s[o]=e.properties.code})});else{if(!('glyphs'in e))throw new Error('Invalid IcoMoon config: expected "icons" (old format) or "glyphs" (new format)');e.glyphs.forEach(e=>{e.extras.name.split(/\s*,\s*/g).forEach(o=>{s[o]=e.extras.codePoint})})}const c=o||(e.preferences?.fontPref?.metadata?.fontFamily??'icomoon');return(0,t.default)(s,c,n||`${c}.ttf`)}