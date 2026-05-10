/**
 * Module ID: 512
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 512);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useRoutePath=function(){const{options:o}=t.useContext(n.LinkingContext),u=(0,e.useStateForPath)();if(void 0===u)throw new Error("Couldn't find a state for the route object. Is your component inside a screen in a navigator?");const c=o?.getPathFromState??e.getPathFromState;return t.useMemo(()=>{if(!1===o?.enabled)return;return c(u,o?.config)},[o?.enabled,o?.config,u,c])};var e=require("./module_235"),t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),n=require("./LinkingContext_493")