/**
 * Module ID: 281
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 281);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.StyleSheet=void 0;const t=require("./unstable_createElement_282"),o=globalThis.window?.getComputedStyle(globalThis.window?.document.documentElement),l={getFlag:t=>o?.getPropertyValue(`--css-interop-${t}`),unstable_hook_onClassName(){},register(t){throw new Error("Stylesheet.register is not available on web")},registerCompiled(t){throw new Error("Stylesheet.registerCompiled is not available on web")},getGlobalStyle(){throw new Error("Stylesheet.getGlobalStyle is not available on web")}};e.StyleSheet=Object.assign({},l,t.StyleSheet)