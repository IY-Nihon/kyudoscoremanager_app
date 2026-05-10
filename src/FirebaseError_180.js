/**
 * Module ID: 180
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 180);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"FirebaseError",{enumerable:!0,get:function(){return n.FirebaseError}}),Object.defineProperty(_e,"SDK_VERSION",{enumerable:!0,get:function(){return X}}),Object.defineProperty(_e,"_DEFAULT_ENTRY_NAME",{enumerable:!0,get:function(){return M}}),Object.defineProperty(_e,"_addComponent",{enumerable:!0,get:function(){return V}}),Object.defineProperty(_e,"_addOrOverwriteComponent",{enumerable:!0,get:function(){return q}}),Object.defineProperty(_e,"_apps",{enumerable:!0,get:function(){return T}}),Object.defineProperty(_e,"_clearComponents",{enumerable:!0,get:function(){return K}}),Object.defineProperty(_e,"_components",{enumerable:!0,get:function(){return R}}),Object.defineProperty(_e,"_getProvider",{enumerable:!0,get:function(){return J}}),Object.defineProperty(_e,"_registerComponent",{enumerable:!0,get:function(){return z}}),Object.defineProperty(_e,"_removeServiceInstance",{enumerable:!0,get:function(){return W}}),Object.defineProperty(_e,"deleteApp",{enumerable:!0,get:function(){return ae}}),Object.defineProperty(_e,"getApp",{enumerable:!0,get:function(){return ee}}),Object.defineProperty(_e,"getApps",{enumerable:!0,get:function(){return te}}),Object.defineProperty(_e,"initializeApp",{enumerable:!0,get:function(){return Z}}),Object.defineProperty(_e,"onLog",{enumerable:!0,get:function(){return ne}}),Object.defineProperty(_e,"registerVersion",{enumerable:!0,get:function(){return re}}),Object.defineProperty(_e,"setLogLevel",{enumerable:!0,get:function(){return ie}});var e=require("./Component_181"),t=require("./h_183"),n=require("./CONSTANTS_182"),o=require("./module_184");
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
class s{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(c(e)){const t=e.getImmediate();return`${t.library}/${t.version}`}return null}).filter(e=>e).join(' ')}}function c(e){const t=e.getComponent();return"VERSION"===(null==t?void 0:t.type)}const p="@firebase/app",h="0.9.13",f=new t.Logger('@firebase/app'),l="@firebase/app-compat",u="@firebase/analytics-compat",b="@firebase/analytics",w="@firebase/app-check-compat",_="@firebase/app-check",y="@firebase/auth",v="@firebase/auth-compat",C="@firebase/database",D="@firebase/database-compat",P="@firebase/functions",E="@firebase/functions-compat",O="@firebase/installations",j="@firebase/installations-compat",I="@firebase/messaging",S="@firebase/messaging-compat",$="@firebase/performance",A="@firebase/performance-compat",N="@firebase/remote-config",k="@firebase/remote-config-compat",B="@firebase/storage",F="@firebase/storage-compat",x="@firebase/firestore",H="@firebase/firestore-compat",L="firebase",M='[DEFAULT]',U={[p]:'fire-core',[l]:'fire-core-compat',[b]:'fire-analytics',[u]:'fire-analytics-compat',[_]:'fire-app-check',[w]:'fire-app-check-compat',[y]:'fire-auth',[v]:'fire-auth-compat',[C]:'fire-rtdb',[D]:'fire-rtdb-compat',[P]:'fire-fn',[E]:'fire-fn-compat',[O]:'fire-iid',[j]:'fire-iid-compat',[I]:'fire-fcm',[S]:'fire-fcm-compat',[$]:'fire-perf',[A]:'fire-perf-compat',[N]:'fire-rc',[k]:'fire-rc-compat',[B]:'fire-gcs',[F]:'fire-gcs-compat',[x]:'fire-fst',[H]:'fire-fst-compat','fire-js':'fire-js',[L]:'fire-js-all'},T=new Map,R=new Map;function V(e,t){try{e.container.addComponent(t)}catch(n){f.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function q(e,t){e.container.addOrOverwriteComponent(t)}function z(e){const t=e.name;if(R.has(t))return f.debug(`There were multiple attempts to register component ${t}.`),!1;R.set(t,e);for(const t of T.values())V(t,e);return!0}function J(e,t){const n=e.container.getProvider('heartbeat').getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}function W(e,t,n=M){J(e,t).clearInstance(n)}function K(){R.clear()}
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
   */const Y={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","no-options":'Need to provide options, when not being deployed to hosting via source.',"invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":'First argument to `onLog` must be null or a function.',"idb-open":'Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.',"idb-get":'Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.',"idb-set":'Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.',"idb-delete":'Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.'},G=new n.ErrorFactory('app','Firebase',Y);
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
class Q{constructor(t,n,o){this._isDeleted=!1,this._options=Object.assign({},t),this._config=Object.assign({},n),this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=o,this.container.addComponent(new e.Component('app',()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw G.create("app-deleted",{appName:this._name})}}
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
   */const X="9.23.0";function Z(t,o={}){let s=t;if('object'!=typeof o){o={name:o}}const c=Object.assign({name:M,automaticDataCollectionEnabled:!1},o),p=c.name;if('string'!=typeof p||!p)throw G.create("bad-app-name",{appName:String(p)});if(s||(s=(0,n.getDefaultAppConfig)()),!s)throw G.create("no-options");const h=T.get(p);if(h){if((0,n.deepEqual)(s,h.options)&&(0,n.deepEqual)(c,h.config))return h;throw G.create("duplicate-app",{appName:p})}const f=new e.ComponentContainer(p);for(const e of R.values())f.addComponent(e);const l=new Q(s,c,f);return T.set(p,l),l}function ee(e=M){const t=T.get(e);if(!t&&e===M&&(0,n.getDefaultAppConfig)())return Z();if(!t)throw G.create("no-app",{appName:e});return t}function te(){return Array.from(T.values())}async function ae(e){const t=e.name;T.has(t)&&(T.delete(t),await Promise.all(e.container.getProviders().map(e=>e.delete())),e.isDeleted=!0)}function re(t,n,o){var s;let c=null!==(s=U[t])&&void 0!==s?s:t;o&&(c+=`-${o}`);const p=c.match(/\s|\//),h=n.match(/\s|\//);if(p||h){const e=[`Unable to register library "${c}" with version "${n}":`];return p&&e.push(`library name "${c}" contains illegal characters (whitespace or "/")`),p&&h&&e.push('and'),h&&e.push(`version name "${n}" contains illegal characters (whitespace or "/")`),void f.warn(e.join(' '))}z(new e.Component(`${c}-version`,()=>({library:c,version:n}),"VERSION"))}function ne(e,n){if(null!==e&&'function'!=typeof e)throw G.create("invalid-log-argument");(0,t.setUserLogHandler)(e,n)}function ie(e){(0,t.setLogLevel)(e)}
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
   */const oe='firebase-heartbeat-store';let se=null;function ce(){return se||(se=(0,o.openDB)("firebase-heartbeat-database",1,{upgrade:(e,t)=>{if(0===t)e.createObjectStore(oe)}}).catch(e=>{throw G.create("idb-open",{originalErrorMessage:e.message})})),se}async function pe(e){try{const t=await ce();return await t.transaction(oe).objectStore(oe).get(fe(e))}catch(e){if(e instanceof n.FirebaseError)f.warn(e.message);else{const t=G.create("idb-get",{originalErrorMessage:null==e?void 0:e.message});f.warn(t.message)}}}async function he(e,t){try{const n=(await ce()).transaction(oe,'readwrite'),o=n.objectStore(oe);await o.put(t,fe(e)),await n.done}catch(e){if(e instanceof n.FirebaseError)f.warn(e.message);else{const t=G.create("idb-set",{originalErrorMessage:null==e?void 0:e.message});f.warn(t.message)}}}function fe(e){return`${e.name}!${e.options.appId}`}
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
   */class le{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider('app').getImmediate();this._storage=new de(t),this._heartbeatsCachePromise=this._storage.read().then(e=>(this._heartbeatsCache=e,e))}async triggerHeartbeat(){const e=this.container.getProvider('platform-logger').getImmediate().getPlatformInfoString(),t=ue();if(null===this._heartbeatsCache&&(this._heartbeatsCache=await this._heartbeatsCachePromise),this._heartbeatsCache.lastSentHeartbeatDate!==t&&!this._heartbeatsCache.heartbeats.some(e=>e.date===t))return this._heartbeatsCache.heartbeats.push({date:t,agent:e}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(e=>{const t=new Date(e.date).valueOf();return Date.now()-t<=2592e6}),this._storage.overwrite(this._heartbeatsCache)}async getHeartbeatsHeader(){if(null===this._heartbeatsCache&&await this._heartbeatsCachePromise,null===this._heartbeatsCache||0===this._heartbeatsCache.heartbeats.length)return'';const e=ue(),{heartbeatsToSend:t,unsentEntries:o}=be(this._heartbeatsCache.heartbeats),s=(0,n.base64urlEncodeWithoutPadding)(JSON.stringify({version:2,heartbeats:t}));return this._heartbeatsCache.lastSentHeartbeatDate=e,o.length>0?(this._heartbeatsCache.heartbeats=o,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}}function ue(){return(new Date).toISOString().substring(0,10)}function be(e,t=1024){const n=[];let o=e.slice();for(const s of e){const e=n.find(e=>e.agent===s.agent);if(e){if(e.dates.push(s.date),ge(n)>t){e.dates.pop();break}}else if(n.push({agent:s.agent,dates:[s.date]}),ge(n)>t){n.pop();break}o=o.slice(1)}return{heartbeatsToSend:n,unsentEntries:o}}class de{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return!!(0,n.isIndexedDBAvailable)()&&(0,n.validateIndexedDBOpenable)().then(()=>!0).catch(()=>!1)}async read(){if(await this._canUseIndexedDBPromise){return await pe(this.app)||{heartbeats:[]}}return{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){const n=await this.read();return he(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}}async add(e){var t;if(await this._canUseIndexedDBPromise){const n=await this.read();return he(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}}}function ge(e){return(0,n.base64urlEncodeWithoutPadding)(JSON.stringify({version:2,heartbeats:e})).length}
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
   */var me;me='',z(new e.Component('platform-logger',e=>new s(e),"PRIVATE")),z(new e.Component('heartbeat',e=>new le(e),"PRIVATE")),re(p,h,me),re(p,h,'esm2017'),re('fire-js','')