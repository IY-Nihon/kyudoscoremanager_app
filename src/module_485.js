/**
 * Module ID: 485
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 485);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useOnRouteFocus=function({router:o,getState:u,key:n,setState:c}){const{onRouteFocus:s}=e.useContext(t.NavigationBuilderContext);return e.useCallback(e=>{const t=u(),f=o.getStateForRouteFocus(t,e);f!==t&&c(f),void 0!==s&&void 0!==n&&s(n)},[u,s,o,c,n])};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(o){var u=Object.getOwnPropertyDescriptor(e,o);Object.defineProperty(t,o,u.get?u:{enumerable:!0,get:function(){return e[o]}})}),t.default=e,t})(require("./module_37")),t=require("./NavigationBuilderContext_257")