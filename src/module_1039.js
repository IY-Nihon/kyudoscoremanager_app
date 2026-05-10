/**
 * Module ID: 1039
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 1039);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function t(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.StatusBar=function({style:t,hideTransitionAnimation:n,animated:c,hidden:f}){const h=(0,o.default)(),S=e.default.useMemo(()=>s(t,h),[t,h]);return(0,l.jsx)(u.default,{animated:c,hidden:f,barStyle:S,showHideTransition:'none'===n?void 0:n})},_e.setStatusBarStyle=function(t,e){u.default.setBarStyle(s(t),e)},_e.setStatusBarHidden=function(t,e){u.default.setHidden(t,e)},_e.setStatusBarBackgroundColor=function(t,e){},_e.setStatusBarNetworkActivityIndicatorVisible=function(t){},_e.setStatusBarTranslucent=function(t){};var e=t(require("./module_37")),n=t(require("./default_366")),u=t(require("./module_395")),o=t(require("./default_411")),l=require("./module_427");function s(t="auto",e=n.default?.getColorScheme()??'light'){e||(e='light');let u=t;return'auto'===t?u='light'===e?'dark':'light':'inverted'===t&&(u='light'===e?'light':'dark'),'light'===u?'light-content':'dark-content'}