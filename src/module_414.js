/**
 * Module ID: 414
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 414);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.colorScheme=void 0;const t=require("./unstable_createElement_282"),o=require("./module_277"),s=require("./module_415"),l=require("./module_281");let n,c=t.Appearance;const h=l.StyleSheet.getFlag("darkMode");let w,u,b;if(h){const t=h.split(" ");w=t[0],u=t[1],"class"===w&&(b="window"in globalThis.window&&globalThis.window.document.documentElement.classList.contains(u)?"dark":"light")}else if("window"in globalThis){const t=globalThis.window.document.getElementsByTagName("head")[0];new MutationObserver(function(t,o){const s=l.StyleSheet.getFlag("darkMode");if(!s)return;o.disconnect();const n=s.split(" ");w=n[0],u=n[1],e.colorScheme.set(globalThis.window.document.documentElement.classList.contains(u)?"dark":"system")}).observe(t,{attributes:!1,childList:!0,subtree:!1})}const S=(0,s.observable)(c.getColorScheme()??"light"),v=(0,s.observable)(b,{fallback:S});function T(o){c=o,n?.remove(),n=c.addChangeListener(o=>{"active"===t.AppState.currentState&&S.set(o.colorScheme??"light")})}e.colorScheme={set(t){if("media"===w)throw new Error("Cannot manually set color scheme, as dark mode is type 'media'. Please use StyleSheet.setFlag('darkMode', 'class')");if(!globalThis.window)throw new Error("Cannot manually set color scheme while not in a browser environment.");"system"===t?v.set(void 0):v.set(t),u&&("dark"===t?globalThis.window?.document.documentElement.classList.add(u):globalThis.window?.document.documentElement.classList.remove(u))},get:v.get,toggle(){let t=v.get();void 0===t&&(t=c.getColorScheme()??"light"),e.colorScheme.set("light"===t?"dark":"light")},[o.INTERNAL_RESET]:t=>{v.set(void 0),T(t)}},T(c)