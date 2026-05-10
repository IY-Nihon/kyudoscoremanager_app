/**
 * Module ID: 542
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 542);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["source","style"];function t(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.HeaderIcon=function(t){let{source:u,style:l}=t,f=(0,n.default)(t,e);const{colors:b}=(0,o.useTheme)(),{direction:y}=(0,o.useLocale)();return(0,s.jsx)(c.default,Object.assign({source:u,resizeMode:"contain",fadeDuration:0,tintColor:b.text,style:[_.icon,'rtl'===y&&_.flip,l]},f))},Object.defineProperty(_e,"ICON_SIZE",{enumerable:!0,get:function(){return l}}),Object.defineProperty(_e,"ICON_MARGIN",{enumerable:!0,get:function(){return f}});var n=t(require("./module_130")),o=require("./module_233"),c=t(require("./default_339"));require("./module_98");var u=t(require("./default_45")),s=require("./module_254");const l=24,f=3,_=u.default.create({icon:{width:l,height:l,margin:f},flip:{transform:'scaleX(-1)'}})