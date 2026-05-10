/**
 * Module ID: 391
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 391);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return b}});var t=e(require("./default_22")),n=e(require("./default_46")),l=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var l=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,l.get?l:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),u=e(require("./default_145")),d=e(require("./default_162")),f=e(require("./default_164")),o=e(require("./default_392")),c=e(require("./default_45")),s=["children","enabled","onValueChange","selectedValue","style","testID","itemStyle","mode","prompt"],y=l.forwardRef((e,o)=>{var c=e.children,y=e.enabled,b=e.onValueChange,p=e.selectedValue,h=e.style,_=e.testID,O=(e.itemStyle,e.mode,e.prompt,(0,n.default)(e,s)),j=l.useRef(null);var I=(0,t.default)({children:c,disabled:!1===y||void 0,onChange:function(e){var t=e.target,n=t.selectedIndex,l=t.value;b&&b(l,n)},style:[v.initial,h],testID:_,value:p},O),D=(0,f.default)(I),P=(0,d.default)(j,D,o);return I.ref=P,(0,u.default)('select',I)});y.Item=o.default;var v=c.default.create({initial:{fontFamily:'System',fontSize:'inherit',margin:0}}),b=y