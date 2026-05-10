/**
 * Module ID: 29
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 29);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return p}}),_e.getApplication=function(e,l,u){return{element:c.default.createElement(n.default,{WrapperComponent:u,rootTag:{}},c.default.createElement(e,l)),getStyleElement:e=>{var n=f.default.getSheet();return c.default.createElement("style",(0,t.default)({},e,{dangerouslySetInnerHTML:{__html:n.textContent},id:n.id}))}}};var t=e(require("./default_30")),n=e(require("./module_31")),l=e(require("./module_27")),u=require("./module_32"),o=e(u),f=e(require("./default_45")),c=e(require("./module_37"));function p(e,t,f,p){var s=p.hydrate,_=p.initialProps,y=p.rootTag,E=s?u.hydrate:o.default;return(0,l.default)(y,'Expect to have a valid rootTag, instead got ',y),E(c.default.createElement(n.default,{WrapperComponent:t,ref:f,rootTag:y},c.default.createElement(e,_)),y)}