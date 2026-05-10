/**
 * Module ID: 91
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i2 = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 91);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(e,"__esModule",{value:!0}),e.styleq=void 0;var l=new WeakMap;function n(n){var s,u,t;return null!=n&&(s=!0===n.disableCache,u=!0===n.disableMix,t=n.transform),function(){for(var n=[],i='',o=null,f=s?null:l,v=new Array(arguments.length),c=0;c<arguments.length;c++)v[c]=arguments[c];for(;v.length>0;){var p=v.pop();if(null!=p&&!1!==p)if(Array.isArray(p))for(var y=0;y<p.length;y++)v.push(p[y]);else{var h=null!=t?t(p):p;if(h.$$css){var b='';if(null!=f&&f.has(h)){var M=f.get(h);null!=M&&(b=M[0],n.push.apply(n,M[1]),f=M[2])}else{var $=[];for(var _ in h){var j=h[_];"$$css"!==_&&('string'==typeof j||null===j?n.includes(_)||(n.push(_),null!=f&&$.push(_),'string'==typeof j&&(b+=b?' '+j:j)):console.error("styleq: ".concat(_," typeof ").concat(String(j)," is not \"string\" or \"null\".")))}if(null!=f){var q=new WeakMap;f.set(h,[b,$,q]),f=q}}b&&(i=i?b+' '+i:b)}else if(u)null==o&&(o={}),o=Object.assign({},h,o);else{var w=null;for(var A in h){var O=h[A];void 0!==O&&(n.includes(A)||(null!=O&&(null==o&&(o={}),null==w&&(w={}),w[A]=O),n.push(A),f=null))}null!=w&&(o=Object.assign(w,o))}}}return[i,o]}}var s=n();e.styleq=s,s.factory=n