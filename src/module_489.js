/**
 * Module ID: 489
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 489);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.usePreventRemove=function(e,u){const[d]=n.useState(()=>(0,t.nanoid)()),v=(0,f.useNavigation)(),{key:l}=(0,c.useRoute)(),{setPreventRemove:_}=(0,s.usePreventRemoveContext)();n.useEffect(()=>(_(d,l,e),()=>{_(d,l,!1)}),[_,d,l,e]);const b=(0,o.default)(t=>{e&&(t.preventDefault(),u({data:t.data}))});n.useEffect(()=>v?.addListener('beforeRemove',b),[v,b])};var e,t=require("./module_240"),n=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),u=require("./default_247"),o=(e=u)&&e.__esModule?e:{default:e},f=require("./module_438"),s=require("./module_490"),c=require("./module_434")