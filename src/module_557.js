/**
 * Module ID: 557
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 557);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.Screen=function(e){const o=(0,s.useSafeAreaInsets)(),y=n.useContext(f.HeaderShownContext),b=n.useContext(c.HeaderHeightContext),{focused:j,modal:p=!1,header:H,headerShown:S=!0,headerTransparent:_,headerStatusBarHeight:C=(y?0:o.top),navigation:P,route:O,children:w,style:E}=e,M=(0,h.useFrameSize)(e=>(0,d.getDefaultHeaderHeight)(e,p,C)),k=n.useRef(null),[z,B]=n.useState(M);return n.useLayoutEffect(()=>{k.current?.measure((e,t,n,o)=>{B(o)})},[O.name]),(0,x.jsxs)(l.Background,{"aria-hidden":!j,style:[v.container,E],collapsable:!1,children:[S?(0,x.jsx)(t.NavigationProvider,{route:O,navigation:P,children:(0,x.jsx)(u.default,{ref:k,pointerEvents:"box-none",onLayout:e=>{const{height:t}=e.nativeEvent.layout;B(t)},style:[v.header,_?v.absolute:null],children:H})}):null,(0,x.jsx)(u.default,{style:v.content,children:(0,x.jsx)(f.HeaderShownContext.Provider,{value:y||!1!==S,children:(0,x.jsx)(c.HeaderHeightContext.Provider,{value:S?z:b??0,children:w})})})]})};var t=require("./module_233"),n=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),o=e(require("./default_45")),u=e(require("./default_144")),s=require("./module_420"),l=require("./module_521"),d=require("./module_535"),c=require("./module_549"),f=require("./module_545"),h=require("./module_538"),x=require("./module_254");const v=o.default.create({container:{flex:1},content:{flex:1},header:{zIndex:1},absolute:{position:'absolute',top:0,start:0,end:0}})