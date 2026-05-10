/**
 * Module ID: 510
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 510);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useLinkTo=function(){const o=t.useContext(e.NavigationContainerRefContext),u=(0,n.useBuildAction)();return t.useCallback(e=>{if(void 0===o)throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");const t=u(e);o.dispatch(t)},[u,o])};var e=require("./module_235"),t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),n=require("./useBuildAction_509")