/**
 * Module ID: 1009
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 1009);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["transform","origin","originX","originY","fontFamily","fontSize","fontWeight","fontStyle","style","forwardedRef","gradientTransform","patternTransform","onPress"];Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"prepare",{enumerable:!0,get:function(){return p}});var n,o=require("./module_130"),t=(n=o)&&n.__esModule?n:{default:n},s=require("./module_1010"),l=require("./module_1011"),f=require("./module_1016"),u=require("./module_1017");const p=(n,o=n.props)=>{const{transform:p,origin:c,originX:R,originY:h,fontFamily:T,fontSize:y,fontWeight:S,fontStyle:b,style:v,forwardedRef:P,gradientTransform:H,patternTransform:_,onPress:M}=o,j=(0,t.default)(o,e),z=Object.assign({},j);null!=c?z['transform-origin']=c.toString().replace(',',' '):null==R&&null==h||(z['transform-origin']=`${R||0} ${h||0}`);const F=(0,l.parseTransformProp)(p,o);F&&(z.transform=F);const O=(0,l.parseTransformProp)(H);O&&(z.gradientTransform=O);const W=(0,l.parseTransformProp)(_);W&&(z.patternTransform=W),z.ref=e=>{n.elementRef.current=e,'function'==typeof P?P(e):P&&(P.current=e)};const q={};var w;(null!=T&&(q.fontFamily=T),null!=y&&(q.fontSize=y),null!=S&&(q.fontWeight=S),null!=b&&(q.fontStyle=b),z.style=(0,f.resolve)(v,q),null!==M&&(z.onClick=o.onPress),null!==o.href&&void 0!==o.href)&&(z.href=null===(w=(0,u.resolveAssetUri)(o.href))||void 0===w?void 0:w.uri);return z}