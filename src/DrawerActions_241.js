/**
 * Module ID: 241
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 241);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["defaultStatus"];Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"DrawerActions",{enumerable:!0,get:function(){return c}}),_e.DrawerRouter=function(t){let{defaultStatus:o="closed"}=t,l=(0,s.default)(t,e);const y=(0,u.TabRouter)(l),R=e=>Boolean(e.history?.some(e=>'drawer'===e.type)),A=e=>R(e)?e:Object.assign({},e,{history:[...e.history,{type:'drawer',status:'open'===o?'closed':'open'}]}),p=e=>R(e)?Object.assign({},e,{history:e.history.filter(e=>'drawer'!==e.type)}):e,E=e=>'open'===o?p(e):A(e),O=e=>'open'===o?A(e):p(e);return Object.assign({},y,{type:'drawer',getInitialState({routeNames:e,routeParamList:t,routeGetIdList:s}){const u=y.getInitialState({routeNames:e,routeParamList:t,routeGetIdList:s});return Object.assign({},u,{default:o,stale:!1,type:'drawer',key:`drawer-${(0,n.nanoid)()}`})},getRehydratedState(e,{routeNames:t,routeParamList:s,routeGetIdList:u}){if(!1===e.stale)return e;let c=y.getRehydratedState(e,{routeNames:t,routeParamList:s,routeGetIdList:u});return R(e)&&(c=p(c),c=A(c)),Object.assign({},c,{default:o,type:'drawer',key:`drawer-${(0,n.nanoid)()}`})},getStateForRouteFocus(e,t){const o=y.getStateForRouteFocus(e,t);return O(o)},getStateForAction(e,t,o){switch(t.type){case'OPEN_DRAWER':return E(e);case'CLOSE_DRAWER':return O(e);case'TOGGLE_DRAWER':return R(e)?p(e):A(e);case'JUMP_TO':case'NAVIGATE':case'NAVIGATE_DEPRECATED':{const s=y.getStateForAction(e,t,o);return null!=s&&s.index!==e.index?O(s):s}case'GO_BACK':return R(e)?p(e):y.getStateForAction(e,t,o);default:return y.getStateForAction(e,t,o)}},actionCreators:c})};var t,o=require("./module_130"),s=(t=o)&&t.__esModule?t:{default:t},n=require("./module_240"),u=require("./module_242");const c=Object.assign({},u.TabActions,{openDrawer:()=>({type:'OPEN_DRAWER'}),closeDrawer:()=>({type:'CLOSE_DRAWER'}),toggleDrawer:()=>({type:'TOGGLE_DRAWER'})})