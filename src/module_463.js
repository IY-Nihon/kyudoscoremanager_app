/**
 * Module ID: 463
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 463);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.useFocusEffect=function(n){const o=(0,t.useNavigation)();if(void 0!==arguments[1]){const e="You passed a second argument to 'useFocusEffect', but it only accepts one argument. If you want to pass a dependency array, you can use 'React.useCallback':\n\nuseFocusEffect(\n  React.useCallback(() => {\n    // Your code here\n  }, [depA, depB])\n);\n\nSee usage guide: https://reactnavigation.org/docs/use-focus-effect";console.error(e)}e.useEffect(()=>{let e,t=!1;const c=()=>{const e=n();if(void 0===e||'function'==typeof e)return e};o.isFocused()&&(e=c(),t=!0);const u=o.addListener('focus',()=>{t||(void 0!==e&&e(),e=c(),t=!0)}),s=o.addListener('blur',()=>{void 0!==e&&e(),e=void 0,t=!1});return()=>{void 0!==e&&e(),u(),s()}},[n,o])};var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),t=require("./module_438")