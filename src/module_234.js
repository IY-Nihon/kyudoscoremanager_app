/**
 * Module ID: 234
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 234);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["linking"];Object.defineProperty(_e,'__esModule',{value:!0}),_e.createStaticNavigation=function(n){const t=n.getComponent();function f(f,d){let{linking:b}=f,p=(0,o.default)(f,e);const h=u.useMemo(()=>{const e=(0,c.createPathConfigForStaticNavigation)(n,{initialRouteName:b?.config?.initialRouteName},'auto'===b?.enabled);if(e)return{path:b?.config?.path,initialRouteName:b?.config?.initialRouteName,screens:e}},[b?.enabled,b?.config?.path,b?.config?.initialRouteName]),k=u.useMemo(()=>{if(!b)return;const e='boolean'==typeof b.enabled?b.enabled:null!=h?.screens;return Object.assign({},b,{enabled:e,config:h})},[b,h]);if(!0===b?.enabled&&null==h?.screens)throw new Error("Linking is enabled but no linking configuration was found for the screens.\n\nTo solve this:\n- Specify a 'linking' property for the screens you want to link to.\n- Or set 'linking.enabled' to 'auto' to generate paths automatically.\n\nSee usage guide: https://reactnavigation.org/docs/static-configuration#linking");return(0,l.jsx)(s.NavigationContainer,Object.assign({},p,{ref:d,linking:k,children:(0,l.jsx)(t,{})}))}return u.forwardRef(f)};var n,t=require("./module_130"),o=(n=t)&&n.__esModule?n:{default:n},c=require("./module_235"),u=(function(e){if(e&&e.__esModule)return e;var n={};return e&&Object.keys(e).forEach(function(t){var o=Object.getOwnPropertyDescriptor(e,t);Object.defineProperty(n,t,o.get?o:{enumerable:!0,get:function(){return e[t]}})}),n.default=e,n})(require("./module_37")),s=require("./NavigationContainer_492"),l=require("./module_254")