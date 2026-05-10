/**
 * Module ID: 369
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 369);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";var e;Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return t}});class t{static isAvailable(){return void 0===e&&(e='function'==typeof document.queryCommandSupported&&document.queryCommandSupported('copy')),e}static getString(){return Promise.resolve('')}static setString(e){var t=!1,n=document.body;if(n){var o=document.createElement('span');o.textContent=e,o.style.opacity='0',o.style.position='absolute',o.style.whiteSpace='pre-wrap',o.style.userSelect='auto',n.appendChild(o);var c=window.getSelection();c.removeAllRanges();var u=document.createRange();u.selectNodeContents(o),c.addRange(u);try{document.execCommand('copy'),t=!0}catch(e){}c.removeAllRanges(),n.removeChild(o)}return t}}