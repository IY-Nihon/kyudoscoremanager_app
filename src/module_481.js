/**
 * Module ID: 481
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 481);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);


/**
   * @license React
   * use-sync-external-store-with-selector.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
"use strict";var u=require("./module_37");var n="function"==typeof Object.is?Object.is:function(u,n){return u===n&&(0!==u||1/u==1/n)||u!=u&&n!=n},t=u.useSyncExternalStore,l=u.useRef,c=u.useEffect,f=u.useMemo,o=u.useDebugValue;e.useSyncExternalStoreWithSelector=function(u,v,s,S,h){var V=l(null);if(null===V.current){var b={hasValue:!1,value:null};V.current=b}else b=V.current;V=f(function(){function u(u){if(!c){if(c=!0,t=u,u=S(u),void 0!==h&&b.hasValue){var f=b.value;if(h(f,u))return l=f}return l=u}if(f=l,n(t,u))return f;var o=S(u);return void 0!==h&&h(f,o)?(t=u,f):(t=u,l=o)}var t,l,c=!1,f=void 0===s?null:s;return[function(){return u(v())},null===f?void 0:function(){return u(f())}]},[v,s,S,h]);var y=t(u,V[0],V[1]);return c(function(){b.hasValue=!0,b.value=y},[y]),o(y),y}