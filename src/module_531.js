/**
 * Module ID: 531
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 531);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["screen","params","action","href"],t=["variant","color","android_ripple","style","children"];function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),_e.Button=function(e){return'screen'in e||'action'in e?(0,p.jsx)(h,Object.assign({},e)):(0,p.jsx)(j,Object.assign({},e))};var s=n(require("./module_130")),o=require("./module_233"),c=n(require("./module_523"));require("./module_37"),require("./module_98");var l=n(require("./default_45")),u=require("./PlatformPressable_532"),f=require("./module_533"),p=require("./module_254");const b=40;function h(t){let{screen:n,params:c,action:l,href:u}=t,f=(0,s.default)(t,e);const b=(0,o.useLinkProps)({screen:n,params:c,action:l,href:u});return(0,p.jsx)(j,Object.assign({},f,b))}function j(e){let{variant:n="tinted",color:l,android_ripple:h,style:j,children:_}=e,v=(0,s.default)(e,t);const{colors:y,fonts:O}=(0,o.useTheme)(),k=l??y.primary;let P,w;switch(n){case'plain':P='transparent',w=k;break;case'tinted':P=(0,c.default)(k).fade(.85).string(),w=k;break;case'filled':P=k,w=(0,c.default)(k).isDark()?'white':(0,c.default)(k).darken(.71).string()}return(0,p.jsx)(u.PlatformPressable,Object.assign({},v,{android_ripple:Object.assign({radius:b,color:(0,c.default)(w).fade(.85).string()},h),pressOpacity:1,hoverEffect:{color:w},style:[{backgroundColor:P},x.button,j],children:(0,p.jsx)(f.Text,{style:[{color:w},O.regular,x.text],children:_})}))}const x=l.default.create({button:{paddingHorizontal:24,paddingVertical:10,borderRadius:b,borderCurve:'continuous'},text:{fontSize:14,lineHeight:20,letterSpacing:.1,textAlign:'center'}})