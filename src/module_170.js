/**
 * Module ID: 170
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 170);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.setResponderId=function(e,t){null!=e&&(e[o]=t)},_e.getResponderPaths=function(e){for(var t=[],n=[],o=u(e),l=0;l<o.length;l++){var i=o[l],s=c(i);null!=s&&(t.push(s),n.push(i))}return{idPath:t,nodePath:n}},_e.getLowestCommonAncestor=function(e,t){var n=e.length,o=t.length;if(0===n||0===o||e[n-1]!==t[o-1])return null;var u=e[0],l=0,c=t[0],i=0;n-o>0&&(u=e[l=n-o],n=o);o-n>0&&(c=t[i=o-n],o=n);var s=n;for(;s--;){if(u===c)return u;u=e[l++],c=t[i++]}return null},_e.hasTargetTouches=function(e,t){if(!t||0===t.length)return!1;for(var n=0;n<t.length;n++){var o=t[n].target;if(null!=o&&e.contains(o))return!0}return!1},_e.hasValidSelection=function(e){if('selectionchange'===e.type)return(0,n.default)();return'select'===e.type},_e.isPrimaryPointerDown=function(e){var t=e.altKey,n=e.button,o=e.buttons,u=e.ctrlKey,l=e.type,c='mousedown'===l&&(0===n||1===o),i='mousemove'===l&&1===o,s=!1===t&&!1===u;if('touchstart'===l||'touchmove'===l||c&&s||i&&s)return!0;return!1};var e,t=require("./module_171"),n=(e=t)&&e.__esModule?e:{default:e},o='__reactResponderId';function u(e){return'selectionchange'===e.type?l(window.getSelection().anchorNode):null!=e.composedPath?e.composedPath():l(e.target)}function l(e){for(var t=[];null!=e&&e!==document.body;)t.push(e),e=e.parentNode;return t}function c(e){return null!=e?e[o]:null}