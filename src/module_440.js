/**
 * Module ID: 440
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 440);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.getActionFromState=function(n,s){const o=s?t(s):{},c=null!=n.index?n.routes.slice(0,n.index+1):n.routes;if(0===c.length)return;if(!(1===c.length&&void 0===c[0].key||2===c.length&&void 0===c[0].key&&c[0].name===o?.initialRouteName&&void 0===c[1].key))return{type:'RESET',payload:n};const l=n.routes[n.index??n.routes.length-1];let p=l?.state,u=o?.screens?.[l?.name],h=Object.assign({},l.params);const y=l?{name:l.name,path:l.path,params:h}:void 0;y&&u?.screens&&Object.keys(u.screens).length&&(y.pop=!0);for(;p;){if(0===p.routes.length)return;const t=null!=p.index?p.routes.slice(0,p.index+1):p.routes,n=t[t.length-1];if(Object.assign(h,{initial:void 0,screen:void 0,params:void 0,state:void 0}),1===t.length&&void 0===t[0].key)h.initial=!0,h.screen=n.name;else{if(2!==t.length||void 0!==t[0].key||t[0].name!==u?.initialRouteName||void 0!==t[1].key){h.state=p;break}h.initial=!1,h.screen=n.name}n.state?(h.params=Object.assign({},n.params),h.pop=!0,h=h.params):(h.path=n.path,h.params=n.params),p=n.state,u=u?.screens?.[n.name],u?.screens&&Object.keys(u.screens).length&&(h.pop=!0)}(y?.params.screen||y?.params.state)&&(y.pop=!0);if(!y)return;return{type:'NAVIGATE',payload:y}};const t=t=>'object'==typeof t&&null!=t?{initialRouteName:t.initialRouteName,screens:null!=t.screens?n(t.screens):void 0}:{},n=n=>Object.entries(n).reduce((n,[s,o])=>(n[s]=t(o),n),{})