/**
 * Module ID: 547
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 547);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["tintColor","style"];function t(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.HeaderTitle=function(t){let{tintColor:s,style:f}=t,_=(0,l.default)(t,e);const{colors:v,fonts:y}=(0,o.useTheme)();return(0,u.jsx)(n.default.Text,Object.assign({role:"heading","aria-level":"1",numberOfLines:1},_,{style:[{color:void 0===s?v.text:s},y.medium,c.title,f]}))};var l=t(require("./module_130")),o=require("./module_233"),n=t(require("./default_286"));require("./module_98");var s=t(require("./default_45")),u=require("./module_254");const c=s.default.create({title:{fontSize:18}})