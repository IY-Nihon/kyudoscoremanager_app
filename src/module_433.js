/**
 * Module ID: 433
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 433);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);


/**
   * @license React
   * react-is.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
"use strict";var t=Symbol.for("react.transitional.element"),o=Symbol.for("react.portal"),n=Symbol.for("react.fragment"),c=Symbol.for("react.strict_mode"),f=Symbol.for("react.profiler"),s=Symbol.for("react.consumer"),u=Symbol.for("react.context"),l=Symbol.for("react.forward_ref"),y=Symbol.for("react.suspense"),p=Symbol.for("react.suspense_list"),S=Symbol.for("react.memo"),$=Symbol.for("react.lazy"),b=Symbol.for("react.view_transition"),w=Symbol.for("react.client.reference");function v(w){if("object"==typeof w&&null!==w){var v=w.$$typeof;switch(v){case t:switch(w=w.type){case n:case f:case c:case y:case p:case b:return w;default:switch(w=w&&w.$$typeof){case u:case l:case $:case S:case s:return w;default:return v}}case o:return v}}}e.ContextConsumer=s,e.ContextProvider=u,e.Element=t,e.ForwardRef=l,e.Fragment=n,e.Lazy=$,e.Memo=S,e.Portal=o,e.Profiler=f,e.StrictMode=c,e.Suspense=y,e.SuspenseList=p,e.isContextConsumer=function(t){return v(t)===s},e.isContextProvider=function(t){return v(t)===u},e.isElement=function(o){return"object"==typeof o&&null!==o&&o.$$typeof===t},e.isForwardRef=function(t){return v(t)===l},e.isFragment=function(t){return v(t)===n},e.isLazy=function(t){return v(t)===$},e.isMemo=function(t){return v(t)===S},e.isPortal=function(t){return v(t)===o},e.isProfiler=function(t){return v(t)===f},e.isStrictMode=function(t){return v(t)===c},e.isSuspense=function(t){return v(t)===y},e.isSuspenseList=function(t){return v(t)===p},e.isValidElementType=function(t){return"string"==typeof t||"function"==typeof t||t===n||t===f||t===c||t===y||t===p||"object"==typeof t&&null!==t&&(t.$$typeof===$||t.$$typeof===S||t.$$typeof===u||t.$$typeof===s||t.$$typeof===l||t.$$typeof===w||void 0!==t.getModuleId)},e.typeOf=v