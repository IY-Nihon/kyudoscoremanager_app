/**
 * Module ID: 619
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 619);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return s}}),_e.setCustomSourceTransformer=c,Object.defineProperty(_e,"pickScale",{enumerable:!0,get:function(){return l}});var e,t=require("./module_340"),n=require("./default_613"),u=(e=n)&&e.__esModule?e:{default:e};let o;function c(e){o=e}function f(e){if('object'==typeof e)return e;const n=(0,t.getAssetByID)(e);if(!n)return null;const c=new u.default('https://expo.dev',null,n);return o?o(c):c.defaultAsset()}Object.defineProperty(f,'setCustomSourceTransformer',{get:()=>c});var s=f;const{pickScale:l}=u.default