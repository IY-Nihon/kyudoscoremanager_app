/**
 * Module ID: 55
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 55);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function t(t,c){for(var o,n=t.length,u=c^n,h=0;n>=4;)o=1540483477*(65535&(o=255&t.charCodeAt(h)|(255&t.charCodeAt(++h))<<8|(255&t.charCodeAt(++h))<<16|(255&t.charCodeAt(++h))<<24))+((1540483477*(o>>>16)&65535)<<16),u=1540483477*(65535&u)+((1540483477*(u>>>16)&65535)<<16)^(o=1540483477*(65535&(o^=o>>>24))+((1540483477*(o>>>16)&65535)<<16)),n-=4,++h;switch(n){case 3:u^=(255&t.charCodeAt(h+2))<<16;case 2:u^=(255&t.charCodeAt(h+1))<<8;case 1:u=1540483477*(65535&(u^=255&t.charCodeAt(h)))+((1540483477*(u>>>16)&65535)<<16)}return u=1540483477*(65535&(u^=u>>>13))+((1540483477*(u>>>16)&65535)<<16),(u^=u>>>15)>>>0}Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return c}});var c=c=>t(c,1).toString(36)