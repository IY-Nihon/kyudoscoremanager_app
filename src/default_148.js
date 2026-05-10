/**
 * Module ID: 148
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 148);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return u}});var e,t=require("./module_149"),n=(e=t)&&e.__esModule?e:{default:e},o={article:'article',banner:'header',blockquote:'blockquote',button:'button',code:'code',complementary:'aside',contentinfo:'footer',deletion:'del',emphasis:'em',figure:'figure',insertion:'ins',form:'form',list:'ul',listitem:'li',main:'main',navigation:'nav',paragraph:'p',region:'section',strong:'strong'},l={},u=function(e){if(void 0===e&&(e=l),'label'===(e.role||e.accessibilityRole))return'label';var t=(0,n.default)(e);if(t){if('heading'===t){var u=e.accessibilityLevel||e['aria-level'];return null!=u?"h"+u:'h1'}return o[t]}}