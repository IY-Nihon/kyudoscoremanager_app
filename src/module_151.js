/**
 * Module ID: 151
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 151);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.getLocaleDirection=u,_e.LocaleProvider=function(e){var t=e.direction,o=e.locale,l=e.children;return t||o?n.default.createElement(c.Provider,{children:l,value:{direction:o?u(o):t,locale:o}}):l},_e.useLocaleContext=function(){return(0,t.useContext)(c)};var e,t=require("./module_37"),n=(e=t)&&e.__esModule?e:{default:e},o=require("./module_152"),l={direction:'ltr',locale:'en-US'},c=(0,t.createContext)(l);function u(e){return(0,o.isLocaleRTL)(e)?'rtl':'ltr'}