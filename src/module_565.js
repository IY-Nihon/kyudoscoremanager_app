/**
 * Module ID: 565
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 565);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.TabBarIcon=function({route:e,variant:n,size:h,badge:f,badgeStyle:w,activeOpacity:y,inactiveOpacity:b,activeTintColor:v,inactiveTintColor:j,renderIcon:_,allowFontScaling:C,style:k}){const x='material'===n?p:'compact'===h?s:l;return(0,c.jsxs)(o.default,{style:['material'===n?u.wrapperMaterial:'compact'===h?u.wrapperUikitCompact:u.wrapperUikit,k],children:[(0,c.jsx)(o.default,{style:[u.icon,{opacity:y,minWidth:x}],children:_({focused:!0,size:x,color:v})}),(0,c.jsx)(o.default,{style:[u.icon,{opacity:b}],children:_({focused:!1,size:x,color:j})}),(0,c.jsx)(t.Badge,{visible:null!=f,size:.75*x,allowFontScaling:C,style:[u.badge,w],children:f})]})};var t=require("./Background_515");require("./module_37");var n=e(require("./default_45")),o=e(require("./default_144")),c=require("./module_254");const l=25,s=18,p=24;const u=n.default.create({icon:{position:'absolute',alignSelf:'center',alignItems:'center',justifyContent:'center',height:'100%',width:'100%'},wrapperUikit:{width:31,height:28},wrapperUikitCompact:{width:23,height:20},wrapperMaterial:{width:p,height:p},badge:{position:'absolute',end:-3,top:-3}})