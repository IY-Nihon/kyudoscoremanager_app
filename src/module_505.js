/**
 * Module ID: 505
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 505);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useLinkProps=function({screen:s,params:u,href:c,action:l}){const f=t.useContext(e.NavigationContainerRefContext),p=t.useContext(e.NavigationHelpersContext),{options:d}=t.useContext(n.LinkingContext),v=d?.getPathFromState??e.getPathFromState;return{href:c??(null!=s?v({routes:[{name:s,params:u,state:o(u)}]},d?.config):void 0),role:'link',onPress:e=>{let t=!1;if(e){const n='metaKey'in e&&e.metaKey||'altKey'in e&&e.altKey||'ctrlKey'in e&&e.ctrlKey||'shiftKey'in e&&e.shiftKey,o=!('button'in e)||null==e.button||0===e.button,s=!e.currentTarget||!('target'in e.currentTarget)||[void 0,null,'','self'].includes(e.currentTarget.target);!n&&o&&s&&(e.preventDefault?.(),t=!0)}else e?.preventDefault?.(),t=!0;if(t)if(l)if(p)p.dispatch(l);else{if(!f)throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");f.dispatch(l)}else p?.navigate(s,u)}}};var e=require("./module_235"),t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37"));require("./module_98");var n=require("./LinkingContext_493");const o=e=>e?.state?e.state:e?.screen?{routes:[{name:e.screen,params:e.params,state:e.screen?o(e.params):void 0}]}:void 0