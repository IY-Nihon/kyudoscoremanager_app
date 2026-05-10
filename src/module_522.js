/**
 * Module ID: 522
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 522);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["children","style","visible","size"],t=["backgroundColor"];function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.Badge=function(n){let{children:v,style:p,visible:y=!0,size:_=18}=n,O=(0,o.default)(n,e);const[j]=s.useState(()=>new c.default.Value(y?1:0)),[k,w]=s.useState(y),{colors:x,fonts:z}=(0,u.useTheme)();if(s.useEffect(()=>{if(k)return c.default.timing(j,{toValue:y?1:0,duration:150,useNativeDriver:b}).start(({finished:e})=>{e&&!y&&w(!1)}),()=>j.stopAnimation()},[j,k,y]),!k){if(!y)return null;w(!0)}const C=f.default.flatten(p)||{},{backgroundColor:M=x.notification}=C,S=(0,o.default)(C,t),P=(0,l.default)(M).isLight()?'black':'white',R=_/2,A=Math.floor(3*_/4);return(0,d.jsx)(c.default.Text,Object.assign({numberOfLines:1,style:[{transform:[{scale:j.interpolate({inputRange:[0,1],outputRange:[.5,1]})}],color:P,lineHeight:_-1,height:_,minWidth:_,opacity:j,backgroundColor:M,fontSize:A,borderRadius:R,borderCurve:'continuous'},z.regular,h.container,S]},O,{children:v}))};var o=n(require("./module_130")),u=require("./module_233"),l=n(require("./module_523")),s=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),c=n(require("./default_286"));require("./module_98");var f=n(require("./default_45")),d=require("./module_254");const b=!1;const h=f.default.create({container:{alignSelf:'flex-end',textAlign:'center',paddingHorizontal:4,overflow:'hidden'}})