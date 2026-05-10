/**
 * Module ID: 231
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 231);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);


/**
   * BezierEasing - use bezier curve for transition easing function
   * https://github.com/gre/bezier-easing
   * @copyright 2014-2015 Gaëtan Renaudeau. MIT License.
   */
'use strict';Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return h}});var n=4,t=.001,u=1e-7,o=10,f=11,i=.1,c='function'==typeof Float32Array;function v(n,t){return 1-3*t+3*n}function l(n,t){return 3*t-6*n}function b(n){return 3*n}function s(n,t,u){return((v(t,u)*n+l(t,u))*n+b(t))*n}function y(n,t,u){return 3*v(t,u)*n*n+2*l(t,u)*n+b(t)}function w(n,t,f,i,c){var v,l,b=0,y=t,w=f;do{(v=s(l=y+(w-y)/2,i,c)-n)>0?w=l:y=l}while(Math.abs(v)>u&&++b<o);return l}function _(t,u,o,f){for(var i=u,c=0;c<n;++c){var v=y(i,o,f);if(0===v)return i;i-=(s(i,o,f)-t)/v}return i}function h(n,u,o,v){if(!(n>=0&&n<=1&&o>=0&&o<=1))throw new Error('bezier x values must be in [0, 1] range');var l=c?new Float32Array(f):new Array(f);if(n!==u||o!==v)for(var b=0;b<f;++b)l[b]=s(b*i,n,o);function h(u){for(var f=0,c=1;10!==c&&l[c]<=u;++c)f+=i;--c;var v=f+(u-l[c])/(l[c+1]-l[c])*i,b=y(v,n,o);return b>=t?_(u,v,n,o):0===b?v:w(u,f,f+i,n,o)}return function(t){return n===u&&o===v?t:0===t?0:1===t?1:s(h(t),u,v)}}