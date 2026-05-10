/**
 * Module ID: 36
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 36);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);


/**
   * @license React
   * scheduler.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
"use strict";function n(n,t){var a=n.length;n.push(t);e:for(;0<a;){var o=a-1>>>1,u=n[o];if(!(0<l(u,t)))break e;n[o]=t,n[a]=u,a=o}}function t(n){return 0===n.length?null:n[0]}function a(n){if(0===n.length)return null;var t=n[0],a=n.pop();if(a!==t){n[0]=a;e:for(var o=0,u=n.length,s=u>>>1;o<s;){var f=2*(o+1)-1,c=n[f],b=f+1,p=n[b];if(0>l(c,a))b<u&&0>l(p,c)?(n[o]=p,n[b]=a,o=b):(n[o]=c,n[f]=a,o=f);else{if(!(b<u&&0>l(p,a)))break e;n[o]=p,n[b]=a,o=b}}}return t}function l(n,t){var a=n.sortIndex-t.sortIndex;return 0!==a?a:n.id-t.id}if(e.unstable_now=void 0,"object"==typeof performance&&"function"==typeof performance.now){var o=performance;e.unstable_now=function(){return o.now()}}else{var u=Date,s=u.now();e.unstable_now=function(){return u.now()-s}}var f=[],c=[],b=1,p=null,v=3,y=!1,_=!1,k=!1,w=!1,h="function"==typeof setTimeout?setTimeout:null,T="function"==typeof clearTimeout?clearTimeout:null,x="undefined"!=typeof setImmediate?setImmediate:null;function I(l){for(var o=t(c);null!==o;){if(null===o.callback)a(c);else{if(!(o.startTime<=l))break;a(c),o.sortIndex=o.expirationTime,n(f,o)}o=t(c)}}function P(n){if(k=!1,I(n),!_)if(null!==t(f))_=!0,L||(L=!0,C());else{var a=t(c);null!==a&&N(P,a.startTime-n)}}var C,L=!1,M=-1,j=5,F=-1;function R(){return!!w||!(e.unstable_now()-F<j)}function q(){if(w=!1,L){var n=e.unstable_now();F=n;var l=!0;try{e:{_=!1,k&&(k=!1,T(M),M=-1),y=!0;var o=v;try{n:{for(I(n),p=t(f);null!==p&&!(p.expirationTime>n&&R());){var u=p.callback;if("function"==typeof u){p.callback=null,v=p.priorityLevel;var s=u(p.expirationTime<=n);if(n=e.unstable_now(),"function"==typeof s){p.callback=s,I(n),l=!0;break n}p===t(f)&&a(f),I(n)}else a(f);p=t(f)}if(null!==p)l=!0;else{var b=t(c);null!==b&&N(P,b.startTime-n),l=!1}}break e}finally{p=null,v=o,y=!1}l=void 0}}finally{l?C():L=!1}}}if("function"==typeof x)C=function(){x(q)};else if("undefined"!=typeof MessageChannel){var B=new MessageChannel,D=B.port2;B.port1.onmessage=q,C=function(){D.postMessage(null)}}else C=function(){h(q,0)};function N(n,t){M=h(function(){n(e.unstable_now())},t)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(n){n.callback=null},e.unstable_forceFrameRate=function(n){0>n||125<n?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):j=0<n?Math.floor(1e3/n):5},e.unstable_getCurrentPriorityLevel=function(){return v},e.unstable_next=function(n){switch(v){case 1:case 2:case 3:var t=3;break;default:t=v}var a=v;v=t;try{return n()}finally{v=a}},e.unstable_requestPaint=function(){w=!0},e.unstable_runWithPriority=function(n,t){switch(n){case 1:case 2:case 3:case 4:case 5:break;default:n=3}var a=v;v=n;try{return t()}finally{v=a}},e.unstable_scheduleCallback=function(a,l,o){var u=e.unstable_now();switch("object"==typeof o&&null!==o?o="number"==typeof(o=o.delay)&&0<o?u+o:u:o=u,a){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return a={id:b++,callback:l,priorityLevel:a,startTime:o,expirationTime:s=o+s,sortIndex:-1},o>u?(a.sortIndex=o,n(c,a),null===t(f)&&a===t(c)&&(k?(T(M),M=-1):k=!0,N(P,o-u))):(a.sortIndex=s,n(f,a),_||y||(_=!0,L||(L=!0,C()))),a},e.unstable_shouldYield=R,e.unstable_wrapCallback=function(n){var t=v;return function(){var a=v;v=t;try{return n.apply(this,arguments)}finally{v=a}}}