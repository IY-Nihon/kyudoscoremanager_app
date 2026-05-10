/**
 * Module ID: 232
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 232);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["id","initialRouteName","backBehavior","UNSTABLE_routeNamesChangeBehavior","children","layout","screenListeners","screenOptions","screenLayout","UNSTABLE_router"];Object.defineProperty(_e,'__esModule',{value:!0}),_e.createBottomTabNavigator=function(e){return(0,s.createNavigatorFactory)(l)(e)};var t,o=require("./module_130"),n=(t=o)&&t.__esModule?t:{default:t},s=require("./module_233"),c=require("./module_514"),u=require("./module_254");function l(t){let{id:o,initialRouteName:l,backBehavior:N,UNSTABLE_routeNamesChangeBehavior:B,children:v,layout:h,screenListeners:L,screenOptions:_,screenLayout:T,UNSTABLE_router:b}=t,y=(0,n.default)(t,e);const{state:f,descriptors:p,navigation:A,NavigationContent:E}=(0,s.useNavigationBuilder)(s.TabRouter,{id:o,initialRouteName:l,backBehavior:N,UNSTABLE_routeNamesChangeBehavior:B,children:v,layout:h,screenListeners:L,screenOptions:_,screenLayout:T,UNSTABLE_router:b});return(0,u.jsx)(E,{children:(0,u.jsx)(c.BottomTabView,Object.assign({},y,{state:f,navigation:A,descriptors:p}))})}