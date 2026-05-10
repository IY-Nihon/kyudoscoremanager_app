/**
 * Module ID: 139
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 139);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return t}});class t{constructor(){this._registry={}}addListener(t,s,l){var u=n(this._registry,t),o={context:l,listener:s,remove(){u.delete(o)}};return u.add(o),o}emit(t){var n=this._registry[t];if(null!=n){for(var s=arguments.length,l=new Array(s>1?s-1:0),u=1;u<s;u++)l[u-1]=arguments[u];for(var o=0,c=[...n];o<c.length;o++){var v=c[o];v.listener.apply(v.context,l)}}}removeAllListeners(t){null==t?this._registry={}:delete this._registry[t]}listenerCount(t){var n=this._registry[t];return null==n?0:n.size}}function n(t,n){var s=t[n];return null==s&&(s=new Set,t[n]=s),s}