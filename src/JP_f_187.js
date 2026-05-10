/**
 * Module ID: 187
 */
"use strict";

const e = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const t = require;
const n = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const i = (typeof id !== 'undefined' ? id : 187);
const r = module;
const s = exports;
const o = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(s,'__esModule',{value:!0}),Object.defineProperty(s,"DataSnapshot",{enumerable:!0,get:function(){return Ks}}),Object.defineProperty(s,"Database",{enumerable:!0,get:function(){return Ko}}),Object.defineProperty(s,"OnDisconnect",{enumerable:!0,get:function(){return Us}}),Object.defineProperty(s,"QueryConstraint",{enumerable:!0,get:function(){return fo}}),Object.defineProperty(s,"TransactionResult",{enumerable:!0,get:function(){return sa}}),Object.defineProperty(s,"_QueryImpl",{enumerable:!0,get:function(){return Bs}}),Object.defineProperty(s,"_QueryParams",{enumerable:!0,get:function(){return St}}),Object.defineProperty(s,"_ReferenceImpl",{enumerable:!0,get:function(){return Ys}}),Object.defineProperty(s,"_TEST_ACCESS_forceRestClient",{enumerable:!0,get:function(){return la}}),Object.defineProperty(s,"_TEST_ACCESS_hijackHash",{enumerable:!0,get:function(){return aa}}),Object.defineProperty(s,"_repoManagerDatabaseFromApp",{enumerable:!0,get:function(){return Ho}}),Object.defineProperty(s,"_setSDKVersion",{enumerable:!0,get:function(){return p}}),Object.defineProperty(s,"_validatePathString",{enumerable:!0,get:function(){return Ur}}),Object.defineProperty(s,"_validateWritablePath",{enumerable:!0,get:function(){return Hr}}),Object.defineProperty(s,"child",{enumerable:!0,get:function(){return $s}}),Object.defineProperty(s,"connectDatabaseEmulator",{enumerable:!0,get:function(){return Jo}}),Object.defineProperty(s,"enableLogging",{enumerable:!0,get:function(){return ta}}),Object.defineProperty(s,"endAt",{enumerable:!0,get:function(){return go}}),Object.defineProperty(s,"endBefore",{enumerable:!0,get:function(){return vo}}),Object.defineProperty(s,"equalTo",{enumerable:!0,get:function(){return Fo}}),Object.defineProperty(s,"forceLongPolling",{enumerable:!0,get:function(){return $o}}),Object.defineProperty(s,"forceWebSockets",{enumerable:!0,get:function(){return Go}}),Object.defineProperty(s,"get",{enumerable:!0,get:function(){return ro}}),Object.defineProperty(s,"getDatabase",{enumerable:!0,get:function(){return Xo}}),Object.defineProperty(s,"goOffline",{enumerable:!0,get:function(){return Zo}}),Object.defineProperty(s,"goOnline",{enumerable:!0,get:function(){return ea}}),Object.defineProperty(s,"increment",{enumerable:!0,get:function(){return ra}}),Object.defineProperty(s,"limitToFirst",{enumerable:!0,get:function(){return ko}}),Object.defineProperty(s,"limitToLast",{enumerable:!0,get:function(){return Eo}}),Object.defineProperty(s,"off",{enumerable:!0,get:function(){return po}}),Object.defineProperty(s,"onChildAdded",{enumerable:!0,get:function(){return ho}}),Object.defineProperty(s,"onChildChanged",{enumerable:!0,get:function(){return co}}),Object.defineProperty(s,"onChildMoved",{enumerable:!0,get:function(){return uo}}),Object.defineProperty(s,"onChildRemoved",{enumerable:!0,get:function(){return _o}}),Object.defineProperty(s,"onDisconnect",{enumerable:!0,get:function(){return Xs}}),Object.defineProperty(s,"onValue",{enumerable:!0,get:function(){return lo}}),Object.defineProperty(s,"orderByChild",{enumerable:!0,get:function(){return No}}),Object.defineProperty(s,"orderByKey",{enumerable:!0,get:function(){return Ro}}),Object.defineProperty(s,"orderByPriority",{enumerable:!0,get:function(){return Oo}}),Object.defineProperty(s,"orderByValue",{enumerable:!0,get:function(){return Mo}}),Object.defineProperty(s,"push",{enumerable:!0,get:function(){return Js}}),Object.defineProperty(s,"query",{enumerable:!0,get:function(){return Lo}}),Object.defineProperty(s,"ref",{enumerable:!0,get:function(){return Qs}}),Object.defineProperty(s,"refFromURL",{enumerable:!0,get:function(){return Gs}}),Object.defineProperty(s,"remove",{enumerable:!0,get:function(){return Zs}}),Object.defineProperty(s,"runTransaction",{enumerable:!0,get:function(){return oa}}),Object.defineProperty(s,"serverTimestamp",{enumerable:!0,get:function(){return ia}}),Object.defineProperty(s,"set",{enumerable:!0,get:function(){return eo}}),Object.defineProperty(s,"setPriority",{enumerable:!0,get:function(){return to}}),Object.defineProperty(s,"setWithPriority",{enumerable:!0,get:function(){return no}}),Object.defineProperty(s,"startAfter",{enumerable:!0,get:function(){return To}}),Object.defineProperty(s,"startAt",{enumerable:!0,get:function(){return wo}}),Object.defineProperty(s,"update",{enumerable:!0,get:function(){return io}});var a=require("./FirebaseError_180"),l=require("./Component_181"),h=require("./CONSTANTS_182"),c=require("./h_183");const u="@firebase/database",d="0.14.4";
/**
   * @license
   * Copyright 2019 Google LLC
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
let _='';function p(e){_=e}
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
   */class f{constructor(e){this.domStorage_=e,this.prefix_='firebase:'}set(e,t){null==t?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),(0,h.stringify)(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return null==t?null:(0,h.jsonEval)(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}
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
   */class m{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){null==t?delete this.cache_[e]:this.cache_[e]=t}get(e){return(0,h.contains)(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}
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
   */const g=function(e){try{if('undefined'!=typeof window&&void 0!==window[e]){const t=window[e];return t.setItem('firebase:sentinel','cache'),t.removeItem('firebase:sentinel'),new f(t)}}catch(e){}return new m},y=g('localStorage'),v=g('sessionStorage'),C=new c.Logger('@firebase/database'),w=(function(){let e=1;return function(){return e++}})(),b=function(e){const t=(0,h.stringToByteArray)(e),n=new h.Sha1;n.update(t);const i=n.digest();return h.base64.encodeByteArray(i)},T=function(...e){let t='';for(let n=0;n<e.length;n++){const i=e[n];Array.isArray(i)||i&&'object'==typeof i&&'number'==typeof i.length?t+=T.apply(null,i):t+='object'==typeof i?(0,h.stringify)(i):i,t+=' '}return t};let I=null,k=!0;const P=function(e,t){(0,h.assert)(!t||!0===e||!1===e,"Can't turn on custom loggers persistently."),!0===e?(C.logLevel=c.LogLevel.VERBOSE,I=C.log.bind(C),t&&v.set('logging_enabled',!0)):'function'==typeof e?I=e:(I=null,v.remove('logging_enabled'))},E=function(...e){if(!0===k&&(k=!1,null===I&&!0===v.get('logging_enabled')&&P(!0)),I){const t=T.apply(null,e);I(t)}},S=function(e){return function(...t){E(e,...t)}},N=function(...e){const t='FIREBASE INTERNAL ERROR: '+T(...e);C.error(t)},x=function(...e){const t=`FIREBASE FATAL ERROR: ${T(...e)}`;throw C.error(t),new Error(t)},R=function(...e){const t='FIREBASE WARNING: '+T(...e);C.warn(t)},D=function(e){return'number'==typeof e&&(e!=e||e===Number.POSITIVE_INFINITY||e===Number.NEGATIVE_INFINITY)},O=function(e){if((0,h.isNodeSdk)()||'complete'===document.readyState)e();else{let t=!1;const n=function(){document.body?t||(t=!0,e()):setTimeout(n,Math.floor(10))};document.addEventListener?(document.addEventListener('DOMContentLoaded',n,!1),window.addEventListener('load',n,!1)):document.attachEvent&&(document.attachEvent('onreadystatechange',()=>{'complete'===document.readyState&&n()}),window.attachEvent('onload',n))}},A='[MIN_NAME]',M='[MAX_NAME]',q=function(e,t){if(e===t)return 0;if(e===A||t===M)return-1;if(t===A||e===M)return 1;{const n=z(e),i=z(t);return null!==n?null!==i?n-i===0?e.length-t.length:n-i:-1:null!==i?1:e<t?-1:1}},F=function(e,t){return e===t?0:e<t?-1:1},L=function(e,t){if(t&&e in t)return t[e];throw new Error('Missing required key ('+e+') in object: '+(0,h.stringify)(t))},j=function(e){if('object'!=typeof e||null===e)return(0,h.stringify)(e);const t=[];for(const n in e)t.push(n);t.sort();let n='{';for(let i=0;i<t.length;i++)0!==i&&(n+=','),n+=(0,h.stringify)(t[i]),n+=':',n+=j(e[t[i]]);return n+='}',n},W=function(e,t){const n=e.length;if(n<=t)return[e];const i=[];for(let r=0;r<n;r+=t)r+t>n?i.push(e.substring(r,n)):i.push(e.substring(r,r+t));return i};function U(e,t){for(const n in e)e.hasOwnProperty(n)&&t(n,e[n])}const B=function(e){(0,h.assert)(!D(e),'Invalid JSON number');let t,n,i,r,s;0===e?(n=0,i=0,t=1/e==-1/0?1:0):(t=e<0,(e=Math.abs(e))>=Math.pow(2,-1022)?(r=Math.min(Math.floor(Math.log(e)/Math.LN2),1023),n=r+1023,i=Math.round(e*Math.pow(2,52-r)-Math.pow(2,52))):(n=0,i=Math.round(e/Math.pow(2,-1074))));const o=[];for(s=52;s;s-=1)o.push(i%2?1:0),i=Math.floor(i/2);for(s=11;s;s-=1)o.push(n%2?1:0),n=Math.floor(n/2);o.push(t?1:0),o.reverse();const a=o.join('');let l='';for(s=0;s<64;s+=8){let e=parseInt(a.substr(s,8),2).toString(16);1===e.length&&(e='0'+e),l+=e}return l.toLowerCase()};function H(e,t){let n='Unknown Error';'too_big'===e?n="The data requested exceeds the maximum size that can be accessed with a single request.":'permission_denied'===e?n="Client doesn't have permission to access the desired data.":'unavailable'===e&&(n='The service is unavailable');const i=new Error(e+' at '+t._path.toString()+': '+n);return i.code=e.toUpperCase(),i}const V=new RegExp('^-?(0*)\\d{1,10}$'),z=function(e){if(V.test(e)){const t=Number(e);if(t>=-2147483648&&t<=2147483647)return t}return null},Y=function(e){try{e()}catch(e){setTimeout(()=>{const t=e.stack||'';throw R('Exception was thrown by user callback.',t),e},Math.floor(0))}},K=function(e,t){const n=setTimeout(e,t);return'number'==typeof n&&'undefined'!=typeof Deno&&Deno.unrefTimer?Deno.unrefTimer(n):'object'==typeof n&&n.unref&&n.unref(),n};
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
   */
class Q{constructor(e,t){this.appName_=e,this.appCheckProvider=t,this.appCheck=null==t?void 0:t.getImmediate({optional:!0}),this.appCheck||null==t||t.get().then(e=>this.appCheck=e)}getToken(e){return this.appCheck?this.appCheck.getToken(e):new Promise((t,n)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,n):t(null)},0)})}addTokenChangeListener(e){var t;null===(t=this.appCheckProvider)||void 0===t||t.get().then(t=>t.addTokenListener(e))}notifyForInvalidToken(){R(`Provided AppCheck credentials for the app named "${this.appName_}" are invalid. This usually indicates your app was not initialized correctly.`)}}
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
   */class G{constructor(e,t,n){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=n,this.auth_=null,this.auth_=n.getImmediate({optional:!0}),this.auth_||n.onInit(e=>this.auth_=e)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(e=>e&&'auth/token-not-initialized'===e.code?(E('Got auth/token-not-initialized error.  Treating as null token.'),null):Promise.reject(e)):new Promise((t,n)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,n):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+"\" are invalid. This usually indicates your app was not initialized correctly. ";'credential'in this.firebaseOptions_?e+="Make sure the \"credential\" property provided to initializeApp() is authorized to access the specified \"databaseURL\" and is from the correct project.":'serviceAccount'in this.firebaseOptions_?e+="Make sure the \"serviceAccount\" property provided to initializeApp() is authorized to access the specified \"databaseURL\" and is from the correct project.":e+="Make sure the \"apiKey\" and \"databaseURL\" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.",R(e)}}class ${constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}$.OWNER='owner';
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
const X='5',J=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,Z='ac',ee='websocket',te='long_polling';
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
class ne{constructor(e,t,n,i,r=!1,s="",o=!1,a=!1){this.secure=t,this.namespace=n,this.webSocketOnly=i,this.nodeAdmin=r,this.persistenceKey=s,this.includeNamespaceInQueryParams=o,this.isUsingEmulator=a,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf('.')+1),this.internalHost=y.get('host:'+e)||this._host}isCacheableHost(){return's-'===this.internalHost.substr(0,2)}isCustomHost(){return'firebaseio.com'!==this._domain&&'firebaseio-demo.com'!==this._domain}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&y.set('host:'+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+='<'+this.persistenceKey+'>'),e}toURLString(){const e=this.secure?'https://':'http://',t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:'';return`${e}${this.host}/${t}`}}function ie(e){return e.host!==e.internalHost||e.isCustomHost()||e.includeNamespaceInQueryParams}function re(e,t,n){let i;if((0,h.assert)('string'==typeof t,'typeof type must == string'),(0,h.assert)('object'==typeof n,'typeof params must == object'),t===ee)i=(e.secure?'wss://':'ws://')+e.internalHost+'/.ws?';else{if(t!==te)throw new Error('Unknown connection type: '+t);i=(e.secure?'https://':'http://')+e.internalHost+'/.lp?'}ie(e)&&(n.ns=e.namespace);const r=[];return U(n,(e,t)=>{r.push(e+'='+t)}),i+r.join('&')}
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
   */class se{constructor(){this.counters_={}}incrementCounter(e,t=1){(0,h.contains)(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return(0,h.deepCopy)(this.counters_)}}
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
   */const oe={},ae={};function le(e){const t=e.toString();return oe[t]||(oe[t]=new se),oe[t]}function he(e,t){const n=e.toString();return ae[n]||(ae[n]=t()),ae[n]}
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
   */class ce{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const e=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let t=0;t<e.length;++t)e[t]&&Y(()=>{this.onMessage_(e[t])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}
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
   */const ue='start';class de{constructor(e,t,n,i,r,s,o){this.connId=e,this.repoInfo=t,this.applicationId=n,this.appCheckToken=i,this.authToken=r,this.transportSessionId=s,this.lastSessionId=o,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=S(e),this.stats_=le(t),this.urlFn=e=>(this.appCheckToken&&(e[Z]=this.appCheckToken),re(t,te,e))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new ce(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_('Timed out trying to connect.'),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(3e4)),O(()=>{if(this.isClosed_)return;this.scriptTagHolder=new _e((...e)=>{const[t,n,i,r,s]=e;if(this.incrementIncomingBytes_(e),this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,t===ue)this.id=n,this.password=i;else{if("close"!==t)throw new Error('Unrecognized command received: '+t);n?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(n,()=>{this.onClosed_()})):this.onClosed_()}},(...e)=>{const[t,n]=e;this.incrementIncomingBytes_(e),this.myPacketOrderer.handleResponse(t,n)},()=>{this.onClosed_()},this.urlFn);const e={};e[ue]='t',e.ser=Math.floor(1e8*Math.random()),this.scriptTagHolder.uniqueCallbackIdentifier&&(e.cb=this.scriptTagHolder.uniqueCallbackIdentifier),e.v=X,this.transportSessionId&&(e.s=this.transportSessionId),this.lastSessionId&&(e.ls=this.lastSessionId),this.applicationId&&(e.p=this.applicationId),this.appCheckToken&&(e[Z]=this.appCheckToken),'undefined'!=typeof location&&location.hostname&&J.test(location.hostname)&&(e.r="f");const t=this.urlFn(e);this.log_('Connecting via long-poll to '+t),this.scriptTagHolder.addTag(t,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){de.forceAllow_=!0}static forceDisallow(){de.forceDisallow_=!0}static isAvailable(){return!(0,h.isNodeSdk)()&&(!!de.forceAllow_||!(de.forceDisallow_||'undefined'==typeof document||null==document.createElement||'object'==typeof window&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href)||'object'==typeof Windows&&'object'==typeof Windows.UI))}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_('Longpoll is closing itself'),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_('Longpoll is being closed.'),this.shutdown_())}send(e){const t=(0,h.stringify)(e);this.bytesSent+=t.length,this.stats_.incrementCounter('bytes_sent',t.length);const n=(0,h.base64Encode)(t),i=W(n,1840);for(let e=0;e<i.length;e++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,i.length,i[e]),this.curSegmentNum++}addDisconnectPingFrame(e,t){if((0,h.isNodeSdk)())return;this.myDisconnFrame=document.createElement('iframe');const n={dframe:'t'};n.id=e,n.pw=t,this.myDisconnFrame.src=this.urlFn(n),this.myDisconnFrame.style.display='none',document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=(0,h.stringify)(e).length;this.bytesReceived+=t,this.stats_.incrementCounter('bytes_received',t)}}class _e{constructor(e,t,n,i){if(this.onDisconnect=n,this.urlFn=i,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(1e8*Math.random()),this.sendNewPolls=!0,(0,h.isNodeSdk)())this.commandCB=e,this.onMessageCB=t;else{this.uniqueCallbackIdentifier=w(),window["pLPCommand"+this.uniqueCallbackIdentifier]=e,window["pRTLPCB"+this.uniqueCallbackIdentifier]=t,this.myIFrame=_e.createIFrame_();let n='';if(this.myIFrame.src&&'javascript:'===this.myIFrame.src.substr(0,11)){n='<script>document.domain="'+document.domain+'";<\/script>'}const i='<html><body>'+n+'</body></html>';try{this.myIFrame.doc.open(),this.myIFrame.doc.write(i),this.myIFrame.doc.close()}catch(e){E('frame writing exception'),e.stack&&E(e.stack),E(e)}}}static createIFrame_(){const e=document.createElement('iframe');if(e.style.display='none',!document.body)throw'Document body has not initialized. Wait to initialize Firebase until after the document is ready.';document.body.appendChild(e);try{e.contentWindow.document||E('No IE domain setting required')}catch(t){const n=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+n+"';document.close();})())"}return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent='',setTimeout(()=>{null!==this.myIFrame&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e.id=this.myID,e.pw=this.myPW,e.ser=this.currentSerial;let t=this.urlFn(e),n='',i=0;for(;this.pendingSegs.length>0;){if(!(this.pendingSegs[0].d.length+30+n.length<=1870))break;{const e=this.pendingSegs.shift();n=n+"&seg"+i+'='+e.seg+"&ts"+i+'='+e.ts+"&d"+i+'='+e.d,i++}}return t+=n,this.addLongPollTag_(t,this.currentSerial),!0}return!1}enqueueSegment(e,t,n){this.pendingSegs.push({seg:e,ts:t,d:n}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const n=()=>{this.outstandingRequests.delete(t),this.newRequest_()},i=setTimeout(n,Math.floor(25e3));this.addTag(e,()=>{clearTimeout(i),n()})}addTag(e,t){(0,h.isNodeSdk)()?this.doNodeLongPoll(e,t):setTimeout(()=>{try{if(!this.sendNewPolls)return;const n=this.myIFrame.doc.createElement('script');n.type='text/javascript',n.async=!0,n.src=e,n.onload=n.onreadystatechange=function(){const e=n.readyState;e&&'loaded'!==e&&'complete'!==e||(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),t())},n.onerror=()=>{E('Long-poll script failed to load: '+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(n)}catch(e){}},Math.floor(1))}}
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
   */let pe=null;'undefined'!=typeof MozWebSocket?pe=MozWebSocket:'undefined'!=typeof WebSocket&&(pe=WebSocket);class fe{constructor(e,t,n,i,r,s,o){this.connId=e,this.applicationId=n,this.appCheckToken=i,this.authToken=r,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=S(this.connId),this.stats_=le(t),this.connURL=fe.connectionURL_(t,s,o,i,n),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,n,i,r){const s={};return s.v=X,!(0,h.isNodeSdk)()&&'undefined'!=typeof location&&location.hostname&&J.test(location.hostname)&&(s.r="f"),t&&(s.s=t),n&&(s.ls=n),i&&(s[Z]=i),r&&(s.p=r),re(e,ee,s)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_('Websocket connecting to '+this.connURL),this.everConnected_=!1,y.set('previous_websocket_failure',!0);try{let e;if((0,h.isNodeSdk)()){const t=this.nodeAdmin?'AdminNode':'Node';e={headers:{'User-Agent':`Firebase/${X}/${_}/${process.platform}/${t}`,'X-Firebase-GMPID':this.applicationId||''}},this.authToken&&(e.headers.Authorization=`Bearer ${this.authToken}`),this.appCheckToken&&(e.headers['X-Firebase-AppCheck']=this.appCheckToken);const n=process.env,i=0===this.connURL.indexOf('wss://')?n.HTTPS_PROXY||n.https_proxy:n.HTTP_PROXY||n.http_proxy;i&&(e.proxy={origin:i})}this.mySock=new pe(this.connURL,[],e)}catch(e){this.log_('Error instantiating WebSocket.');const t=e.message||e.data;return t&&this.log_(t),void this.onClosed_()}this.mySock.onopen=()=>{this.log_('Websocket connected.'),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_('Websocket connection was disconnected.'),this.mySock=null,this.onClosed_()},this.mySock.onmessage=e=>{this.handleIncomingFrame(e)},this.mySock.onerror=e=>{this.log_('WebSocket error.  Closing connection.');const t=e.message||e.data;t&&this.log_(t),this.onClosed_()}}start(){}static forceDisallow(){fe.forceDisallow_=!0}static isAvailable(){let e=!1;if('undefined'!=typeof navigator&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,n=navigator.userAgent.match(t);n&&n.length>1&&parseFloat(n[1])<4.4&&(e=!0)}return!e&&null!==pe&&!fe.forceDisallow_}static previouslyFailed(){return y.isInMemoryStorage||!0===y.get('previous_websocket_failure')}markConnectionHealthy(){y.remove('previous_websocket_failure')}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const e=this.frames.join('');this.frames=null;const t=(0,h.jsonEval)(e);this.onMessage(t)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if((0,h.assert)(null===this.frames,'We already have a frame buffer'),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(null===this.mySock)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter('bytes_received',t.length),this.resetKeepAlive(),null!==this.frames)this.appendFrame_(t);else{const e=this.extractFrameCount_(t);null!==e&&this.appendFrame_(e)}}send(e){this.resetKeepAlive();const t=(0,h.stringify)(e);this.bytesSent+=t.length,this.stats_.incrementCounter('bytes_sent',t.length);const n=W(t,16384);n.length>1&&this.sendString_(String(n.length));for(let e=0;e<n.length;e++)this.sendString_(n[e])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_('WebSocket is closing itself'),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_('WebSocket is being closed'),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_('0'),this.resetKeepAlive()},Math.floor(45e3))}sendString_(e){try{this.mySock.send(e)}catch(e){this.log_('Exception thrown from WebSocket.send():',e.message||e.data,'Closing connection.'),setTimeout(this.onClosed_.bind(this),0)}}}fe.responsesRequiredToBeHealthy=2,fe.healthyTimeout=3e4;
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
class me{constructor(e){this.initTransports_(e)}static get ALL_TRANSPORTS(){return[de,fe]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}initTransports_(e){const t=fe&&fe.isAvailable();let n=t&&!fe.previouslyFailed();if(e.webSocketOnly&&(t||R("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),n=!0),n)this.transports_=[fe];else{const e=this.transports_=[];for(const t of me.ALL_TRANSPORTS)t&&t.isAvailable()&&e.push(t);me.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error('No transports available')}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}me.globalTransportInitialized_=!1;class ge{constructor(e,t,n,i,r,s,o,a,l,h){this.id=e,this.repoInfo_=t,this.applicationId_=n,this.appCheckToken_=i,this.authToken_=r,this.onMessage_=s,this.onReady_=o,this.onDisconnect_=a,this.onKill_=l,this.lastSessionId=h,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=S('c:'+this.id+':'),this.transportManager_=new me(t),this.log_('Connection created'),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),n=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,n)},Math.floor(0));const i=e.healthyTimeout||0;i>0&&(this.healthyTimeout_=K(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>102400?(this.log_('Connection exceeded healthy timeout but has received '+this.conn_.bytesReceived+' bytes.  Marking connection healthy.'),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>10240?this.log_('Connection exceeded healthy timeout but has sent '+this.conn_.bytesSent+' bytes.  Leaving connection alive.'):(this.log_('Closing unhealthy connection after timeout.'),this.close()))},Math.floor(i)))}nextTransportId_(){return'c:'+this.id+':'+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_('Secondary connection lost.'),this.onSecondaryConnectionLost_()):this.log_('closing an old connection')}}connReceiver_(e){return t=>{2!==this.state_&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_('message on old connection'))}}sendRequest(e){const t={t:'d',d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_('cleaning up and promoting a connection: '+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if("t"in e){const t=e.t;"a"===t?this.upgradeIfSecondaryHealthy_():"r"===t?(this.log_('Got a reset on secondary, closing it'),this.secondaryConn_.close(),this.tx_!==this.secondaryConn_&&this.rx_!==this.secondaryConn_||this.close()):"o"===t&&(this.log_('got pong on secondary.'),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=L('t',e),n=L('d',e);if('c'===t)this.onSecondaryControl_(n);else{if('d'!==t)throw new Error('Unknown protocol layer: '+t);this.pendingDataMessages.push(n)}}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_('Secondary connection is healthy.'),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_('sending ping on secondary.'),this.secondaryConn_.send({t:'c',d:{t:"p",d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_('sending client ack on secondary'),this.secondaryConn_.send({t:'c',d:{t:"a",d:{}}}),this.log_('Ending transmission on primary'),this.conn_.send({t:'c',d:{t:"n",d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=L('t',e),n=L('d',e);'c'===t?this.onControl_(n):'d'===t&&this.onDataMessage_(n)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_('Primary connection is healthy.'),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=L("t",e);if("d"in e){const n=e.d;if("h"===t){const e=Object.assign({},n);this.repoInfo_.isUsingEmulator&&(e.h=this.repoInfo_.host),this.onHandshake_(e)}else if("n"===t){this.log_('recvd end transmission on primary'),this.rx_=this.secondaryConn_;for(let e=0;e<this.pendingDataMessages.length;++e)this.onDataMessage_(this.pendingDataMessages[e]);this.pendingDataMessages=[],this.tryCleanupConnection()}else"s"===t?this.onConnectionShutdown_(n):"r"===t?this.onReset_(n):"e"===t?N('Server Error: '+n):"o"===t?(this.log_('got pong on primary.'),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):N('Unknown control packet command: '+t)}}onHandshake_(e){const t=e.ts,n=e.v,i=e.h;this.sessionId=e.s,this.repoInfo_.host=i,0===this.state_&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),X!==n&&R('Protocol version mismatch detected'),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),n=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,n),K(()=>{this.secondaryConn_&&(this.log_('Timed out trying to upgrade.'),this.secondaryConn_.close())},Math.floor(6e4))}onReset_(e){this.log_('Reset packet received.  New host: '+e),this.repoInfo_.host=e,1===this.state_?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_('Realtime connection established.'),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),0===this.primaryResponsesRequired_?(this.log_('Primary connection is healthy.'),this.isHealthy_=!0):K(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(5e3))}sendPingOnPrimaryIfNecessary_(){this.isHealthy_||1!==this.state_||(this.log_('sending ping on primary.'),this.sendData_({t:'c',d:{t:"p",d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,this.tx_!==e&&this.rx_!==e||this.close()}onConnectionLost_(e){this.conn_=null,e||0!==this.state_?1===this.state_&&this.log_('Realtime connection lost.'):(this.log_('Realtime connection failed.'),this.repoInfo_.isCacheableHost()&&(y.remove('host:'+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)),this.close()}onConnectionShutdown_(e){this.log_('Connection shutdown command received. Shutting down...'),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(1!==this.state_)throw'Connection is not connected';this.tx_.send(e)}close(){2!==this.state_&&(this.log_('Closing realtime connection.'),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_('Shutting down all connections'),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}
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
   */class ye{put(e,t,n,i){}merge(e,t,n,i){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,n){}onDisconnectMerge(e,t,n){}onDisconnectCancel(e,t){}reportStats(e){}}
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
   */class ve{constructor(e){this.allowedEvents_=e,this.listeners_={},(0,h.assert)(Array.isArray(e)&&e.length>0,'Requires a non-empty array')}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const n=[...this.listeners_[e]];for(let e=0;e<n.length;e++)n[e].callback.apply(n[e].context,t)}}on(e,t,n){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:n});const i=this.getInitialEvent(e);i&&t.apply(n,i)}off(e,t,n){this.validateEventType_(e);const i=this.listeners_[e]||[];for(let e=0;e<i.length;e++)if(i[e].callback===t&&(!n||n===i[e].context))return void i.splice(e,1)}validateEventType_(e){(0,h.assert)(this.allowedEvents_.find(t=>t===e),'Unknown event: '+e)}}
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
   */class Ce extends ve{constructor(){super(['online']),this.online_=!0,'undefined'==typeof window||void 0===window.addEventListener||(0,h.isMobileCordova)()||(window.addEventListener('online',()=>{this.online_||(this.online_=!0,this.trigger('online',!0))},!1),window.addEventListener('offline',()=>{this.online_&&(this.online_=!1,this.trigger('online',!1))},!1))}static getInstance(){return new Ce}getInitialEvent(e){return(0,h.assert)('online'===e,'Unknown event type: '+e),[this.online_]}currentlyOnline(){return this.online_}}
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
   */class we{constructor(e,t){if(void 0===t){this.pieces_=e.split('/');let t=0;for(let e=0;e<this.pieces_.length;e++)this.pieces_[e].length>0&&(this.pieces_[t]=this.pieces_[e],t++);this.pieces_.length=t,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e='';for(let t=this.pieceNum_;t<this.pieces_.length;t++)''!==this.pieces_[t]&&(e+='/'+this.pieces_[t]);return e||'/'}}function be(){return new we('')}function Te(e){return e.pieceNum_>=e.pieces_.length?null:e.pieces_[e.pieceNum_]}function Ie(e){return e.pieces_.length-e.pieceNum_}function ke(e){let t=e.pieceNum_;return t<e.pieces_.length&&t++,new we(e.pieces_,t)}function Pe(e){return e.pieceNum_<e.pieces_.length?e.pieces_[e.pieces_.length-1]:null}function Ee(e){let t='';for(let n=e.pieceNum_;n<e.pieces_.length;n++)''!==e.pieces_[n]&&(t+='/'+encodeURIComponent(String(e.pieces_[n])));return t||'/'}function Se(e,t=0){return e.pieces_.slice(e.pieceNum_+t)}function Ne(e){if(e.pieceNum_>=e.pieces_.length)return null;const t=[];for(let n=e.pieceNum_;n<e.pieces_.length-1;n++)t.push(e.pieces_[n]);return new we(t,0)}function xe(e,t){const n=[];for(let t=e.pieceNum_;t<e.pieces_.length;t++)n.push(e.pieces_[t]);if(t instanceof we)for(let e=t.pieceNum_;e<t.pieces_.length;e++)n.push(t.pieces_[e]);else{const e=t.split('/');for(let t=0;t<e.length;t++)e[t].length>0&&n.push(e[t])}return new we(n,0)}function Re(e){return e.pieceNum_>=e.pieces_.length}function De(e,t){const n=Te(e),i=Te(t);if(null===n)return t;if(n===i)return De(ke(e),ke(t));throw new Error('INTERNAL ERROR: innerPath ('+t+") is not within outerPath ("+e+')')}function Oe(e,t){const n=Se(e,0),i=Se(t,0);for(let e=0;e<n.length&&e<i.length;e++){const t=q(n[e],i[e]);if(0!==t)return t}return n.length===i.length?0:n.length<i.length?-1:1}function Ae(e,t){if(Ie(e)!==Ie(t))return!1;for(let n=e.pieceNum_,i=t.pieceNum_;n<=e.pieces_.length;n++,i++)if(e.pieces_[n]!==t.pieces_[i])return!1;return!0}function Me(e,t){let n=e.pieceNum_,i=t.pieceNum_;if(Ie(e)>Ie(t))return!1;for(;n<e.pieces_.length;){if(e.pieces_[n]!==t.pieces_[i])return!1;++n,++i}return!0}class qe{constructor(e,t){this.errorPrefix_=t,this.parts_=Se(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let e=0;e<this.parts_.length;e++)this.byteLength_+=(0,h.stringLength)(this.parts_[e]);je(this)}}function Fe(e,t){e.parts_.length>0&&(e.byteLength_+=1),e.parts_.push(t),e.byteLength_+=(0,h.stringLength)(t),je(e)}function Le(e){const t=e.parts_.pop();e.byteLength_-=(0,h.stringLength)(t),e.parts_.length>0&&(e.byteLength_-=1)}function je(e){if(e.byteLength_>768)throw new Error(e.errorPrefix_+"has a key path longer than 768 bytes ("+e.byteLength_+').');if(e.parts_.length>32)throw new Error(e.errorPrefix_+"path specified exceeds the maximum depth that can be written (32) or object contains a cycle "+We(e))}function We(e){return 0===e.parts_.length?'':"in property '"+e.parts_.join('.')+"'"}
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
   */class Ue extends ve{constructor(){let e,t;super(['visible']),'undefined'!=typeof document&&void 0!==document.addEventListener&&(void 0!==document.hidden?(t='visibilitychange',e='hidden'):void 0!==document.mozHidden?(t='mozvisibilitychange',e='mozHidden'):void 0!==document.msHidden?(t='msvisibilitychange',e='msHidden'):void 0!==document.webkitHidden&&(t='webkitvisibilitychange',e='webkitHidden')),this.visible_=!0,t&&document.addEventListener(t,()=>{const t=!document[e];t!==this.visible_&&(this.visible_=t,this.trigger('visible',t))},!1)}static getInstance(){return new Ue}getInitialEvent(e){return(0,h.assert)('visible'===e,'Unknown event type: '+e),[this.visible_]}}
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
   */const Be=1e3;class He extends ye{constructor(e,t,n,i,r,s,o,a){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=n,this.onConnectStatus_=i,this.onServerInfoUpdate_=r,this.authTokenProvider_=s,this.appCheckTokenProvider_=o,this.authOverride_=a,this.id=He.nextPersistentConnectionId_++,this.log_=S('p:'+this.id+':'),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Be,this.maxReconnectDelay_=3e5,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,a&&!(0,h.isNodeSdk)())throw new Error('Auth override specified in options, but not supported on non Node.js platforms');Ue.getInstance().on('visible',this.onVisible_,this),-1===e.host.indexOf('fblocal')&&Ce.getInstance().on('online',this.onOnline_,this)}sendRequest(e,t,n){const i=++this.requestNumber_,r={r:i,a:e,b:t};this.log_((0,h.stringify)(r)),(0,h.assert)(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(r),n&&(this.requestCBHash_[i]=n)}get(e){this.initConnection_();const t=new h.Deferred,n={action:'g',request:{p:e._path.toString(),q:e._queryObject},onComplete:e=>{const n=e.d;'ok'===e.s?t.resolve(n):t.reject(n)}};this.outstandingGets_.push(n),this.outstandingGetCount_++;const i=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(i),t.promise}listen(e,t,n,i){this.initConnection_();const r=e._queryIdentifier,s=e._path.toString();this.log_('Listen called for '+s+' '+r),this.listens.has(s)||this.listens.set(s,new Map),(0,h.assert)(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),'listen() called for non-default but complete query'),(0,h.assert)(!this.listens.get(s).has(r),"listen() called twice for same path/queryId.");const o={onComplete:i,hashFn:t,query:e,tag:n};this.listens.get(s).set(r,o),this.connected_&&this.sendListen_(o)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest('g',t.request,n=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,0===this.outstandingGetCount_&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(n)})}sendListen_(e){const t=e.query,n=t._path.toString(),i=t._queryIdentifier;this.log_('Listen on '+n+' for '+i);const r={p:n};e.tag&&(r.q=t._queryObject,r.t=e.tag),r.h=e.hashFn(),this.sendRequest('q',r,r=>{const s=r.d,o=r.s;He.warnOnListenWarnings_(s,t);(this.listens.get(n)&&this.listens.get(n).get(i))===e&&(this.log_('listen response',r),'ok'!==o&&this.removeListen_(n,i),e.onComplete&&e.onComplete(o,s))})}static warnOnListenWarnings_(e,t){if(e&&'object'==typeof e&&(0,h.contains)(e,'w')){const n=(0,h.safeGet)(e,'w');if(Array.isArray(n)&&~n.indexOf('no_index')){const e='".indexOn": "'+t._queryParams.getIndex().toString()+'"',n=t._path.toString();R(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${e} at ${n} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_('Auth token refreshed'),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest('unauth',{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&40===e.length||(0,h.isAdmin)(e))&&(this.log_('Admin auth credential detected.  Reducing max reconnect time.'),this.maxReconnectDelay_=3e4)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_('App check token refreshed'),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest('unappeck',{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=(0,h.isValidFormat)(e)?'auth':'gauth',n={cred:e};null===this.authOverride_?n.noauth=!0:'object'==typeof this.authOverride_&&(n.authvar=this.authOverride_),this.sendRequest(t,n,t=>{const n=t.s,i=t.d||'error';this.authToken_===e&&('ok'===n?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(n,i))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest('appcheck',{token:this.appCheckToken_},e=>{const t=e.s,n=e.d||'error';'ok'===t?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,n)})}unlisten(e,t){const n=e._path.toString(),i=e._queryIdentifier;this.log_('Unlisten called for '+n+' '+i),(0,h.assert)(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),'unlisten() called for non-default but complete query');this.removeListen_(n,i)&&this.connected_&&this.sendUnlisten_(n,i,e._queryObject,t)}sendUnlisten_(e,t,n,i){this.log_('Unlisten on '+e+' for '+t);const r={p:e};i&&(r.q=n,r.t=i),this.sendRequest('n',r)}onDisconnectPut(e,t,n){this.initConnection_(),this.connected_?this.sendOnDisconnect_('o',e,t,n):this.onDisconnectRequestQueue_.push({pathString:e,action:'o',data:t,onComplete:n})}onDisconnectMerge(e,t,n){this.initConnection_(),this.connected_?this.sendOnDisconnect_('om',e,t,n):this.onDisconnectRequestQueue_.push({pathString:e,action:'om',data:t,onComplete:n})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_('oc',e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:'oc',data:null,onComplete:t})}sendOnDisconnect_(e,t,n,i){const r={p:t,d:n};this.log_('onDisconnect '+e,r),this.sendRequest(e,r,e=>{i&&setTimeout(()=>{i(e.s,e.d)},Math.floor(0))})}put(e,t,n,i){this.putInternal('p',e,t,n,i)}merge(e,t,n,i){this.putInternal('m',e,t,n,i)}putInternal(e,t,n,i,r){this.initConnection_();const s={p:t,d:n};void 0!==r&&(s.h=r),this.outstandingPuts_.push({action:e,request:s,onComplete:i}),this.outstandingPutCount_++;const o=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(o):this.log_('Buffering put: '+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,n=this.outstandingPuts_[e].request,i=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,n,n=>{this.log_(t+' response',n),delete this.outstandingPuts_[e],this.outstandingPutCount_--,0===this.outstandingPutCount_&&(this.outstandingPuts_=[]),i&&i(n.s,n.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_('reportStats',t),this.sendRequest('s',t,e=>{if('ok'!==e.s){const t=e.d;this.log_('reportStats','Error sending stats: '+t)}})}}onDataMessage_(e){if('r'in e){this.log_('from server: '+(0,h.stringify)(e));const t=e.r,n=this.requestCBHash_[t];n&&(delete this.requestCBHash_[t],n(e.b))}else{if('error'in e)throw'A server-side error has occurred: '+e.error;'a'in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_('handleServerMessage',e,t),'d'===e?this.onDataUpdate_(t.p,t.d,!1,t.t):'m'===e?this.onDataUpdate_(t.p,t.d,!0,t.t):'c'===e?this.onListenRevoked_(t.p,t.q):'ac'===e?this.onAuthRevoked_(t.s,t.d):'apc'===e?this.onAppCheckRevoked_(t.s,t.d):'sd'===e?this.onSecurityDebugPacket_(t):N('Unrecognized action received from server: '+(0,h.stringify)(e)+'\nAre you using the latest client?')}onReady_(e,t){this.log_('connection ready'),this.connected_=!0,this.lastConnectionEstablishedTime_=(new Date).getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){(0,h.assert)(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_('Window became visible.  Reducing delay.'),this.reconnectDelay_=Be,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_('Browser went online.'),this.reconnectDelay_=Be,this.realtime_||this.scheduleConnect_(0)):(this.log_('Browser went offline.  Killing connection.'),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_('data client disconnected'),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){if(this.visible_){if(this.lastConnectionEstablishedTime_){(new Date).getTime()-this.lastConnectionEstablishedTime_>3e4&&(this.reconnectDelay_=Be),this.lastConnectionEstablishedTime_=null}}else this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=(new Date).getTime();const e=(new Date).getTime()-this.lastConnectionAttemptTime_;let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_('Trying to reconnect in '+t+'ms'),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,1.3*this.reconnectDelay_)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_('Making a connection attempt'),this.lastConnectionAttemptTime_=(new Date).getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),n=this.onRealtimeDisconnect_.bind(this),i=this.id+':'+He.nextConnectionId_++,r=this.lastSessionId;let s=!1,o=null;const a=function(){o?o.close():(s=!0,n())},l=function(e){(0,h.assert)(o,"sendRequest call when we're not connected not allowed."),o.sendRequest(e)};this.realtime_={close:a,sendRequest:l};const c=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[a,l]=await Promise.all([this.authTokenProvider_.getToken(c),this.appCheckTokenProvider_.getToken(c)]);s?E('getToken() completed but was canceled'):(E('getToken() completed. Creating connection.'),this.authToken_=a&&a.accessToken,this.appCheckToken_=l&&l.token,o=new ge(i,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,n,e=>{R(e+' ('+this.repoInfo_.toString()+')'),this.interrupt("server_kill")},r))}catch(e){this.log_('Failed to get token: '+e),s||(this.repoInfo_.nodeAdmin&&R(e),a())}}}interrupt(e){E('Interrupting connection for reason: '+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){E('Resuming connection for reason: '+e),delete this.interruptReasons_[e],(0,h.isEmpty)(this.interruptReasons_)&&(this.reconnectDelay_=Be,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-(new Date).getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&'h'in t.request&&t.queued&&(t.onComplete&&t.onComplete('disconnect'),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}0===this.outstandingPutCount_&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let n;n=t?t.map(e=>j(e)).join('$'):'default';const i=this.removeListen_(e,n);i&&i.onComplete&&i.onComplete('permission_denied')}removeListen_(e,t){const n=new we(e).toString();let i;if(this.listens.has(n)){const e=this.listens.get(n);i=e.get(t),e.delete(t),0===e.size&&this.listens.delete(n)}else i=void 0;return i}onAuthRevoked_(e,t){E('Auth token revoked: '+e+'/'+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),'invalid_token'!==e&&'permission_denied'!==e||(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=3&&(this.reconnectDelay_=3e4,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){E('App check token revoked: '+e+'/'+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,'invalid_token'!==e&&'permission_denied'!==e||(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=3&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):'msg'in e&&console.log('FIREBASE: '+e.msg.replace('\n','\nFIREBASE: '))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t='js';(0,h.isNodeSdk)()&&(t=this.repoInfo_.nodeAdmin?'admin_node':'node'),e['sdk.'+t+'.'+_.replace(/\./g,'-')]=1,(0,h.isMobileCordova)()?e['framework.cordova']=1:(0,h.isReactNative)()&&(e['framework.reactnative']=1),this.reportStats(e)}shouldReconnect_(){const e=Ce.getInstance().currentlyOnline();return(0,h.isEmpty)(this.interruptReasons_)&&e}}He.nextPersistentConnectionId_=0,He.nextConnectionId_=0;
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
class Ve{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new Ve(e,t)}}
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
   */class ze{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const n=new Ve(A,e),i=new Ve(A,t);return 0!==this.compare(n,i)}minPost(){return Ve.MIN}}
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
   */let Ye;class Ke extends ze{static get __EMPTY_NODE(){return Ye}static set __EMPTY_NODE(e){Ye=e}compare(e,t){return q(e.name,t.name)}isDefinedOn(e){throw(0,h.assertionError)('KeyIndex.isDefinedOn not expected to be called.')}indexedValueChanged(e,t){return!1}minPost(){return Ve.MIN}maxPost(){return new Ve(M,Ye)}makePost(e,t){return(0,h.assert)('string'==typeof e,'KeyIndex indexValue must always be a string.'),new Ve(e,Ye)}toString(){return'.key'}}const Qe=new Ke;
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
   */class Ge{constructor(e,t,n,i,r=null){this.isReverse_=i,this.resultGenerator_=r,this.nodeStack_=[];let s=1;for(;!e.isEmpty();)if(s=t?n(e.key,t):1,i&&(s*=-1),s<0)e=this.isReverse_?e.left:e.right;else{if(0===s){this.nodeStack_.push(e);break}this.nodeStack_.push(e),e=this.isReverse_?e.right:e.left}}getNext(){if(0===this.nodeStack_.length)return null;let e,t=this.nodeStack_.pop();if(e=this.resultGenerator_?this.resultGenerator_(t.key,t.value):{key:t.key,value:t.value},this.isReverse_)for(t=t.left;!t.isEmpty();)this.nodeStack_.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack_.push(t),t=t.left;return e}hasNext(){return this.nodeStack_.length>0}peek(){if(0===this.nodeStack_.length)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class $e{constructor(e,t,n,i,r){this.key=e,this.value=t,this.color=null!=n?n:$e.RED,this.left=null!=i?i:Xe.EMPTY_NODE,this.right=null!=r?r:Xe.EMPTY_NODE}copy(e,t,n,i,r){return new $e(null!=e?e:this.key,null!=t?t:this.value,null!=n?n:this.color,null!=i?i:this.left,null!=r?r:this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let i=this;const r=n(e,i.key);return i=r<0?i.copy(null,null,null,i.left.insert(e,t,n),null):0===r?i.copy(null,t,null,null,null):i.copy(null,null,null,null,i.right.insert(e,t,n)),i.fixUp_()}removeMin_(){if(this.left.isEmpty())return Xe.EMPTY_NODE;let e=this;return e.left.isRed_()||e.left.left.isRed_()||(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let n,i;if(n=this,t(e,n.key)<0)n.left.isEmpty()||n.left.isRed_()||n.left.left.isRed_()||(n=n.moveRedLeft_()),n=n.copy(null,null,null,n.left.remove(e,t),null);else{if(n.left.isRed_()&&(n=n.rotateRight_()),n.right.isEmpty()||n.right.isRed_()||n.right.left.isRed_()||(n=n.moveRedRight_()),0===t(e,n.key)){if(n.right.isEmpty())return Xe.EMPTY_NODE;i=n.right.min_(),n=n.copy(i.key,i.value,null,null,n.right.removeMin_())}n=n.copy(null,null,null,null,n.right.remove(e,t))}return n.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,$e.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,$e.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error('Red node has red child('+this.key+','+this.value+')');if(this.right.isRed_())throw new Error('Right child of ('+this.key+','+this.value+') is red');const e=this.left.check_();if(e!==this.right.check_())throw new Error('Black depths differ');return e+(this.isRed_()?0:1)}}$e.RED=!0,$e.BLACK=!1;class Xe{constructor(e,t=Xe.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new Xe(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,$e.BLACK,null,null))}remove(e){return new Xe(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,$e.BLACK,null,null))}get(e){let t,n=this.root_;for(;!n.isEmpty();){if(t=this.comparator_(e,n.key),0===t)return n.value;t<0?n=n.left:t>0&&(n=n.right)}return null}getPredecessorKey(e){let t,n=this.root_,i=null;for(;!n.isEmpty();){if(t=this.comparator_(e,n.key),0===t){if(n.left.isEmpty())return i?i.key:null;for(n=n.left;!n.right.isEmpty();)n=n.right;return n.key}t<0?n=n.left:t>0&&(i=n,n=n.right)}throw new Error('Attempted to find predecessor key for a nonexistent key.  What gives?')}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new Ge(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new Ge(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new Ge(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new Ge(this.root_,null,this.comparator_,!0,e)}}
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
function Je(e,t){return q(e.name,t.name)}function Ze(e,t){return q(e,t)}
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
   */let et;Xe.EMPTY_NODE=new class{copy(e,t,n,i,r){return this}insert(e,t,n){return new $e(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}};const tt=function(e){return'number'==typeof e?'number:'+B(e):'string:'+e},nt=function(e){if(e.isLeafNode()){const t=e.val();(0,h.assert)('string'==typeof t||'number'==typeof t||'object'==typeof t&&(0,h.contains)(t,'.sv'),'Priority must be a string or number.')}else(0,h.assert)(e===et||e.isEmpty(),'priority of unexpected type.');(0,h.assert)(e===et||e.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};
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
let it,rt,st;class ot{constructor(e,t=ot.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,(0,h.assert)(void 0!==this.value_&&null!==this.value_,"LeafNode shouldn't be created with null/undefined value."),nt(this.priorityNode_)}static set __childrenNodeConstructor(e){it=e}static get __childrenNodeConstructor(){return it}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new ot(this.value_,e)}getImmediateChild(e){return'.priority'===e?this.priorityNode_:ot.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return Re(e)?this:'.priority'===Te(e)?this.priorityNode_:ot.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return'.priority'===e?this.updatePriority(t):t.isEmpty()&&'.priority'!==e?this:ot.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const n=Te(e);return null===n?t:t.isEmpty()&&'.priority'!==n?this:((0,h.assert)('.priority'!==n||1===Ie(e),'.priority must be the last token in a path'),this.updateImmediateChild(n,ot.__childrenNodeConstructor.EMPTY_NODE.updateChild(ke(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{'.value':this.getValue(),'.priority':this.getPriority().val()}:this.getValue()}hash(){if(null===this.lazyHash_){let e='';this.priorityNode_.isEmpty()||(e+='priority:'+tt(this.priorityNode_.val())+':');const t=typeof this.value_;e+=t+':',e+='number'===t?B(this.value_):this.value_,this.lazyHash_=b(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===ot.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof ot.__childrenNodeConstructor?-1:((0,h.assert)(e.isLeafNode(),'Unknown node type'),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,n=typeof this.value_,i=ot.VALUE_TYPE_ORDER.indexOf(t),r=ot.VALUE_TYPE_ORDER.indexOf(n);return(0,h.assert)(i>=0,'Unknown leaf type: '+t),(0,h.assert)(r>=0,'Unknown leaf type: '+n),i===r?'object'===n?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:r-i}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}return!1}}ot.VALUE_TYPE_ORDER=['object','boolean','number','string'];const at=new class extends ze{compare(e,t){const n=e.node.getPriority(),i=t.node.getPriority(),r=n.compareTo(i);return 0===r?q(e.name,t.name):r}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return Ve.MIN}maxPost(){return new Ve(M,new ot('[PRIORITY-POST]',st))}makePost(e,t){const n=rt(e);return new Ve(t,new ot('[PRIORITY-POST]',n))}toString(){return'.priority'}},lt=Math.log(2);
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
   */class ht{constructor(e){var t;this.count=(t=e+1,parseInt(Math.log(t)/lt,10)),this.current_=this.count-1;const n=(i=this.count,parseInt(Array(i+1).join('1'),2));var i;this.bits_=e+1&n}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const ct=function(e,t,n,i){e.sort(t);const r=function(t,i){const s=i-t;let o,a;if(0===s)return null;if(1===s)return o=e[t],a=n?n(o):o,new $e(a,o.node,$e.BLACK,null,null);{const l=parseInt(s/2,10)+t,h=r(t,l),c=r(l+1,i);return o=e[l],a=n?n(o):o,new $e(a,o.node,$e.BLACK,h,c)}},s=(function(t){let i=null,s=null,o=e.length;const a=function(t,i){const s=o-t,a=o;o-=t;const h=r(s+1,a),c=e[s],u=n?n(c):c;l(new $e(u,c.node,i,null,h))},l=function(e){i?(i.left=e,i=e):(s=e,i=e)};for(let e=0;e<t.count;++e){const n=t.nextBitIsOne(),i=Math.pow(2,t.count-(e+1));n?a(i,$e.BLACK):(a(i,$e.BLACK),a(i,$e.RED))}return s})(new ht(e.length));return new Xe(i||t,s)};
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
   */let ut;const dt={};class _t{constructor(e,t){this.indexes_=e,this.indexSet_=t}static get Default(){return(0,h.assert)(dt&&at,'ChildrenNode.ts has not been loaded'),ut=ut||new _t({'.priority':dt},{'.priority':at}),ut}get(e){const t=(0,h.safeGet)(this.indexes_,e);if(!t)throw new Error('No index defined for '+e);return t instanceof Xe?t:null}hasIndex(e){return(0,h.contains)(this.indexSet_,e.toString())}addIndex(e,t){(0,h.assert)(e!==Qe,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const n=[];let i=!1;const r=t.getIterator(Ve.Wrap);let s,o=r.getNext();for(;o;)i=i||e.isDefinedOn(o.node),n.push(o),o=r.getNext();s=i?ct(n,e.getCompare()):dt;const a=e.toString(),l=Object.assign({},this.indexSet_);l[a]=e;const c=Object.assign({},this.indexes_);return c[a]=s,new _t(c,l)}addToIndexes(e,t){const n=(0,h.map)(this.indexes_,(n,i)=>{const r=(0,h.safeGet)(this.indexSet_,i);if((0,h.assert)(r,'Missing index implementation for '+i),n===dt){if(r.isDefinedOn(e.node)){const n=[],i=t.getIterator(Ve.Wrap);let s=i.getNext();for(;s;)s.name!==e.name&&n.push(s),s=i.getNext();return n.push(e),ct(n,r.getCompare())}return dt}{const i=t.get(e.name);let r=n;return i&&(r=r.remove(new Ve(e.name,i))),r.insert(e,e.node)}});return new _t(n,this.indexSet_)}removeFromIndexes(e,t){const n=(0,h.map)(this.indexes_,n=>{if(n===dt)return n;{const i=t.get(e.name);return i?n.remove(new Ve(e.name,i)):n}});return new _t(n,this.indexSet_)}}
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
   */let pt;class ft{constructor(e,t,n){this.children_=e,this.priorityNode_=t,this.indexMap_=n,this.lazyHash_=null,this.priorityNode_&&nt(this.priorityNode_),this.children_.isEmpty()&&(0,h.assert)(!this.priorityNode_||this.priorityNode_.isEmpty(),'An empty node cannot have a priority')}static get EMPTY_NODE(){return pt||(pt=new ft(new Xe(Ze),null,_t.Default))}isLeafNode(){return!1}getPriority(){return this.priorityNode_||pt}updatePriority(e){return this.children_.isEmpty()?this:new ft(this.children_,e,this.indexMap_)}getImmediateChild(e){if('.priority'===e)return this.getPriority();{const t=this.children_.get(e);return null===t?pt:t}}getChild(e){const t=Te(e);return null===t?this:this.getImmediateChild(t).getChild(ke(e))}hasChild(e){return null!==this.children_.get(e)}updateImmediateChild(e,t){if((0,h.assert)(t,'We should always be passing snapshot nodes'),'.priority'===e)return this.updatePriority(t);{const n=new Ve(e,t);let i,r;t.isEmpty()?(i=this.children_.remove(e),r=this.indexMap_.removeFromIndexes(n,this.children_)):(i=this.children_.insert(e,t),r=this.indexMap_.addToIndexes(n,this.children_));const s=i.isEmpty()?pt:this.priorityNode_;return new ft(i,s,r)}}updateChild(e,t){const n=Te(e);if(null===n)return t;{(0,h.assert)('.priority'!==Te(e)||1===Ie(e),'.priority must be the last token in a path');const i=this.getImmediateChild(n).updateChild(ke(e),t);return this.updateImmediateChild(n,i)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let n=0,i=0,r=!0;if(this.forEachChild(at,(s,o)=>{t[s]=o.val(e),n++,r&&ft.INTEGER_REGEXP_.test(s)?i=Math.max(i,Number(s)):r=!1}),!e&&r&&i<2*n){const e=[];for(const n in t)e[n]=t[n];return e}return e&&!this.getPriority().isEmpty()&&(t['.priority']=this.getPriority().val()),t}hash(){if(null===this.lazyHash_){let e='';this.getPriority().isEmpty()||(e+='priority:'+tt(this.getPriority().val())+':'),this.forEachChild(at,(t,n)=>{const i=n.hash();''!==i&&(e+=':'+t+':'+i)}),this.lazyHash_=''===e?'':b(e)}return this.lazyHash_}getPredecessorChildName(e,t,n){const i=this.resolveIndex_(n);if(i){const n=i.getPredecessorKey(new Ve(e,t));return n?n.name:null}return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const e=t.minKey();return e&&e.name}return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new Ve(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const e=t.maxKey();return e&&e.name}return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new Ve(t,this.children_.get(t)):null}forEachChild(e,t){const n=this.resolveIndex_(e);return n?n.inorderTraversal(e=>t(e.name,e.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const n=this.resolveIndex_(t);if(n)return n.getIteratorFrom(e,e=>e);{const n=this.children_.getIteratorFrom(e.name,Ve.Wrap);let i=n.peek();for(;null!=i&&t.compare(i,e)<0;)n.getNext(),i=n.peek();return n}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const n=this.resolveIndex_(t);if(n)return n.getReverseIteratorFrom(e,e=>e);{const n=this.children_.getReverseIteratorFrom(e.name,Ve.Wrap);let i=n.peek();for(;null!=i&&t.compare(i,e)>0;)n.getNext(),i=n.peek();return n}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===mt?-1:0}withIndex(e){if(e===Qe||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new ft(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===Qe||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority())){if(this.children_.count()===t.children_.count()){const e=this.getIterator(at),n=t.getIterator(at);let i=e.getNext(),r=n.getNext();for(;i&&r;){if(i.name!==r.name||!i.node.equals(r.node))return!1;i=e.getNext(),r=n.getNext()}return null===i&&null===r}return!1}return!1}}resolveIndex_(e){return e===Qe?null:this.indexMap_.get(e.toString())}}ft.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;const mt=new class extends ft{constructor(){super(new Xe(Ze),ft.EMPTY_NODE,_t.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return ft.EMPTY_NODE}isEmpty(){return!1}};Object.defineProperties(Ve,{MIN:{value:new Ve(A,ft.EMPTY_NODE)},MAX:{value:new Ve(M,mt)}}),Ke.__EMPTY_NODE=ft.EMPTY_NODE,ot.__childrenNodeConstructor=ft,et=mt,(function(e){st=e})(mt);
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
const gt=!0;function yt(e,t=null){if(null===e)return ft.EMPTY_NODE;if('object'==typeof e&&'.priority'in e&&(t=e['.priority']),(0,h.assert)(null===t||'string'==typeof t||'number'==typeof t||'object'==typeof t&&'.sv'in t,'Invalid priority type found: '+typeof t),'object'==typeof e&&'.value'in e&&null!==e['.value']&&(e=e['.value']),'object'!=typeof e||'.sv'in e){return new ot(e,yt(t))}if(e instanceof Array||!gt){let n=ft.EMPTY_NODE;return U(e,(t,i)=>{if((0,h.contains)(e,t)&&'.'!==t.substring(0,1)){const e=yt(i);!e.isLeafNode()&&e.isEmpty()||(n=n.updateImmediateChild(t,e))}}),n.updatePriority(yt(t))}{const n=[];let i=!1;if(U(e,(e,t)=>{if('.'!==e.substring(0,1)){const r=yt(t);r.isEmpty()||(i=i||!r.getPriority().isEmpty(),n.push(new Ve(e,r)))}}),0===n.length)return ft.EMPTY_NODE;const r=ct(n,Je,e=>e.name,Ze);if(i){const e=ct(n,at.getCompare());return new ft(r,yt(t),new _t({'.priority':e},{'.priority':at}))}return new ft(r,yt(t),_t.Default)}}!(function(e){rt=e})(yt);
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
class vt extends ze{constructor(e){super(),this.indexPath_=e,(0,h.assert)(!Re(e)&&'.priority'!==Te(e),"Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const n=this.extractChild(e.node),i=this.extractChild(t.node),r=n.compareTo(i);return 0===r?q(e.name,t.name):r}makePost(e,t){const n=yt(e),i=ft.EMPTY_NODE.updateChild(this.indexPath_,n);return new Ve(t,i)}maxPost(){const e=ft.EMPTY_NODE.updateChild(this.indexPath_,mt);return new Ve(M,e)}toString(){return Se(this.indexPath_,0).join('/')}}
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
   */const Ct=new class extends ze{compare(e,t){const n=e.node.compareTo(t.node);return 0===n?q(e.name,t.name):n}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return Ve.MIN}maxPost(){return Ve.MAX}makePost(e,t){const n=yt(e);return new Ve(t,n)}toString(){return'.value'}};
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
   */function wt(e){return{type:"value",snapshotNode:e}}function bt(e,t){return{type:"child_added",snapshotNode:t,childName:e}}function Tt(e,t){return{type:"child_removed",snapshotNode:t,childName:e}}function It(e,t,n){return{type:"child_changed",snapshotNode:t,childName:e,oldSnap:n}}
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
class kt{constructor(e){this.index_=e}updateChild(e,t,n,i,r,s){(0,h.assert)(e.isIndexed(this.index_),'A node must be indexed if only a child is updated');const o=e.getImmediateChild(t);return o.getChild(i).equals(n.getChild(i))&&o.isEmpty()===n.isEmpty()?e:(null!=s&&(n.isEmpty()?e.hasChild(t)?s.trackChildChange(Tt(t,o)):(0,h.assert)(e.isLeafNode(),'A child remove without an old child only makes sense on a leaf node'):o.isEmpty()?s.trackChildChange(bt(t,n)):s.trackChildChange(It(t,n,o))),e.isLeafNode()&&n.isEmpty()?e:e.updateImmediateChild(t,n).withIndex(this.index_))}updateFullNode(e,t,n){return null!=n&&(e.isLeafNode()||e.forEachChild(at,(e,i)=>{t.hasChild(e)||n.trackChildChange(Tt(e,i))}),t.isLeafNode()||t.forEachChild(at,(t,i)=>{if(e.hasChild(t)){const r=e.getImmediateChild(t);r.equals(i)||n.trackChildChange(It(t,i,r))}else n.trackChildChange(bt(t,i))})),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?ft.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}
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
   */class Pt{constructor(e){this.indexedFilter_=new kt(e.getIndex()),this.index_=e.getIndex(),this.startPost_=Pt.getStartPost_(e),this.endPost_=Pt.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,n=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&n}updateChild(e,t,n,i,r,s){return this.matches(new Ve(t,n))||(n=ft.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,n,i,r,s)}updateFullNode(e,t,n){t.isLeafNode()&&(t=ft.EMPTY_NODE);let i=t.withIndex(this.index_);i=i.updatePriority(ft.EMPTY_NODE);const r=this;return t.forEachChild(at,(e,t)=>{r.matches(new Ve(e,t))||(i=i.updateImmediateChild(e,ft.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,i,n)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}return e.getIndex().maxPost()}}
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
   */class Et{constructor(e){this.withinDirectionalStart=e=>this.reverse_?this.withinEndPost(e):this.withinStartPost(e),this.withinDirectionalEnd=e=>this.reverse_?this.withinStartPost(e):this.withinEndPost(e),this.withinStartPost=e=>{const t=this.index_.compare(this.rangedFilter_.getStartPost(),e);return this.startIsInclusive_?t<=0:t<0},this.withinEndPost=e=>{const t=this.index_.compare(e,this.rangedFilter_.getEndPost());return this.endIsInclusive_?t<=0:t<0},this.rangedFilter_=new Pt(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,n,i,r,s){return this.rangedFilter_.matches(new Ve(t,n))||(n=ft.EMPTY_NODE),e.getImmediateChild(t).equals(n)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,n,i,r,s):this.fullLimitUpdateChild_(e,t,n,r,s)}updateFullNode(e,t,n){let i;if(t.isLeafNode()||t.isEmpty())i=ft.EMPTY_NODE.withIndex(this.index_);else if(2*this.limit_<t.numChildren()&&t.isIndexed(this.index_)){let e;i=ft.EMPTY_NODE.withIndex(this.index_),e=this.reverse_?t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let n=0;for(;e.hasNext()&&n<this.limit_;){const t=e.getNext();if(this.withinDirectionalStart(t)){if(!this.withinDirectionalEnd(t))break;i=i.updateImmediateChild(t.name,t.node),n++}}}else{let e;i=t.withIndex(this.index_),i=i.updatePriority(ft.EMPTY_NODE),e=this.reverse_?i.getReverseIterator(this.index_):i.getIterator(this.index_);let n=0;for(;e.hasNext();){const t=e.getNext();n<this.limit_&&this.withinDirectionalStart(t)&&this.withinDirectionalEnd(t)?n++:i=i.updateImmediateChild(t.name,ft.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,i,n)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,n,i,r){let s;if(this.reverse_){const e=this.index_.getCompare();s=(t,n)=>e(n,t)}else s=this.index_.getCompare();const o=e;(0,h.assert)(o.numChildren()===this.limit_,'');const a=new Ve(t,n),l=this.reverse_?o.getFirstChild(this.index_):o.getLastChild(this.index_),c=this.rangedFilter_.matches(a);if(o.hasChild(t)){const e=o.getImmediateChild(t);let h=i.getChildAfterChild(this.index_,l,this.reverse_);for(;null!=h&&(h.name===t||o.hasChild(h.name));)h=i.getChildAfterChild(this.index_,h,this.reverse_);const u=null==h?1:s(h,a);if(c&&!n.isEmpty()&&u>=0)return null!=r&&r.trackChildChange(It(t,n,e)),o.updateImmediateChild(t,n);{null!=r&&r.trackChildChange(Tt(t,e));const n=o.updateImmediateChild(t,ft.EMPTY_NODE);return null!=h&&this.rangedFilter_.matches(h)?(null!=r&&r.trackChildChange(bt(h.name,h.node)),n.updateImmediateChild(h.name,h.node)):n}}return n.isEmpty()?e:c&&s(l,a)>=0?(null!=r&&(r.trackChildChange(Tt(l.name,l.node)),r.trackChildChange(bt(t,n))),o.updateImmediateChild(t,n).updateImmediateChild(l.name,ft.EMPTY_NODE)):e}}
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
   */class St{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_='',this.indexStartValue_=null,this.indexStartName_='',this.indexEndValue_=null,this.indexEndName_='',this.index_=at}hasStart(){return this.startSet_}isViewFromLeft(){return''===this.viewFrom_?this.startSet_:"l"===this.viewFrom_}getIndexStartValue(){return(0,h.assert)(this.startSet_,'Only valid if start has been set'),this.indexStartValue_}getIndexStartName(){return(0,h.assert)(this.startSet_,'Only valid if start has been set'),this.startNameSet_?this.indexStartName_:A}hasEnd(){return this.endSet_}getIndexEndValue(){return(0,h.assert)(this.endSet_,'Only valid if end has been set'),this.indexEndValue_}getIndexEndName(){return(0,h.assert)(this.endSet_,'Only valid if end has been set'),this.endNameSet_?this.indexEndName_:M}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&''!==this.viewFrom_}getLimit(){return(0,h.assert)(this.limitSet_,'Only valid if limit has been set'),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===at}copy(){const e=new St;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function Nt(e,t){const n=e.copy();return n.limitSet_=!0,n.limit_=t,n.viewFrom_="l",n}function xt(e,t){const n=e.copy();return n.limitSet_=!0,n.limit_=t,n.viewFrom_="r",n}function Rt(e,t,n){const i=e.copy();return i.startSet_=!0,void 0===t&&(t=null),i.indexStartValue_=t,null!=n?(i.startNameSet_=!0,i.indexStartName_=n):(i.startNameSet_=!1,i.indexStartName_=''),i}function Dt(e,t,n){let i;return i=e.index_===Qe||n?Rt(e,t,n):Rt(e,t,M),i.startAfterSet_=!0,i}function Ot(e,t,n){const i=e.copy();return i.endSet_=!0,void 0===t&&(t=null),i.indexEndValue_=t,void 0!==n?(i.endNameSet_=!0,i.indexEndName_=n):(i.endNameSet_=!1,i.indexEndName_=''),i}function At(e,t,n){let i;return i=e.index_===Qe||n?Ot(e,t,n):Ot(e,t,A),i.endBeforeSet_=!0,i}function Mt(e,t){const n=e.copy();return n.index_=t,n}function qt(e){const t={};if(e.isDefault())return t;let n;if(e.index_===at?n="$priority":e.index_===Ct?n="$value":e.index_===Qe?n="$key":((0,h.assert)(e.index_ instanceof vt,'Unrecognized index type!'),n=e.index_.toString()),t.orderBy=(0,h.stringify)(n),e.startSet_){const n=e.startAfterSet_?"startAfter":"startAt";t[n]=(0,h.stringify)(e.indexStartValue_),e.startNameSet_&&(t[n]+=','+(0,h.stringify)(e.indexStartName_))}if(e.endSet_){const n=e.endBeforeSet_?"endBefore":"endAt";t[n]=(0,h.stringify)(e.indexEndValue_),e.endNameSet_&&(t[n]+=','+(0,h.stringify)(e.indexEndName_))}return e.limitSet_&&(e.isViewFromLeft()?t.limitToFirst=e.limit_:t.limitToLast=e.limit_),t}function Ft(e){const t={};if(e.startSet_&&(t.sp=e.indexStartValue_,e.startNameSet_&&(t.sn=e.indexStartName_),t.sin=!e.startAfterSet_),e.endSet_&&(t.ep=e.indexEndValue_,e.endNameSet_&&(t.en=e.indexEndName_),t.ein=!e.endBeforeSet_),e.limitSet_){t.l=e.limit_;let n=e.viewFrom_;''===n&&(n=e.isViewFromLeft()?"l":"r"),t.vf=n}return e.index_!==at&&(t.i=e.index_.toString()),t}
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
   */class Lt extends ye{constructor(e,t,n,i){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=n,this.appCheckTokenProvider_=i,this.log_=S('p:rest:'),this.listens_={}}reportStats(e){throw new Error('Method not implemented.')}static getListenId_(e,t){return void 0!==t?'tag$'+t:((0,h.assert)(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}listen(e,t,n,i){const r=e._path.toString();this.log_('Listen called for '+r+' '+e._queryIdentifier);const s=Lt.getListenId_(e,n),o={};this.listens_[s]=o;const a=qt(e._queryParams);this.restRequest_(r+'.json',a,(e,t)=>{let a=t;if(404===e&&(a=null,e=null),null===e&&this.onDataUpdate_(r,a,!1,n),(0,h.safeGet)(this.listens_,s)===o){let t;t=e?401===e?'permission_denied':'rest_error:'+e:'ok',i(t,null)}})}unlisten(e,t){const n=Lt.getListenId_(e,t);delete this.listens_[n]}get(e){const t=qt(e._queryParams),n=e._path.toString(),i=new h.Deferred;return this.restRequest_(n+'.json',t,(e,t)=>{let r=t;404===e&&(r=null,e=null),null===e?(this.onDataUpdate_(n,r,!1,null),i.resolve(r)):i.reject(new Error(r))}),i.promise}refreshAuthToken(e){}restRequest_(e,t={},n){return t.format='export',Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([i,r])=>{i&&i.accessToken&&(t.auth=i.accessToken),r&&r.token&&(t.ac=r.token);const s=(this.repoInfo_.secure?'https://':'http://')+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+(0,h.querystring)(t);this.log_('Sending REST request for '+s);const o=new XMLHttpRequest;o.onreadystatechange=()=>{if(n&&4===o.readyState){this.log_('REST Response for '+s+' received. status:',o.status,'response:',o.responseText);let e=null;if(o.status>=200&&o.status<300){try{e=(0,h.jsonEval)(o.responseText)}catch(e){R('Failed to parse JSON response for '+s+': '+o.responseText)}n(null,e)}else 401!==o.status&&404!==o.status&&R('Got unsuccessful REST response for '+s+' Status: '+o.status),n(o.status);n=null}},o.open('GET',s,!0),o.send()})}}
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
   */class jt{constructor(){this.rootNode_=ft.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}
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
   */function Wt(){return{value:null,children:new Map}}function Ut(e,t,n){if(Re(t))e.value=n,e.children.clear();else if(null!==e.value)e.value=e.value.updateChild(t,n);else{const i=Te(t);e.children.has(i)||e.children.set(i,Wt());Ut(e.children.get(i),t=ke(t),n)}}function Bt(e,t){if(Re(t))return e.value=null,e.children.clear(),!0;if(null!==e.value){if(e.value.isLeafNode())return!1;{const n=e.value;return e.value=null,n.forEachChild(at,(t,n)=>{Ut(e,new we(t),n)}),Bt(e,t)}}if(e.children.size>0){const n=Te(t);if(t=ke(t),e.children.has(n)){Bt(e.children.get(n),t)&&e.children.delete(n)}return 0===e.children.size}return!0}function Ht(e,t,n){null!==e.value?n(t,e.value):Vt(e,(e,i)=>{Ht(i,new we(t.toString()+'/'+e),n)})}function Vt(e,t){e.children.forEach((e,n)=>{t(n,e)})}
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
   */class zt{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t=Object.assign({},e);return this.last_&&U(this.last_,(e,n)=>{t[e]=t[e]-n}),this.last_=e,t}}
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
   */class Yt{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new zt(e);const n=1e4+2e4*Math.random();K(this.reportStats_.bind(this),Math.floor(n))}reportStats_(){const e=this.statsListener_.get(),t={};let n=!1;U(e,(e,i)=>{i>0&&(0,h.contains)(this.statsToReport_,e)&&(t[e]=i,n=!0)}),n&&this.server_.reportStats(t),K(this.reportStats_.bind(this),Math.floor(2*Math.random()*3e5))}}
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
   */var Kt;function Qt(e){return{fromUser:!1,fromServer:!0,queryId:e,tagged:!0}}
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
   */!(function(e){e[e.OVERWRITE=0]="OVERWRITE",e[e.MERGE=1]="MERGE",e[e.ACK_USER_WRITE=2]="ACK_USER_WRITE",e[e.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(Kt||(Kt={}));class Gt{constructor(e,t,n){this.path=e,this.affectedTree=t,this.revert=n,this.type=Kt.ACK_USER_WRITE,this.source={fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}operationForChild(e){if(Re(this.path)){if(null!=this.affectedTree.value)return(0,h.assert)(this.affectedTree.children.isEmpty(),'affectedTree should not have overlapping affected paths.'),this;{const t=this.affectedTree.subtree(new we(e));return new Gt(be(),t,this.revert)}}return(0,h.assert)(Te(this.path)===e,'operationForChild called for unrelated child.'),new Gt(ke(this.path),this.affectedTree,this.revert)}}
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
   */class $t{constructor(e,t){this.source=e,this.path=t,this.type=Kt.LISTEN_COMPLETE}operationForChild(e){return Re(this.path)?new $t(this.source,be()):new $t(this.source,ke(this.path))}}
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
   */class Xt{constructor(e,t,n){this.source=e,this.path=t,this.snap=n,this.type=Kt.OVERWRITE}operationForChild(e){return Re(this.path)?new Xt(this.source,be(),this.snap.getImmediateChild(e)):new Xt(this.source,ke(this.path),this.snap)}}
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
   */class Jt{constructor(e,t,n){this.source=e,this.path=t,this.children=n,this.type=Kt.MERGE}operationForChild(e){if(Re(this.path)){const t=this.children.subtree(new we(e));return t.isEmpty()?null:t.value?new Xt(this.source,be(),t.value):new Jt(this.source,be(),t)}return(0,h.assert)(Te(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new Jt(this.source,ke(this.path),this.children)}toString(){return'Operation('+this.path+': '+this.source.toString()+' merge: '+this.children.toString()+')'}}
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
   */class Zt{constructor(e,t,n){this.node_=e,this.fullyInitialized_=t,this.filtered_=n}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(Re(e))return this.isFullyInitialized()&&!this.filtered_;const t=Te(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}
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
   */class en{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function tn(e,t,n,i){const r=[],s=[];return t.forEach(t=>{var n;"child_changed"===t.type&&e.index_.indexedValueChanged(t.oldSnap,t.snapshotNode)&&s.push((n=t.childName,{type:"child_moved",snapshotNode:t.snapshotNode,childName:n}))}),nn(e,r,"child_removed",t,i,n),nn(e,r,"child_added",t,i,n),nn(e,r,"child_moved",s,i,n),nn(e,r,"child_changed",t,i,n),nn(e,r,"value",t,i,n),r}function nn(e,t,n,i,r,s){const o=i.filter(e=>e.type===n);o.sort((t,n)=>sn(e,t,n)),o.forEach(n=>{const i=rn(e,n,s);r.forEach(r=>{r.respondsTo(n.type)&&t.push(r.createEvent(i,e.query_))})})}function rn(e,t,n){return'value'===t.type||'child_removed'===t.type||(t.prevName=n.getPredecessorChildName(t.childName,t.snapshotNode,e.index_)),t}function sn(e,t,n){if(null==t.childName||null==n.childName)throw(0,h.assertionError)('Should only compare child_ events.');const i=new Ve(t.childName,t.snapshotNode),r=new Ve(n.childName,n.snapshotNode);return e.index_.compare(i,r)}
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
   */function on(e,t){return{eventCache:e,serverCache:t}}function an(e,t,n,i){return on(new Zt(t,n,i),e.serverCache)}function ln(e,t,n,i){return on(e.eventCache,new Zt(t,n,i))}function hn(e){return e.eventCache.isFullyInitialized()?e.eventCache.getNode():null}function cn(e){return e.serverCache.isFullyInitialized()?e.serverCache.getNode():null}
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
   */let un;const dn=()=>(un||(un=new Xe(F)),un);class _n{constructor(e,t=dn()){this.value=e,this.children=t}static fromObject(e){let t=new _n(null);return U(e,(e,n)=>{t=t.set(new we(e),n)}),t}isEmpty(){return null===this.value&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(null!=this.value&&t(this.value))return{path:be(),value:this.value};if(Re(e))return null;{const n=Te(e),i=this.children.get(n);if(null!==i){const r=i.findRootMostMatchingPathAndValue(ke(e),t);if(null!=r){return{path:xe(new we(n),r.path),value:r.value}}return null}return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(Re(e))return this;{const t=Te(e),n=this.children.get(t);return null!==n?n.subtree(ke(e)):new _n(null)}}set(e,t){if(Re(e))return new _n(t,this.children);{const n=Te(e),i=(this.children.get(n)||new _n(null)).set(ke(e),t),r=this.children.insert(n,i);return new _n(this.value,r)}}remove(e){if(Re(e))return this.children.isEmpty()?new _n(null):new _n(null,this.children);{const t=Te(e),n=this.children.get(t);if(n){const i=n.remove(ke(e));let r;return r=i.isEmpty()?this.children.remove(t):this.children.insert(t,i),null===this.value&&r.isEmpty()?new _n(null):new _n(this.value,r)}return this}}get(e){if(Re(e))return this.value;{const t=Te(e),n=this.children.get(t);return n?n.get(ke(e)):null}}setTree(e,t){if(Re(e))return t;{const n=Te(e),i=(this.children.get(n)||new _n(null)).setTree(ke(e),t);let r;return r=i.isEmpty()?this.children.remove(n):this.children.insert(n,i),new _n(this.value,r)}}fold(e){return this.fold_(be(),e)}fold_(e,t){const n={};return this.children.inorderTraversal((i,r)=>{n[i]=r.fold_(xe(e,i),t)}),t(e,this.value,n)}findOnPath(e,t){return this.findOnPath_(e,be(),t)}findOnPath_(e,t,n){const i=!!this.value&&n(t,this.value);if(i)return i;if(Re(e))return null;{const i=Te(e),r=this.children.get(i);return r?r.findOnPath_(ke(e),xe(t,i),n):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,be(),t)}foreachOnPath_(e,t,n){if(Re(e))return this;{this.value&&n(t,this.value);const i=Te(e),r=this.children.get(i);return r?r.foreachOnPath_(ke(e),xe(t,i),n):new _n(null)}}foreach(e){this.foreach_(be(),e)}foreach_(e,t){this.children.inorderTraversal((n,i)=>{i.foreach_(xe(e,n),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,n)=>{n.value&&e(t,n.value)})}}
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
   */class pn{constructor(e){this.writeTree_=e}static empty(){return new pn(new _n(null))}}function fn(e,t,n){if(Re(t))return new pn(new _n(n));{const i=e.writeTree_.findRootMostValueAndPath(t);if(null!=i){const r=i.path;let s=i.value;const o=De(r,t);return s=s.updateChild(o,n),new pn(e.writeTree_.set(r,s))}{const i=new _n(n),r=e.writeTree_.setTree(t,i);return new pn(r)}}}function mn(e,t,n){let i=e;return U(n,(e,n)=>{i=fn(i,xe(t,e),n)}),i}function gn(e,t){if(Re(t))return pn.empty();{const n=e.writeTree_.setTree(t,new _n(null));return new pn(n)}}function yn(e,t){return null!=vn(e,t)}function vn(e,t){const n=e.writeTree_.findRootMostValueAndPath(t);return null!=n?e.writeTree_.get(n.path).getChild(De(n.path,t)):null}function Cn(e){const t=[],n=e.writeTree_.value;return null!=n?n.isLeafNode()||n.forEachChild(at,(e,n)=>{t.push(new Ve(e,n))}):e.writeTree_.children.inorderTraversal((e,n)=>{null!=n.value&&t.push(new Ve(e,n.value))}),t}function wn(e,t){if(Re(t))return e;{const n=vn(e,t);return new pn(null!=n?new _n(n):e.writeTree_.subtree(t))}}function bn(e){return e.writeTree_.isEmpty()}function Tn(e,t){return In(be(),e.writeTree_,t)}function In(e,t,n){if(null!=t.value)return n.updateChild(e,t.value);{let i=null;return t.children.inorderTraversal((t,r)=>{'.priority'===t?((0,h.assert)(null!==r.value,'Priority writes must always be leaf nodes'),i=r.value):n=In(xe(e,t),r,n)}),n.getChild(e).isEmpty()||null===i||(n=n.updateChild(xe(e,'.priority'),i)),n}}
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
   */function kn(e,t){return Kn(t,e)}function Pn(e,t,n,i,r){(0,h.assert)(i>e.lastWriteId,'Stacking an older write on top of newer ones'),void 0===r&&(r=!0),e.allWrites.push({path:t,snap:n,writeId:i,visible:r}),r&&(e.visibleWrites=fn(e.visibleWrites,t,n)),e.lastWriteId=i}function En(e,t,n,i){(0,h.assert)(i>e.lastWriteId,'Stacking an older merge on top of newer ones'),e.allWrites.push({path:t,children:n,writeId:i,visible:!0}),e.visibleWrites=mn(e.visibleWrites,t,n),e.lastWriteId=i}function Sn(e,t){for(let n=0;n<e.allWrites.length;n++){const i=e.allWrites[n];if(i.writeId===t)return i}return null}function Nn(e,t){const n=e.allWrites.findIndex(e=>e.writeId===t);(0,h.assert)(n>=0,'removeWrite called with nonexistent writeId.');const i=e.allWrites[n];e.allWrites.splice(n,1);let r=i.visible,s=!1,o=e.allWrites.length-1;for(;r&&o>=0;){const t=e.allWrites[o];t.visible&&(o>=n&&xn(t,i.path)?r=!1:Me(i.path,t.path)&&(s=!0)),o--}if(r){if(s)return Rn(e),!0;if(i.snap)e.visibleWrites=gn(e.visibleWrites,i.path);else{U(i.children,t=>{e.visibleWrites=gn(e.visibleWrites,xe(i.path,t))})}return!0}return!1}function xn(e,t){if(e.snap)return Me(e.path,t);for(const n in e.children)if(e.children.hasOwnProperty(n)&&Me(xe(e.path,n),t))return!0;return!1}function Rn(e){e.visibleWrites=On(e.allWrites,Dn,be()),e.allWrites.length>0?e.lastWriteId=e.allWrites[e.allWrites.length-1].writeId:e.lastWriteId=-1}function Dn(e){return e.visible}function On(e,t,n){let i=pn.empty();for(let r=0;r<e.length;++r){const s=e[r];if(t(s)){const e=s.path;let t;if(s.snap)Me(n,e)?(t=De(n,e),i=fn(i,t,s.snap)):Me(e,n)&&(t=De(e,n),i=fn(i,be(),s.snap.getChild(t)));else{if(!s.children)throw(0,h.assertionError)('WriteRecord should have .snap or .children');if(Me(n,e))t=De(n,e),i=mn(i,t,s.children);else if(Me(e,n))if(t=De(e,n),Re(t))i=mn(i,be(),s.children);else{const e=(0,h.safeGet)(s.children,Te(t));if(e){const n=e.getChild(ke(t));i=fn(i,be(),n)}}}}}return i}function An(e,t,n,i,r){if(i||r){const s=wn(e.visibleWrites,t);if(!r&&bn(s))return n;if(r||null!=n||yn(s,be())){const s=function(e){return(e.visible||r)&&(!i||!~i.indexOf(e.writeId))&&(Me(e.path,t)||Me(t,e.path))};return Tn(On(e.allWrites,s,t),n||ft.EMPTY_NODE)}return null}{const i=vn(e.visibleWrites,t);if(null!=i)return i;{const i=wn(e.visibleWrites,t);if(bn(i))return n;if(null!=n||yn(i,be())){return Tn(i,n||ft.EMPTY_NODE)}return null}}}function Mn(e,t,n){let i=ft.EMPTY_NODE;const r=vn(e.visibleWrites,t);if(r)return r.isLeafNode()||r.forEachChild(at,(e,t)=>{i=i.updateImmediateChild(e,t)}),i;if(n){const r=wn(e.visibleWrites,t);return n.forEachChild(at,(e,t)=>{const n=Tn(wn(r,new we(e)),t);i=i.updateImmediateChild(e,n)}),Cn(r).forEach(e=>{i=i.updateImmediateChild(e.name,e.node)}),i}return Cn(wn(e.visibleWrites,t)).forEach(e=>{i=i.updateImmediateChild(e.name,e.node)}),i}function qn(e,t,n,i,r){(0,h.assert)(i||r,'Either existingEventSnap or existingServerSnap must exist');const s=xe(t,n);if(yn(e.visibleWrites,s))return null;{const t=wn(e.visibleWrites,s);return bn(t)?r.getChild(n):Tn(t,r.getChild(n))}}function Fn(e,t,n,i){const r=xe(t,n),s=vn(e.visibleWrites,r);if(null!=s)return s;if(i.isCompleteForChild(n)){return Tn(wn(e.visibleWrites,r),i.getNode().getImmediateChild(n))}return null}function Ln(e,t){return vn(e.visibleWrites,t)}function jn(e,t,n,i,r,s,o){let a;const l=wn(e.visibleWrites,t),h=vn(l,be());if(null!=h)a=h;else{if(null==n)return[];a=Tn(l,n)}if(a=a.withIndex(o),a.isEmpty()||a.isLeafNode())return[];{const e=[],t=o.getCompare(),n=s?a.getReverseIteratorFrom(i,o):a.getIteratorFrom(i,o);let l=n.getNext();for(;l&&e.length<r;)0!==t(l,i)&&e.push(l),l=n.getNext();return e}}function Wn(e,t,n,i){return An(e.writeTree,e.treePath,t,n,i)}function Un(e,t){return Mn(e.writeTree,e.treePath,t)}function Bn(e,t,n,i){return qn(e.writeTree,e.treePath,t,n,i)}function Hn(e,t){return Ln(e.writeTree,xe(e.treePath,t))}function Vn(e,t,n,i,r,s){return jn(e.writeTree,e.treePath,t,n,i,r,s)}function zn(e,t,n){return Fn(e.writeTree,e.treePath,t,n)}function Yn(e,t){return Kn(xe(e.treePath,t),e.writeTree)}function Kn(e,t){return{treePath:e,writeTree:t}}
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
   */class Qn{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,n=e.childName;(0,h.assert)("child_added"===t||"child_changed"===t||"child_removed"===t,'Only child changes supported for tracking'),(0,h.assert)('.priority'!==n,'Only non-priority child changes can be tracked.');const i=this.changeMap.get(n);if(i){const r=i.type;if("child_added"===t&&"child_removed"===r)this.changeMap.set(n,It(n,e.snapshotNode,i.snapshotNode));else if("child_removed"===t&&"child_added"===r)this.changeMap.delete(n);else if("child_removed"===t&&"child_changed"===r)this.changeMap.set(n,Tt(n,i.oldSnap));else if("child_changed"===t&&"child_added"===r)this.changeMap.set(n,bt(n,e.snapshotNode));else{if("child_changed"!==t||"child_changed"!==r)throw(0,h.assertionError)('Illegal combination of changes: '+e+' occurred after '+i);this.changeMap.set(n,It(n,e.snapshotNode,i.oldSnap))}}else this.changeMap.set(n,e)}getChanges(){return Array.from(this.changeMap.values())}}
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
   */const Gn=new class{getCompleteChild(e){return null}getChildAfterChild(e,t,n){return null}};class $n{constructor(e,t,n=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=n}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const t=null!=this.optCompleteServerCache_?new Zt(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return zn(this.writes_,e,t)}}getChildAfterChild(e,t,n){const i=null!=this.optCompleteServerCache_?this.optCompleteServerCache_:cn(this.viewCache_),r=Vn(this.writes_,i,t,1,n,e);return 0===r.length?null:r[0]}}
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
   */function Xn(e){return{filter:e}}function Jn(e,t,n,i,r){const s=new Qn;let o,a;if(n.type===Kt.OVERWRITE){const l=n;l.source.fromUser?o=ni(e,t,l.path,l.snap,i,r,s):((0,h.assert)(l.source.fromServer,'Unknown source.'),a=l.source.tagged||t.serverCache.isFiltered()&&!Re(l.path),o=ti(e,t,l.path,l.snap,i,r,a,s))}else if(n.type===Kt.MERGE){const l=n;l.source.fromUser?o=ri(e,t,l.path,l.children,i,r,s):((0,h.assert)(l.source.fromServer,'Unknown source.'),a=l.source.tagged||t.serverCache.isFiltered(),o=oi(e,t,l.path,l.children,i,r,a,s))}else if(n.type===Kt.ACK_USER_WRITE){const a=n;o=a.revert?hi(e,t,a.path,i,r,s):ai(e,t,a.path,a.affectedTree,i,r,s)}else{if(n.type!==Kt.LISTEN_COMPLETE)throw(0,h.assertionError)('Unknown operation type: '+n.type);o=li(e,t,n.path,i,s)}const l=s.getChanges();return Zn(t,o,l),{viewCache:o,changes:l}}function Zn(e,t,n){const i=t.eventCache;if(i.isFullyInitialized()){const r=i.getNode().isLeafNode()||i.getNode().isEmpty(),s=hn(e);(n.length>0||!e.eventCache.isFullyInitialized()||r&&!i.getNode().equals(s)||!i.getNode().getPriority().equals(s.getPriority()))&&n.push(wt(hn(t)))}}function ei(e,t,n,i,r,s){const o=t.eventCache;if(null!=Hn(i,n))return t;{let a,l;if(Re(n))if((0,h.assert)(t.serverCache.isFullyInitialized(),'If change path is empty, we must have complete server data'),t.serverCache.isFiltered()){const n=cn(t),r=Un(i,n instanceof ft?n:ft.EMPTY_NODE);a=e.filter.updateFullNode(t.eventCache.getNode(),r,s)}else{const n=Wn(i,cn(t));a=e.filter.updateFullNode(t.eventCache.getNode(),n,s)}else{const c=Te(n);if('.priority'===c){(0,h.assert)(1===Ie(n),"Can't have a priority with additional path components");const r=o.getNode();l=t.serverCache.getNode();const s=Bn(i,n,r,l);a=null!=s?e.filter.updatePriority(r,s):o.getNode()}else{const h=ke(n);let u;if(o.isCompleteForChild(c)){l=t.serverCache.getNode();const e=Bn(i,n,o.getNode(),l);u=null!=e?o.getNode().getImmediateChild(c).updateChild(h,e):o.getNode().getImmediateChild(c)}else u=zn(i,c,t.serverCache);a=null!=u?e.filter.updateChild(o.getNode(),c,u,h,r,s):o.getNode()}}return an(t,a,o.isFullyInitialized()||Re(n),e.filter.filtersNodes())}}function ti(e,t,n,i,r,s,o,a){const l=t.serverCache;let h;const c=o?e.filter:e.filter.getIndexedFilter();if(Re(n))h=c.updateFullNode(l.getNode(),i,null);else if(c.filtersNodes()&&!l.isFiltered()){const e=l.getNode().updateChild(n,i);h=c.updateFullNode(l.getNode(),e,null)}else{const e=Te(n);if(!l.isCompleteForPath(n)&&Ie(n)>1)return t;const r=ke(n),s=l.getNode().getImmediateChild(e).updateChild(r,i);h='.priority'===e?c.updatePriority(l.getNode(),s):c.updateChild(l.getNode(),e,s,r,Gn,null)}const u=ln(t,h,l.isFullyInitialized()||Re(n),c.filtersNodes());return ei(e,u,n,r,new $n(r,u,s),a)}function ni(e,t,n,i,r,s,o){const a=t.eventCache;let l,h;const c=new $n(r,t,s);if(Re(n))h=e.filter.updateFullNode(t.eventCache.getNode(),i,o),l=an(t,h,!0,e.filter.filtersNodes());else{const r=Te(n);if('.priority'===r)h=e.filter.updatePriority(t.eventCache.getNode(),i),l=an(t,h,a.isFullyInitialized(),a.isFiltered());else{const s=ke(n),h=a.getNode().getImmediateChild(r);let u;if(Re(s))u=i;else{const e=c.getCompleteChild(r);u=null!=e?'.priority'===Pe(s)&&e.getChild(Ne(s)).isEmpty()?e:e.updateChild(s,i):ft.EMPTY_NODE}if(h.equals(u))l=t;else{l=an(t,e.filter.updateChild(a.getNode(),r,u,s,c,o),a.isFullyInitialized(),e.filter.filtersNodes())}}}return l}function ii(e,t){return e.eventCache.isCompleteForChild(t)}function ri(e,t,n,i,r,s,o){let a=t;return i.foreach((i,l)=>{const h=xe(n,i);ii(t,Te(h))&&(a=ni(e,a,h,l,r,s,o))}),i.foreach((i,l)=>{const h=xe(n,i);ii(t,Te(h))||(a=ni(e,a,h,l,r,s,o))}),a}function si(e,t,n){return n.foreach((e,n)=>{t=t.updateChild(e,n)}),t}function oi(e,t,n,i,r,s,o,a){if(t.serverCache.getNode().isEmpty()&&!t.serverCache.isFullyInitialized())return t;let l,h=t;l=Re(n)?i:new _n(null).setTree(n,i);const c=t.serverCache.getNode();return l.children.inorderTraversal((n,i)=>{if(c.hasChild(n)){const l=si(0,t.serverCache.getNode().getImmediateChild(n),i);h=ti(e,h,new we(n),l,r,s,o,a)}}),l.children.inorderTraversal((n,i)=>{const l=!t.serverCache.isCompleteForChild(n)&&null===i.value;if(!c.hasChild(n)&&!l){const l=si(0,t.serverCache.getNode().getImmediateChild(n),i);h=ti(e,h,new we(n),l,r,s,o,a)}}),h}function ai(e,t,n,i,r,s,o){if(null!=Hn(r,n))return t;const a=t.serverCache.isFiltered(),l=t.serverCache;if(null!=i.value){if(Re(n)&&l.isFullyInitialized()||l.isCompleteForPath(n))return ti(e,t,n,l.getNode().getChild(n),r,s,a,o);if(Re(n)){let i=new _n(null);return l.getNode().forEachChild(Qe,(e,t)=>{i=i.set(new we(e),t)}),oi(e,t,n,i,r,s,a,o)}return t}{let h=new _n(null);return i.foreach((e,t)=>{const i=xe(n,e);l.isCompleteForPath(i)&&(h=h.set(e,l.getNode().getChild(i)))}),oi(e,t,n,h,r,s,a,o)}}function li(e,t,n,i,r){const s=t.serverCache;return ei(e,ln(t,s.getNode(),s.isFullyInitialized()||Re(n),s.isFiltered()),n,i,Gn,r)}function hi(e,t,n,i,r,s){let o;if(null!=Hn(i,n))return t;{const a=new $n(i,t,r),l=t.eventCache.getNode();let c;if(Re(n)||'.priority'===Te(n)){let n;if(t.serverCache.isFullyInitialized())n=Wn(i,cn(t));else{const e=t.serverCache.getNode();(0,h.assert)(e instanceof ft,'serverChildren would be complete if leaf node'),n=Un(i,e)}c=e.filter.updateFullNode(l,n,s)}else{const r=Te(n);let h=zn(i,r,t.serverCache);null==h&&t.serverCache.isCompleteForChild(r)&&(h=l.getImmediateChild(r)),c=null!=h?e.filter.updateChild(l,r,h,ke(n),a,s):t.eventCache.getNode().hasChild(r)?e.filter.updateChild(l,r,ft.EMPTY_NODE,ke(n),a,s):l,c.isEmpty()&&t.serverCache.isFullyInitialized()&&(o=Wn(i,cn(t)),o.isLeafNode()&&(c=e.filter.updateFullNode(c,o,s)))}return o=t.serverCache.isFullyInitialized()||null!=Hn(i,be()),an(t,c,o,e.filter.filtersNodes())}}
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
   */class ci{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const n=this.query_._queryParams,i=new kt(n.getIndex()),r=(s=n).loadsAllData()?new kt(s.getIndex()):s.hasLimit()?new Et(s):new Pt(s);var s;this.processor_=Xn(r);const o=t.serverCache,a=t.eventCache,l=i.updateFullNode(ft.EMPTY_NODE,o.getNode(),null),h=r.updateFullNode(ft.EMPTY_NODE,a.getNode(),null),c=new Zt(l,o.isFullyInitialized(),i.filtersNodes()),u=new Zt(h,a.isFullyInitialized(),r.filtersNodes());this.viewCache_=on(u,c),this.eventGenerator_=new en(this.query_)}get query(){return this.query_}}function ui(e){return e.viewCache_.serverCache.getNode()}function di(e){return hn(e.viewCache_)}function _i(e,t){const n=cn(e.viewCache_);return n&&(e.query._queryParams.loadsAllData()||!Re(t)&&!n.getImmediateChild(Te(t)).isEmpty())?n.getChild(t):null}function pi(e){return 0===e.eventRegistrations_.length}function fi(e,t){e.eventRegistrations_.push(t)}function mi(e,t,n){const i=[];if(n){(0,h.assert)(null==t,'A cancel should cancel all event registrations.');const r=e.query._path;e.eventRegistrations_.forEach(e=>{const t=e.createCancelEvent(n,r);t&&i.push(t)})}if(t){let n=[];for(let i=0;i<e.eventRegistrations_.length;++i){const r=e.eventRegistrations_[i];if(r.matches(t)){if(t.hasAnyCallback()){n=n.concat(e.eventRegistrations_.slice(i+1));break}}else n.push(r)}e.eventRegistrations_=n}else e.eventRegistrations_=[];return i}function gi(e,t,n,i){t.type===Kt.MERGE&&null!==t.source.queryId&&((0,h.assert)(cn(e.viewCache_),'We should always have a full cache before handling merges'),(0,h.assert)(hn(e.viewCache_),'Missing event cache, even though we have a server cache'));const r=e.viewCache_,s=Jn(e.processor_,r,t,n,i);var o,a;return o=e.processor_,a=s.viewCache,(0,h.assert)(a.eventCache.getNode().isIndexed(o.filter.getIndex()),'Event snap not indexed'),(0,h.assert)(a.serverCache.getNode().isIndexed(o.filter.getIndex()),'Server snap not indexed'),(0,h.assert)(s.viewCache.serverCache.isFullyInitialized()||!r.serverCache.isFullyInitialized(),'Once a server snap is complete, it should never go back'),e.viewCache_=s.viewCache,vi(e,s.changes,s.viewCache.eventCache.getNode(),null)}function yi(e,t){const n=e.viewCache_.eventCache,i=[];if(!n.getNode().isLeafNode()){n.getNode().forEachChild(at,(e,t)=>{i.push(bt(e,t))})}return n.isFullyInitialized()&&i.push(wt(n.getNode())),vi(e,i,n.getNode(),t)}function vi(e,t,n,i){const r=i?[i]:e.eventRegistrations_;return tn(e.eventGenerator_,t,n,r)}
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
   */let Ci,wi;class bi{constructor(){this.views=new Map}}function Ti(e,t,n,i){const r=t.source.queryId;if(null!==r){const s=e.views.get(r);return(0,h.assert)(null!=s,'SyncTree gave us an op for an invalid query.'),gi(s,t,n,i)}{let r=[];for(const s of e.views.values())r=r.concat(gi(s,t,n,i));return r}}function Ii(e,t,n,i,r){const s=t._queryIdentifier,o=e.views.get(s);if(!o){let e=Wn(n,r?i:null),s=!1;e?s=!0:i instanceof ft?(e=Un(n,i),s=!1):(e=ft.EMPTY_NODE,s=!1);const o=on(new Zt(e,s,!1),new Zt(i,r,!1));return new ci(t,o)}return o}function ki(e,t,n,i,r,s){const o=Ii(e,t,i,r,s);return e.views.has(t._queryIdentifier)||e.views.set(t._queryIdentifier,o),fi(o,n),yi(o,n)}function Pi(e,t,n,i){const r=t._queryIdentifier,s=[];let o=[];const a=Ri(e);if('default'===r)for(const[t,r]of e.views.entries())o=o.concat(mi(r,n,i)),pi(r)&&(e.views.delete(t),r.query._queryParams.loadsAllData()||s.push(r.query));else{const t=e.views.get(r);t&&(o=o.concat(mi(t,n,i)),pi(t)&&(e.views.delete(r),t.query._queryParams.loadsAllData()||s.push(t.query)))}return a&&!Ri(e)&&s.push(new((0,h.assert)(Ci,'Reference.ts has not been loaded'),Ci)(t._repo,t._path)),{removed:s,events:o}}function Ei(e){const t=[];for(const n of e.views.values())n.query._queryParams.loadsAllData()||t.push(n);return t}function Si(e,t){let n=null;for(const i of e.views.values())n=n||_i(i,t);return n}function Ni(e,t){if(t._queryParams.loadsAllData())return Di(e);{const n=t._queryIdentifier;return e.views.get(n)}}function xi(e,t){return null!=Ni(e,t)}function Ri(e){return null!=Di(e)}function Di(e){for(const t of e.views.values())if(t.query._queryParams.loadsAllData())return t;return null}
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
   */let Oi=1;class Ai{constructor(e){this.listenProvider_=e,this.syncPointTree_=new _n(null),this.pendingWriteTree_={visibleWrites:pn.empty(),allWrites:[],lastWriteId:-1},this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function Mi(e,t,n,i,r){return Pn(e.pendingWriteTree_,t,n,i,r),r?Qi(e,new Xt({fromUser:!0,fromServer:!1,queryId:null,tagged:!1},t,n)):[]}function qi(e,t,n,i){En(e.pendingWriteTree_,t,n,i);const r=_n.fromObject(n);return Qi(e,new Jt({fromUser:!0,fromServer:!1,queryId:null,tagged:!1},t,r))}function Fi(e,t,n=!1){const i=Sn(e.pendingWriteTree_,t);if(Nn(e.pendingWriteTree_,t)){let t=new _n(null);return null!=i.snap?t=t.set(be(),!0):U(i.children,e=>{t=t.set(new we(e),!0)}),Qi(e,new Gt(i.path,t,n))}return[]}function Li(e,t,n){return Qi(e,new Xt({fromUser:!1,fromServer:!0,queryId:null,tagged:!1},t,n))}function ji(e,t,n){const i=_n.fromObject(n);return Qi(e,new Jt({fromUser:!1,fromServer:!0,queryId:null,tagged:!1},t,i))}function Wi(e,t){return Qi(e,new $t({fromUser:!1,fromServer:!0,queryId:null,tagged:!1},t))}function Ui(e,t,n){const i=er(e,n);if(i){const n=tr(i),r=n.path,s=n.queryId,o=De(r,t);return nr(e,r,new $t(Qt(s),o))}return[]}function Bi(e,t,n,i,r=!1){const s=t._path,o=e.syncPointTree_.get(s);let a=[];if(o&&('default'===t._queryIdentifier||xi(o,t))){const l=Pi(o,t,n,i);0===o.views.size&&(e.syncPointTree_=e.syncPointTree_.remove(s));const h=l.removed;if(a=l.events,!r){const n=-1!==h.findIndex(e=>e._queryParams.loadsAllData()),r=e.syncPointTree_.findOnPath(s,(e,t)=>Ri(t));if(n&&!r){const t=e.syncPointTree_.subtree(s);if(!t.isEmpty()){const n=ir(t);for(let t=0;t<n.length;++t){const i=n[t],r=i.query,s=Xi(e,i);e.listenProvider_.startListening(rr(r),Ji(e,r),s.hashFn,s.onComplete)}}}if(!r&&h.length>0&&!i)if(n){const n=null;e.listenProvider_.stopListening(rr(t),n)}else h.forEach(t=>{const n=e.queryToTagMap.get(Zi(t));e.listenProvider_.stopListening(rr(t),n)})}sr(e,h)}return a}function Hi(e,t,n,i){const r=er(e,i);if(null!=r){const i=tr(r),s=i.path,o=i.queryId,a=De(s,t);return nr(e,s,new Xt(Qt(o),a,n))}return[]}function Vi(e,t,n,i){const r=er(e,i);if(r){const i=tr(r),s=i.path,o=i.queryId,a=De(s,t),l=_n.fromObject(n);return nr(e,s,new Jt(Qt(o),a,l))}return[]}function zi(e,t,n,i=!1){const r=t._path;let s=null,o=!1;e.syncPointTree_.foreachOnPath(r,(e,t)=>{const n=De(e,r);s=s||Si(t,n),o=o||Ri(t)});let a,l=e.syncPointTree_.get(r);if(l?(o=o||Ri(l),s=s||Si(l,be())):(l=new bi,e.syncPointTree_=e.syncPointTree_.set(r,l)),null!=s)a=!0;else{a=!1,s=ft.EMPTY_NODE;e.syncPointTree_.subtree(r).foreachChild((e,t)=>{const n=Si(t,be());n&&(s=s.updateImmediateChild(e,n))})}const c=xi(l,t);if(!c&&!t._queryParams.loadsAllData()){const n=Zi(t);(0,h.assert)(!e.queryToTagMap.has(n),'View does not exist, but we have a tag');const i=Oi++;e.queryToTagMap.set(n,i),e.tagToQueryMap.set(i,n)}let u=ki(l,t,n,kn(e.pendingWriteTree_,r),s,a);if(!c&&!o&&!i){const n=Ni(l,t);u=u.concat(or(e,t,n))}return u}function Yi(e,t,n){const i=e.pendingWriteTree_,r=e.syncPointTree_.findOnPath(t,(e,n)=>{const i=Si(n,De(e,t));if(i)return i});return An(i,t,r,n,!0)}function Ki(e,t){const n=t._path;let i=null;e.syncPointTree_.foreachOnPath(n,(e,t)=>{const r=De(e,n);i=i||Si(t,r)});let r=e.syncPointTree_.get(n);r?i=i||Si(r,be()):(r=new bi,e.syncPointTree_=e.syncPointTree_.set(n,r));const s=null!=i,o=s?new Zt(i,!0,!1):null;return di(Ii(r,t,kn(e.pendingWriteTree_,t._path),s?o.getNode():ft.EMPTY_NODE,s))}function Qi(e,t){return Gi(t,e.syncPointTree_,null,kn(e.pendingWriteTree_,be()))}function Gi(e,t,n,i){if(Re(e.path))return $i(e,t,n,i);{const r=t.get(be());null==n&&null!=r&&(n=Si(r,be()));let s=[];const o=Te(e.path),a=e.operationForChild(o),l=t.children.get(o);if(l&&a){const e=n?n.getImmediateChild(o):null,t=Yn(i,o);s=s.concat(Gi(a,l,e,t))}return r&&(s=s.concat(Ti(r,e,i,n))),s}}function $i(e,t,n,i){const r=t.get(be());null==n&&null!=r&&(n=Si(r,be()));let s=[];return t.children.inorderTraversal((t,r)=>{const o=n?n.getImmediateChild(t):null,a=Yn(i,t),l=e.operationForChild(t);l&&(s=s.concat($i(l,r,o,a)))}),r&&(s=s.concat(Ti(r,e,i,n))),s}function Xi(e,t){const n=t.query,i=Ji(e,n);return{hashFn:()=>(ui(t)||ft.EMPTY_NODE).hash(),onComplete:t=>{if('ok'===t)return i?Ui(e,n._path,i):Wi(e,n._path);{const i=H(t,n);return Bi(e,n,null,i)}}}}function Ji(e,t){const n=Zi(t);return e.queryToTagMap.get(n)}function Zi(e){return e._path.toString()+'$'+e._queryIdentifier}function er(e,t){return e.tagToQueryMap.get(t)}function tr(e){const t=e.indexOf('$');return(0,h.assert)(-1!==t&&t<e.length-1,'Bad queryKey.'),{queryId:e.substr(t+1),path:new we(e.substr(0,t))}}function nr(e,t,n){const i=e.syncPointTree_.get(t);(0,h.assert)(i,"Missing sync point for query tag that we're tracking");return Ti(i,n,kn(e.pendingWriteTree_,t),null)}function ir(e){return e.fold((e,t,n)=>{if(t&&Ri(t)){return[Di(t)]}{let e=[];return t&&(e=Ei(t)),U(n,(t,n)=>{e=e.concat(n)}),e}})}function rr(e){return e._queryParams.loadsAllData()&&!e._queryParams.isDefault()?new((0,h.assert)(wi,'Reference.ts has not been loaded'),wi)(e._repo,e._path):e}function sr(e,t){for(let n=0;n<t.length;++n){const i=t[n];if(!i._queryParams.loadsAllData()){const t=Zi(i),n=e.queryToTagMap.get(t);e.queryToTagMap.delete(t),e.tagToQueryMap.delete(n)}}}function or(e,t,n){const i=t._path,r=Ji(e,t),s=Xi(e,n),o=e.listenProvider_.startListening(rr(t),r,s.hashFn,s.onComplete),a=e.syncPointTree_.subtree(i);if(r)(0,h.assert)(!Ri(a.value),"If we're adding a query, it shouldn't be shadowed");else{const t=a.fold((e,t,n)=>{if(!Re(e)&&t&&Ri(t))return[Di(t).query];{let e=[];return t&&(e=e.concat(Ei(t).map(e=>e.query))),U(n,(t,n)=>{e=e.concat(n)}),e}});for(let n=0;n<t.length;++n){const i=t[n];e.listenProvider_.stopListening(rr(i),Ji(e,i))}}return o}
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
   */class ar{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new ar(t)}node(){return this.node_}}class lr{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=xe(this.path_,e);return new lr(this.syncTree_,t)}node(){return Yi(this.syncTree_,this.path_)}}const hr=function(e){return(e=e||{}).timestamp=e.timestamp||(new Date).getTime(),e},cr=function(e,t,n){return e&&'object'==typeof e?((0,h.assert)('.sv'in e,'Unexpected leaf node or priority contents'),'string'==typeof e['.sv']?ur(e['.sv'],t,n):'object'==typeof e['.sv']?dr(e['.sv'],t):void(0,h.assert)(!1,'Unexpected server value: '+JSON.stringify(e,null,2))):e},ur=function(e,t,n){if('timestamp'===e)return n.timestamp;(0,h.assert)(!1,'Unexpected server value: '+e)},dr=function(e,t,n){e.hasOwnProperty('increment')||(0,h.assert)(!1,'Unexpected server value: '+JSON.stringify(e,null,2));const i=e.increment;'number'!=typeof i&&(0,h.assert)(!1,'Unexpected increment value: '+i);const r=t.node();if((0,h.assert)(null!=r,'Expected ChildrenNode.EMPTY_NODE for nulls'),!r.isLeafNode())return i;const s=r.getValue();return'number'!=typeof s?i:s+i},_r=function(e,t,n,i){return fr(t,new lr(n,e),i)},pr=function(e,t,n){return fr(e,new ar(t),n)};function fr(e,t,n){const i=e.getPriority().val(),r=cr(i,t.getImmediateChild('.priority'),n);let s;if(e.isLeafNode()){const i=e,s=cr(i.getValue(),t,n);return s!==i.getValue()||r!==i.getPriority().val()?new ot(s,yt(r)):e}{const i=e;return s=i,r!==i.getPriority().val()&&(s=s.updatePriority(new ot(r))),i.forEachChild(at,(e,i)=>{const r=fr(i,t.getImmediateChild(e),n);r!==i&&(s=s.updateImmediateChild(e,r))}),s}}
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
   */class mr{constructor(e="",t=null,n={children:{},childCount:0}){this.name=e,this.parent=t,this.node=n}}function gr(e,t){let n=t instanceof we?t:new we(t),i=e,r=Te(n);for(;null!==r;){const e=(0,h.safeGet)(i.node.children,r)||{children:{},childCount:0};i=new mr(r,i,e),n=ke(n),r=Te(n)}return i}function yr(e){return e.node.value}function vr(e,t){e.node.value=t,Pr(e)}function Cr(e){return e.node.childCount>0}function wr(e){return void 0===yr(e)&&!Cr(e)}function br(e,t){U(e.node.children,(n,i)=>{t(new mr(n,e,i))})}function Tr(e,t,n,i){n&&!i&&t(e),br(e,e=>{Tr(e,t,!0,i)}),n&&i&&t(e)}function Ir(e,t,n){let i=n?e:e.parent;for(;null!==i;){if(t(i))return!0;i=i.parent}return!1}function kr(e){return new we(null===e.parent?e.name:kr(e.parent)+'/'+e.name)}function Pr(e){null!==e.parent&&Er(e.parent,e.name,e)}function Er(e,t,n){const i=wr(n),r=(0,h.contains)(e.node.children,t);i&&r?(delete e.node.children[t],e.node.childCount--,Pr(e)):i||r||(e.node.children[t]=n.node,e.node.childCount++,Pr(e))}
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
   */const Sr=/[\[\].#$\/\u0000-\u001F\u007F]/,Nr=/[\[\].#$\u0000-\u001F\u007F]/,xr=10485760,Rr=function(e){return'string'==typeof e&&0!==e.length&&!Sr.test(e)},Dr=function(e){return'string'==typeof e&&0!==e.length&&!Nr.test(e)},Or=function(e){return e&&(e=e.replace(/^\/*\.info(\/|$)/,'/')),Dr(e)},Ar=function(e){return null===e||'string'==typeof e||'number'==typeof e&&!D(e)||e&&'object'==typeof e&&(0,h.contains)(e,'.sv')},Mr=function(e,t,n,i){i&&void 0===t||qr((0,h.errorPrefix)(e,'value'),t,n)},qr=function(e,t,n){const i=n instanceof we?new qe(n,e):n;if(void 0===t)throw new Error(e+'contains undefined '+We(i));if('function'==typeof t)throw new Error(e+'contains a function '+We(i)+' with contents = '+t.toString());if(D(t))throw new Error(e+'contains '+t.toString()+' '+We(i));if('string'==typeof t&&t.length>3495253.3333333335&&(0,h.stringLength)(t)>xr)throw new Error(e+'contains a string greater than '+xr+' utf8 bytes '+We(i)+" ('"+t.substring(0,50)+"...')");if(t&&'object'==typeof t){let n=!1,r=!1;if(U(t,(t,s)=>{if('.value'===t)n=!0;else if('.priority'!==t&&'.sv'!==t&&(r=!0,!Rr(t)))throw new Error(e+' contains an invalid key ('+t+') '+We(i)+".  Keys must be non-empty strings and can't contain \".\", \"#\", \"$\", \"/\", \"[\", or \"]\"");Fe(i,t),qr(e,s,i),Le(i)}),n&&r)throw new Error(e+' contains ".value" child '+We(i)+' in addition to actual children.')}},Fr=function(e,t){let n,i;for(n=0;n<t.length;n++){i=t[n];const r=Se(i);for(let t=0;t<r.length;t++)if('.priority'===r[t]&&t===r.length-1);else if(!Rr(r[t]))throw new Error(e+'contains an invalid key ('+r[t]+') in path '+i.toString()+". Keys must be non-empty strings and can't contain \".\", \"#\", \"$\", \"/\", \"[\", or \"]\"")}t.sort(Oe);let r=null;for(n=0;n<t.length;n++){if(i=t[n],null!==r&&Me(r,i))throw new Error(e+'contains a path '+r.toString()+' that is ancestor of another path '+i.toString());r=i}},Lr=function(e,t,n,i){if(i&&void 0===t)return;const r=(0,h.errorPrefix)(e,'values');if(!t||'object'!=typeof t||Array.isArray(t))throw new Error(r+' must be an object containing the children to replace.');const s=[];U(t,(e,t)=>{const i=new we(e);if(qr(r,t,xe(n,i)),'.priority'===Pe(i)&&!Ar(t))throw new Error(r+"contains an invalid value for '"+i.toString()+"', which must be a valid Firebase priority (a string, finite number, server value, or null).");s.push(i)}),Fr(r,s)},jr=function(e,t,n){if(!n||void 0!==t){if(D(t))throw new Error((0,h.errorPrefix)(e,'priority')+'is '+t.toString()+", but must be a valid Firebase priority (a string, finite number, server value, or null).");if(!Ar(t))throw new Error((0,h.errorPrefix)(e,'priority')+"must be a valid Firebase priority (a string, finite number, server value, or null).")}},Wr=function(e,t,n,i){if(!(i&&void 0===n||Rr(n)))throw new Error((0,h.errorPrefix)(e,t)+'was an invalid key = "'+n+"\".  Firebase keys must be non-empty strings and can't contain \".\", \"#\", \"$\", \"/\", \"[\", or \"]\").")},Ur=function(e,t,n,i){if(!(i&&void 0===n||Dr(n)))throw new Error((0,h.errorPrefix)(e,t)+'was an invalid path = "'+n+"\". Paths must be non-empty strings and can't contain \".\", \"#\", \"$\", \"[\", or \"]\"")},Br=function(e,t,n,i){n&&(n=n.replace(/^\/*\.info(\/|$)/,'/')),Ur(e,t,n,i)},Hr=function(e,t){if('.info'===Te(t))throw new Error(e+" failed = Can't modify data under /.info/")},Vr=function(e,t){const n=t.path.toString();if('string'!=typeof t.repoInfo.host||0===t.repoInfo.host.length||!Rr(t.repoInfo.namespace)&&'localhost'!==t.repoInfo.host.split(':')[0]||0!==n.length&&!Or(n))throw new Error((0,h.errorPrefix)(e,'url')+"must be a valid firebase URL and the path can't contain \".\", \"#\", \"$\", \"[\", or \"]\".")};
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
class zr{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function Yr(e,t){let n=null;for(let i=0;i<t.length;i++){const r=t[i],s=r.getPath();null===n||Ae(s,n.path)||(e.eventLists_.push(n),n=null),null===n&&(n={events:[],path:s}),n.events.push(r)}n&&e.eventLists_.push(n)}function Kr(e,t,n){Yr(e,n),Gr(e,e=>Ae(e,t))}function Qr(e,t,n){Yr(e,n),Gr(e,e=>Me(e,t)||Me(t,e))}function Gr(e,t){e.recursionDepth_++;let n=!0;for(let i=0;i<e.eventLists_.length;i++){const r=e.eventLists_[i];if(r){t(r.path)?($r(e.eventLists_[i]),e.eventLists_[i]=null):n=!1}}n&&(e.eventLists_=[]),e.recursionDepth_--}function $r(e){for(let t=0;t<e.events.length;t++){const n=e.events[t];if(null!==n){e.events[t]=null;const i=n.getEventRunner();I&&E('event: '+n.toString()),Y(i)}}}
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
   */const Xr='repo_interrupt',Jr=25;class Zr{constructor(e,t,n,i){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=n,this.appCheckProvider_=i,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new zr,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=Wt(),this.transactionQueueTree_=new mr,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?'https://':'http://')+this.repoInfo_.host}}function es(e,t,n){if(e.stats_=le(e.repoInfo_),e.forceRestClient_||('object'==typeof window&&window.navigator&&window.navigator.userAgent||'').search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0)e.server_=new Lt(e.repoInfo_,(t,n,i,r)=>{is(e,t,n,i,r)},e.authTokenProvider_,e.appCheckProvider_),setTimeout(()=>rs(e,!0),0);else{if(null!=n){if('object'!=typeof n)throw new Error('Only objects are supported for option databaseAuthVariableOverride');try{(0,h.stringify)(n)}catch(e){throw new Error('Invalid authOverride provided: '+e)}}e.persistentConnection_=new He(e.repoInfo_,t,(t,n,i,r)=>{is(e,t,n,i,r)},t=>{rs(e,t)},t=>{ss(e,t)},e.authTokenProvider_,e.appCheckProvider_,n),e.server_=e.persistentConnection_}e.authTokenProvider_.addTokenChangeListener(t=>{e.server_.refreshAuthToken(t)}),e.appCheckProvider_.addTokenChangeListener(t=>{e.server_.refreshAppCheckToken(t.token)}),e.statsReporter_=he(e.repoInfo_,()=>new Yt(e.stats_,e.server_)),e.infoData_=new jt,e.infoSyncTree_=new Ai({startListening:(t,n,i,r)=>{let s=[];const o=e.infoData_.getNode(t._path);return o.isEmpty()||(s=Li(e.infoSyncTree_,t._path,o),setTimeout(()=>{r('ok')},0)),s},stopListening:()=>{}}),os(e,'connected',!1),e.serverSyncTree_=new Ai({startListening:(t,n,i,r)=>(e.server_.listen(t,i,n,(n,i)=>{const s=r(n,i);Qr(e.eventQueue_,t._path,s)}),[]),stopListening:(t,n)=>{e.server_.unlisten(t,n)}})}function ts(e){const t=e.infoData_.getNode(new we('.info/serverTimeOffset')).val()||0;return(new Date).getTime()+t}function ns(e){return hr({timestamp:ts(e)})}function is(e,t,n,i,r){e.dataUpdateCount++;const s=new we(t);n=e.interceptServerDataCallback_?e.interceptServerDataCallback_(t,n):n;let o=[];if(r)if(i){const t=(0,h.map)(n,e=>yt(e));o=Vi(e.serverSyncTree_,s,t,r)}else{const t=yt(n);o=Hi(e.serverSyncTree_,s,t,r)}else if(i){const t=(0,h.map)(n,e=>yt(e));o=ji(e.serverSyncTree_,s,t)}else{const t=yt(n);o=Li(e.serverSyncTree_,s,t)}let a=s;o.length>0&&(a=Is(e,s)),Qr(e.eventQueue_,a,o)}function rs(e,t){os(e,'connected',t),!1===t&&us(e)}function ss(e,t){U(t,(t,n)=>{os(e,t,n)})}function os(e,t,n){const i=new we('/.info/'+t),r=yt(n);e.infoData_.updateSnapshot(i,r);const s=Li(e.infoSyncTree_,i,r);Qr(e.eventQueue_,i,s)}function as(e){return e.nextWriteId_++}function ls(e,t,n){const i=Ki(e.serverSyncTree_,t);return null!=i?Promise.resolve(i):e.server_.get(t).then(i=>{const r=yt(i).withIndex(t._queryParams.getIndex());let s;if(zi(e.serverSyncTree_,t,n,!0),t._queryParams.loadsAllData())s=Li(e.serverSyncTree_,t._path,r);else{const n=Ji(e.serverSyncTree_,t);s=Hi(e.serverSyncTree_,t._path,r,n)}return Qr(e.eventQueue_,t._path,s),Bi(e.serverSyncTree_,t,n,null,!0),r},n=>(ys(e,'get for query '+(0,h.stringify)(t)+' failed: '+n),Promise.reject(new Error(n))))}function hs(e,t,n,i,r){ys(e,'set',{path:t.toString(),value:n,priority:i});const s=ns(e),o=yt(n,i),a=Yi(e.serverSyncTree_,t),l=pr(o,a,s),h=as(e),c=Mi(e.serverSyncTree_,t,l,h,!0);Yr(e.eventQueue_,c),e.server_.put(t.toString(),o.val(!0),(n,i)=>{const s='ok'===n;s||R('set at '+t+' failed: '+n);const o=Fi(e.serverSyncTree_,h,!s);Qr(e.eventQueue_,t,o),vs(e,r,n,i)});const u=xs(e,t);Is(e,u),Qr(e.eventQueue_,u,[])}function cs(e,t,n,i){ys(e,'update',{path:t.toString(),value:n});let r=!0;const s=ns(e),o={};if(U(n,(n,i)=>{r=!1,o[n]=_r(xe(t,n),yt(i),e.serverSyncTree_,s)}),r)E("update() called with empty data.  Don't do anything."),vs(e,i,'ok',void 0);else{const r=as(e),s=qi(e.serverSyncTree_,t,o,r);Yr(e.eventQueue_,s),e.server_.merge(t.toString(),n,(n,s)=>{const o='ok'===n;o||R('update at '+t+' failed: '+n);const a=Fi(e.serverSyncTree_,r,!o),l=a.length>0?Is(e,t):t;Qr(e.eventQueue_,l,a),vs(e,i,n,s)}),U(n,n=>{const i=xs(e,xe(t,n));Is(e,i)}),Qr(e.eventQueue_,t,[])}}function us(e){ys(e,'onDisconnectEvents');const t=ns(e),n=Wt();Ht(e.onDisconnect_,be(),(i,r)=>{const s=_r(i,r,e.serverSyncTree_,t);Ut(n,i,s)});let i=[];Ht(n,be(),(t,n)=>{i=i.concat(Li(e.serverSyncTree_,t,n));const r=xs(e,t);Is(e,r)}),e.onDisconnect_=Wt(),Qr(e.eventQueue_,be(),i)}function ds(e,t,n,i){const r=yt(n);e.server_.onDisconnectPut(t.toString(),r.val(!0),(n,s)=>{'ok'===n&&Ut(e.onDisconnect_,t,r),vs(e,i,n,s)})}function _s(e,t,n,i,r){const s=yt(n,i);e.server_.onDisconnectPut(t.toString(),s.val(!0),(n,i)=>{'ok'===n&&Ut(e.onDisconnect_,t,s),vs(e,r,n,i)})}function ps(e,t,n,i){if((0,h.isEmpty)(n))return E("onDisconnect().update() called with empty data.  Don't do anything."),void vs(e,i,'ok',void 0);e.server_.onDisconnectMerge(t.toString(),n,(r,s)=>{'ok'===r&&U(n,(n,i)=>{const r=yt(i);Ut(e.onDisconnect_,xe(t,n),r)}),vs(e,i,r,s)})}function fs(e,t,n){let i;i='.info'===Te(t._path)?zi(e.infoSyncTree_,t,n):zi(e.serverSyncTree_,t,n),Kr(e.eventQueue_,t._path,i)}function ms(e,t,n){let i;i='.info'===Te(t._path)?Bi(e.infoSyncTree_,t,n):Bi(e.serverSyncTree_,t,n),Kr(e.eventQueue_,t._path,i)}function gs(e){e.persistentConnection_&&e.persistentConnection_.interrupt(Xr)}function ys(e,...t){let n='';e.persistentConnection_&&(n=e.persistentConnection_.id+':'),E(n,...t)}function vs(e,t,n,i){t&&Y(()=>{if('ok'===n)t(null);else{const e=(n||'error').toUpperCase();let r=e;i&&(r+=': '+i);const s=new Error(r);s.code=e,t(s)}})}function Cs(e,t,n,i,r,s){ys(e,'transaction on '+t);const o={path:t,update:n,onComplete:i,status:null,order:w(),applyLocally:s,retryCount:0,unwatcher:r,abortReason:null,currentWriteId:null,currentInputSnapshot:null,currentOutputSnapshotRaw:null,currentOutputSnapshotResolved:null},a=ws(e,t,void 0);o.currentInputSnapshot=a;const l=o.update(a.val());if(void 0===l)o.unwatcher(),o.currentOutputSnapshotRaw=null,o.currentOutputSnapshotResolved=null,o.onComplete&&o.onComplete(null,!1,o.currentInputSnapshot);else{qr('transaction failed: Data returned ',l,o.path),o.status=0;const n=gr(e.transactionQueueTree_,t),i=yr(n)||[];let r;if(i.push(o),vr(n,i),'object'==typeof l&&null!==l&&(0,h.contains)(l,'.priority'))r=(0,h.safeGet)(l,'.priority'),(0,h.assert)(Ar(r),"Invalid priority returned by transaction. Priority must be a valid string, finite number, server value, or null.");else{r=(Yi(e.serverSyncTree_,t)||ft.EMPTY_NODE).getPriority().val()}const s=ns(e),c=yt(l,r),u=pr(c,a,s);o.currentOutputSnapshotRaw=c,o.currentOutputSnapshotResolved=u,o.currentWriteId=as(e);const d=Mi(e.serverSyncTree_,t,u,o.currentWriteId,o.applyLocally);Qr(e.eventQueue_,t,d),bs(e,e.transactionQueueTree_)}}function ws(e,t,n){return Yi(e.serverSyncTree_,t,n)||ft.EMPTY_NODE}function bs(e,t=e.transactionQueueTree_){if(t||Ns(e,t),yr(t)){const n=Es(e,t);(0,h.assert)(n.length>0,'Sending zero length transaction queue');n.every(e=>0===e.status)&&Ts(e,kr(t),n)}else Cr(t)&&br(t,t=>{bs(e,t)})}function Ts(e,t,n){const i=n.map(e=>e.currentWriteId),r=ws(e,t,i);let s=r;const o=r.hash();for(let e=0;e<n.length;e++){const i=n[e];(0,h.assert)(0===i.status,'tryToSendTransactionQueue_: items in queue should all be run.'),i.status=1,i.retryCount++;const r=De(t,i.path);s=s.updateChild(r,i.currentOutputSnapshotRaw)}const a=s.val(!0),l=t;e.server_.put(l.toString(),a,i=>{ys(e,'transaction put response',{path:l.toString(),status:i});let r=[];if('ok'===i){const i=[];for(let t=0;t<n.length;t++)n[t].status=2,r=r.concat(Fi(e.serverSyncTree_,n[t].currentWriteId)),n[t].onComplete&&i.push(()=>n[t].onComplete(null,!0,n[t].currentOutputSnapshotResolved)),n[t].unwatcher();Ns(e,gr(e.transactionQueueTree_,t)),bs(e,e.transactionQueueTree_),Qr(e.eventQueue_,t,r);for(let e=0;e<i.length;e++)Y(i[e])}else{if('datastale'===i)for(let e=0;e<n.length;e++)3===n[e].status?n[e].status=4:n[e].status=0;else{R('transaction at '+l.toString()+' failed: '+i);for(let e=0;e<n.length;e++)n[e].status=4,n[e].abortReason=i}Is(e,t)}},o)}function Is(e,t){const n=Ps(e,t),i=kr(n);return ks(e,Es(e,n),i),i}function ks(e,t,n){if(0===t.length)return;const i=[];let r=[];const s=t.filter(e=>0===e.status).map(e=>e.currentWriteId);for(let o=0;o<t.length;o++){const a=t[o],l=De(n,a.path);let c,u=!1;if((0,h.assert)(null!==l,'rerunTransactionsUnderNode_: relativePath should not be null.'),4===a.status)u=!0,c=a.abortReason,r=r.concat(Fi(e.serverSyncTree_,a.currentWriteId,!0));else if(0===a.status)if(a.retryCount>=Jr)u=!0,c='maxretry',r=r.concat(Fi(e.serverSyncTree_,a.currentWriteId,!0));else{const n=ws(e,a.path,s);a.currentInputSnapshot=n;const i=t[o].update(n.val());if(void 0!==i){qr('transaction failed: Data returned ',i,a.path);let t=yt(i);'object'==typeof i&&null!=i&&(0,h.contains)(i,'.priority')||(t=t.updatePriority(n.getPriority()));const o=a.currentWriteId,l=ns(e),c=pr(t,n,l);a.currentOutputSnapshotRaw=t,a.currentOutputSnapshotResolved=c,a.currentWriteId=as(e),s.splice(s.indexOf(o),1),r=r.concat(Mi(e.serverSyncTree_,a.path,c,a.currentWriteId,a.applyLocally)),r=r.concat(Fi(e.serverSyncTree_,o,!0))}else u=!0,c='nodata',r=r.concat(Fi(e.serverSyncTree_,a.currentWriteId,!0))}Qr(e.eventQueue_,n,r),r=[],u&&(t[o].status=2,(function(e){setTimeout(e,Math.floor(0))})(t[o].unwatcher),t[o].onComplete&&('nodata'===c?i.push(()=>t[o].onComplete(null,!1,t[o].currentInputSnapshot)):i.push(()=>t[o].onComplete(new Error(c),!1,null))))}Ns(e,e.transactionQueueTree_);for(let e=0;e<i.length;e++)Y(i[e]);bs(e,e.transactionQueueTree_)}function Ps(e,t){let n,i=e.transactionQueueTree_;for(n=Te(t);null!==n&&void 0===yr(i);)i=gr(i,n),n=Te(t=ke(t));return i}function Es(e,t){const n=[];return Ss(e,t,n),n.sort((e,t)=>e.order-t.order),n}function Ss(e,t,n){const i=yr(t);if(i)for(let e=0;e<i.length;e++)n.push(i[e]);br(t,t=>{Ss(e,t,n)})}function Ns(e,t){const n=yr(t);if(n){let e=0;for(let t=0;t<n.length;t++)2!==n[t].status&&(n[e]=n[t],e++);n.length=e,vr(t,n.length>0?n:void 0)}br(t,t=>{Ns(e,t)})}function xs(e,t){const n=kr(Ps(e,t)),i=gr(e.transactionQueueTree_,t);return Ir(i,t=>{Rs(e,t)}),Rs(e,i),Tr(i,t=>{Rs(e,t)}),n}function Rs(e,t){const n=yr(t);if(n){const i=[];let r=[],s=-1;for(let t=0;t<n.length;t++)3===n[t].status||(1===n[t].status?((0,h.assert)(s===t-1,'All SENT items should be at beginning of queue.'),s=t,n[t].status=3,n[t].abortReason='set'):((0,h.assert)(0===n[t].status,'Unexpected transaction status in abort'),n[t].unwatcher(),r=r.concat(Fi(e.serverSyncTree_,n[t].currentWriteId,!0)),n[t].onComplete&&i.push(n[t].onComplete.bind(null,new Error('set'),!1,null))));-1===s?vr(t,void 0):n.length=s+1,Qr(e.eventQueue_,kr(t),r);for(let e=0;e<i.length;e++)Y(i[e])}}
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
   */function Ds(e){let t='';const n=e.split('/');for(let e=0;e<n.length;e++)if(n[e].length>0){let i=n[e];try{i=decodeURIComponent(i.replace(/\+/g,' '))}catch(e){}t+='/'+i}return t}function Os(e){const t={};'?'===e.charAt(0)&&(e=e.substring(1));for(const n of e.split('&')){if(0===n.length)continue;const i=n.split('=');2===i.length?t[decodeURIComponent(i[0])]=decodeURIComponent(i[1]):R(`Invalid query segment '${n}' in query '${e}'`)}return t}const As=function(e,t){const n=Ms(e),i=n.namespace;'firebase.com'===n.domain&&x(n.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),i&&'undefined'!==i||'localhost'===n.domain||x('Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com'),n.secure||'undefined'!=typeof window&&window.location&&window.location.protocol&&-1!==window.location.protocol.indexOf('https:')&&R("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().");const r='ws'===n.scheme||'wss'===n.scheme;return{repoInfo:new ne(n.host,n.secure,i,r,t,'',i!==n.subdomain),path:new we(n.pathString)}},Ms=function(e){let t='',n='',i='',r='',s='',o=!0,a='https',l=443;if('string'==typeof e){let h=e.indexOf('//');h>=0&&(a=e.substring(0,h-1),e=e.substring(h+2));let c=e.indexOf('/');-1===c&&(c=e.length);let u=e.indexOf('?');-1===u&&(u=e.length),t=e.substring(0,Math.min(c,u)),c<u&&(r=Ds(e.substring(c,u)));const d=Os(e.substring(Math.min(e.length,u)));h=t.indexOf(':'),h>=0?(o='https'===a||'wss'===a,l=parseInt(t.substring(h+1),10)):h=t.length;const _=t.slice(0,h);if('localhost'===_.toLowerCase())n='localhost';else if(_.split('.').length<=2)n=_;else{const e=t.indexOf('.');i=t.substring(0,e).toLowerCase(),n=t.substring(e+1),s=i}'ns'in d&&(s=d.ns)}return{host:t,port:l,domain:n,subdomain:i,secure:o,scheme:a,pathString:r,namespace:s}},qs='-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz',Fs=(function(){let e=0;const t=[];return function(n){const i=n===e;let r;e=n;const s=new Array(8);for(r=7;r>=0;r--)s[r]=qs.charAt(n%64),n=Math.floor(n/64);(0,h.assert)(0===n,'Cannot push at time == 0');let o=s.join('');if(i){for(r=11;r>=0&&63===t[r];r--)t[r]=0;t[r]++}else for(r=0;r<12;r++)t[r]=Math.floor(64*Math.random());for(r=0;r<12;r++)o+=qs.charAt(t[r]);return(0,h.assert)(20===o.length,'nextPushId: Length should be 20.'),o}})();
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
class Ls{constructor(e,t,n,i){this.eventType=e,this.eventRegistration=t,this.snapshot=n,this.prevName=i}getPath(){const e=this.snapshot.ref;return'value'===this.eventType?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+':'+this.eventType+':'+(0,h.stringify)(this.snapshot.exportVal())}}class js{constructor(e,t,n){this.eventRegistration=e,this.error=t,this.path=n}getPath(){return this.path}getEventType(){return'cancel'}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+':cancel'}}
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
   */class Ws{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return(0,h.assert)(this.hasCancelCallback,'Raising a cancel event on a listener with no cancel callback'),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||void 0!==this.snapshotCallback.userCallback&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}
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
   */class Us{constructor(e,t){this._repo=e,this._path=t}cancel(){const e=new h.Deferred;var t,n,i;return t=this._repo,n=this._path,i=e.wrapCallback(()=>{}),t.server_.onDisconnectCancel(n.toString(),(e,r)=>{'ok'===e&&Bt(t.onDisconnect_,n),vs(0,i,e,r)}),e.promise}remove(){Hr('OnDisconnect.remove',this._path);const e=new h.Deferred;return ds(this._repo,this._path,null,e.wrapCallback(()=>{})),e.promise}set(e){Hr('OnDisconnect.set',this._path),Mr('OnDisconnect.set',e,this._path,!1);const t=new h.Deferred;return ds(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}setWithPriority(e,t){Hr('OnDisconnect.setWithPriority',this._path),Mr('OnDisconnect.setWithPriority',e,this._path,!1),jr('OnDisconnect.setWithPriority',t,!1);const n=new h.Deferred;return _s(this._repo,this._path,e,t,n.wrapCallback(()=>{})),n.promise}update(e){Hr('OnDisconnect.update',this._path),Lr('OnDisconnect.update',e,this._path,!1);const t=new h.Deferred;return ps(this._repo,this._path,e,t.wrapCallback(()=>{})),t.promise}}
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
   */class Bs{constructor(e,t,n,i){this._repo=e,this._path=t,this._queryParams=n,this._orderByCalled=i}get key(){return Re(this._path)?null:Pe(this._path)}get ref(){return new Ys(this._repo,this._path)}get _queryIdentifier(){const e=Ft(this._queryParams),t=j(e);return'{}'===t?'default':t}get _queryObject(){return Ft(this._queryParams)}isEqual(e){if(!((e=(0,h.getModularInstance)(e))instanceof Bs))return!1;const t=this._repo===e._repo,n=Ae(this._path,e._path),i=this._queryIdentifier===e._queryIdentifier;return t&&n&&i}toJSON(){return this.toString()}toString(){return this._repo.toString()+Ee(this._path)}}function Hs(e,t){if(!0===e._orderByCalled)throw new Error(t+": You can't combine multiple orderBy calls.")}function Vs(e){let t=null,n=null;if(e.hasStart()&&(t=e.getIndexStartValue()),e.hasEnd()&&(n=e.getIndexEndValue()),e.getIndex()===Qe){const i="Query: When ordering by key, you may only pass one argument to startAt(), endAt(), or equalTo().",r="Query: When ordering by key, the argument passed to startAt(), startAfter(), endAt(), endBefore(), or equalTo() must be a string.";if(e.hasStart()){if(e.getIndexStartName()!==A)throw new Error(i);if('string'!=typeof t)throw new Error(r)}if(e.hasEnd()){if(e.getIndexEndName()!==M)throw new Error(i);if('string'!=typeof n)throw new Error(r)}}else if(e.getIndex()===at){if(null!=t&&!Ar(t)||null!=n&&!Ar(n))throw new Error("Query: When ordering by priority, the first argument passed to startAt(), startAfter() endAt(), endBefore(), or equalTo() must be a valid priority value (null, a number, or a string).")}else if((0,h.assert)(e.getIndex()instanceof vt||e.getIndex()===Ct,'unknown index type.'),null!=t&&'object'==typeof t||null!=n&&'object'==typeof n)throw new Error("Query: First argument passed to startAt(), startAfter(), endAt(), endBefore(), or equalTo() cannot be an object.")}function zs(e){if(e.hasStart()&&e.hasEnd()&&e.hasLimit()&&!e.hasAnchoredLimit())throw new Error("Query: Can't combine startAt(), startAfter(), endAt(), endBefore(), and limit(). Use limitToFirst() or limitToLast() instead.")}class Ys extends Bs{constructor(e,t){super(e,t,new St,!1)}get parent(){const e=Ne(this._path);return null===e?null:new Ys(this._repo,e)}get root(){let e=this;for(;null!==e.parent;)e=e.parent;return e}}class Ks{constructor(e,t,n){this._node=e,this.ref=t,this._index=n}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new we(e),n=$s(this.ref,e);return new Ks(this._node.getChild(t),n,at)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){if(this._node.isLeafNode())return!1;return!!this._node.forEachChild(this._index,(t,n)=>e(new Ks(n,$s(this.ref,t),at)))}hasChild(e){const t=new we(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return!this._node.isLeafNode()&&!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function Qs(e,t){return(e=(0,h.getModularInstance)(e))._checkNotDeleted('ref'),void 0!==t?$s(e._root,t):e._root}function Gs(e,t){(e=(0,h.getModularInstance)(e))._checkNotDeleted('refFromURL');const n=As(t,e._repo.repoInfo_.nodeAdmin);Vr('refFromURL',n);const i=n.repoInfo;return e._repo.repoInfo_.isCustomHost()||i.host===e._repo.repoInfo_.host||x("refFromURL: Host name does not match the current database: (found "+i.host+' but expected '+e._repo.repoInfo_.host+')'),Qs(e,n.path.toString())}function $s(e,t){return null===Te((e=(0,h.getModularInstance)(e))._path)?Br('child','path',t,!1):Ur('child','path',t,!1),new Ys(e._repo,xe(e._path,t))}function Xs(e){return e=(0,h.getModularInstance)(e),new Us(e._repo,e._path)}function Js(e,t){e=(0,h.getModularInstance)(e),Hr('push',e._path),Mr('push',t,e._path,!0);const n=ts(e._repo),i=Fs(n),r=$s(e,i),s=$s(e,i);let o;return o=null!=t?eo(s,t).then(()=>s):Promise.resolve(s),r.then=o.then.bind(o),r.catch=o.then.bind(o,void 0),r}function Zs(e){return Hr('remove',e._path),eo(e,null)}function eo(e,t){e=(0,h.getModularInstance)(e),Hr('set',e._path),Mr('set',t,e._path,!1);const n=new h.Deferred;return hs(e._repo,e._path,t,null,n.wrapCallback(()=>{})),n.promise}function to(e,t){e=(0,h.getModularInstance)(e),Hr('setPriority',e._path),jr('setPriority',t,!1);const n=new h.Deferred;return hs(e._repo,xe(e._path,'.priority'),t,null,n.wrapCallback(()=>{})),n.promise}function no(e,t,n){if(Hr('setWithPriority',e._path),Mr('setWithPriority',t,e._path,!1),jr('setWithPriority',n,!1),'.length'===e.key||'.keys'===e.key)throw'setWithPriority failed: '+e.key+' is a read-only object.';const i=new h.Deferred;return hs(e._repo,e._path,t,n,i.wrapCallback(()=>{})),i.promise}function io(e,t){Lr('update',t,e._path,!1);const n=new h.Deferred;return cs(e._repo,e._path,t,n.wrapCallback(()=>{})),n.promise}function ro(e){e=(0,h.getModularInstance)(e);const t=new Ws(()=>{}),n=new so(t);return ls(e._repo,e,n).then(t=>new Ks(t,new Ys(e._repo,e._path),e._queryParams.getIndex()))}class so{constructor(e){this.callbackContext=e}respondsTo(e){return'value'===e}createEvent(e,t){const n=t._queryParams.getIndex();return new Ls('value',this,new Ks(e.snapshotNode,new Ys(t._repo,t._path),n))}getEventRunner(e){return'cancel'===e.getEventType()?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new js(this,e,t):null}matches(e){return e instanceof so&&(!e.callbackContext||!this.callbackContext||e.callbackContext.matches(this.callbackContext))}hasAnyCallback(){return null!==this.callbackContext}}class oo{constructor(e,t){this.eventType=e,this.callbackContext=t}respondsTo(e){let t='children_added'===e?'child_added':e;return t='children_removed'===t?'child_removed':t,this.eventType===t}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new js(this,e,t):null}createEvent(e,t){(0,h.assert)(null!=e.childName,'Child events should have a childName.');const n=$s(new Ys(t._repo,t._path),e.childName),i=t._queryParams.getIndex();return new Ls(e.type,this,new Ks(e.snapshotNode,n,i),e.prevName)}getEventRunner(e){return'cancel'===e.getEventType()?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,e.prevName)}matches(e){return e instanceof oo&&(this.eventType===e.eventType&&(!this.callbackContext||!e.callbackContext||this.callbackContext.matches(e.callbackContext)))}hasAnyCallback(){return!!this.callbackContext}}function ao(e,t,n,i,r){let s;if('object'==typeof i&&(s=void 0,r=i),'function'==typeof i&&(s=i),r&&r.onlyOnce){const t=n,i=(n,i)=>{ms(e._repo,e,a),t(n,i)};i.userCallback=n.userCallback,i.context=n.context,n=i}const o=new Ws(n,s||void 0),a='value'===t?new so(o):new oo(t,o);return fs(e._repo,e,a),()=>ms(e._repo,e,a)}function lo(e,t,n,i){return ao(e,'value',t,n,i)}function ho(e,t,n,i){return ao(e,'child_added',t,n,i)}function co(e,t,n,i){return ao(e,'child_changed',t,n,i)}function uo(e,t,n,i){return ao(e,'child_moved',t,n,i)}function _o(e,t,n,i){return ao(e,'child_removed',t,n,i)}function po(e,t,n){let i=null;const r=n?new Ws(n):null;'value'===t?i=new so(r):t&&(i=new oo(t,r)),ms(e._repo,e,i)}class fo{}class mo extends fo{constructor(e,t){super(),this._value=e,this._key=t}_apply(e){Mr('endAt',this._value,e._path,!0);const t=Ot(e._queryParams,this._value,this._key);if(zs(t),Vs(t),e._queryParams.hasEnd())throw new Error("endAt: Starting point was already set (by another call to endAt, endBefore or equalTo).");return new Bs(e._repo,e._path,t,e._orderByCalled)}}function go(e,t){return Wr('endAt','key',t,!0),new mo(e,t)}class yo extends fo{constructor(e,t){super(),this._value=e,this._key=t}_apply(e){Mr('endBefore',this._value,e._path,!1);const t=At(e._queryParams,this._value,this._key);if(zs(t),Vs(t),e._queryParams.hasEnd())throw new Error("endBefore: Starting point was already set (by another call to endAt, endBefore or equalTo).");return new Bs(e._repo,e._path,t,e._orderByCalled)}}function vo(e,t){return Wr('endBefore','key',t,!0),new yo(e,t)}class Co extends fo{constructor(e,t){super(),this._value=e,this._key=t}_apply(e){Mr('startAt',this._value,e._path,!0);const t=Rt(e._queryParams,this._value,this._key);if(zs(t),Vs(t),e._queryParams.hasStart())throw new Error("startAt: Starting point was already set (by another call to startAt, startBefore or equalTo).");return new Bs(e._repo,e._path,t,e._orderByCalled)}}function wo(e=null,t){return Wr('startAt','key',t,!0),new Co(e,t)}class bo extends fo{constructor(e,t){super(),this._value=e,this._key=t}_apply(e){Mr('startAfter',this._value,e._path,!1);const t=Dt(e._queryParams,this._value,this._key);if(zs(t),Vs(t),e._queryParams.hasStart())throw new Error("startAfter: Starting point was already set (by another call to startAt, startAfter, or equalTo).");return new Bs(e._repo,e._path,t,e._orderByCalled)}}function To(e,t){return Wr('startAfter','key',t,!0),new bo(e,t)}class Io extends fo{constructor(e){super(),this._limit=e}_apply(e){if(e._queryParams.hasLimit())throw new Error("limitToFirst: Limit was already set (by another call to limitToFirst or limitToLast).");return new Bs(e._repo,e._path,Nt(e._queryParams,this._limit),e._orderByCalled)}}function ko(e){if('number'!=typeof e||Math.floor(e)!==e||e<=0)throw new Error('limitToFirst: First argument must be a positive integer.');return new Io(e)}class Po extends fo{constructor(e){super(),this._limit=e}_apply(e){if(e._queryParams.hasLimit())throw new Error("limitToLast: Limit was already set (by another call to limitToFirst or limitToLast).");return new Bs(e._repo,e._path,xt(e._queryParams,this._limit),e._orderByCalled)}}function Eo(e){if('number'!=typeof e||Math.floor(e)!==e||e<=0)throw new Error('limitToLast: First argument must be a positive integer.');return new Po(e)}class So extends fo{constructor(e){super(),this._path=e}_apply(e){Hs(e,'orderByChild');const t=new we(this._path);if(Re(t))throw new Error('orderByChild: cannot pass in empty path. Use orderByValue() instead.');const n=new vt(t),i=Mt(e._queryParams,n);return Vs(i),new Bs(e._repo,e._path,i,!0)}}function No(e){if('$key'===e)throw new Error('orderByChild: "$key" is invalid.  Use orderByKey() instead.');if('$priority'===e)throw new Error('orderByChild: "$priority" is invalid.  Use orderByPriority() instead.');if('$value'===e)throw new Error('orderByChild: "$value" is invalid.  Use orderByValue() instead.');return Ur('orderByChild','path',e,!1),new So(e)}class xo extends fo{_apply(e){Hs(e,'orderByKey');const t=Mt(e._queryParams,Qe);return Vs(t),new Bs(e._repo,e._path,t,!0)}}function Ro(){return new xo}class Do extends fo{_apply(e){Hs(e,'orderByPriority');const t=Mt(e._queryParams,at);return Vs(t),new Bs(e._repo,e._path,t,!0)}}function Oo(){return new Do}class Ao extends fo{_apply(e){Hs(e,'orderByValue');const t=Mt(e._queryParams,Ct);return Vs(t),new Bs(e._repo,e._path,t,!0)}}function Mo(){return new Ao}class qo extends fo{constructor(e,t){super(),this._value=e,this._key=t}_apply(e){if(Mr('equalTo',this._value,e._path,!1),e._queryParams.hasStart())throw new Error("equalTo: Starting point was already set (by another call to startAt/startAfter or equalTo).");if(e._queryParams.hasEnd())throw new Error("equalTo: Ending point was already set (by another call to endAt/endBefore or equalTo).");return new mo(this._value,this._key)._apply(new Co(this._value,this._key)._apply(e))}}function Fo(e,t){return Wr('equalTo','key',t,!0),new qo(e,t)}function Lo(e,...t){let n=(0,h.getModularInstance)(e);for(const e of t)n=e._apply(n);return n}!(function(e){(0,h.assert)(!Ci,'__referenceConstructor has already been defined'),Ci=e})(Ys),(function(e){(0,h.assert)(!wi,'__referenceConstructor has already been defined'),wi=e})(Ys);
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
   */
const jo='FIREBASE_DATABASE_EMULATOR_HOST',Wo={};let Uo=!1;function Bo(e,t,n,i){e.repoInfo_=new ne(`${t}:${n}`,!1,e.repoInfo_.namespace,e.repoInfo_.webSocketOnly,e.repoInfo_.nodeAdmin,e.repoInfo_.persistenceKey,e.repoInfo_.includeNamespaceInQueryParams,!0),i&&(e.authTokenProvider_=i)}function Ho(e,t,n,i,r){let s=i||e.options.databaseURL;void 0===s&&(e.options.projectId||x("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),E('Using default host for project ',e.options.projectId),s=`${e.options.projectId}-default-rtdb.firebaseio.com`);let o,a,l=As(s,r),h=l.repoInfo;'undefined'!=typeof process&&process.env&&(a=process.env[jo]),a?(o=!0,s=`http://${a}?ns=${h.namespace}`,l=As(s,r),h=l.repoInfo):o=!l.repoInfo.secure;const c=r&&o?new $($.OWNER):new G(e.name,e.options,t);Vr('Invalid Firebase Database URL',l),Re(l.path)||x("Database URL must point to the root of a Firebase Database (not including a child path).");const u=zo(h,e,c,new Q(e.name,n));return new Ko(u,e)}function Vo(e,t){const n=Wo[t];n&&n[e.key]===e||x(`Database ${t}(${e.repoInfo_}) has already been deleted.`),gs(e),delete n[e.key]}function zo(e,t,n,i){let r=Wo[t.name];r||(r={},Wo[t.name]=r);let s=r[e.toURLString()];return s&&x('Database initialized multiple times. Please make sure the format of the database URL matches with each database() call.'),s=new Zr(e,Uo,n,i),r[e.toURLString()]=s,s}function Yo(e){Uo=e}class Ko{constructor(e,t){this._repoInternal=e,this.app=t,this.type='database',this._instanceStarted=!1}get _repo(){return this._instanceStarted||(es(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new Ys(this._repo,be())),this._rootInternal}_delete(){return null!==this._rootInternal&&(Vo(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){null===this._rootInternal&&x('Cannot call '+e+' on a deleted database.')}}function Qo(){me.IS_TRANSPORT_INITIALIZED&&R('Transport has already been initialized. Please call this function before calling ref or setting up a listener')}function Go(){Qo(),de.forceDisallow()}function $o(){Qo(),fe.forceDisallow(),de.forceAllow()}function Xo(e=(0,a.getApp)(),t){const n=(0,a._getProvider)(e,'database').getImmediate({identifier:t});if(!n._instanceStarted){const e=(0,h.getDefaultEmulatorHostnameAndPort)('database');e&&Jo(n,...e)}return n}function Jo(e,t,n,i={}){(e=(0,h.getModularInstance)(e))._checkNotDeleted('useEmulator'),e._instanceStarted&&x('Cannot call useEmulator() after instance has already been initialized.');const r=e._repoInternal;let s;if(r.repoInfo_.nodeAdmin)i.mockUserToken&&x('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),s=new $($.OWNER);else if(i.mockUserToken){const t='string'==typeof i.mockUserToken?i.mockUserToken:(0,h.createMockUserToken)(i.mockUserToken,e.app.options.projectId);s=new $(t)}Bo(r,t,n,s)}function Zo(e){(e=(0,h.getModularInstance)(e))._checkNotDeleted('goOffline'),gs(e._repo)}function ea(e){var t;(e=(0,h.getModularInstance)(e))._checkNotDeleted('goOnline'),(t=e._repo).persistentConnection_&&t.persistentConnection_.resume(Xr)}function ta(e,t){P(e,t)}
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
   */
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
   */
const na={'.sv':'timestamp'};function ia(){return na}function ra(e){return{'.sv':{increment:e}}}
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
   */class sa{constructor(e,t){this.committed=e,this.snapshot=t}toJSON(){return{committed:this.committed,snapshot:this.snapshot.toJSON()}}}function oa(e,t,n){var i;if(e=(0,h.getModularInstance)(e),Hr('Reference.transaction',e._path),'.length'===e.key||'.keys'===e.key)throw'Reference.transaction failed: '+e.key+' is a read-only object.';const r=null===(i=null==n?void 0:n.applyLocally)||void 0===i||i,s=new h.Deferred,o=lo(e,()=>{});return Cs(e._repo,e._path,t,(t,n,i)=>{let r=null;t?s.reject(t):(r=new Ks(i,new Ys(e._repo,e._path),at),s.resolve(new sa(n,r)))},o,r),s.promise}
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
   */He.prototype.simpleListen=function(e,t){this.sendRequest('q',{p:e},t)},He.prototype.echo=function(e,t){this.sendRequest('echo',{d:e},t)};const aa=function(e){const t=He.prototype.put;return He.prototype.put=function(n,i,r,s){void 0!==s&&(s=e()),t.call(this,n,i,r,s)},function(){He.prototype.put=t}},la=function(e){Yo(e)};var ha;p(a.SDK_VERSION),(0,a._registerComponent)(new l.Component('database',(e,{instanceIdentifier:t})=>Ho(e.getProvider('app').getImmediate(),e.getProvider('auth-internal'),e.getProvider('app-check-internal'),t),"PUBLIC").setMultipleInstances(!0)),(0,a.registerVersion)(u,d,ha),(0,a.registerVersion)(u,d,'esm2017')