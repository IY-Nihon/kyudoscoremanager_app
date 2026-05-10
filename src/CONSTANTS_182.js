/**
 * Module ID: 182
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const _r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a2 = (typeof id !== 'undefined' ? id : 182);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"CONSTANTS",{enumerable:!0,get:function(){return e}}),Object.defineProperty(_e,"DecodeBase64StringError",{enumerable:!0,get:function(){return s}}),Object.defineProperty(_e,"Deferred",{enumerable:!0,get:function(){return v}}),Object.defineProperty(_e,"ErrorFactory",{enumerable:!0,get:function(){return F}}),Object.defineProperty(_e,"FirebaseError",{enumerable:!0,get:function(){return U}}),Object.defineProperty(_e,"MAX_VALUE_MILLIS",{enumerable:!0,get:function(){return ve}}),Object.defineProperty(_e,"RANDOM_FACTOR",{enumerable:!0,get:function(){return Pe}}),Object.defineProperty(_e,"Sha1",{enumerable:!0,get:function(){return se}}),Object.defineProperty(_e,"areCookiesEnabled",{enumerable:!0,get:function(){return R}}),Object.defineProperty(_e,"assert",{enumerable:!0,get:function(){return t}}),Object.defineProperty(_e,"assertionError",{enumerable:!0,get:function(){return r}}),Object.defineProperty(_e,"async",{enumerable:!0,get:function(){return ae}}),Object.defineProperty(_e,"base64",{enumerable:!0,get:function(){return i}}),Object.defineProperty(_e,"base64Decode",{enumerable:!0,get:function(){return a}}),Object.defineProperty(_e,"base64Encode",{enumerable:!0,get:function(){return c}}),Object.defineProperty(_e,"base64urlEncodeWithoutPadding",{enumerable:!0,get:function(){return u}}),Object.defineProperty(_e,"calculateBackoffMillis",{enumerable:!0,get:function(){return Se}}),Object.defineProperty(_e,"contains",{enumerable:!0,get:function(){return Q}}),Object.defineProperty(_e,"createMockUserToken",{enumerable:!0,get:function(){return P}}),Object.defineProperty(_e,"createSubscribe",{enumerable:!0,get:function(){return ce}}),Object.defineProperty(_e,"decode",{enumerable:!0,get:function(){return J}}),Object.defineProperty(_e,"deepCopy",{enumerable:!0,get:function(){return f}}),Object.defineProperty(_e,"deepEqual",{enumerable:!0,get:function(){return ee}}),Object.defineProperty(_e,"deepExtend",{enumerable:!0,get:function(){return l}}),Object.defineProperty(_e,"errorPrefix",{enumerable:!0,get:function(){return de}}),Object.defineProperty(_e,"extractQuerystring",{enumerable:!0,get:function(){return ie}}),Object.defineProperty(_e,"getDefaultAppConfig",{enumerable:!0,get:function(){return E}}),Object.defineProperty(_e,"getDefaultEmulatorHost",{enumerable:!0,get:function(){return _}}),Object.defineProperty(_e,"getDefaultEmulatorHostnameAndPort",{enumerable:!0,get:function(){return O}}),Object.defineProperty(_e,"getDefaults",{enumerable:!0,get:function(){return y}}),Object.defineProperty(_e,"getExperimentalSetting",{enumerable:!0,get:function(){return j}}),Object.defineProperty(_e,"getGlobal",{enumerable:!0,get:function(){return d}}),Object.defineProperty(_e,"getModularInstance",{enumerable:!0,get:function(){return xe}}),Object.defineProperty(_e,"getUA",{enumerable:!0,get:function(){return S}}),Object.defineProperty(_e,"isAdmin",{enumerable:!0,get:function(){return K}}),Object.defineProperty(_e,"isBrowser",{enumerable:!0,get:function(){return x}}),Object.defineProperty(_e,"isBrowserExtension",{enumerable:!0,get:function(){return w}}),Object.defineProperty(_e,"isElectron",{enumerable:!0,get:function(){return T}}),Object.defineProperty(_e,"isEmpty",{enumerable:!0,get:function(){return Y}}),Object.defineProperty(_e,"isIE",{enumerable:!0,get:function(){return N}}),Object.defineProperty(_e,"isIndexedDBAvailable",{enumerable:!0,get:function(){return I}}),Object.defineProperty(_e,"isMobileCordova",{enumerable:!0,get:function(){return A}}),Object.defineProperty(_e,"isNode",{enumerable:!0,get:function(){return C}}),Object.defineProperty(_e,"isNodeSdk",{enumerable:!0,get:function(){return B}}),Object.defineProperty(_e,"isReactNative",{enumerable:!0,get:function(){return D}}),Object.defineProperty(_e,"isSafari",{enumerable:!0,get:function(){return k}}),Object.defineProperty(_e,"isUWP",{enumerable:!0,get:function(){return M}}),Object.defineProperty(_e,"isValidFormat",{enumerable:!0,get:function(){return G}}),Object.defineProperty(_e,"isValidTimestamp",{enumerable:!0,get:function(){return H}}),Object.defineProperty(_e,"issuedAtTime",{enumerable:!0,get:function(){return q}}),Object.defineProperty(_e,"jsonEval",{enumerable:!0,get:function(){return $}}),Object.defineProperty(_e,"map",{enumerable:!0,get:function(){return Z}}),Object.defineProperty(_e,"ordinal",{enumerable:!0,get:function(){return Ae}}),Object.defineProperty(_e,"promiseWithTimeout",{enumerable:!0,get:function(){return re}}),Object.defineProperty(_e,"querystring",{enumerable:!0,get:function(){return ne}}),Object.defineProperty(_e,"querystringDecode",{enumerable:!0,get:function(){return oe}}),Object.defineProperty(_e,"safeGet",{enumerable:!0,get:function(){return X}}),Object.defineProperty(_e,"stringLength",{enumerable:!0,get:function(){return me}}),Object.defineProperty(_e,"stringToByteArray",{enumerable:!0,get:function(){return ge}}),Object.defineProperty(_e,"stringify",{enumerable:!0,get:function(){return z}}),Object.defineProperty(_e,"uuidv4",{enumerable:!0,get:function(){return Oe}}),Object.defineProperty(_e,"validateArgCount",{enumerable:!0,get:function(){return he}}),Object.defineProperty(_e,"validateCallback",{enumerable:!0,get:function(){return pe}}),Object.defineProperty(_e,"validateContextObject",{enumerable:!0,get:function(){return ye}}),Object.defineProperty(_e,"validateIndexedDBOpenable",{enumerable:!0,get:function(){return L}}),Object.defineProperty(_e,"validateNamespace",{enumerable:!0,get:function(){return be}});
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
const e={NODE_CLIENT:!1,NODE_ADMIN:!1,SDK_VERSION:'${JSCORE_VERSION}'},t=function(e,t){if(!e)throw r(t)},r=function(t){return new Error('Firebase Database ('+e.SDK_VERSION+') INTERNAL ASSERT FAILED: '+t)},n=function(e){const t=[];let r=0;for(let n=0;n<e.length;n++){let o=e.charCodeAt(n);o<128?t[r++]=o:o<2048?(t[r++]=o>>6|192,t[r++]=63&o|128):55296==(64512&o)&&n+1<e.length&&56320==(64512&e.charCodeAt(n+1))?(o=65536+((1023&o)<<10)+(1023&e.charCodeAt(++n)),t[r++]=o>>18|240,t[r++]=o>>12&63|128,t[r++]=o>>6&63|128,t[r++]=63&o|128):(t[r++]=o>>12|224,t[r++]=o>>6&63|128,t[r++]=63&o|128)}return t},o=function(e){const t=[];let r=0,n=0;for(;r<e.length;){const o=e[r++];if(o<128)t[n++]=String.fromCharCode(o);else if(o>191&&o<224){const i=e[r++];t[n++]=String.fromCharCode((31&o)<<6|63&i)}else if(o>239&&o<365){const i=((7&o)<<18|(63&e[r++])<<12|(63&e[r++])<<6|63&e[r++])-65536;t[n++]=String.fromCharCode(55296+(i>>10)),t[n++]=String.fromCharCode(56320+(1023&i))}else{const i=e[r++],s=e[r++];t[n++]=String.fromCharCode((15&o)<<12|(63&i)<<6|63&s)}}return t.join('')},i={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+'+/='},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+'-_.'},HAS_NATIVE_SUPPORT:'function'==typeof atob,encodeByteArray(e,t){if(!Array.isArray(e))throw Error('encodeByteArray takes an array as a parameter');this.init_();const r=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let t=0;t<e.length;t+=3){const o=e[t],i=t+1<e.length,s=i?e[t+1]:0,c=t+2<e.length,u=c?e[t+2]:0,a=o>>2,f=(3&o)<<4|s>>4;let l=(15&s)<<2|u>>6,h=63&u;c||(h=64,i||(l=64)),n.push(r[a],r[f],r[l],r[h])}return n.join('')},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(n(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):o(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const r=t?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let t=0;t<e.length;){const o=r[e.charAt(t++)],i=t<e.length?r[e.charAt(t)]:0;++t;const c=t<e.length?r[e.charAt(t)]:64;++t;const u=t<e.length?r[e.charAt(t)]:64;if(++t,null==o||null==i||null==c||null==u)throw new s;const a=o<<2|i>>4;if(n.push(a),64!==c){const e=i<<4&240|c>>2;if(n.push(e),64!==u){const e=c<<6&192|u;n.push(e)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class s extends Error{constructor(){super(...arguments),this.name='DecodeBase64StringError'}}const c=function(e){const t=n(e);return i.encodeByteArray(t,!0)},u=function(e){return c(e).replace(/\./g,'')},a=function(e){try{return i.decodeString(e,!0)}catch(e){console.error('base64Decode failed: ',e)}return null};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
function f(e){return l(void 0,e)}function l(e,t){if(!(t instanceof Object))return t;switch(t.constructor){case Date:return new Date(t.getTime());case Object:void 0===e&&(e={});break;case Array:e=[];break;default:return t}for(const r in t)t.hasOwnProperty(r)&&h(r)&&(e[r]=l(e[r],t[r]));return e}function h(e){return'__proto__'!==e}
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function d(){if('undefined'!=typeof self)return self;if('undefined'!=typeof window)return window;if(void 0!==g)return g;throw new Error('Unable to locate global object.')}
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const b=()=>{if('undefined'==typeof process||void 0===process.env)return;const e=process.env.__FIREBASE_DEFAULTS__;return e?JSON.parse(e):void 0},p=()=>{if('undefined'==typeof document)return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(e){return}const t=e&&a(e[1]);return t&&JSON.parse(t)},y=()=>{try{return d().__FIREBASE_DEFAULTS__||b()||p()}catch(e){return void console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`)}},_=e=>{var t,r;return null===(r=null===(t=y())||void 0===t?void 0:t.emulatorHosts)||void 0===r?void 0:r[e]},O=e=>{const t=_(e);if(!t)return;const r=t.lastIndexOf(':');if(r<=0||r+1===t.length)throw new Error(`Invalid host ${t} with no separate hostname and port!`);const n=parseInt(t.substring(r+1),10);return'['===t[0]?[t.substring(1,r-1),n]:[t.substring(0,r),n]},E=()=>{var e;return null===(e=y())||void 0===e?void 0:e.config},j=e=>{var t;return null===(t=y())||void 0===t?void 0:t[`_${e}`]};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
class v{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,r)=>{t?this.reject(t):this.resolve(r),'function'==typeof e&&(this.promise.catch(()=>{}),1===e.length?e(t):e(t,r))}}}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function P(e,t){if(e.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const r=t||'demo-project',n=e.iat||0,o=e.sub||e.user_id;if(!o)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const i=Object.assign({iss:`https://securetoken.google.com/${r}`,aud:r,iat:n,exp:n+3600,auth_time:n,sub:o,user_id:o,firebase:{sign_in_provider:'custom',identities:{}}},e);return[u(JSON.stringify({alg:'none',type:'JWT'})),u(JSON.stringify(i)),''].join('.')}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function S(){return'undefined'!=typeof navigator&&'string'==typeof navigator.userAgent?navigator.userAgent:''}function A(){return'undefined'!=typeof window&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(S())}function C(){var e;const t=null===(e=y())||void 0===e?void 0:e.forceEnvironment;if('node'===t)return!0;if('browser'===t)return!1;try{return'[object process]'===Object.prototype.toString.call(g.process)}catch(e){return!1}}function x(){return'object'==typeof self&&self.self===self}function w(){const e='object'==typeof chrome?chrome.runtime:'object'==typeof browser?browser.runtime:void 0;return'object'==typeof e&&void 0!==e.id}function D(){return'object'==typeof navigator&&'ReactNative'===navigator.product}function T(){return S().indexOf('Electron/')>=0}function N(){const e=S();return e.indexOf('MSIE ')>=0||e.indexOf('Trident/')>=0}function M(){return S().indexOf('MSAppHost/')>=0}function B(){return!0===e.NODE_CLIENT||!0===e.NODE_ADMIN}function k(){return!C()&&navigator.userAgent.includes('Safari')&&!navigator.userAgent.includes('Chrome')}function I(){try{return'object'==typeof indexedDB}catch(e){return!1}}function L(){return new Promise((e,t)=>{try{let r=!0;const n='validate-browser-context-for-indexeddb-analytics-module',o=self.indexedDB.open(n);o.onsuccess=()=>{o.result.close(),r||self.indexedDB.deleteDatabase(n),e(!0)},o.onupgradeneeded=()=>{r=!1},o.onerror=()=>{var e;t((null===(e=o.error)||void 0===e?void 0:e.message)||'')}}catch(e){t(e)}})}function R(){return!('undefined'==typeof navigator||!navigator.cookieEnabled)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class U extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name="FirebaseError",Object.setPrototypeOf(this,U.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,F.prototype.create)}}class F{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){const r=t[0]||{},n=`${this.service}/${e}`,o=this.errors[e],i=o?V(o,r):'Error',s=`${this.serviceName}: ${i} (${n}).`;return new U(n,s,r)}}function V(e,t){return e.replace(W,(e,r)=>{const n=t[r];return null!=n?String(n):`<${r}?>`})}const W=/\{\$([^}]+)}/g;
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function $(e){return JSON.parse(e)}function z(e){return JSON.stringify(e)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const J=function(e){let t={},r={},n={},o='';try{const i=e.split('.');t=$(a(i[0])||''),r=$(a(i[1])||''),o=i[2],n=r.d||{},delete r.d}catch(e){}return{header:t,claims:r,data:n,signature:o}},H=function(e){const t=J(e).claims,r=Math.floor((new Date).getTime()/1e3);let n=0,o=0;return'object'==typeof t&&(t.hasOwnProperty('nbf')?n=t.nbf:t.hasOwnProperty('iat')&&(n=t.iat),o=t.hasOwnProperty('exp')?t.exp:n+86400),!!r&&!!n&&!!o&&r>=n&&r<=o},q=function(e){const t=J(e).claims;return'object'==typeof t&&t.hasOwnProperty('iat')?t.iat:null},G=function(e){const t=J(e).claims;return!!t&&'object'==typeof t&&t.hasOwnProperty('iat')},K=function(e){const t=J(e).claims;return'object'==typeof t&&!0===t.admin};
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
function Q(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function X(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:void 0}function Y(e){for(const t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}function Z(e,t,r){const n={};for(const o in e)Object.prototype.hasOwnProperty.call(e,o)&&(n[o]=t.call(r,e[o],o,e));return n}function ee(e,t){if(e===t)return!0;const r=Object.keys(e),n=Object.keys(t);for(const o of r){if(!n.includes(o))return!1;const r=e[o],i=t[o];if(te(r)&&te(i)){if(!ee(r,i))return!1}else if(r!==i)return!1}for(const e of n)if(!r.includes(e))return!1;return!0}function te(e){return null!==e&&'object'==typeof e}
/**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function re(e,t=2e3){const r=new v;return setTimeout(()=>r.reject('timeout!'),t),e.then(r.resolve,r.reject),r.promise}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function ne(e){const t=[];for(const[r,n]of Object.entries(e))Array.isArray(n)?n.forEach(e=>{t.push(encodeURIComponent(r)+'='+encodeURIComponent(e))}):t.push(encodeURIComponent(r)+'='+encodeURIComponent(n));return t.length?'&'+t.join('&'):''}function oe(e){const t={};return e.replace(/^\?/,'').split('&').forEach(e=>{if(e){const[r,n]=e.split('=');t[decodeURIComponent(r)]=decodeURIComponent(n)}}),t}function ie(e){const t=e.indexOf('?');if(!t)return'';const r=e.indexOf('#',t);return e.substring(t,r>0?r:void 0)}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class se{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=64,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const r=this.W_;if('string'==typeof e)for(let n=0;n<16;n++)r[n]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let n=0;n<16;n++)r[n]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let e=16;e<80;e++){const t=r[e-3]^r[e-8]^r[e-14]^r[e-16];r[e]=4294967295&(t<<1|t>>>31)}let n,o,i=this.chain_[0],s=this.chain_[1],c=this.chain_[2],u=this.chain_[3],a=this.chain_[4];for(let e=0;e<80;e++){e<40?e<20?(n=u^s&(c^u),o=1518500249):(n=s^c^u,o=1859775393):e<60?(n=s&c|u&(s|c),o=2400959708):(n=s^c^u,o=3395469782);const t=(i<<5|i>>>27)+n+a+o+r[e]&4294967295;a=u,u=c,c=4294967295&(s<<30|s>>>2),s=i,i=t}this.chain_[0]=this.chain_[0]+i&4294967295,this.chain_[1]=this.chain_[1]+s&4294967295,this.chain_[2]=this.chain_[2]+c&4294967295,this.chain_[3]=this.chain_[3]+u&4294967295,this.chain_[4]=this.chain_[4]+a&4294967295}update(e,t){if(null==e)return;void 0===t&&(t=e.length);const r=t-this.blockSize;let n=0;const o=this.buf_;let i=this.inbuf_;for(;n<t;){if(0===i)for(;n<=r;)this.compress_(e,n),n+=this.blockSize;if('string'==typeof e){for(;n<t;)if(o[i]=e.charCodeAt(n),++i,++n,i===this.blockSize){this.compress_(o),i=0;break}}else for(;n<t;)if(o[i]=e[n],++i,++n,i===this.blockSize){this.compress_(o),i=0;break}}this.inbuf_=i,this.total_+=t}digest(){const e=[];let t=8*this.total_;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let e=this.blockSize-1;e>=56;e--)this.buf_[e]=255&t,t/=256;this.compress_(this.buf_);let r=0;for(let t=0;t<5;t++)for(let n=24;n>=0;n-=8)e[r]=this.chain_[t]>>n&255,++r;return e}}function ce(e,t){const r=new ue(e,t);return r.subscribe.bind(r)}class ue{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(e=>{this.error(e)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let n;if(void 0===e&&void 0===t&&void 0===r)throw new Error('Missing Observer.');n=fe(e,['next','error','complete'])?e:{next:e,error:t,complete:r},void 0===n.next&&(n.next=le),void 0===n.error&&(n.error=le),void 0===n.complete&&(n.complete=le);const o=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?n.error(this.finalError):n.complete()}catch(e){}}),this.observers.push(n),o}unsubscribeOne(e){void 0!==this.observers&&void 0!==this.observers[e]&&(delete this.observers[e],this.observerCount-=1,0===this.observerCount&&void 0!==this.onNoObservers&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(void 0!==this.observers&&void 0!==this.observers[e])try{t(this.observers[e])}catch(e){'undefined'!=typeof console&&console.error&&console.error(e)}})}close(e){this.finalized||(this.finalized=!0,void 0!==e&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function ae(e,t){return(...r)=>{Promise.resolve(!0).then(()=>{e(...r)}).catch(e=>{t&&t(e)})}}function fe(e,t){if('object'!=typeof e||null===e)return!1;for(const r of t)if(r in e&&'function'==typeof e[r])return!0;return!1}function le(){}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const he=function(e,t,r,n){let o;if(n<t?o='at least '+t:n>r&&(o=0===r?'none':'no more than '+r),o){throw new Error(e+' failed: Was called with '+n+(1===n?' argument.':' arguments.')+' Expects '+o+'.')}};function de(e,t){return`${e} failed: ${t} argument `}function be(e,t,r){if((!r||t)&&'string'!=typeof t)throw new Error(de(e,'namespace')+'must be a valid firebase namespace.')}function pe(e,t,r,n){if((!n||r)&&'function'!=typeof r)throw new Error(de(e,t)+'must be a valid function.')}function ye(e,t,r,n){if((!n||r)&&('object'!=typeof r||null===r))throw new Error(de(e,t)+'must be a valid context object.')}
/**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const ge=function(e){const r=[];let n=0;for(let o=0;o<e.length;o++){let i=e.charCodeAt(o);if(i>=55296&&i<=56319){const r=i-55296;o++,t(o<e.length,'Surrogate pair missing trail surrogate.');i=65536+(r<<10)+(e.charCodeAt(o)-56320)}i<128?r[n++]=i:i<2048?(r[n++]=i>>6|192,r[n++]=63&i|128):i<65536?(r[n++]=i>>12|224,r[n++]=i>>6&63|128,r[n++]=63&i|128):(r[n++]=i>>18|240,r[n++]=i>>12&63|128,r[n++]=i>>6&63|128,r[n++]=63&i|128)}return r},me=function(e){let t=0;for(let r=0;r<e.length;r++){const n=e.charCodeAt(r);n<128?t++:n<2048?t+=2:n>=55296&&n<=56319?(t+=4,r++):t+=3}return t},Oe=function(){return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,e=>{const t=16*Math.random()|0;return('x'===e?t:3&t|8).toString(16)})},Ee=1e3,je=2,ve=144e5,Pe=.5;function Se(e,t=Ee,r=je){const n=t*Math.pow(r,e),o=Math.round(Pe*n*(Math.random()-.5)*2);return Math.min(ve,n+o)}
/**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function Ae(e){return Number.isFinite(e)?e+Ce(e):`${e}`}function Ce(e){const t=(e=Math.abs(e))%100;if(t>=10&&t<=20)return'th';const r=e%10;return 1===r?'st':2===r?'nd':3===r?'rd':'th'}
/**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function xe(e){return e&&e._delegate?e._delegate:e}