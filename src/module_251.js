/**
 * Module ID: 251
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 251);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"NOT_INITIALIZED_ERROR",{enumerable:!0,get:function(){return n}}),e.createNavigationContainerRef=function(){const o=[...Object.keys(t.CommonActions),'addListener','removeListener','resetRoot','dispatch','isFocused','canGoBack','getRootState','getState','getParent','getCurrentRoute','getCurrentOptions'],s={},c=(t,n)=>{s[t]&&(s[t]=s[t].filter(t=>t!==n))};let u=null;return Object.assign({get current(){return u},set current(t){u=t,null!=t&&Object.entries(s).forEach(([n,o])=>{o.forEach(o=>{t.addListener(n,o)})})},isReady:()=>null!=u&&u.isReady()},o.reduce((t,o)=>(t[o]=(...t)=>{if(null!=u)return u[o](...t);switch(o){case'addListener':{const[n,o]=t;return s[n]=s[n]||[],s[n].push(o),()=>c(n,o)}case'removeListener':{const[n,o]=t;c(n,o);break}default:console.error(n)}},t),{}))};var t=require("./BaseRouter_237");const n="The 'navigation' object hasn't been initialized yet. This might happen if you don't have a navigator mounted, or if the navigator hasn't finished mounting. See https://reactnavigation.org/docs/navigating-without-navigation-prop#handling-initialization for more details."