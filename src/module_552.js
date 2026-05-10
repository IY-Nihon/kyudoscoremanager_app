/**
 * Module ID: 552
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 552);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["tintColor","style"];function t(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.Label=function(t){let{tintColor:n,style:c}=t,f=(0,l.default)(t,e);return(0,u.jsx)(o.Text,Object.assign({numberOfLines:1},f,{style:[s.label,null!=n&&{color:n},c]}))};var l=t(require("./module_130")),n=t(require("./default_45")),o=require("./module_533"),u=require("./module_254");const s=n.default.create({label:{textAlign:'center',backgroundColor:'transparent'}})