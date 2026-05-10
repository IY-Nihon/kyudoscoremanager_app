/**
 * Module ID: 189
 */
"use strict";

const e = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const t = require;
const n = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const r = (typeof id !== 'undefined' ? id : 189);
const s = module;
const i = exports;
const o = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(i,'__esModule',{value:!0}),Object.defineProperty(i,"AbstractUserDataWriter",{enumerable:!0,get:function(){return Ph}}),Object.defineProperty(i,"AggregateField",{enumerable:!0,get:function(){return _l}}),Object.defineProperty(i,"AggregateQuerySnapshot",{enumerable:!0,get:function(){return xl}}),Object.defineProperty(i,"Bytes",{enumerable:!0,get:function(){return Dl}}),Object.defineProperty(i,"CACHE_SIZE_UNLIMITED",{enumerable:!0,get:function(){return cl}}),Object.defineProperty(i,"CollectionReference",{enumerable:!0,get:function(){return Zu}}),Object.defineProperty(i,"DocumentReference",{enumerable:!0,get:function(){return Xu}}),Object.defineProperty(i,"DocumentSnapshot",{enumerable:!0,get:function(){return jh}}),Object.defineProperty(i,"FieldPath",{enumerable:!0,get:function(){return Cl}}),Object.defineProperty(i,"FieldValue",{enumerable:!0,get:function(){return Al}}),Object.defineProperty(i,"Firestore",{enumerable:!0,get:function(){return ul}}),Object.defineProperty(i,"FirestoreError",{enumerable:!0,get:function(){return D}}),Object.defineProperty(i,"GeoPoint",{enumerable:!0,get:function(){return kl}}),Object.defineProperty(i,"LoadBundleTask",{enumerable:!0,get:function(){return al}}),Object.defineProperty(i,"Query",{enumerable:!0,get:function(){return Ju}}),Object.defineProperty(i,"QueryCompositeFilterConstraint",{enumerable:!0,get:function(){return fh}}),Object.defineProperty(i,"QueryConstraint",{enumerable:!0,get:function(){return uh}}),Object.defineProperty(i,"QueryDocumentSnapshot",{enumerable:!0,get:function(){return zh}}),Object.defineProperty(i,"QueryEndAtConstraint",{enumerable:!0,get:function(){return Sh}}),Object.defineProperty(i,"QueryFieldFilterConstraint",{enumerable:!0,get:function(){return hh}}),Object.defineProperty(i,"QueryLimitConstraint",{enumerable:!0,get:function(){return wh}}),Object.defineProperty(i,"QueryOrderByConstraint",{enumerable:!0,get:function(){return ph}}),Object.defineProperty(i,"QuerySnapshot",{enumerable:!0,get:function(){return Gh}}),Object.defineProperty(i,"QueryStartAtConstraint",{enumerable:!0,get:function(){return Ih}}),Object.defineProperty(i,"SnapshotMetadata",{enumerable:!0,get:function(){return Uh}}),Object.defineProperty(i,"Timestamp",{enumerable:!0,get:function(){return z}}),Object.defineProperty(i,"Transaction",{enumerable:!0,get:function(){return _d}}),Object.defineProperty(i,"WriteBatch",{enumerable:!0,get:function(){return Td}}),Object.defineProperty(i,"_DatabaseId",{enumerable:!0,get:function(){return Et}}),Object.defineProperty(i,"_DocumentKey",{enumerable:!0,get:function(){return H}}),Object.defineProperty(i,"_EmptyAppCheckTokenProvider",{enumerable:!0,get:function(){return V}}),Object.defineProperty(i,"_EmptyAuthCredentialsProvider",{enumerable:!0,get:function(){return A}}),Object.defineProperty(i,"_FieldPath",{enumerable:!0,get:function(){return W}}),Object.defineProperty(i,"_TestingHooks",{enumerable:!0,get:function(){return Qr}}),Object.defineProperty(i,"_cast",{enumerable:!0,get:function(){return $u}}),Object.defineProperty(i,"_debugAssert",{enumerable:!0,get:function(){return S}}),Object.defineProperty(i,"_isBase64Available",{enumerable:!0,get:function(){return dt}}),Object.defineProperty(i,"_logWarn",{enumerable:!0,get:function(){return b}}),Object.defineProperty(i,"_validateIsNotUsedTogether",{enumerable:!0,get:function(){return ju}}),Object.defineProperty(i,"addDoc",{enumerable:!0,get:function(){return rd}}),Object.defineProperty(i,"aggregateFieldEqual",{enumerable:!0,get:function(){return qh}}),Object.defineProperty(i,"aggregateQuerySnapshotEqual",{enumerable:!0,get:function(){return Bh}}),Object.defineProperty(i,"and",{enumerable:!0,get:function(){return gh}}),Object.defineProperty(i,"arrayRemove",{enumerable:!0,get:function(){return Ad}}),Object.defineProperty(i,"arrayUnion",{enumerable:!0,get:function(){return Nd}}),Object.defineProperty(i,"average",{enumerable:!0,get:function(){return Vh}}),Object.defineProperty(i,"clearIndexedDbPersistence",{enumerable:!0,get:function(){return yl}}),Object.defineProperty(i,"collection",{enumerable:!0,get:function(){return el}}),Object.defineProperty(i,"collectionGroup",{enumerable:!0,get:function(){return tl}}),Object.defineProperty(i,"connectFirestoreEmulator",{enumerable:!0,get:function(){return Yu}}),Object.defineProperty(i,"count",{enumerable:!0,get:function(){return Lh}}),Object.defineProperty(i,"deleteDoc",{enumerable:!0,get:function(){return nd}}),Object.defineProperty(i,"deleteField",{enumerable:!0,get:function(){return Dd}}),Object.defineProperty(i,"disableNetwork",{enumerable:!0,get:function(){return bl}}),Object.defineProperty(i,"doc",{enumerable:!0,get:function(){return nl}}),Object.defineProperty(i,"documentId",{enumerable:!0,get:function(){return Nl}}),Object.defineProperty(i,"enableIndexedDbPersistence",{enumerable:!0,get:function(){return ml}}),Object.defineProperty(i,"enableMultiTabIndexedDbPersistence",{enumerable:!0,get:function(){return gl}}),Object.defineProperty(i,"enableNetwork",{enumerable:!0,get:function(){return vl}}),Object.defineProperty(i,"endAt",{enumerable:!0,get:function(){return xh}}),Object.defineProperty(i,"endBefore",{enumerable:!0,get:function(){return _h}}),Object.defineProperty(i,"ensureFirestoreConfigured",{enumerable:!0,get:function(){return dl}}),Object.defineProperty(i,"executeWrite",{enumerable:!0,get:function(){return od}}),Object.defineProperty(i,"getAggregateFromServer",{enumerable:!0,get:function(){return ud}}),Object.defineProperty(i,"getCountFromServer",{enumerable:!0,get:function(){return cd}}),Object.defineProperty(i,"getDoc",{enumerable:!0,get:function(){return Qh}}),Object.defineProperty(i,"getDocFromCache",{enumerable:!0,get:function(){return Hh}}),Object.defineProperty(i,"getDocFromServer",{enumerable:!0,get:function(){return Yh}}),Object.defineProperty(i,"getDocs",{enumerable:!0,get:function(){return Xh}}),Object.defineProperty(i,"getDocsFromCache",{enumerable:!0,get:function(){return Jh}}),Object.defineProperty(i,"getDocsFromServer",{enumerable:!0,get:function(){return Zh}}),Object.defineProperty(i,"getFirestore",{enumerable:!0,get:function(){return hl}}),Object.defineProperty(i,"increment",{enumerable:!0,get:function(){return kd}}),Object.defineProperty(i,"initializeFirestore",{enumerable:!0,get:function(){return ll}}),Object.defineProperty(i,"limit",{enumerable:!0,get:function(){return vh}}),Object.defineProperty(i,"limitToLast",{enumerable:!0,get:function(){return bh}}),Object.defineProperty(i,"loadBundle",{enumerable:!0,get:function(){return El}}),Object.defineProperty(i,"memoryEagerGarbageCollector",{enumerable:!0,get:function(){return md}}),Object.defineProperty(i,"memoryLocalCache",{enumerable:!0,get:function(){return pd}}),Object.defineProperty(i,"memoryLruGarbageCollector",{enumerable:!0,get:function(){return gd}}),Object.defineProperty(i,"namedQuery",{enumerable:!0,get:function(){return Tl}}),Object.defineProperty(i,"onSnapshot",{enumerable:!0,get:function(){return sd}}),Object.defineProperty(i,"onSnapshotsInSync",{enumerable:!0,get:function(){return id}}),Object.defineProperty(i,"or",{enumerable:!0,get:function(){return mh}}),Object.defineProperty(i,"orderBy",{enumerable:!0,get:function(){return yh}}),Object.defineProperty(i,"persistentLocalCache",{enumerable:!0,get:function(){return yd}}),Object.defineProperty(i,"persistentMultipleTabManager",{enumerable:!0,get:function(){return Id}}),Object.defineProperty(i,"persistentSingleTabManager",{enumerable:!0,get:function(){return bd}}),Object.defineProperty(i,"query",{enumerable:!0,get:function(){return lh}}),Object.defineProperty(i,"queryEqual",{enumerable:!0,get:function(){return sl}}),Object.defineProperty(i,"refEqual",{enumerable:!0,get:function(){return rl}}),Object.defineProperty(i,"runTransaction",{enumerable:!0,get:function(){return xd}}),Object.defineProperty(i,"serverTimestamp",{enumerable:!0,get:function(){return Cd}}),Object.defineProperty(i,"setDoc",{enumerable:!0,get:function(){return ed}}),Object.defineProperty(i,"setIndexConfiguration",{enumerable:!0,get:function(){return Pd}}),Object.defineProperty(i,"setLogLevel",{enumerable:!0,get:function(){return y}}),Object.defineProperty(i,"snapshotEqual",{enumerable:!0,get:function(){return $h}}),Object.defineProperty(i,"startAfter",{enumerable:!0,get:function(){return Th}}),Object.defineProperty(i,"startAt",{enumerable:!0,get:function(){return Eh}}),Object.defineProperty(i,"sum",{enumerable:!0,get:function(){return Rh}}),Object.defineProperty(i,"terminate",{enumerable:!0,get:function(){return Il}}),Object.defineProperty(i,"updateDoc",{enumerable:!0,get:function(){return td}}),Object.defineProperty(i,"waitForPendingWrites",{enumerable:!0,get:function(){return wl}}),Object.defineProperty(i,"where",{enumerable:!0,get:function(){return dh}}),Object.defineProperty(i,"writeBatch",{enumerable:!0,get:function(){return Od}});var a=require("./FirebaseError_180"),c=require("./Component_181"),u=require("./h_183"),l=require("./CONSTANTS_182"),h=require("./ErrorCode_190");const d="@firebase/firestore";
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
   */class f{constructor(e){this.uid=e}isAuthenticated(){return null!=this.uid}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}f.UNAUTHENTICATED=new f(null),f.GOOGLE_CREDENTIALS=new f("google-credentials-uid"),f.FIRST_PARTY=new f("first-party-uid"),f.MOCK_USER=new f("mock-user");
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
let m="9.23.0";
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
   */const g=new u.Logger("@firebase/firestore");function p(){return g.logLevel}function y(e){g.setLogLevel(e)}function w(e,...t){if(g.logLevel<=u.LogLevel.DEBUG){const n=t.map(I);g.debug(`Firestore (${m}): ${e}`,...n)}}function v(e,...t){if(g.logLevel<=u.LogLevel.ERROR){const n=t.map(I);g.error(`Firestore (${m}): ${e}`,...n)}}function b(e,...t){if(g.logLevel<=u.LogLevel.WARN){const n=t.map(I);g.warn(`Firestore (${m}): ${e}`,...n)}}function I(e){if("string"==typeof e)return e;try{return t=e,JSON.stringify(t)}catch(t){return e}
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
    */var t}
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
   */function E(e="Unexpected state"){const t=`FIRESTORE (${m}) INTERNAL ASSERTION FAILED: `+e;throw v(t),new Error(t)}function T(e,t){e||E()}function S(e,t){e||E()}function _(e,t){return e}
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
   */const x={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class D extends l.FirebaseError{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}
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
   */class C{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}
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
   */class N{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class A{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(f.UNAUTHENTICATED))}shutdown(){}}class k{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable(()=>t(this.token.user))}shutdown(){this.changeListener=null}}class O{constructor(e){this.t=e,this.currentUser=f.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){let n=this.i;const r=e=>this.i!==n?(n=this.i,t(e)):Promise.resolve();let s=new C;this.o=()=>{this.i++,this.currentUser=this.u(),s.resolve(),s=new C,e.enqueueRetryable(()=>r(this.currentUser))};const i=()=>{const t=s;e.enqueueRetryable(async()=>{await t.promise,await r(this.currentUser)})},o=e=>{w("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=e,this.auth.addAuthTokenListener(this.o),i()};this.t.onInit(e=>o(e)),setTimeout(()=>{if(!this.auth){const e=this.t.getImmediate({optional:!0});e?o(e):(w("FirebaseAuthCredentialsProvider","Auth not yet detected"),s.resolve(),s=new C)}},0),i()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(t=>this.i!==e?(w("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):t?(T("string"==typeof t.accessToken),new N(t.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.auth.removeAuthTokenListener(this.o)}u(){const e=this.auth&&this.auth.getUid();return T(null===e||"string"==typeof e),new f(e)}}class P{constructor(e,t,n){this.h=e,this.l=t,this.m=n,this.type="FirstParty",this.user=f.FIRST_PARTY,this.g=new Map}p(){return this.m?this.m():null}get headers(){this.g.set("X-Goog-AuthUser",this.h);const e=this.p();return e&&this.g.set("Authorization",e),this.l&&this.g.set("X-Goog-Iam-Authorization-Token",this.l),this.g}}class F{constructor(e,t,n){this.h=e,this.l=t,this.m=n}getToken(){return Promise.resolve(new P(this.h,this.l,this.m))}start(e,t){e.enqueueRetryable(()=>t(f.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class M{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class R{constructor(e){this.I=e,this.forceRefresh=!1,this.appCheck=null,this.T=null}start(e,t){const n=e=>{null!=e.error&&w("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${e.error.message}`);const n=e.token!==this.T;return this.T=e.token,w("FirebaseAppCheckTokenProvider",`Received ${n?"new":"existing"} token.`),n?t(e.token):Promise.resolve()};this.o=t=>{e.enqueueRetryable(()=>n(t))};const r=e=>{w("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=e,this.appCheck.addTokenListener(this.o)};this.I.onInit(e=>r(e)),setTimeout(()=>{if(!this.appCheck){const e=this.I.getImmediate({optional:!0});e?r(e):w("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(e=>e?(T("string"==typeof e.token),this.T=e.token,new M(e.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.appCheck.removeTokenListener(this.o)}}class V{getToken(){return Promise.resolve(new M(""))}invalidateToken(){}start(e,t){}shutdown(){}}
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
   */function L(e){const t="undefined"!=typeof self&&(self.crypto||self.msCrypto),n=new Uint8Array(e);if(t&&"function"==typeof t.getRandomValues)t.getRandomValues(n);else for(let t=0;t<e;t++)n[t]=Math.floor(256*Math.random());return n}
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
   */class q{static A(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(256/62);let n="";for(;n.length<20;){const r=L(40);for(let s=0;s<r.length;++s)n.length<20&&r[s]<t&&(n+=e.charAt(r[s]%62))}return n}}function B(e,t){return e<t?-1:e>t?1:0}function U(e,t,n){return e.length===t.length&&e.every((e,r)=>n(e,t[r]))}function j(e){return e+"\0"}
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
   */class z{constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new D(x.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new D(x.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<-62135596800)throw new D(x.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new D(x.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}static now(){return z.fromMillis(Date.now())}static fromDate(e){return z.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),n=Math.floor(1e6*(e-1e3*t));return new z(t,n)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/1e6}_compareTo(e){return this.seconds===e.seconds?B(this.nanoseconds,e.nanoseconds):B(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{seconds:this.seconds,nanoseconds:this.nanoseconds}}valueOf(){const e=this.seconds- -62135596800;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}
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
   */class G{constructor(e){this.timestamp=e}static fromTimestamp(e){return new G(e)}static min(){return new G(new z(0,0))}static max(){return new G(new z(253402300799,999999999))}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}
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
   */class K{constructor(e,t,n){void 0===t?t=0:t>e.length&&E(),void 0===n?n=e.length-t:n>e.length-t&&E(),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return 0===K.comparator(this,e)}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof K?e.forEach(e=>{t.push(e)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=void 0===e?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return 0===this.length}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const n=Math.min(e.length,t.length);for(let r=0;r<n;r++){const n=e.get(r),s=t.get(r);if(n<s)return-1;if(n>s)return 1}return e.length<t.length?-1:e.length>t.length?1:0}}class $ extends K{construct(e,t,n){return new $(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}static fromString(...e){const t=[];for(const n of e){if(n.indexOf("//")>=0)throw new D(x.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter(e=>e.length>0))}return new $(t)}static emptyPath(){return new $([])}}const Q=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class W extends K{construct(e,t,n){return new W(e,t,n)}static isValidIdentifier(e){return Q.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),W.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return 1===this.length&&"__name__"===this.get(0)}static keyField(){return new W(["__name__"])}static fromServerFormat(e){const t=[];let n="",r=0;const s=()=>{if(0===n.length)throw new D(x.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""};let i=!1;for(;r<e.length;){const t=e[r];if("\\"===t){if(r+1===e.length)throw new D(x.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const t=e[r+1];if("\\"!==t&&"."!==t&&"`"!==t)throw new D(x.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=t,r+=2}else"`"===t?(i=!i,r++):"."!==t||i?(n+=t,r++):(s(),r++)}if(s(),i)throw new D(x.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new W(t)}static emptyPath(){return new W([])}}
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
   */class H{constructor(e){this.path=e}static fromPath(e){return new H($.fromString(e))}static fromName(e){return new H($.fromString(e).popFirst(5))}static empty(){return new H($.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return null!==e&&0===$.comparator(this.path,e.path)}toString(){return this.path.toString()}static comparator(e,t){return $.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new H(new $(e.slice()))}}
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
   */class Y{constructor(e,t,n,r){this.indexId=e,this.collectionGroup=t,this.fields=n,this.indexState=r}}function X(e){return e.fields.find(e=>2===e.kind)}function J(e){return e.fields.filter(e=>2!==e.kind)}function Z(e,t){let n=B(e.collectionGroup,t.collectionGroup);if(0!==n)return n;for(let r=0;r<Math.min(e.fields.length,t.fields.length);++r)if(n=te(e.fields[r],t.fields[r]),0!==n)return n;return B(e.fields.length,t.fields.length)}Y.UNKNOWN_ID=-1;class ee{constructor(e,t){this.fieldPath=e,this.kind=t}}function te(e,t){const n=W.comparator(e.fieldPath,t.fieldPath);return 0!==n?n:B(e.kind,t.kind)}class ne{constructor(e,t){this.sequenceNumber=e,this.offset=t}static empty(){return new ne(0,ie.min())}}function re(e,t){const n=e.toTimestamp().seconds,r=e.toTimestamp().nanoseconds+1,s=G.fromTimestamp(1e9===r?new z(n+1,0):new z(n,r));return new ie(s,H.empty(),t)}function se(e){return new ie(e.readTime,e.key,-1)}class ie{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new ie(G.min(),H.empty(),-1)}static max(){return new ie(G.max(),H.empty(),-1)}}function oe(e,t){let n=e.readTime.compareTo(t.readTime);return 0!==n?n:(n=H.comparator(e.documentKey,t.documentKey),0!==n?n:B(e.largestBatchId,t.largestBatchId)
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
   */)}const ae="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class ce{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}
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
   */async function ue(e){if(e.code!==x.FAILED_PRECONDITION||e.message!==ae)throw e;w("LocalStore","Unexpectedly lost primary lease")}
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
   */class le{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)},e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&E(),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new le((n,r)=>{this.nextCallback=t=>{this.wrapSuccess(e,t).next(n,r)},this.catchCallback=e=>{this.wrapFailure(t,e).next(n,r)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{const t=e();return t instanceof le?t:le.resolve(t)}catch(e){return le.reject(e)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):le.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):le.reject(t)}static resolve(e){return new le((t,n)=>{t(e)})}static reject(e){return new le((t,n)=>{n(e)})}static waitFor(e){return new le((t,n)=>{let r=0,s=0,i=!1;e.forEach(e=>{++r,e.next(()=>{++s,i&&s===r&&t()},e=>n(e))}),i=!0,s===r&&t()})}static or(e){let t=le.resolve(!1);for(const n of e)t=t.next(e=>e?le.resolve(e):n());return t}static forEach(e,t){const n=[];return e.forEach((e,r)=>{n.push(t.call(this,e,r))}),this.waitFor(n)}static mapArray(e,t){return new le((n,r)=>{const s=e.length,i=new Array(s);let o=0;for(let a=0;a<s;a++){const c=a;t(e[c]).next(e=>{i[c]=e,++o,o===s&&n(i)},e=>r(e))}})}static doWhile(e,t){return new le((n,r)=>{const s=()=>{!0===e()?t().next(()=>{s()},r):n()};s()})}}
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
   */class he{constructor(e,t){this.action=e,this.transaction=t,this.aborted=!1,this.v=new C,this.transaction.oncomplete=()=>{this.v.resolve()},this.transaction.onabort=()=>{t.error?this.v.reject(new me(e,t.error)):this.v.resolve()},this.transaction.onerror=t=>{const n=ve(t.target.error);this.v.reject(new me(e,n))}}static open(e,t,n,r){try{return new he(t,e.transaction(r,n))}catch(e){throw new me(t,e)}}get R(){return this.v.promise}abort(e){e&&this.v.reject(e),this.aborted||(w("SimpleDb","Aborting transaction:",e?e.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}P(){const e=this.transaction;this.aborted||"function"!=typeof e.commit||e.commit()}store(e){const t=this.transaction.objectStore(e);return new pe(t)}}class de{constructor(e,t,n){this.name=e,this.version=t,this.V=n,12.2===de.S((0,l.getUA)())&&v("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}static delete(e){return w("SimpleDb","Removing database:",e),ye(window.indexedDB.deleteDatabase(e)).toPromise()}static D(){if(!(0,l.isIndexedDBAvailable)())return!1;if(de.C())return!0;const e=(0,l.getUA)(),t=de.S(e),n=0<t&&t<10,r=de.N(e),s=0<r&&r<4.5;return!(e.indexOf("MSIE ")>0||e.indexOf("Trident/")>0||e.indexOf("Edge/")>0||n||s)}static C(){var e;return"undefined"!=typeof process&&"YES"===(null===(e=process.env)||void 0===e?void 0:e.k)}static M(e,t){return e.store(t)}static S(e){const t=e.match(/i(?:phone|pad|pod) os ([\d_]+)/i),n=t?t[1].split("_").slice(0,2).join("."):"-1";return Number(n)}static N(e){const t=e.match(/Android ([\d.]+)/i),n=t?t[1].split(".").slice(0,2).join("."):"-1";return Number(n)}async $(e){return this.db||(w("SimpleDb","Opening database:",this.name),this.db=await new Promise((t,n)=>{const r=indexedDB.open(this.name,this.version);r.onsuccess=e=>{const n=e.target.result;t(n)},r.onblocked=()=>{n(new me(e,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},r.onerror=t=>{const r=t.target.error;"VersionError"===r.name?n(new D(x.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):"InvalidStateError"===r.name?n(new D(x.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+r)):n(new me(e,r))},r.onupgradeneeded=e=>{w("SimpleDb",'Database "'+this.name+'" requires upgrade from version:',e.oldVersion);const t=e.target.result;this.V.O(t,r.transaction,e.oldVersion,this.version).next(()=>{w("SimpleDb","Database upgrade to version "+this.version+" complete")})}})),this.F&&(this.db.onversionchange=e=>this.F(e)),this.db}B(e){this.F=e,this.db&&(this.db.onversionchange=t=>e(t))}async runTransaction(e,t,n,r){const s="readonly"===t;let i=0;for(;;){++i;try{this.db=await this.$(e);const t=he.open(this.db,e,s?"readonly":"readwrite",n),i=r(t).next(e=>(t.P(),e)).catch(e=>(t.abort(e),le.reject(e))).toPromise();return i.catch(()=>{}),await t.R,i}catch(e){const t=e,n="FirebaseError"!==t.name&&i<3;if(w("SimpleDb","Transaction failed with error:",t.message,"Retrying:",n),this.close(),!n)return Promise.reject(t)}}}close(){this.db&&this.db.close(),this.db=void 0}}class fe{constructor(e){this.L=e,this.q=!1,this.U=null}get isDone(){return this.q}get K(){return this.U}set cursor(e){this.L=e}done(){this.q=!0}G(e){this.U=e}delete(){return ye(this.L.delete())}}class me extends D{constructor(e,t){super(x.UNAVAILABLE,`IndexedDB transaction '${e}' failed: ${t}`),this.name="IndexedDbTransactionError"}}function ge(e){return"IndexedDbTransactionError"===e.name}class pe{constructor(e){this.store=e}put(e,t){let n;return void 0!==t?(w("SimpleDb","PUT",this.store.name,e,t),n=this.store.put(t,e)):(w("SimpleDb","PUT",this.store.name,"<auto-key>",e),n=this.store.put(e)),ye(n)}add(e){return w("SimpleDb","ADD",this.store.name,e,e),ye(this.store.add(e))}get(e){return ye(this.store.get(e)).next(t=>(void 0===t&&(t=null),w("SimpleDb","GET",this.store.name,e,t),t))}delete(e){return w("SimpleDb","DELETE",this.store.name,e),ye(this.store.delete(e))}count(){return w("SimpleDb","COUNT",this.store.name),ye(this.store.count())}j(e,t){const n=this.options(e,t);if(n.index||"function"!=typeof this.store.getAll){const e=this.cursor(n),t=[];return this.W(e,(e,n)=>{t.push(n)}).next(()=>t)}{const e=this.store.getAll(n.range);return new le((t,n)=>{e.onerror=e=>{n(e.target.error)},e.onsuccess=e=>{t(e.target.result)}})}}H(e,t){const n=this.store.getAll(e,null===t?void 0:t);return new le((e,t)=>{n.onerror=e=>{t(e.target.error)},n.onsuccess=t=>{e(t.target.result)}})}J(e,t){w("SimpleDb","DELETE ALL",this.store.name);const n=this.options(e,t);n.Y=!1;const r=this.cursor(n);return this.W(r,(e,t,n)=>n.delete())}X(e,t){let n;t?n=e:(n={},t=e);const r=this.cursor(n);return this.W(r,t)}Z(e){const t=this.cursor({});return new le((n,r)=>{t.onerror=e=>{const t=ve(e.target.error);r(t)},t.onsuccess=t=>{const r=t.target.result;r?e(r.primaryKey,r.value).next(e=>{e?r.continue():n()}):n()}})}W(e,t){const n=[];return new le((r,s)=>{e.onerror=e=>{s(e.target.error)},e.onsuccess=e=>{const s=e.target.result;if(!s)return void r();const i=new fe(s),o=t(s.primaryKey,s.value,i);if(o instanceof le){const e=o.catch(e=>(i.done(),le.reject(e)));n.push(e)}i.isDone?r():null===i.K?s.continue():s.continue(i.K)}}).next(()=>le.waitFor(n))}options(e,t){let n;return void 0!==e&&("string"==typeof e?n=e:t=e),{index:n,range:t}}cursor(e){let t="next";if(e.reverse&&(t="prev"),e.index){const n=this.store.index(e.index);return e.Y?n.openKeyCursor(e.range,t):n.openCursor(e.range,t)}return this.store.openCursor(e.range,t)}}function ye(e){return new le((t,n)=>{e.onsuccess=e=>{const n=e.target.result;t(n)},e.onerror=e=>{const t=ve(e.target.error);n(t)}})}let we=!1;function ve(e){const t=de.S((0,l.getUA)());if(t>=12.2&&t<13){const t="An internal error was encountered in the Indexed Database server";if(e.message.indexOf(t)>=0){const e=new D("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${t}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return we||(we=!0,setTimeout(()=>{throw e},0)),e}}return e}class be{constructor(e,t){this.asyncQueue=e,this.tt=t,this.task=null}start(){this.et(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return null!==this.task}et(e){w("IndexBackiller",`Scheduled in ${e}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",e,async()=>{this.task=null;try{w("IndexBackiller",`Documents written: ${await this.tt.nt()}`)}catch(e){ge(e)?w("IndexBackiller","Ignoring IndexedDB error during index backfill: ",e):await ue(e)}await this.et(6e4)})}}class Ie{constructor(e,t){this.localStore=e,this.persistence=t}async nt(e=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",t=>this.st(t,e))}st(e,t){const n=new Set;let r=t,s=!0;return le.doWhile(()=>!0===s&&r>0,()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(e).next(t=>{if(null!==t&&!n.has(t))return w("IndexBackiller",`Processing collection: ${t}`),this.it(e,t,r).next(e=>{r-=e,n.add(t)});s=!1})).next(()=>t-r)}it(e,t,n){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(e,t).next(r=>this.localStore.localDocuments.getNextDocuments(e,t,r,n).next(n=>{const s=n.changes;return this.localStore.indexManager.updateIndexEntries(e,s).next(()=>this.rt(r,n)).next(n=>(w("IndexBackiller",`Updating offset: ${n}`),this.localStore.indexManager.updateCollectionGroup(e,t,n))).next(()=>s.size)}))}rt(e,t){let n=e;return t.changes.forEach((e,t)=>{const r=se(t);oe(r,n)>0&&(n=r)}),new ie(n.readTime,n.documentKey,Math.max(t.batchId,e.largestBatchId))}}
/**
   * @license
   * Copyright 2018 Google LLC
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
   */class Ee{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=e=>this.ot(e),this.ut=e=>t.writeSequenceNumber(e))}ot(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ut&&this.ut(e),e}}function Te(e){return null==e}function Se(e){return 0===e&&1/e==-1/0}function _e(e){return"number"==typeof e&&Number.isInteger(e)&&!Se(e)&&e<=Number.MAX_SAFE_INTEGER&&e>=Number.MIN_SAFE_INTEGER}
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
   */function xe(e){let t="";for(let n=0;n<e.length;n++)t.length>0&&(t=Ce(t)),t=De(e.get(n),t);return Ce(t)}function De(e,t){let n=t;const r=e.length;for(let t=0;t<r;t++){const r=e.charAt(t);switch(r){case"\0":n+="\x01\x10";break;case"\x01":n+="\x01\x11";break;default:n+=r}}return n}function Ce(e){return e+"\x01\x01"}function Ne(e){const t=e.length;if(T(t>=2),2===t)return T("\x01"===e.charAt(0)&&"\x01"===e.charAt(1)),$.emptyPath();const n=t-2,r=[];let s="";for(let i=0;i<t;){const t=e.indexOf("\x01",i);switch((t<0||t>n)&&E(),e.charAt(t+1)){case"\x01":const n=e.substring(i,t);let o;0===s.length?o=n:(s+=n,o=s,s=""),r.push(o);break;case"\x10":s+=e.substring(i,t),s+="\0";break;case"\x11":s+=e.substring(i,t+1);break;default:E()}i=t+2}return new $(r)}
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
   */Ee.ct=-1;const Ae=["userId","batchId"];
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
   */function ke(e,t){return[e,xe(t)]}function Oe(e,t,n){return[e,xe(t),n]}const Pe={},Fe=["prefixPath","collectionGroup","readTime","documentId"],Me=["prefixPath","collectionGroup","documentId"],Re=["collectionGroup","readTime","prefixPath","documentId"],Ve=["canonicalId","targetId"],Le=["targetId","path"],qe=["path","targetId"],Be=["collectionId","parent"],Ue=["indexId","uid"],je=["uid","sequenceNumber"],ze=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],Ge=["indexId","uid","orderedDocumentKey"],Ke=["userId","collectionPath","documentId"],$e=["userId","collectionPath","largestBatchId"],Qe=["userId","collectionGroup","largestBatchId"],We=["mutationQueues","mutations","documentMutations","remoteDocuments","targets","owner","targetGlobal","targetDocuments","clientMetadata","remoteDocumentGlobal","collectionParents","bundles","namedQueries"],He=[...We,"documentOverlays"],Ye=["mutationQueues","mutations","documentMutations","remoteDocumentsV14","targets","owner","targetGlobal","targetDocuments","clientMetadata","remoteDocumentGlobal","collectionParents","bundles","namedQueries","documentOverlays"],Xe=Ye,Je=[...Xe,"indexConfiguration","indexState","indexEntries"];
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
   */class Ze extends ce{constructor(e,t){super(),this.ht=e,this.currentSequenceNumber=t}}function et(e,t){const n=_(e);return de.M(n.ht,t)}
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
   */function tt(e){let t=0;for(const n in e)Object.prototype.hasOwnProperty.call(e,n)&&t++;return t}function nt(e,t){for(const n in e)Object.prototype.hasOwnProperty.call(e,n)&&t(n,e[n])}function rt(e){for(const t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}
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
   */class st{constructor(e,t){this.comparator=e,this.root=t||ot.EMPTY}insert(e,t){return new st(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,ot.BLACK,null,null))}remove(e){return new st(this.comparator,this.root.remove(e,this.comparator).copy(null,null,ot.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const n=this.comparator(e,t.key);if(0===n)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){const r=this.comparator(e,n.key);if(0===r)return t+n.left.size;r<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,n)=>(e(t,n),!1))}toString(){const e=[];return this.inorderTraversal((t,n)=>(e.push(`${t}:${n}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new it(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new it(this.root,e,this.comparator,!1)}getReverseIterator(){return new it(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new it(this.root,e,this.comparator,!0)}}class it{constructor(e,t,n,r){this.isReverse=r,this.nodeStack=[];let s=1;for(;!e.isEmpty();)if(s=t?n(e.key,t):1,t&&r&&(s*=-1),s<0)e=this.isReverse?e.left:e.right;else{if(0===s){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(0===this.nodeStack.length)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class ot{constructor(e,t,n,r,s){this.key=e,this.value=t,this.color=null!=n?n:ot.RED,this.left=null!=r?r:ot.EMPTY,this.right=null!=s?s:ot.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,r,s){return new ot(null!=e?e:this.key,null!=t?t:this.value,null!=n?n:this.color,null!=r?r:this.left,null!=s?s:this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let r=this;const s=n(e,r.key);return r=s<0?r.copy(null,null,null,r.left.insert(e,t,n),null):0===s?r.copy(null,t,null,null,null):r.copy(null,null,null,null,r.right.insert(e,t,n)),r.fixUp()}removeMin(){if(this.left.isEmpty())return ot.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,r=this;if(t(e,r.key)<0)r.left.isEmpty()||r.left.isRed()||r.left.left.isRed()||(r=r.moveRedLeft()),r=r.copy(null,null,null,r.left.remove(e,t),null);else{if(r.left.isRed()&&(r=r.rotateRight()),r.right.isEmpty()||r.right.isRed()||r.right.left.isRed()||(r=r.moveRedRight()),0===t(e,r.key)){if(r.right.isEmpty())return ot.EMPTY;n=r.right.min(),r=r.copy(n.key,n.value,null,null,r.right.removeMin())}r=r.copy(null,null,null,null,r.right.remove(e,t))}return r.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,ot.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,ot.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw E();if(this.right.isRed())throw E();const e=this.left.check();if(e!==this.right.check())throw E();return e+(this.isRed()?0:1)}}ot.EMPTY=null,ot.RED=!0,ot.BLACK=!1,ot.EMPTY=new class{constructor(){this.size=0}get key(){throw E()}get value(){throw E()}get color(){throw E()}get left(){throw E()}get right(){throw E()}copy(e,t,n,r,s){return this}insert(e,t,n){return new ot(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};
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
class at{constructor(e){this.comparator=e,this.data=new st(this.comparator)}has(e){return null!==this.data.get(e)}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,n)=>(e(t),!1))}forEachInRange(e,t){const n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){const r=n.getNext();if(this.comparator(r.key,e[1])>=0)return;t(r.key)}}forEachWhile(e,t){let n;for(n=void 0!==t?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new ct(this.data.getIterator())}getIteratorFrom(e){return new ct(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(e=>{t=t.add(e)}),t}isEqual(e){if(!(e instanceof at))return!1;if(this.size!==e.size)return!1;const t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){const e=t.getNext().key,r=n.getNext().key;if(0!==this.comparator(e,r))return!1}return!0}toArray(){const e=[];return this.forEach(t=>{e.push(t)}),e}toString(){const e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){const t=new at(this.comparator);return t.data=e,t}}class ct{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function ut(e){return e.hasNext()?e.getNext():void 0}
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
   */class lt{constructor(e){this.fields=e,e.sort(W.comparator)}static empty(){return new lt([])}unionWith(e){let t=new at(W.comparator);for(const e of this.fields)t=t.add(e);for(const n of e)t=t.add(n);return new lt(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return U(this.fields,e.fields,(e,t)=>e.isEqual(t))}}
/**
   * @license
   * Copyright 2023 Google LLC
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
   */class ht extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}
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
   */function dt(){return"undefined"!=typeof atob}
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
   */class ft{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(e){try{return atob(e)}catch(e){throw"undefined"!=typeof DOMException&&e instanceof DOMException?new ht("Invalid base64 string: "+e):e}})(e);return new ft(t)}static fromUint8Array(e){const t=(function(e){let t="";for(let n=0;n<e.length;++n)t+=String.fromCharCode(e[n]);return t})(e);return new ft(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return e=this.binaryString,btoa(e);var e}toUint8Array(){return(function(e){const t=new Uint8Array(e.length);for(let n=0;n<e.length;n++)t[n]=e.charCodeAt(n);return t}
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
      */)(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return B(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}ft.EMPTY_BYTE_STRING=new ft("");const mt=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function gt(e){if(T(!!e),"string"==typeof e){let t=0;const n=mt.exec(e);if(T(!!n),n[1]){let e=n[1];e=(e+"000000000").substr(0,9),t=Number(e)}const r=new Date(e);return{seconds:Math.floor(r.getTime()/1e3),nanos:t}}return{seconds:pt(e.seconds),nanos:pt(e.nanos)}}function pt(e){return"number"==typeof e?e:"string"==typeof e?Number(e):0}function yt(e){return"string"==typeof e?ft.fromBase64String(e):ft.fromUint8Array(e)}
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
   */function wt(e){var t,n;return"server_timestamp"===(null===(n=((null===(t=null==e?void 0:e.mapValue)||void 0===t?void 0:t.fields)||{}).__type__)||void 0===n?void 0:n.stringValue)}function vt(e){const t=e.mapValue.fields.__previous_value__;return wt(t)?vt(t):t}function bt(e){const t=gt(e.mapValue.fields.__local_write_time__.timestampValue);return new z(t.seconds,t.nanos)}
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
   */class It{constructor(e,t,n,r,s,i,o,a,c){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=r,this.ssl=s,this.forceLongPolling=i,this.autoDetectLongPolling=o,this.longPollingOptions=a,this.useFetchStreams=c}}class Et{constructor(e,t){this.projectId=e,this.database=t||"(default)"}static empty(){return new Et("","")}get isDefaultDatabase(){return"(default)"===this.database}isEqual(e){return e instanceof Et&&e.projectId===this.projectId&&e.database===this.database}}
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
   */const Tt={mapValue:{fields:{__type__:{stringValue:"__max__"}}}},St={nullValue:"NULL_VALUE"};function _t(e){return"nullValue"in e?0:"booleanValue"in e?1:"integerValue"in e||"doubleValue"in e?2:"timestampValue"in e?3:"stringValue"in e?5:"bytesValue"in e?6:"referenceValue"in e?7:"geoPointValue"in e?8:"arrayValue"in e?9:"mapValue"in e?wt(e)?4:Bt(e)?9007199254740991:10:E()}function xt(e,t){if(e===t)return!0;const n=_t(e);if(n!==_t(t))return!1;switch(n){case 0:case 9007199254740991:return!0;case 1:return e.booleanValue===t.booleanValue;case 4:return bt(e).isEqual(bt(t));case 3:return(function(e,t){if("string"==typeof e.timestampValue&&"string"==typeof t.timestampValue&&e.timestampValue.length===t.timestampValue.length)return e.timestampValue===t.timestampValue;const n=gt(e.timestampValue),r=gt(t.timestampValue);return n.seconds===r.seconds&&n.nanos===r.nanos})(e,t);case 5:return e.stringValue===t.stringValue;case 6:return(function(e,t){return yt(e.bytesValue).isEqual(yt(t.bytesValue))})(e,t);case 7:return e.referenceValue===t.referenceValue;case 8:return(function(e,t){return pt(e.geoPointValue.latitude)===pt(t.geoPointValue.latitude)&&pt(e.geoPointValue.longitude)===pt(t.geoPointValue.longitude)})(e,t);case 2:return(function(e,t){if("integerValue"in e&&"integerValue"in t)return pt(e.integerValue)===pt(t.integerValue);if("doubleValue"in e&&"doubleValue"in t){const n=pt(e.doubleValue),r=pt(t.doubleValue);return n===r?Se(n)===Se(r):isNaN(n)&&isNaN(r)}return!1})(e,t);case 9:return U(e.arrayValue.values||[],t.arrayValue.values||[],xt);case 10:return(function(e,t){const n=e.mapValue.fields||{},r=t.mapValue.fields||{};if(tt(n)!==tt(r))return!1;for(const e in n)if(n.hasOwnProperty(e)&&(void 0===r[e]||!xt(n[e],r[e])))return!1;return!0})(e,t);default:return E()}}function Dt(e,t){return void 0!==(e.values||[]).find(e=>xt(e,t))}function Ct(e,t){if(e===t)return 0;const n=_t(e),r=_t(t);if(n!==r)return B(n,r);switch(n){case 0:case 9007199254740991:return 0;case 1:return B(e.booleanValue,t.booleanValue);case 2:return(function(e,t){const n=pt(e.integerValue||e.doubleValue),r=pt(t.integerValue||t.doubleValue);return n<r?-1:n>r?1:n===r?0:isNaN(n)?isNaN(r)?0:-1:1})(e,t);case 3:return Nt(e.timestampValue,t.timestampValue);case 4:return Nt(bt(e),bt(t));case 5:return B(e.stringValue,t.stringValue);case 6:return(function(e,t){const n=yt(e),r=yt(t);return n.compareTo(r)})(e.bytesValue,t.bytesValue);case 7:return(function(e,t){const n=e.split("/"),r=t.split("/");for(let e=0;e<n.length&&e<r.length;e++){const t=B(n[e],r[e]);if(0!==t)return t}return B(n.length,r.length)})(e.referenceValue,t.referenceValue);case 8:return(function(e,t){const n=B(pt(e.latitude),pt(t.latitude));return 0!==n?n:B(pt(e.longitude),pt(t.longitude))})(e.geoPointValue,t.geoPointValue);case 9:return(function(e,t){const n=e.values||[],r=t.values||[];for(let e=0;e<n.length&&e<r.length;++e){const t=Ct(n[e],r[e]);if(t)return t}return B(n.length,r.length)})(e.arrayValue,t.arrayValue);case 10:return(function(e,t){if(e===Tt.mapValue&&t===Tt.mapValue)return 0;if(e===Tt.mapValue)return 1;if(t===Tt.mapValue)return-1;const n=e.fields||{},r=Object.keys(n),s=t.fields||{},i=Object.keys(s);r.sort(),i.sort();for(let e=0;e<r.length&&e<i.length;++e){const t=B(r[e],i[e]);if(0!==t)return t;const o=Ct(n[r[e]],s[i[e]]);if(0!==o)return o}return B(r.length,i.length)})(e.mapValue,t.mapValue);default:throw E()}}function Nt(e,t){if("string"==typeof e&&"string"==typeof t&&e.length===t.length)return B(e,t);const n=gt(e),r=gt(t),s=B(n.seconds,r.seconds);return 0!==s?s:B(n.nanos,r.nanos)}function At(e){return kt(e)}function kt(e){return"nullValue"in e?"null":"booleanValue"in e?""+e.booleanValue:"integerValue"in e?""+e.integerValue:"doubleValue"in e?""+e.doubleValue:"timestampValue"in e?(function(e){const t=gt(e);return`time(${t.seconds},${t.nanos})`})(e.timestampValue):"stringValue"in e?e.stringValue:"bytesValue"in e?yt(e.bytesValue).toBase64():"referenceValue"in e?(n=e.referenceValue,H.fromName(n).toString()):"geoPointValue"in e?`geo(${(t=e.geoPointValue).latitude},${t.longitude})`:"arrayValue"in e?(function(e){let t="[",n=!0;for(const r of e.values||[])n?n=!1:t+=",",t+=kt(r);return t+"]"})(e.arrayValue):"mapValue"in e?(function(e){const t=Object.keys(e.fields||{}).sort();let n="{",r=!0;for(const s of t)r?r=!1:n+=",",n+=`${s}:${kt(e.fields[s])}`;return n+"}"})(e.mapValue):E();var t,n}function Ot(e){switch(_t(e)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const t=vt(e);return t?16+Ot(t):16;case 5:return 2*e.stringValue.length;case 6:return yt(e.bytesValue).approximateByteSize();case 7:return e.referenceValue.length;case 9:return(e.arrayValue.values||[]).reduce((e,t)=>e+Ot(t),0);case 10:return(function(e){let t=0;return nt(e.fields,(e,n)=>{t+=e.length+Ot(n)}),t})(e.mapValue);default:throw E()}}function Pt(e,t){return{referenceValue:`projects/${e.projectId}/databases/${e.database}/documents/${t.path.canonicalString()}`}}function Ft(e){return!!e&&"integerValue"in e}function Mt(e){return!!e&&"arrayValue"in e}function Rt(e){return!!e&&"nullValue"in e}function Vt(e){return!!e&&"doubleValue"in e&&isNaN(Number(e.doubleValue))}function Lt(e){return!!e&&"mapValue"in e}function qt(e){if(e.geoPointValue)return{geoPointValue:Object.assign({},e.geoPointValue)};if(e.timestampValue&&"object"==typeof e.timestampValue)return{timestampValue:Object.assign({},e.timestampValue)};if(e.mapValue){const t={mapValue:{fields:{}}};return nt(e.mapValue.fields,(e,n)=>t.mapValue.fields[e]=qt(n)),t}if(e.arrayValue){const t={arrayValue:{values:[]}};for(let n=0;n<(e.arrayValue.values||[]).length;++n)t.arrayValue.values[n]=qt(e.arrayValue.values[n]);return t}return Object.assign({},e)}function Bt(e){return"__max__"===(((e.mapValue||{}).fields||{}).__type__||{}).stringValue}function Ut(e){return"nullValue"in e?St:"booleanValue"in e?{booleanValue:!1}:"integerValue"in e||"doubleValue"in e?{doubleValue:NaN}:"timestampValue"in e?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in e?{stringValue:""}:"bytesValue"in e?{bytesValue:""}:"referenceValue"in e?Pt(Et.empty(),H.empty()):"geoPointValue"in e?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in e?{arrayValue:{}}:"mapValue"in e?{mapValue:{}}:E()}function jt(e){return"nullValue"in e?{booleanValue:!1}:"booleanValue"in e?{doubleValue:NaN}:"integerValue"in e||"doubleValue"in e?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in e?{stringValue:""}:"stringValue"in e?{bytesValue:""}:"bytesValue"in e?Pt(Et.empty(),H.empty()):"referenceValue"in e?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in e?{arrayValue:{}}:"arrayValue"in e?{mapValue:{}}:"mapValue"in e?Tt:E()}function zt(e,t){const n=Ct(e.value,t.value);return 0!==n?n:e.inclusive&&!t.inclusive?-1:!e.inclusive&&t.inclusive?1:0}function Gt(e,t){const n=Ct(e.value,t.value);return 0!==n?n:e.inclusive&&!t.inclusive?1:!e.inclusive&&t.inclusive?-1:0}
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
   */class Kt{constructor(e){this.value=e}static empty(){return new Kt({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!Lt(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=qt(t)}setAll(e){let t=W.emptyPath(),n={},r=[];e.forEach((e,s)=>{if(!t.isImmediateParentOf(s)){const e=this.getFieldsMap(t);this.applyChanges(e,n,r),n={},r=[],t=s.popLast()}e?n[s.lastSegment()]=qt(e):r.push(s.lastSegment())});const s=this.getFieldsMap(t);this.applyChanges(s,n,r)}delete(e){const t=this.field(e.popLast());Lt(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return xt(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let r=t.mapValue.fields[e.get(n)];Lt(r)&&r.mapValue.fields||(r={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=r),t=r}return t.mapValue.fields}applyChanges(e,t,n){nt(t,(t,n)=>e[t]=n);for(const t of n)delete e[t]}clone(){return new Kt(qt(this.value))}}function $t(e){const t=[];return nt(e.fields,(e,n)=>{const r=new W([e]);if(Lt(n)){const e=$t(n.mapValue).fields;if(0===e.length)t.push(r);else for(const n of e)t.push(r.child(n))}else t.push(r)}),new lt(t)
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
   */}class Qt{constructor(e,t,n,r,s,i,o){this.key=e,this.documentType=t,this.version=n,this.readTime=r,this.createTime=s,this.data=i,this.documentState=o}static newInvalidDocument(e){return new Qt(e,0,G.min(),G.min(),G.min(),Kt.empty(),0)}static newFoundDocument(e,t,n,r){return new Qt(e,1,t,G.min(),n,r,0)}static newNoDocument(e,t){return new Qt(e,2,t,G.min(),G.min(),Kt.empty(),0)}static newUnknownDocument(e,t){return new Qt(e,3,t,G.min(),G.min(),Kt.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(G.min())||2!==this.documentType&&0!==this.documentType||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=Kt.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=Kt.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=G.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return 1===this.documentState}get hasCommittedMutations(){return 2===this.documentState}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return 0!==this.documentType}isFoundDocument(){return 1===this.documentType}isNoDocument(){return 2===this.documentType}isUnknownDocument(){return 3===this.documentType}isEqual(e){return e instanceof Qt&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new Qt(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}
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
   */class Wt{constructor(e,t){this.position=e,this.inclusive=t}}function Ht(e,t,n){let r=0;for(let s=0;s<e.position.length;s++){const i=t[s],o=e.position[s];if(r=i.field.isKeyField()?H.comparator(H.fromName(o.referenceValue),n.key):Ct(o,n.data.field(i.field)),"desc"===i.dir&&(r*=-1),0!==r)break}return r}function Yt(e,t){if(null===e)return null===t;if(null===t)return!1;if(e.inclusive!==t.inclusive||e.position.length!==t.position.length)return!1;for(let n=0;n<e.position.length;n++)if(!xt(e.position[n],t.position[n]))return!1;return!0}
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
   */class Xt{constructor(e,t="asc"){this.field=e,this.dir=t}}function Jt(e,t){return e.dir===t.dir&&e.field.isEqual(t.field)}
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
   */class Zt{}class en extends Zt{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?"in"===t||"not-in"===t?this.createKeyFieldInFilter(e,t,n):new hn(e,t,n):"array-contains"===t?new gn(e,n):"in"===t?new pn(e,n):"not-in"===t?new yn(e,n):"array-contains-any"===t?new wn(e,n):new en(e,t,n)}static createKeyFieldInFilter(e,t,n){return"in"===t?new dn(e,n):new fn(e,n)}matches(e){const t=e.data.field(this.field);return"!="===this.op?null!==t&&this.matchesComparison(Ct(t,this.value)):null!==t&&_t(this.value)===_t(t)&&this.matchesComparison(Ct(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return 0===e;case"!=":return 0!==e;case">":return e>0;case">=":return e>=0;default:return E()}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}getFirstInequalityField(){return this.isInequality()?this.field:null}}class tn extends Zt{constructor(e,t){super(),this.filters=e,this.op=t,this.lt=null}static create(e,t){return new tn(e,t)}matches(e){return nn(this)?void 0===this.filters.find(t=>!t.matches(e)):void 0!==this.filters.find(t=>t.matches(e))}getFlattenedFilters(){return null!==this.lt||(this.lt=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.lt}getFilters(){return Object.assign([],this.filters)}getFirstInequalityField(){const e=this.ft(e=>e.isInequality());return null!==e?e.field:null}ft(e){for(const t of this.getFlattenedFilters())if(e(t))return t;return null}}function nn(e){return"and"===e.op}function rn(e){return"or"===e.op}function sn(e){return on(e)&&nn(e)}function on(e){for(const t of e.filters)if(t instanceof tn)return!1;return!0}function an(e){if(e instanceof en)return e.field.canonicalString()+e.op.toString()+At(e.value);if(sn(e))return e.filters.map(e=>an(e)).join(",");{const t=e.filters.map(e=>an(e)).join(",");return`${e.op}(${t})`}}function cn(e,t){return e instanceof en?(function(e,t){return t instanceof en&&e.op===t.op&&e.field.isEqual(t.field)&&xt(e.value,t.value)})(e,t):e instanceof tn?(function(e,t){return t instanceof tn&&e.op===t.op&&e.filters.length===t.filters.length&&e.filters.reduce((e,n,r)=>e&&cn(n,t.filters[r]),!0)})(e,t):void E()}function un(e,t){const n=e.filters.concat(t);return tn.create(n,e.op)}function ln(e){return e instanceof en?(function(e){return`${e.field.canonicalString()} ${e.op} ${At(e.value)}`})(e):e instanceof tn?(function(e){return e.op.toString()+" {"+e.getFilters().map(ln).join(" ,")+"}"})(e):"Filter"}class hn extends en{constructor(e,t,n){super(e,t,n),this.key=H.fromName(n.referenceValue)}matches(e){const t=H.comparator(e.key,this.key);return this.matchesComparison(t)}}class dn extends en{constructor(e,t){super(e,"in",t),this.keys=mn("in",t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}}class fn extends en{constructor(e,t){super(e,"not-in",t),this.keys=mn("not-in",t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}}function mn(e,t){var n;return((null===(n=t.arrayValue)||void 0===n?void 0:n.values)||[]).map(e=>H.fromName(e.referenceValue))}class gn extends en{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return Mt(t)&&Dt(t.arrayValue,this.value)}}class pn extends en{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return null!==t&&Dt(this.value.arrayValue,t)}}class yn extends en{constructor(e,t){super(e,"not-in",t)}matches(e){if(Dt(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return null!==t&&!Dt(this.value.arrayValue,t)}}class wn extends en{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!Mt(t)||!t.arrayValue.values)&&t.arrayValue.values.some(e=>Dt(this.value.arrayValue,e))}}
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
   */class vn{constructor(e,t=null,n=[],r=[],s=null,i=null,o=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=r,this.limit=s,this.startAt=i,this.endAt=o,this.dt=null}}function bn(e,t=null,n=[],r=[],s=null,i=null,o=null){return new vn(e,t,n,r,s,i,o)}function In(e){const t=_(e);if(null===t.dt){let e=t.path.canonicalString();null!==t.collectionGroup&&(e+="|cg:"+t.collectionGroup),e+="|f:",e+=t.filters.map(e=>an(e)).join(","),e+="|ob:",e+=t.orderBy.map(e=>(function(e){return e.field.canonicalString()+e.dir})(e)).join(","),Te(t.limit)||(e+="|l:",e+=t.limit),t.startAt&&(e+="|lb:",e+=t.startAt.inclusive?"b:":"a:",e+=t.startAt.position.map(e=>At(e)).join(",")),t.endAt&&(e+="|ub:",e+=t.endAt.inclusive?"a:":"b:",e+=t.endAt.position.map(e=>At(e)).join(",")),t.dt=e}return t.dt}function En(e,t){if(e.limit!==t.limit)return!1;if(e.orderBy.length!==t.orderBy.length)return!1;for(let n=0;n<e.orderBy.length;n++)if(!Jt(e.orderBy[n],t.orderBy[n]))return!1;if(e.filters.length!==t.filters.length)return!1;for(let n=0;n<e.filters.length;n++)if(!cn(e.filters[n],t.filters[n]))return!1;return e.collectionGroup===t.collectionGroup&&!!e.path.isEqual(t.path)&&!!Yt(e.startAt,t.startAt)&&Yt(e.endAt,t.endAt)}function Tn(e){return H.isDocumentKey(e.path)&&null===e.collectionGroup&&0===e.filters.length}function Sn(e,t){return e.filters.filter(e=>e instanceof en&&e.field.isEqual(t))}function _n(e,t,n){let r=St,s=!0;for(const n of Sn(e,t)){let e=St,t=!0;switch(n.op){case"<":case"<=":e=Ut(n.value);break;case"==":case"in":case">=":e=n.value;break;case">":e=n.value,t=!1;break;case"!=":case"not-in":e=St}zt({value:r,inclusive:s},{value:e,inclusive:t})<0&&(r=e,s=t)}if(null!==n)for(let i=0;i<e.orderBy.length;++i)if(e.orderBy[i].field.isEqual(t)){const e=n.position[i];zt({value:r,inclusive:s},{value:e,inclusive:n.inclusive})<0&&(r=e,s=n.inclusive);break}return{value:r,inclusive:s}}function xn(e,t,n){let r=Tt,s=!0;for(const n of Sn(e,t)){let e=Tt,t=!0;switch(n.op){case">=":case">":e=jt(n.value),t=!1;break;case"==":case"in":case"<=":e=n.value;break;case"<":e=n.value,t=!1;break;case"!=":case"not-in":e=Tt}Gt({value:r,inclusive:s},{value:e,inclusive:t})>0&&(r=e,s=t)}if(null!==n)for(let i=0;i<e.orderBy.length;++i)if(e.orderBy[i].field.isEqual(t)){const e=n.position[i];Gt({value:r,inclusive:s},{value:e,inclusive:n.inclusive})>0&&(r=e,s=n.inclusive);break}return{value:r,inclusive:s}}
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
   */class Dn{constructor(e,t=null,n=[],r=[],s=null,i="F",o=null,a=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=r,this.limit=s,this.limitType=i,this.startAt=o,this.endAt=a,this.wt=null,this._t=null,this.startAt,this.endAt}}function Cn(e,t,n,r,s,i,o,a){return new Dn(e,t,n,r,s,i,o,a)}function Nn(e){return new Dn(e)}function An(e){return 0===e.filters.length&&null===e.limit&&null==e.startAt&&null==e.endAt&&(0===e.explicitOrderBy.length||1===e.explicitOrderBy.length&&e.explicitOrderBy[0].field.isKeyField())}function kn(e){return e.explicitOrderBy.length>0?e.explicitOrderBy[0].field:null}function On(e){for(const t of e.filters){const e=t.getFirstInequalityField();if(null!==e)return e}return null}function Pn(e){return null!==e.collectionGroup}function Fn(e){const t=_(e);if(null===t.wt){t.wt=[];const e=On(t),n=kn(t);if(null!==e&&null===n)e.isKeyField()||t.wt.push(new Xt(e)),t.wt.push(new Xt(W.keyField(),"asc"));else{let e=!1;for(const n of t.explicitOrderBy)t.wt.push(n),n.field.isKeyField()&&(e=!0);if(!e){const e=t.explicitOrderBy.length>0?t.explicitOrderBy[t.explicitOrderBy.length-1].dir:"asc";t.wt.push(new Xt(W.keyField(),e))}}}return t.wt}function Mn(e){const t=_(e);if(!t._t)if("F"===t.limitType)t._t=bn(t.path,t.collectionGroup,Fn(t),t.filters,t.limit,t.startAt,t.endAt);else{const e=[];for(const n of Fn(t)){const t="desc"===n.dir?"asc":"desc";e.push(new Xt(n.field,t))}const n=t.endAt?new Wt(t.endAt.position,t.endAt.inclusive):null,r=t.startAt?new Wt(t.startAt.position,t.startAt.inclusive):null;t._t=bn(t.path,t.collectionGroup,e,t.filters,t.limit,n,r)}return t._t}function Rn(e,t){t.getFirstInequalityField(),On(e);const n=e.filters.concat([t]);return new Dn(e.path,e.collectionGroup,e.explicitOrderBy.slice(),n,e.limit,e.limitType,e.startAt,e.endAt)}function Vn(e,t,n){return new Dn(e.path,e.collectionGroup,e.explicitOrderBy.slice(),e.filters.slice(),t,n,e.startAt,e.endAt)}function Ln(e,t){return En(Mn(e),Mn(t))&&e.limitType===t.limitType}function qn(e){return`${In(Mn(e))}|lt:${e.limitType}`}function Bn(e){return`Query(target=${(function(e){let t=e.path.canonicalString();return null!==e.collectionGroup&&(t+=" collectionGroup="+e.collectionGroup),e.filters.length>0&&(t+=`, filters: [${e.filters.map(e=>ln(e)).join(", ")}]`),Te(e.limit)||(t+=", limit: "+e.limit),e.orderBy.length>0&&(t+=`, orderBy: [${e.orderBy.map(e=>(function(e){return`${e.field.canonicalString()} (${e.dir})`})(e)).join(", ")}]`),e.startAt&&(t+=", startAt: ",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(e=>At(e)).join(",")),e.endAt&&(t+=", endAt: ",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(e=>At(e)).join(",")),`Target(${t})`})(Mn(e))}; limitType=${e.limitType})`}function Un(e,t){return t.isFoundDocument()&&(function(e,t){const n=t.key.path;return null!==e.collectionGroup?t.key.hasCollectionId(e.collectionGroup)&&e.path.isPrefixOf(n):H.isDocumentKey(e.path)?e.path.isEqual(n):e.path.isImmediateParentOf(n)})(e,t)&&(function(e,t){for(const n of Fn(e))if(!n.field.isKeyField()&&null===t.data.field(n.field))return!1;return!0})(e,t)&&(function(e,t){for(const n of e.filters)if(!n.matches(t))return!1;return!0})(e,t)&&(function(e,t){return!(e.startAt&&!(function(e,t,n){const r=Ht(e,t,n);return e.inclusive?r<=0:r<0})(e.startAt,Fn(e),t))&&!(e.endAt&&!(function(e,t,n){const r=Ht(e,t,n);return e.inclusive?r>=0:r>0})(e.endAt,Fn(e),t))})(e,t)}function jn(e){return e.collectionGroup||(e.path.length%2==1?e.path.lastSegment():e.path.get(e.path.length-2))}function zn(e){return(t,n)=>{let r=!1;for(const s of Fn(e)){const e=Gn(s,t,n);if(0!==e)return e;r=r||s.field.isKeyField()}return 0}}function Gn(e,t,n){const r=e.field.isKeyField()?H.comparator(t.key,n.key):(function(e,t,n){const r=t.data.field(e),s=n.data.field(e);return null!==r&&null!==s?Ct(r,s):E()})(e.field,t,n);switch(e.dir){case"asc":return r;case"desc":return-1*r;default:return E()}}
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
   */class Kn{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),n=this.inner[t];if(void 0!==n)for(const[t,r]of n)if(this.equalsFn(t,e))return r}has(e){return void 0!==this.get(e)}set(e,t){const n=this.mapKeyFn(e),r=this.inner[n];if(void 0===r)return this.inner[n]=[[e,t]],void this.innerSize++;for(let n=0;n<r.length;n++)if(this.equalsFn(r[n][0],e))return void(r[n]=[e,t]);r.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),n=this.inner[t];if(void 0===n)return!1;for(let r=0;r<n.length;r++)if(this.equalsFn(n[r][0],e))return 1===n.length?delete this.inner[t]:n.splice(r,1),this.innerSize--,!0;return!1}forEach(e){nt(this.inner,(t,n)=>{for(const[t,r]of n)e(t,r)})}isEmpty(){return rt(this.inner)}size(){return this.innerSize}}
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
   */const $n=new st(H.comparator);function Qn(){return $n}const Wn=new st(H.comparator);function Hn(...e){let t=Wn;for(const n of e)t=t.insert(n.key,n);return t}function Yn(e){let t=Wn;return e.forEach((e,n)=>t=t.insert(e,n.overlayedDocument)),t}function Xn(){return Zn()}function Jn(){return Zn()}function Zn(){return new Kn(e=>e.toString(),(e,t)=>e.isEqual(t))}const er=new st(H.comparator),tr=new at(H.comparator);function nr(...e){let t=tr;for(const n of e)t=t.add(n);return t}const rr=new at(B);function sr(){return rr}
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
   */function ir(e,t){if(e.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Se(t)?"-0":t}}function or(e){return{integerValue:""+e}}function ar(e,t){return _e(t)?or(t):ir(e,t)}
/**
   * @license
   * Copyright 2018 Google LLC
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
   */class cr{constructor(){this._=void 0}}function ur(e,t,n){return e instanceof dr?(function(e,t){const n={fields:{__type__:{stringValue:"server_timestamp"},__local_write_time__:{timestampValue:{seconds:e.seconds,nanos:e.nanoseconds}}}};return t&&wt(t)&&(t=vt(t)),t&&(n.fields.__previous_value__=t),{mapValue:n}})(n,t):e instanceof fr?mr(e,t):e instanceof gr?pr(e,t):(function(e,t){const n=hr(e,t),r=wr(n)+wr(e.gt);return Ft(n)&&Ft(e.gt)?or(r):ir(e.serializer,r)})(e,t)}function lr(e,t,n){return e instanceof fr?mr(e,t):e instanceof gr?pr(e,t):n}function hr(e,t){return e instanceof yr?Ft(n=t)||(function(e){return!!e&&"doubleValue"in e})(n)?t:{integerValue:0}:null;var n}class dr extends cr{}class fr extends cr{constructor(e){super(),this.elements=e}}function mr(e,t){const n=vr(t);for(const t of e.elements)n.some(e=>xt(e,t))||n.push(t);return{arrayValue:{values:n}}}class gr extends cr{constructor(e){super(),this.elements=e}}function pr(e,t){let n=vr(t);for(const t of e.elements)n=n.filter(e=>!xt(e,t));return{arrayValue:{values:n}}}class yr extends cr{constructor(e,t){super(),this.serializer=e,this.gt=t}}function wr(e){return pt(e.integerValue||e.doubleValue)}function vr(e){return Mt(e)&&e.arrayValue.values?e.arrayValue.values.slice():[]}
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
   */class br{constructor(e,t){this.field=e,this.transform=t}}function Ir(e,t){return e.field.isEqual(t.field)&&(function(e,t){return e instanceof fr&&t instanceof fr||e instanceof gr&&t instanceof gr?U(e.elements,t.elements,xt):e instanceof yr&&t instanceof yr?xt(e.gt,t.gt):e instanceof dr&&t instanceof dr})(e.transform,t.transform)}class Er{constructor(e,t){this.version=e,this.transformResults=t}}class Tr{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new Tr}static exists(e){return new Tr(void 0,e)}static updateTime(e){return new Tr(e)}get isNone(){return void 0===this.updateTime&&void 0===this.exists}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function Sr(e,t){return void 0!==e.updateTime?t.isFoundDocument()&&t.version.isEqual(e.updateTime):void 0===e.exists||e.exists===t.isFoundDocument()}class _r{}function xr(e,t){if(!e.hasLocalMutations||t&&0===t.fields.length)return null;if(null===t)return e.isNoDocument()?new Rr(e.key,Tr.none()):new kr(e.key,e.data,Tr.none());{const n=e.data,r=Kt.empty();let s=new at(W.comparator);for(let e of t.fields)if(!s.has(e)){let t=n.field(e);null===t&&e.length>1&&(e=e.popLast(),t=n.field(e)),null===t?r.delete(e):r.set(e,t),s=s.add(e)}return new Or(e.key,r,new lt(s.toArray()),Tr.none())}}function Dr(e,t,n){e instanceof kr?(function(e,t,n){const r=e.value.clone(),s=Fr(e.fieldTransforms,t,n.transformResults);r.setAll(s),t.convertToFoundDocument(n.version,r).setHasCommittedMutations()})(e,t,n):e instanceof Or?(function(e,t,n){if(!Sr(e.precondition,t))return void t.convertToUnknownDocument(n.version);const r=Fr(e.fieldTransforms,t,n.transformResults),s=t.data;s.setAll(Pr(e)),s.setAll(r),t.convertToFoundDocument(n.version,s).setHasCommittedMutations()})(e,t,n):(function(e,t,n){t.convertToNoDocument(n.version).setHasCommittedMutations()})(0,t,n)}function Cr(e,t,n,r){return e instanceof kr?(function(e,t,n,r){if(!Sr(e.precondition,t))return n;const s=e.value.clone(),i=Mr(e.fieldTransforms,r,t);return s.setAll(i),t.convertToFoundDocument(t.version,s).setHasLocalMutations(),null})(e,t,n,r):e instanceof Or?(function(e,t,n,r){if(!Sr(e.precondition,t))return n;const s=Mr(e.fieldTransforms,r,t),i=t.data;return i.setAll(Pr(e)),i.setAll(s),t.convertToFoundDocument(t.version,i).setHasLocalMutations(),null===n?null:n.unionWith(e.fieldMask.fields).unionWith(e.fieldTransforms.map(e=>e.field))})(e,t,n,r):(function(e,t,n){return Sr(e.precondition,t)?(t.convertToNoDocument(t.version).setHasLocalMutations(),null):n})(e,t,n)}function Nr(e,t){let n=null;for(const r of e.fieldTransforms){const e=t.data.field(r.field),s=hr(r.transform,e||null);null!=s&&(null===n&&(n=Kt.empty()),n.set(r.field,s))}return n||null}function Ar(e,t){return e.type===t.type&&!!e.key.isEqual(t.key)&&!!e.precondition.isEqual(t.precondition)&&!!(function(e,t){return void 0===e&&void 0===t||!(!e||!t)&&U(e,t,(e,t)=>Ir(e,t))})(e.fieldTransforms,t.fieldTransforms)&&(0===e.type?e.value.isEqual(t.value):1!==e.type||e.data.isEqual(t.data)&&e.fieldMask.isEqual(t.fieldMask))}class kr extends _r{constructor(e,t,n,r=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=r,this.type=0}getFieldMask(){return null}}class Or extends _r{constructor(e,t,n,r,s=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=r,this.fieldTransforms=s,this.type=1}getFieldMask(){return this.fieldMask}}function Pr(e){const t=new Map;return e.fieldMask.fields.forEach(n=>{if(!n.isEmpty()){const r=e.data.field(n);t.set(n,r)}}),t}function Fr(e,t,n){const r=new Map;T(e.length===n.length);for(let s=0;s<n.length;s++){const i=e[s],o=i.transform,a=t.data.field(i.field);r.set(i.field,lr(o,a,n[s]))}return r}function Mr(e,t,n){const r=new Map;for(const s of e){const e=s.transform,i=n.data.field(s.field);r.set(s.field,ur(e,i,t))}return r}class Rr extends _r{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class Vr extends _r{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}
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
   */class Lr{constructor(e,t,n,r){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=r}applyToRemoteDocument(e,t){const n=t.mutationResults;for(let t=0;t<this.mutations.length;t++){const r=this.mutations[t];r.key.isEqual(e.key)&&Dr(r,e,n[t])}}applyToLocalView(e,t){for(const n of this.baseMutations)n.key.isEqual(e.key)&&(t=Cr(n,e,t,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(e.key)&&(t=Cr(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const n=Jn();return this.mutations.forEach(r=>{const s=e.get(r.key),i=s.overlayedDocument;let o=this.applyToLocalView(i,s.mutatedFields);o=t.has(r.key)?null:o;const a=xr(i,o);null!==a&&n.set(r.key,a),i.isValidDocument()||i.convertToNoDocument(G.min())}),n}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),nr())}isEqual(e){return this.batchId===e.batchId&&U(this.mutations,e.mutations,(e,t)=>Ar(e,t))&&U(this.baseMutations,e.baseMutations,(e,t)=>Ar(e,t))}}class qr{constructor(e,t,n,r){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=r}static from(e,t,n){T(e.mutations.length===n.length);let r=er;const s=e.mutations;for(let e=0;e<s.length;e++)r=r.insert(s[e].key,n[e].version);return new qr(e,t,n,r)}}
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
   */class Br{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return null!==e&&this.mutation===e.mutation}toString(){return`Overlay{\n      largestBatchId: ${this.largestBatchId},\n      mutation: ${this.mutation.toString()}\n    }`}}
/**
   * @license
   * Copyright 2023 Google LLC
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
   */class Ur{constructor(e,t,n){this.alias=e,this.yt=t,this.fieldPath=n}}
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
   */class jr{constructor(e,t){this.count=e,this.unchangedNames=t}}
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
   */var zr,Gr;function Kr(e){switch(e){default:return E();case x.CANCELLED:case x.UNKNOWN:case x.DEADLINE_EXCEEDED:case x.RESOURCE_EXHAUSTED:case x.INTERNAL:case x.UNAVAILABLE:case x.UNAUTHENTICATED:return!1;case x.INVALID_ARGUMENT:case x.NOT_FOUND:case x.ALREADY_EXISTS:case x.PERMISSION_DENIED:case x.FAILED_PRECONDITION:case x.ABORTED:case x.OUT_OF_RANGE:case x.UNIMPLEMENTED:case x.DATA_LOSS:return!0}}function $r(e){if(void 0===e)return v("GRPC error has no .code"),x.UNKNOWN;switch(e){case zr.OK:return x.OK;case zr.CANCELLED:return x.CANCELLED;case zr.UNKNOWN:return x.UNKNOWN;case zr.DEADLINE_EXCEEDED:return x.DEADLINE_EXCEEDED;case zr.RESOURCE_EXHAUSTED:return x.RESOURCE_EXHAUSTED;case zr.INTERNAL:return x.INTERNAL;case zr.UNAVAILABLE:return x.UNAVAILABLE;case zr.UNAUTHENTICATED:return x.UNAUTHENTICATED;case zr.INVALID_ARGUMENT:return x.INVALID_ARGUMENT;case zr.NOT_FOUND:return x.NOT_FOUND;case zr.ALREADY_EXISTS:return x.ALREADY_EXISTS;case zr.PERMISSION_DENIED:return x.PERMISSION_DENIED;case zr.FAILED_PRECONDITION:return x.FAILED_PRECONDITION;case zr.ABORTED:return x.ABORTED;case zr.OUT_OF_RANGE:return x.OUT_OF_RANGE;case zr.UNIMPLEMENTED:return x.UNIMPLEMENTED;case zr.DATA_LOSS:return x.DATA_LOSS;default:return E()}}(Gr=zr||(zr={}))[Gr.OK=0]="OK",Gr[Gr.CANCELLED=1]="CANCELLED",Gr[Gr.UNKNOWN=2]="UNKNOWN",Gr[Gr.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",Gr[Gr.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",Gr[Gr.NOT_FOUND=5]="NOT_FOUND",Gr[Gr.ALREADY_EXISTS=6]="ALREADY_EXISTS",Gr[Gr.PERMISSION_DENIED=7]="PERMISSION_DENIED",Gr[Gr.UNAUTHENTICATED=16]="UNAUTHENTICATED",Gr[Gr.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",Gr[Gr.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",Gr[Gr.ABORTED=10]="ABORTED",Gr[Gr.OUT_OF_RANGE=11]="OUT_OF_RANGE",Gr[Gr.UNIMPLEMENTED=12]="UNIMPLEMENTED",Gr[Gr.INTERNAL=13]="INTERNAL",Gr[Gr.UNAVAILABLE=14]="UNAVAILABLE",Gr[Gr.DATA_LOSS=15]="DATA_LOSS";
/**
   * @license
   * Copyright 2023 Google LLC
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
class Qr{constructor(){this.onExistenceFilterMismatchCallbacks=new Map}static get instance(){return Wr}static getOrCreateInstance(){return null===Wr&&(Wr=new Qr),Wr}onExistenceFilterMismatch(e){const t=Symbol();return this.onExistenceFilterMismatchCallbacks.set(t,e),()=>this.onExistenceFilterMismatchCallbacks.delete(t)}notifyOnExistenceFilterMismatch(e){this.onExistenceFilterMismatchCallbacks.forEach(t=>t(e))}}let Wr=null;
/**
   * @license
   * Copyright 2023 Google LLC
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
   */function Hr(){return new TextEncoder}
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
   */const Yr=new h.Integer([4294967295,4294967295],0);function Xr(e){const t=Hr().encode(e),n=new h.Md5;return n.update(t),new Uint8Array(n.digest())}function Jr(e){const t=new DataView(e.buffer),n=t.getUint32(0,!0),r=t.getUint32(4,!0),s=t.getUint32(8,!0),i=t.getUint32(12,!0);return[new h.Integer([n,r],0),new h.Integer([s,i],0)]}class Zr{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new es(`Invalid padding: ${t}`);if(n<0)throw new es(`Invalid hash count: ${n}`);if(e.length>0&&0===this.hashCount)throw new es(`Invalid hash count: ${n}`);if(0===e.length&&0!==t)throw new es(`Invalid padding when bitmap length is 0: ${t}`);this.It=8*e.length-t,this.Tt=h.Integer.fromNumber(this.It)}Et(e,t,n){let r=e.add(t.multiply(h.Integer.fromNumber(n)));return 1===r.compare(Yr)&&(r=new h.Integer([r.getBits(0),r.getBits(1)],0)),r.modulo(this.Tt).toNumber()}At(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}vt(e){if(0===this.It)return!1;const t=Xr(e),[n,r]=Jr(t);for(let e=0;e<this.hashCount;e++){const t=this.Et(n,r,e);if(!this.At(t))return!1}return!0}static create(e,t,n){const r=e%8==0?0:8-e%8,s=new Uint8Array(Math.ceil(e/8)),i=new Zr(s,r,t);return n.forEach(e=>i.insert(e)),i}insert(e){if(0===this.It)return;const t=Xr(e),[n,r]=Jr(t);for(let e=0;e<this.hashCount;e++){const t=this.Et(n,r,e);this.Rt(t)}}Rt(e){const t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}}class es extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}
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
   */class ts{constructor(e,t,n,r,s){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=r,this.resolvedLimboDocuments=s}static createSynthesizedRemoteEventForCurrentChange(e,t,n){const r=new Map;return r.set(e,ns.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new ts(G.min(),r,new st(B),Qn(),nr())}}class ns{constructor(e,t,n,r,s){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=r,this.removedDocuments=s}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new ns(n,t,nr(),nr(),nr())}}
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
   */class rs{constructor(e,t,n,r){this.Pt=e,this.removedTargetIds=t,this.key=n,this.bt=r}}class ss{constructor(e,t){this.targetId=e,this.Vt=t}}class is{constructor(e,t,n=ft.EMPTY_BYTE_STRING,r=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=r}}class os{constructor(){this.St=0,this.Dt=us(),this.Ct=ft.EMPTY_BYTE_STRING,this.xt=!1,this.Nt=!0}get current(){return this.xt}get resumeToken(){return this.Ct}get kt(){return 0!==this.St}get Mt(){return this.Nt}$t(e){e.approximateByteSize()>0&&(this.Nt=!0,this.Ct=e)}Ot(){let e=nr(),t=nr(),n=nr();return this.Dt.forEach((r,s)=>{switch(s){case 0:e=e.add(r);break;case 2:t=t.add(r);break;case 1:n=n.add(r);break;default:E()}}),new ns(this.Ct,this.xt,e,t,n)}Ft(){this.Nt=!1,this.Dt=us()}Bt(e,t){this.Nt=!0,this.Dt=this.Dt.insert(e,t)}Lt(e){this.Nt=!0,this.Dt=this.Dt.remove(e)}qt(){this.St+=1}Ut(){this.St-=1}Kt(){this.Nt=!0,this.xt=!0}}class as{constructor(e){this.Gt=e,this.Qt=new Map,this.jt=Qn(),this.zt=cs(),this.Wt=new st(B)}Ht(e){for(const t of e.Pt)e.bt&&e.bt.isFoundDocument()?this.Jt(t,e.bt):this.Yt(t,e.key,e.bt);for(const t of e.removedTargetIds)this.Yt(t,e.key,e.bt)}Xt(e){this.forEachTarget(e,t=>{const n=this.Zt(t);switch(e.state){case 0:this.te(t)&&n.$t(e.resumeToken);break;case 1:n.Ut(),n.kt||n.Ft(),n.$t(e.resumeToken);break;case 2:n.Ut(),n.kt||this.removeTarget(t);break;case 3:this.te(t)&&(n.Kt(),n.$t(e.resumeToken));break;case 4:this.te(t)&&(this.ee(t),n.$t(e.resumeToken));break;default:E()}})}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.Qt.forEach((e,n)=>{this.te(n)&&t(n)})}ne(e){var t;const n=e.targetId,r=e.Vt.count,s=this.se(n);if(s){const i=s.target;if(Tn(i))if(0===r){const e=new H(i.path);this.Yt(n,e,Qt.newNoDocument(e,G.min()))}else T(1===r);else{const s=this.ie(n);if(s!==r){const r=this.re(e,s);if(0!==r){this.ee(n);const e=2===r?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Wt=this.Wt.insert(n,e)}null===(t=Qr.instance)||void 0===t||t.notifyOnExistenceFilterMismatch((function(e,t,n){var r,s,i,o,a,c;const u={localCacheCount:t,existenceFilterCount:n.count},l=n.unchangedNames;return l&&(u.bloomFilter={applied:0===e,hashCount:null!==(r=null==l?void 0:l.hashCount)&&void 0!==r?r:0,bitmapLength:null!==(o=null===(i=null===(s=null==l?void 0:l.bits)||void 0===s?void 0:s.bitmap)||void 0===i?void 0:i.length)&&void 0!==o?o:0,padding:null!==(c=null===(a=null==l?void 0:l.bits)||void 0===a?void 0:a.padding)&&void 0!==c?c:0}),u}
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
            */)(r,s,e.Vt))}}}}re(e,t){const{unchangedNames:n,count:r}=e.Vt;if(!n||!n.bits)return 1;const{bits:{bitmap:s="",padding:i=0},hashCount:o=0}=n;let a,c;try{a=yt(s).toUint8Array()}catch(e){if(e instanceof ht)return b("Decoding the base64 bloom filter in existence filter failed ("+e.message+"); ignoring the bloom filter and falling back to full re-query."),1;throw e}try{c=new Zr(a,i,o)}catch(e){return b(e instanceof es?"BloomFilter error: ":"Applying bloom filter failed: ",e),1}return 0===c.It?1:r!==t-this.oe(e.targetId,c)?2:0}oe(e,t){const n=this.Gt.getRemoteKeysForTarget(e);let r=0;return n.forEach(n=>{const s=this.Gt.ue(),i=`projects/${s.projectId}/databases/${s.database}/documents/${n.path.canonicalString()}`;t.vt(i)||(this.Yt(e,n,null),r++)}),r}ce(e){const t=new Map;this.Qt.forEach((n,r)=>{const s=this.se(r);if(s){if(n.current&&Tn(s.target)){const t=new H(s.target.path);null!==this.jt.get(t)||this.ae(r,t)||this.Yt(r,t,Qt.newNoDocument(t,e))}n.Mt&&(t.set(r,n.Ot()),n.Ft())}});let n=nr();this.zt.forEach((e,t)=>{let r=!0;t.forEachWhile(e=>{const t=this.se(e);return!t||"TargetPurposeLimboResolution"===t.purpose||(r=!1,!1)}),r&&(n=n.add(e))}),this.jt.forEach((t,n)=>n.setReadTime(e));const r=new ts(e,t,this.Wt,this.jt,n);return this.jt=Qn(),this.zt=cs(),this.Wt=new st(B),r}Jt(e,t){if(!this.te(e))return;const n=this.ae(e,t.key)?2:0;this.Zt(e).Bt(t.key,n),this.jt=this.jt.insert(t.key,t),this.zt=this.zt.insert(t.key,this.he(t.key).add(e))}Yt(e,t,n){if(!this.te(e))return;const r=this.Zt(e);this.ae(e,t)?r.Bt(t,1):r.Lt(t),this.zt=this.zt.insert(t,this.he(t).delete(e)),n&&(this.jt=this.jt.insert(t,n))}removeTarget(e){this.Qt.delete(e)}ie(e){const t=this.Zt(e).Ot();return this.Gt.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}qt(e){this.Zt(e).qt()}Zt(e){let t=this.Qt.get(e);return t||(t=new os,this.Qt.set(e,t)),t}he(e){let t=this.zt.get(e);return t||(t=new at(B),this.zt=this.zt.insert(e,t)),t}te(e){const t=null!==this.se(e);return t||w("WatchChangeAggregator","Detected inactive target",e),t}se(e){const t=this.Qt.get(e);return t&&t.kt?null:this.Gt.le(e)}ee(e){this.Qt.set(e,new os),this.Gt.getRemoteKeysForTarget(e).forEach(t=>{this.Yt(e,t,null)})}ae(e,t){return this.Gt.getRemoteKeysForTarget(e).has(t)}}function cs(){return new st(H.comparator)}function us(){return new st(H.comparator)}const ls={asc:"ASCENDING",desc:"DESCENDING"},hs={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},ds={and:"AND",or:"OR"};class fs{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function ms(e,t){return e.useProto3Json||Te(t)?t:{value:t}}function gs(e,t){return e.useProto3Json?`${new Date(1e3*t.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+t.nanoseconds).slice(-9)}Z`:{seconds:""+t.seconds,nanos:t.nanoseconds}}function ps(e,t){return e.useProto3Json?t.toBase64():t.toUint8Array()}function ys(e,t){return gs(e,t.toTimestamp())}function ws(e){return T(!!e),G.fromTimestamp((function(e){const t=gt(e);return new z(t.seconds,t.nanos)})(e))}function vs(e,t){return(function(e){return new $(["projects",e.projectId,"databases",e.database])})(e).child("documents").child(t).canonicalString()}function bs(e){const t=$.fromString(e);return T($s(t)),t}function Is(e,t){return vs(e.databaseId,t.path)}function Es(e,t){const n=bs(t);if(n.get(1)!==e.databaseId.projectId)throw new D(x.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+n.get(1)+" vs "+e.databaseId.projectId);if(n.get(3)!==e.databaseId.database)throw new D(x.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+n.get(3)+" vs "+e.databaseId.database);return new H(xs(n))}function Ts(e,t){return vs(e.databaseId,t)}function Ss(e){const t=bs(e);return 4===t.length?$.emptyPath():xs(t)}function _s(e){return new $(["projects",e.databaseId.projectId,"databases",e.databaseId.database]).canonicalString()}function xs(e){return T(e.length>4&&"documents"===e.get(4)),e.popFirst(5)}function Ds(e,t,n){return{name:Is(e,t),fields:n.value.mapValue.fields}}function Cs(e,t,n){const r=Es(e,t.name),s=ws(t.updateTime),i=t.createTime?ws(t.createTime):G.min(),o=new Kt({mapValue:{fields:t.fields}}),a=Qt.newFoundDocument(r,s,i,o);return n&&a.setHasCommittedMutations(),n?a.setHasCommittedMutations():a}function Ns(e,t){return"found"in t?(function(e,t){T(!!t.found),t.found.name,t.found.updateTime;const n=Es(e,t.found.name),r=ws(t.found.updateTime),s=t.found.createTime?ws(t.found.createTime):G.min(),i=new Kt({mapValue:{fields:t.found.fields}});return Qt.newFoundDocument(n,r,s,i)})(e,t):"missing"in t?(function(e,t){T(!!t.missing),T(!!t.readTime);const n=Es(e,t.missing),r=ws(t.readTime);return Qt.newNoDocument(n,r)})(e,t):E()}function As(e,t){let n;if("targetChange"in t){t.targetChange;const r=(function(e){return"NO_CHANGE"===e?0:"ADD"===e?1:"REMOVE"===e?2:"CURRENT"===e?3:"RESET"===e?4:E()})(t.targetChange.targetChangeType||"NO_CHANGE"),s=t.targetChange.targetIds||[],i=(function(e,t){return e.useProto3Json?(T(void 0===t||"string"==typeof t),ft.fromBase64String(t||"")):(T(void 0===t||t instanceof Uint8Array),ft.fromUint8Array(t||new Uint8Array))})(e,t.targetChange.resumeToken),o=t.targetChange.cause,a=o&&(function(e){const t=void 0===e.code?x.UNKNOWN:$r(e.code);return new D(t,e.message||"")})(o);n=new is(r,s,i,a||null)}else if("documentChange"in t){t.documentChange;const r=t.documentChange;r.document,r.document.name,r.document.updateTime;const s=Es(e,r.document.name),i=ws(r.document.updateTime),o=r.document.createTime?ws(r.document.createTime):G.min(),a=new Kt({mapValue:{fields:r.document.fields}}),c=Qt.newFoundDocument(s,i,o,a),u=r.targetIds||[],l=r.removedTargetIds||[];n=new rs(u,l,c.key,c)}else if("documentDelete"in t){t.documentDelete;const r=t.documentDelete;r.document;const s=Es(e,r.document),i=r.readTime?ws(r.readTime):G.min(),o=Qt.newNoDocument(s,i),a=r.removedTargetIds||[];n=new rs([],a,o.key,o)}else if("documentRemove"in t){t.documentRemove;const r=t.documentRemove;r.document;const s=Es(e,r.document),i=r.removedTargetIds||[];n=new rs([],i,s,null)}else{if(!("filter"in t))return E();{t.filter;const e=t.filter;e.targetId;const{count:r=0,unchangedNames:s}=e,i=new jr(r,s),o=e.targetId;n=new ss(o,i)}}return n}function ks(e,t){let n;if(t instanceof kr)n={update:Ds(e,t.key,t.value)};else if(t instanceof Rr)n={delete:Is(e,t.key)};else if(t instanceof Or)n={update:Ds(e,t.key,t.data),updateMask:Ks(t.fieldMask)};else{if(!(t instanceof Vr))return E();n={verify:Is(e,t.key)}}return t.fieldTransforms.length>0&&(n.updateTransforms=t.fieldTransforms.map(e=>(function(e,t){const n=t.transform;if(n instanceof dr)return{fieldPath:t.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(n instanceof fr)return{fieldPath:t.field.canonicalString(),appendMissingElements:{values:n.elements}};if(n instanceof gr)return{fieldPath:t.field.canonicalString(),removeAllFromArray:{values:n.elements}};if(n instanceof yr)return{fieldPath:t.field.canonicalString(),increment:n.gt};throw E()})(0,e))),t.precondition.isNone||(n.currentDocument=(function(e,t){return void 0!==t.updateTime?{updateTime:ys(e,t.updateTime)}:void 0!==t.exists?{exists:t.exists}:E()})(e,t.precondition)),n}function Os(e,t){const n=t.currentDocument?(function(e){return void 0!==e.updateTime?Tr.updateTime(ws(e.updateTime)):void 0!==e.exists?Tr.exists(e.exists):Tr.none()})(t.currentDocument):Tr.none(),r=t.updateTransforms?t.updateTransforms.map(t=>(function(e,t){let n=null;if("setToServerValue"in t)T("REQUEST_TIME"===t.setToServerValue),n=new dr;else if("appendMissingElements"in t){const e=t.appendMissingElements.values||[];n=new fr(e)}else if("removeAllFromArray"in t){const e=t.removeAllFromArray.values||[];n=new gr(e)}else"increment"in t?n=new yr(e,t.increment):E();const r=W.fromServerFormat(t.fieldPath);return new br(r,n)})(e,t)):[];if(t.update){t.update.name;const s=Es(e,t.update.name),i=new Kt({mapValue:{fields:t.update.fields}});if(t.updateMask){const e=(function(e){const t=e.fieldPaths||[];return new lt(t.map(e=>W.fromServerFormat(e)))})(t.updateMask);return new Or(s,i,e,n,r)}return new kr(s,i,n,r)}if(t.delete){const r=Es(e,t.delete);return new Rr(r,n)}if(t.verify){const r=Es(e,t.verify);return new Vr(r,n)}return E()}function Ps(e,t){return e&&e.length>0?(T(void 0!==t),e.map(e=>(function(e,t){let n=e.updateTime?ws(e.updateTime):ws(t);return n.isEqual(G.min())&&(n=ws(t)),new Er(n,e.transformResults||[])})(e,t))):[]}function Fs(e,t){return{documents:[Ts(e,t.path)]}}function Ms(e,t){const n={structuredQuery:{}},r=t.path;null!==t.collectionGroup?(n.parent=Ts(e,r),n.structuredQuery.from=[{collectionId:t.collectionGroup,allDescendants:!0}]):(n.parent=Ts(e,r.popLast()),n.structuredQuery.from=[{collectionId:r.lastSegment()}]);const s=(function(e){if(0!==e.length)return Gs(tn.create(e,"and"))})(t.filters);s&&(n.structuredQuery.where=s);const i=(function(e){if(0!==e.length)return e.map(e=>(function(e){return{field:js(e.field),direction:qs(e.dir)}})(e))})(t.orderBy);i&&(n.structuredQuery.orderBy=i);const o=ms(e,t.limit);var a;return null!==o&&(n.structuredQuery.limit=o),t.startAt&&(n.structuredQuery.startAt={before:(a=t.startAt).inclusive,values:a.position}),t.endAt&&(n.structuredQuery.endAt=(function(e){return{before:!e.inclusive,values:e.position}})(t.endAt)),n}function Rs(e){let t=Ss(e.parent);const n=e.structuredQuery,r=n.from?n.from.length:0;let s=null;if(r>0){T(1===r);const e=n.from[0];e.allDescendants?s=e.collectionId:t=t.child(e.collectionId)}let i=[];n.where&&(i=(function(e){const t=Ls(e);return t instanceof tn&&sn(t)?t.getFilters():[t]})(n.where));let o=[];n.orderBy&&(o=n.orderBy.map(e=>(function(e){return new Xt(zs(e.field),(function(e){switch(e){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(e.direction))})(e)));let a=null;n.limit&&(a=(function(e){let t;return t="object"==typeof e?e.value:e,Te(t)?null:t})(n.limit));let c=null;n.startAt&&(c=(function(e){const t=!!e.before,n=e.values||[];return new Wt(n,t)})(n.startAt));let u=null;return n.endAt&&(u=(function(e){const t=!e.before,n=e.values||[];return new Wt(n,t)})(n.endAt)),Cn(t,s,o,i,a,"F",c,u)}function Vs(e,t){const n=(function(e){switch(e){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return E()}})(t.purpose);return null==n?null:{"goog-listen-tags":n}}function Ls(e){return void 0!==e.unaryFilter?(function(e){switch(e.unaryFilter.op){case"IS_NAN":const t=zs(e.unaryFilter.field);return en.create(t,"==",{doubleValue:NaN});case"IS_NULL":const n=zs(e.unaryFilter.field);return en.create(n,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const r=zs(e.unaryFilter.field);return en.create(r,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const s=zs(e.unaryFilter.field);return en.create(s,"!=",{nullValue:"NULL_VALUE"});default:return E()}})(e):void 0!==e.fieldFilter?(function(e){return en.create(zs(e.fieldFilter.field),(function(e){switch(e){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";default:return E()}})(e.fieldFilter.op),e.fieldFilter.value)})(e):void 0!==e.compositeFilter?(function(e){return tn.create(e.compositeFilter.filters.map(e=>Ls(e)),(function(e){switch(e){case"AND":return"and";case"OR":return"or";default:return E()}})(e.compositeFilter.op))})(e):E()}function qs(e){return ls[e]}function Bs(e){return hs[e]}function Us(e){return ds[e]}function js(e){return{fieldPath:e.canonicalString()}}function zs(e){return W.fromServerFormat(e.fieldPath)}function Gs(e){return e instanceof en?(function(e){if("=="===e.op){if(Vt(e.value))return{unaryFilter:{field:js(e.field),op:"IS_NAN"}};if(Rt(e.value))return{unaryFilter:{field:js(e.field),op:"IS_NULL"}}}else if("!="===e.op){if(Vt(e.value))return{unaryFilter:{field:js(e.field),op:"IS_NOT_NAN"}};if(Rt(e.value))return{unaryFilter:{field:js(e.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:js(e.field),op:Bs(e.op),value:e.value}}})(e):e instanceof tn?(function(e){const t=e.getFilters().map(e=>Gs(e));return 1===t.length?t[0]:{compositeFilter:{op:Us(e.op),filters:t}}})(e):E()}function Ks(e){const t=[];return e.fields.forEach(e=>t.push(e.canonicalString())),{fieldPaths:t}}function $s(e){return e.length>=4&&"projects"===e.get(0)&&"databases"===e.get(2)}
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
   */class Qs{constructor(e,t,n,r,s=G.min(),i=G.min(),o=ft.EMPTY_BYTE_STRING,a=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=r,this.snapshotVersion=s,this.lastLimboFreeSnapshotVersion=i,this.resumeToken=o,this.expectedCount=a}withSequenceNumber(e){return new Qs(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new Qs(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new Qs(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new Qs(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}
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
   */class Ws{constructor(e){this.fe=e}}function Hs(e,t){let n;if(t.document)n=Cs(e.fe,t.document,!!t.hasCommittedMutations);else if(t.noDocument){const e=H.fromSegments(t.noDocument.path),r=Zs(t.noDocument.readTime);n=Qt.newNoDocument(e,r),t.hasCommittedMutations&&n.setHasCommittedMutations()}else{if(!t.unknownDocument)return E();{const e=H.fromSegments(t.unknownDocument.path),r=Zs(t.unknownDocument.version);n=Qt.newUnknownDocument(e,r)}}return t.readTime&&n.setReadTime((function(e){const t=new z(e[0],e[1]);return G.fromTimestamp(t)})(t.readTime)),n}function Ys(e,t){const n=t.key,r={prefixPath:n.getCollectionPath().popLast().toArray(),collectionGroup:n.collectionGroup,documentId:n.path.lastSegment(),readTime:Xs(t.readTime),hasCommittedMutations:t.hasCommittedMutations};if(t.isFoundDocument())r.document=(function(e,t){return{name:Is(e,t.key),fields:t.data.value.mapValue.fields,updateTime:gs(e,t.version.toTimestamp()),createTime:gs(e,t.createTime.toTimestamp())}})(e.fe,t);else if(t.isNoDocument())r.noDocument={path:n.path.toArray(),readTime:Js(t.version)};else{if(!t.isUnknownDocument())return E();r.unknownDocument={path:n.path.toArray(),version:Js(t.version)}}return r}function Xs(e){const t=e.toTimestamp();return[t.seconds,t.nanoseconds]}function Js(e){const t=e.toTimestamp();return{seconds:t.seconds,nanoseconds:t.nanoseconds}}function Zs(e){const t=new z(e.seconds,e.nanoseconds);return G.fromTimestamp(t)}function ei(e,t){const n=(t.baseMutations||[]).map(t=>Os(e.fe,t));for(let e=0;e<t.mutations.length-1;++e){const n=t.mutations[e];if(e+1<t.mutations.length&&void 0!==t.mutations[e+1].transform){const r=t.mutations[e+1];n.updateTransforms=r.transform.fieldTransforms,t.mutations.splice(e+1,1),++e}}const r=t.mutations.map(t=>Os(e.fe,t)),s=z.fromMillis(t.localWriteTimeMs);return new Lr(t.batchId,s,n,r)}function ti(e){const t=Zs(e.readTime),n=void 0!==e.lastLimboFreeSnapshotVersion?Zs(e.lastLimboFreeSnapshotVersion):G.min();let r;var s;return void 0!==e.query.documents?(T(1===(s=e.query).documents.length),r=Mn(Nn(Ss(s.documents[0])))):r=(function(e){return Mn(Rs(e))})(e.query),new Qs(r,e.targetId,"TargetPurposeListen",e.lastListenSequenceNumber,t,n,ft.fromBase64String(e.resumeToken))}function ni(e,t){const n=Js(t.snapshotVersion),r=Js(t.lastLimboFreeSnapshotVersion);let s;s=Tn(t.target)?Fs(e.fe,t.target):Ms(e.fe,t.target);const i=t.resumeToken.toBase64();return{targetId:t.targetId,canonicalId:In(t.target),readTime:n,resumeToken:i,lastListenSequenceNumber:t.sequenceNumber,lastLimboFreeSnapshotVersion:r,query:s}}function ri(e){const t=Rs({parent:e.parent,structuredQuery:e.structuredQuery});return"LAST"===e.limitType?Vn(t,t.limit,"L"):t}function si(e,t){return new Br(t.largestBatchId,Os(e.fe,t.overlayMutation))}function ii(e,t){const n=t.path.lastSegment();return[e,xe(t.path.popLast()),n]}function oi(e,t,n,r){return{indexId:e,uid:t.uid||"",sequenceNumber:n,readTime:Js(r.readTime),documentKey:xe(r.documentKey.path),largestBatchId:r.largestBatchId}}
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
   */class ai{getBundleMetadata(e,t){return ci(e).get(t).next(e=>{if(e)return{id:(t=e).bundleId,createTime:Zs(t.createTime),version:t.version};var t})}saveBundleMetadata(e,t){return ci(e).put({bundleId:(n=t).id,createTime:Js(ws(n.createTime)),version:n.version});var n}getNamedQuery(e,t){return ui(e).get(t).next(e=>{if(e)return{name:(t=e).name,query:ri(t.bundledQuery),readTime:Zs(t.readTime)};var t})}saveNamedQuery(e,t){return ui(e).put((function(e){return{name:e.name,readTime:Js(ws(e.readTime)),bundledQuery:e.bundledQuery}})(t))}}function ci(e){return et(e,"bundles")}function ui(e){return et(e,"namedQueries")}
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
   */class li{constructor(e,t){this.serializer=e,this.userId=t}static de(e,t){const n=t.uid||"";return new li(e,n)}getOverlay(e,t){return hi(e).get(ii(this.userId,t)).next(e=>e?si(this.serializer,e):null)}getOverlays(e,t){const n=Xn();return le.forEach(t,t=>this.getOverlay(e,t).next(e=>{null!==e&&n.set(t,e)})).next(()=>n)}saveOverlays(e,t,n){const r=[];return n.forEach((n,s)=>{const i=new Br(t,s);r.push(this.we(e,i))}),le.waitFor(r)}removeOverlaysForBatchId(e,t,n){const r=new Set;t.forEach(e=>r.add(xe(e.getCollectionPath())));const s=[];return r.forEach(t=>{const r=IDBKeyRange.bound([this.userId,t,n],[this.userId,t,n+1],!1,!0);s.push(hi(e).J("collectionPathOverlayIndex",r))}),le.waitFor(s)}getOverlaysForCollection(e,t,n){const r=Xn(),s=xe(t),i=IDBKeyRange.bound([this.userId,s,n],[this.userId,s,Number.POSITIVE_INFINITY],!0);return hi(e).j("collectionPathOverlayIndex",i).next(e=>{for(const t of e){const e=si(this.serializer,t);r.set(e.getKey(),e)}return r})}getOverlaysForCollectionGroup(e,t,n,r){const s=Xn();let i;const o=IDBKeyRange.bound([this.userId,t,n],[this.userId,t,Number.POSITIVE_INFINITY],!0);return hi(e).X({index:"collectionGroupOverlayIndex",range:o},(e,t,n)=>{const o=si(this.serializer,t);s.size()<r||o.largestBatchId===i?(s.set(o.getKey(),o),i=o.largestBatchId):n.done()}).next(()=>s)}we(e,t){return hi(e).put((function(e,t,n){const[r,s,i]=ii(t,n.mutation.key);return{userId:t,collectionPath:s,documentId:i,collectionGroup:n.mutation.key.getCollectionGroup(),largestBatchId:n.largestBatchId,overlayMutation:ks(e.fe,n.mutation)}})(this.serializer,this.userId,t))}}function hi(e){return et(e,"documentOverlays")}
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
   */class di{constructor(){}_e(e,t){this.me(e,t),t.ge()}me(e,t){if("nullValue"in e)this.ye(t,5);else if("booleanValue"in e)this.ye(t,10),t.pe(e.booleanValue?1:0);else if("integerValue"in e)this.ye(t,15),t.pe(pt(e.integerValue));else if("doubleValue"in e){const n=pt(e.doubleValue);isNaN(n)?this.ye(t,13):(this.ye(t,15),Se(n)?t.pe(0):t.pe(n))}else if("timestampValue"in e){const n=e.timestampValue;this.ye(t,20),"string"==typeof n?t.Ie(n):(t.Ie(`${n.seconds||""}`),t.pe(n.nanos||0))}else if("stringValue"in e)this.Te(e.stringValue,t),this.Ee(t);else if("bytesValue"in e)this.ye(t,30),t.Ae(yt(e.bytesValue)),this.Ee(t);else if("referenceValue"in e)this.ve(e.referenceValue,t);else if("geoPointValue"in e){const n=e.geoPointValue;this.ye(t,45),t.pe(n.latitude||0),t.pe(n.longitude||0)}else"mapValue"in e?Bt(e)?this.ye(t,Number.MAX_SAFE_INTEGER):(this.Re(e.mapValue,t),this.Ee(t)):"arrayValue"in e?(this.Pe(e.arrayValue,t),this.Ee(t)):E()}Te(e,t){this.ye(t,25),this.be(e,t)}be(e,t){t.Ie(e)}Re(e,t){const n=e.fields||{};this.ye(t,55);for(const e of Object.keys(n))this.Te(e,t),this.me(n[e],t)}Pe(e,t){const n=e.values||[];this.ye(t,50);for(const e of n)this.me(e,t)}ve(e,t){this.ye(t,37),H.fromName(e).path.forEach(e=>{this.ye(t,60),this.be(e,t)})}ye(e,t){e.pe(t)}Ee(e){e.pe(2)}}function fi(e){if(0===e)return 8;let t=0;return!(e>>4)&&(t+=4,e<<=4),!(e>>6)&&(t+=2,e<<=2),!(e>>7)&&(t+=1),t}function mi(e){const t=64-(function(e){let t=0;for(let n=0;n<8;++n){const r=fi(255&e[n]);if(t+=r,8!==r)break}return t})(e);return Math.ceil(t/8)}di.Ve=new di;class gi{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Se(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.De(n.value),n=t.next();this.Ce()}xe(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Ne(n.value),n=t.next();this.ke()}Me(e){for(const t of e){const e=t.charCodeAt(0);if(e<128)this.De(e);else if(e<2048)this.De(960|e>>>6),this.De(128|63&e);else if(t<"\ud800"||"\udbff"<t)this.De(480|e>>>12),this.De(128|63&e>>>6),this.De(128|63&e);else{const e=t.codePointAt(0);this.De(240|e>>>18),this.De(128|63&e>>>12),this.De(128|63&e>>>6),this.De(128|63&e)}}this.Ce()}$e(e){for(const t of e){const e=t.charCodeAt(0);if(e<128)this.Ne(e);else if(e<2048)this.Ne(960|e>>>6),this.Ne(128|63&e);else if(t<"\ud800"||"\udbff"<t)this.Ne(480|e>>>12),this.Ne(128|63&e>>>6),this.Ne(128|63&e);else{const e=t.codePointAt(0);this.Ne(240|e>>>18),this.Ne(128|63&e>>>12),this.Ne(128|63&e>>>6),this.Ne(128|63&e)}}this.ke()}Oe(e){const t=this.Fe(e),n=mi(t);this.Be(1+n),this.buffer[this.position++]=255&n;for(let e=t.length-n;e<t.length;++e)this.buffer[this.position++]=255&t[e]}Le(e){const t=this.Fe(e),n=mi(t);this.Be(1+n),this.buffer[this.position++]=~(255&n);for(let e=t.length-n;e<t.length;++e)this.buffer[this.position++]=~(255&t[e])}qe(){this.Ue(255),this.Ue(255)}Ke(){this.Ge(255),this.Ge(255)}reset(){this.position=0}seed(e){this.Be(e.length),this.buffer.set(e,this.position),this.position+=e.length}Qe(){return this.buffer.slice(0,this.position)}Fe(e){const t=(function(e){const t=new DataView(new ArrayBuffer(8));return t.setFloat64(0,e,!1),new Uint8Array(t.buffer)})(e),n=!!(128&t[0]);t[0]^=n?255:128;for(let e=1;e<t.length;++e)t[e]^=n?255:0;return t}De(e){const t=255&e;0===t?(this.Ue(0),this.Ue(255)):255===t?(this.Ue(255),this.Ue(0)):this.Ue(t)}Ne(e){const t=255&e;0===t?(this.Ge(0),this.Ge(255)):255===t?(this.Ge(255),this.Ge(0)):this.Ge(e)}Ce(){this.Ue(0),this.Ue(1)}ke(){this.Ge(0),this.Ge(1)}Ue(e){this.Be(1),this.buffer[this.position++]=e}Ge(e){this.Be(1),this.buffer[this.position++]=~e}Be(e){const t=e+this.position;if(t<=this.buffer.length)return;let n=2*this.buffer.length;n<t&&(n=t);const r=new Uint8Array(n);r.set(this.buffer),this.buffer=r}}class pi{constructor(e){this.je=e}Ae(e){this.je.Se(e)}Ie(e){this.je.Me(e)}pe(e){this.je.Oe(e)}ge(){this.je.qe()}}class yi{constructor(e){this.je=e}Ae(e){this.je.xe(e)}Ie(e){this.je.$e(e)}pe(e){this.je.Le(e)}ge(){this.je.Ke()}}class wi{constructor(){this.je=new gi,this.ze=new pi(this.je),this.We=new yi(this.je)}seed(e){this.je.seed(e)}He(e){return 0===e?this.ze:this.We}Qe(){return this.je.Qe()}reset(){this.je.reset()}}
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
   */class vi{constructor(e,t,n,r){this.indexId=e,this.documentKey=t,this.arrayValue=n,this.directionalValue=r}Je(){const e=this.directionalValue.length,t=0===e||255===this.directionalValue[e-1]?e+1:e,n=new Uint8Array(t);return n.set(this.directionalValue,0),t!==e?n.set([0],this.directionalValue.length):++n[n.length-1],new vi(this.indexId,this.documentKey,this.arrayValue,n)}}function bi(e,t){let n=e.indexId-t.indexId;return 0!==n?n:(n=Ii(e.arrayValue,t.arrayValue),0!==n?n:(n=Ii(e.directionalValue,t.directionalValue),0!==n?n:H.comparator(e.documentKey,t.documentKey)))}function Ii(e,t){for(let n=0;n<e.length&&n<t.length;++n){const r=e[n]-t[n];if(0!==r)return r}return e.length-t.length}
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
   */class Ei{constructor(e){this.collectionId=null!=e.collectionGroup?e.collectionGroup:e.path.lastSegment(),this.Ye=e.orderBy,this.Xe=[];for(const t of e.filters){const e=t;e.isInequality()?this.Ze=e:this.Xe.push(e)}}tn(e){T(e.collectionGroup===this.collectionId);const t=X(e);if(void 0!==t&&!this.en(t))return!1;const n=J(e);let r=new Set,s=0,i=0;for(;s<n.length&&this.en(n[s]);++s)r=r.add(n[s].fieldPath.canonicalString());if(s===n.length)return!0;if(void 0!==this.Ze){if(!r.has(this.Ze.field.canonicalString())){const e=n[s];if(!this.nn(this.Ze,e)||!this.sn(this.Ye[i++],e))return!1}++s}for(;s<n.length;++s){const e=n[s];if(i>=this.Ye.length||!this.sn(this.Ye[i++],e))return!1}return!0}en(e){for(const t of this.Xe)if(this.nn(t,e))return!0;return!1}nn(e,t){if(void 0===e||!e.field.isEqual(t.fieldPath))return!1;const n="array-contains"===e.op||"array-contains-any"===e.op;return 2===t.kind===n}sn(e,t){return!!e.field.isEqual(t.fieldPath)&&(0===t.kind&&"asc"===e.dir||1===t.kind&&"desc"===e.dir)}}
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
   */function Ti(e){var t,n;if(T(e instanceof en||e instanceof tn),e instanceof en){if(e instanceof pn){const r=(null===(n=null===(t=e.value.arrayValue)||void 0===t?void 0:t.values)||void 0===n?void 0:n.map(t=>en.create(e.field,"==",t)))||[];return tn.create(r,"or")}return e}const r=e.filters.map(e=>Ti(e));return tn.create(r,e.op)}function Si(e){if(0===e.getFilters().length)return[];const t=Ci(Ti(e));return T(Di(t)),_i(t)||xi(t)?[t]:t.getFilters()}function _i(e){return e instanceof en}function xi(e){return e instanceof tn&&sn(e)}function Di(e){return _i(e)||xi(e)||(function(e){if(e instanceof tn&&rn(e)){for(const t of e.getFilters())if(!_i(t)&&!xi(t))return!1;return!0}return!1})(e)}function Ci(e){if(T(e instanceof en||e instanceof tn),e instanceof en)return e;if(1===e.filters.length)return Ci(e.filters[0]);const t=e.filters.map(e=>Ci(e));let n=tn.create(t,e.op);return n=ki(n),Di(n)?n:(T(n instanceof tn),T(nn(n)),T(n.filters.length>1),n.filters.reduce((e,t)=>Ni(e,t)))}function Ni(e,t){let n;return T(e instanceof en||e instanceof tn),T(t instanceof en||t instanceof tn),n=e instanceof en?t instanceof en?(function(e,t){return tn.create([e,t],"and")})(e,t):Ai(e,t):t instanceof en?Ai(t,e):(function(e,t){if(T(e.filters.length>0&&t.filters.length>0),nn(e)&&nn(t))return un(e,t.getFilters());const n=rn(e)?e:t,r=rn(e)?t:e,s=n.filters.map(e=>Ni(e,r));return tn.create(s,"or")})(e,t),ki(n)}function Ai(e,t){if(nn(t))return un(t,e.getFilters());{const n=t.filters.map(t=>Ni(e,t));return tn.create(n,"or")}}function ki(e){if(T(e instanceof en||e instanceof tn),e instanceof en)return e;const t=e.getFilters();if(1===t.length)return ki(t[0]);if(on(e))return e;const n=t.map(e=>ki(e)),r=[];return n.forEach(t=>{t instanceof en?r.push(t):t instanceof tn&&(t.op===e.op?r.push(...t.filters):r.push(t))}),1===r.length?r[0]:tn.create(r,e.op)
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
   */}class Oi{constructor(){this.rn=new Pi}addToCollectionParentIndex(e,t){return this.rn.add(t),le.resolve()}getCollectionParents(e,t){return le.resolve(this.rn.getEntries(t))}addFieldIndex(e,t){return le.resolve()}deleteFieldIndex(e,t){return le.resolve()}getDocumentsMatchingTarget(e,t){return le.resolve(null)}getIndexType(e,t){return le.resolve(0)}getFieldIndexes(e,t){return le.resolve([])}getNextCollectionGroupToUpdate(e){return le.resolve(null)}getMinOffset(e,t){return le.resolve(ie.min())}getMinOffsetFromCollectionGroup(e,t){return le.resolve(ie.min())}updateCollectionGroup(e,t,n){return le.resolve()}updateIndexEntries(e,t){return le.resolve()}}class Pi{constructor(){this.index={}}add(e){const t=e.lastSegment(),n=e.popLast(),r=this.index[t]||new at($.comparator),s=!r.has(n);return this.index[t]=r.add(n),s}has(e){const t=e.lastSegment(),n=e.popLast(),r=this.index[t];return r&&r.has(n)}getEntries(e){return(this.index[e]||new at($.comparator)).toArray()}}
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
   */const Fi=new Uint8Array(0);class Mi{constructor(e,t){this.user=e,this.databaseId=t,this.on=new Pi,this.un=new Kn(e=>In(e),(e,t)=>En(e,t)),this.uid=e.uid||""}addToCollectionParentIndex(e,t){if(!this.on.has(t)){const n=t.lastSegment(),r=t.popLast();e.addOnCommittedListener(()=>{this.on.add(t)});const s={collectionId:n,parent:xe(r)};return Ri(e).put(s)}return le.resolve()}getCollectionParents(e,t){const n=[],r=IDBKeyRange.bound([t,""],[j(t),""],!1,!0);return Ri(e).j(r).next(e=>{for(const r of e){if(r.collectionId!==t)break;n.push(Ne(r.parent))}return n})}addFieldIndex(e,t){const n=Li(e),r=(function(e){return{indexId:e.indexId,collectionGroup:e.collectionGroup,fields:e.fields.map(e=>[e.fieldPath.canonicalString(),e.kind])}})(t);delete r.indexId;const s=n.add(r);if(t.indexState){const n=qi(e);return s.next(e=>{n.put(oi(e,this.user,t.indexState.sequenceNumber,t.indexState.offset))})}return s.next()}deleteFieldIndex(e,t){const n=Li(e),r=qi(e),s=Vi(e);return n.delete(t.indexId).next(()=>r.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0))).next(()=>s.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0)))}getDocumentsMatchingTarget(e,t){const n=Vi(e);let r=!0;const s=new Map;return le.forEach(this.cn(t),t=>this.an(e,t).next(e=>{r&&(r=!!e),s.set(t,e)})).next(()=>{if(r){let e=nr();const r=[];return le.forEach(s,(s,i)=>{var o;w("IndexedDbIndexManager",`Using index ${o=s,`id=${o.indexId}|cg=${o.collectionGroup}|f=${o.fields.map(e=>`${e.fieldPath}:${e.kind}`).join(",")}`} to execute ${In(t)}`);const a=(function(e,t){const n=X(t);if(void 0===n)return null;for(const t of Sn(e,n.fieldPath))switch(t.op){case"array-contains-any":return t.value.arrayValue.values||[];case"array-contains":return[t.value]}return null})(i,s),c=(function(e,t){const n=new Map;for(const r of J(t))for(const t of Sn(e,r.fieldPath))switch(t.op){case"==":case"in":n.set(r.fieldPath.canonicalString(),t.value);break;case"not-in":case"!=":return n.set(r.fieldPath.canonicalString(),t.value),Array.from(n.values())}return null})(i,s),u=(function(e,t){const n=[];let r=!0;for(const s of J(t)){const t=0===s.kind?_n(e,s.fieldPath,e.startAt):xn(e,s.fieldPath,e.startAt);n.push(t.value),r&&(r=t.inclusive)}return new Wt(n,r)})(i,s),l=(function(e,t){const n=[];let r=!0;for(const s of J(t)){const t=0===s.kind?xn(e,s.fieldPath,e.endAt):_n(e,s.fieldPath,e.endAt);n.push(t.value),r&&(r=t.inclusive)}return new Wt(n,r)})(i,s),h=this.hn(s,i,u),d=this.hn(s,i,l),f=this.ln(s,i,c),m=this.fn(s.indexId,a,h,u.inclusive,d,l.inclusive,f);return le.forEach(m,s=>n.H(s,t.limit).next(t=>{t.forEach(t=>{const n=H.fromSegments(t.documentKey);e.has(n)||(e=e.add(n),r.push(n))})}))}).next(()=>r)}return le.resolve(null)})}cn(e){let t=this.un.get(e);return t||(t=0===e.filters.length?[e]:Si(tn.create(e.filters,"and")).map(t=>bn(e.path,e.collectionGroup,e.orderBy,t.getFilters(),e.limit,e.startAt,e.endAt)),this.un.set(e,t),t)}fn(e,t,n,r,s,i,o){const a=(null!=t?t.length:1)*Math.max(n.length,s.length),c=a/(null!=t?t.length:1),u=[];for(let l=0;l<a;++l){const a=t?this.dn(t[l/c]):Fi,h=this.wn(e,a,n[l%c],r),d=this._n(e,a,s[l%c],i),f=o.map(t=>this.wn(e,a,t,!0));u.push(...this.createRange(h,d,f))}return u}wn(e,t,n,r){const s=new vi(e,H.empty(),t,n);return r?s:s.Je()}_n(e,t,n,r){const s=new vi(e,H.empty(),t,n);return r?s.Je():s}an(e,t){const n=new Ei(t),r=null!=t.collectionGroup?t.collectionGroup:t.path.lastSegment();return this.getFieldIndexes(e,r).next(e=>{let t=null;for(const r of e)n.tn(r)&&(!t||r.fields.length>t.fields.length)&&(t=r);return t})}getIndexType(e,t){let n=2;const r=this.cn(t);return le.forEach(r,t=>this.an(e,t).next(e=>{e?0!==n&&e.fields.length<(function(e){let t=new at(W.comparator),n=!1;for(const r of e.filters)for(const e of r.getFlattenedFilters())e.field.isKeyField()||("array-contains"===e.op||"array-contains-any"===e.op?n=!0:t=t.add(e.field));for(const n of e.orderBy)n.field.isKeyField()||(t=t.add(n.field));return t.size+(n?1:0)})(t)&&(n=1):n=0})).next(()=>(function(e){return null!==e.limit})(t)&&r.length>1&&2===n?1:n)}mn(e,t){const n=new wi;for(const r of J(e)){const e=t.data.field(r.fieldPath);if(null==e)return null;const s=n.He(r.kind);di.Ve._e(e,s)}return n.Qe()}dn(e){const t=new wi;return di.Ve._e(e,t.He(0)),t.Qe()}gn(e,t){const n=new wi;return di.Ve._e(Pt(this.databaseId,t),n.He((function(e){const t=J(e);return 0===t.length?0:t[t.length-1].kind})(e))),n.Qe()}ln(e,t,n){if(null===n)return[];let r=[];r.push(new wi);let s=0;for(const i of J(e)){const e=n[s++];for(const n of r)if(this.yn(t,i.fieldPath)&&Mt(e))r=this.pn(r,i,e);else{const t=n.He(i.kind);di.Ve._e(e,t)}}return this.In(r)}hn(e,t,n){return this.ln(e,t,n.position)}In(e){const t=[];for(let n=0;n<e.length;++n)t[n]=e[n].Qe();return t}pn(e,t,n){const r=[...e],s=[];for(const e of n.arrayValue.values||[])for(const n of r){const r=new wi;r.seed(n.Qe()),di.Ve._e(e,r.He(t.kind)),s.push(r)}return s}yn(e,t){return!!e.filters.find(e=>e instanceof en&&e.field.isEqual(t)&&("in"===e.op||"not-in"===e.op))}getFieldIndexes(e,t){const n=Li(e),r=qi(e);return(t?n.j("collectionGroupIndex",IDBKeyRange.bound(t,t)):n.j()).next(e=>{const t=[];return le.forEach(e,e=>r.get([e.indexId,this.uid]).next(n=>{t.push((function(e,t){const n=t?new ne(t.sequenceNumber,new ie(Zs(t.readTime),new H(Ne(t.documentKey)),t.largestBatchId)):ne.empty(),r=e.fields.map(([e,t])=>new ee(W.fromServerFormat(e),t));return new Y(e.indexId,e.collectionGroup,r,n)})(e,n))})).next(()=>t)})}getNextCollectionGroupToUpdate(e){return this.getFieldIndexes(e).next(e=>0===e.length?null:(e.sort((e,t)=>{const n=e.indexState.sequenceNumber-t.indexState.sequenceNumber;return 0!==n?n:B(e.collectionGroup,t.collectionGroup)}),e[0].collectionGroup))}updateCollectionGroup(e,t,n){const r=Li(e),s=qi(e);return this.Tn(e).next(e=>r.j("collectionGroupIndex",IDBKeyRange.bound(t,t)).next(t=>le.forEach(t,t=>s.put(oi(t.indexId,this.user,e,n)))))}updateIndexEntries(e,t){const n=new Map;return le.forEach(t,(t,r)=>{const s=n.get(t.collectionGroup);return(s?le.resolve(s):this.getFieldIndexes(e,t.collectionGroup)).next(s=>(n.set(t.collectionGroup,s),le.forEach(s,n=>this.En(e,t,n).next(t=>{const s=this.An(r,n);return t.isEqual(s)?le.resolve():this.vn(e,r,n,t,s)}))))})}Rn(e,t,n,r){return Vi(e).put({indexId:r.indexId,uid:this.uid,arrayValue:r.arrayValue,directionalValue:r.directionalValue,orderedDocumentKey:this.gn(n,t.key),documentKey:t.key.path.toArray()})}Pn(e,t,n,r){return Vi(e).delete([r.indexId,this.uid,r.arrayValue,r.directionalValue,this.gn(n,t.key),t.key.path.toArray()])}En(e,t,n){const r=Vi(e);let s=new at(bi);return r.X({index:"documentKeyIndex",range:IDBKeyRange.only([n.indexId,this.uid,this.gn(n,t)])},(e,r)=>{s=s.add(new vi(n.indexId,t,r.arrayValue,r.directionalValue))}).next(()=>s)}An(e,t){let n=new at(bi);const r=this.mn(t,e);if(null==r)return n;const s=X(t);if(null!=s){const i=e.data.field(s.fieldPath);if(Mt(i))for(const s of i.arrayValue.values||[])n=n.add(new vi(t.indexId,e.key,this.dn(s),r))}else n=n.add(new vi(t.indexId,e.key,Fi,r));return n}vn(e,t,n,r,s){w("IndexedDbIndexManager","Updating index entries for document '%s'",t.key);const i=[];return(function(e,t,n,r,s){const i=e.getIterator(),o=t.getIterator();let a=ut(i),c=ut(o);for(;a||c;){let e=!1,t=!1;if(a&&c){const r=n(a,c);r<0?t=!0:r>0&&(e=!0)}else null!=a?t=!0:e=!0;e?(r(c),c=ut(o)):t?(s(a),a=ut(i)):(a=ut(i),c=ut(o))}})(r,s,bi,r=>{i.push(this.Rn(e,t,n,r))},r=>{i.push(this.Pn(e,t,n,r))}),le.waitFor(i)}Tn(e){let t=1;return qi(e).X({index:"sequenceNumberIndex",reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},(e,n,r)=>{r.done(),t=n.sequenceNumber+1}).next(()=>t)}createRange(e,t,n){n=n.sort((e,t)=>bi(e,t)).filter((e,t,n)=>!t||0!==bi(e,n[t-1]));const r=[];r.push(e);for(const s of n){const n=bi(s,e),i=bi(s,t);if(0===n)r[0]=e.Je();else if(n>0&&i<0)r.push(s),r.push(s.Je());else if(i>0)break}r.push(t);const s=[];for(let e=0;e<r.length;e+=2){if(this.bn(r[e],r[e+1]))return[];const t=[r[e].indexId,this.uid,r[e].arrayValue,r[e].directionalValue,Fi,[]],n=[r[e+1].indexId,this.uid,r[e+1].arrayValue,r[e+1].directionalValue,Fi,[]];s.push(IDBKeyRange.bound(t,n))}return s}bn(e,t){return bi(e,t)>0}getMinOffsetFromCollectionGroup(e,t){return this.getFieldIndexes(e,t).next(Bi)}getMinOffset(e,t){return le.mapArray(this.cn(t),t=>this.an(e,t).next(e=>e||E())).next(Bi)}}function Ri(e){return et(e,"collectionParents")}function Vi(e){return et(e,"indexEntries")}function Li(e){return et(e,"indexConfiguration")}function qi(e){return et(e,"indexState")}function Bi(e){T(0!==e.length);let t=e[0].indexState.offset,n=t.largestBatchId;for(let r=1;r<e.length;r++){const s=e[r].indexState.offset;oe(s,t)<0&&(t=s),n<s.largestBatchId&&(n=s.largestBatchId)}return new ie(t.readTime,t.documentKey,n)}
/**
   * @license
   * Copyright 2018 Google LLC
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
   */const Ui={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0};class ji{constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}static withCacheSize(e){return new ji(e,ji.DEFAULT_COLLECTION_PERCENTILE,ji.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}}
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
   */function zi(e,t,n){const r=e.store("mutations"),s=e.store("documentMutations"),i=[],o=IDBKeyRange.only(n.batchId);let a=0;const c=r.X({range:o},(e,t,n)=>(a++,n.delete()));i.push(c.next(()=>{T(1===a)}));const u=[];for(const e of n.mutations){const r=Oe(t,e.key.path,n.batchId);i.push(s.delete(r)),u.push(e.key)}return le.waitFor(i).next(()=>u)}function Gi(e){if(!e)return 0;let t;if(e.document)t=e.document;else if(e.unknownDocument)t=e.unknownDocument;else{if(!e.noDocument)throw E();t=e.noDocument}return JSON.stringify(t).length}
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
   */ji.DEFAULT_COLLECTION_PERCENTILE=10,ji.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,ji.DEFAULT=new ji(41943040,ji.DEFAULT_COLLECTION_PERCENTILE,ji.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),ji.DISABLED=new ji(-1,0,0);class Ki{constructor(e,t,n,r){this.userId=e,this.serializer=t,this.indexManager=n,this.referenceDelegate=r,this.Vn={}}static de(e,t,n,r){T(""!==e.uid);const s=e.isAuthenticated()?e.uid:"";return new Ki(s,t,n,r)}checkEmpty(e){let t=!0;const n=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return Qi(e).X({index:"userMutationsIndex",range:n},(e,n,r)=>{t=!1,r.done()}).next(()=>t)}addMutationBatch(e,t,n,r){const s=Wi(e),i=Qi(e);return i.add({}).next(o=>{T("number"==typeof o);const a=new Lr(o,t,n,r),c=(function(e,t,n){const r=n.baseMutations.map(t=>ks(e.fe,t)),s=n.mutations.map(t=>ks(e.fe,t));return{userId:t,batchId:n.batchId,localWriteTimeMs:n.localWriteTime.toMillis(),baseMutations:r,mutations:s}})(this.serializer,this.userId,a),u=[];let l=new at((e,t)=>B(e.canonicalString(),t.canonicalString()));for(const e of r){const t=Oe(this.userId,e.key.path,o);l=l.add(e.key.path.popLast()),u.push(i.put(c)),u.push(s.put(t,Pe))}return l.forEach(t=>{u.push(this.indexManager.addToCollectionParentIndex(e,t))}),e.addOnCommittedListener(()=>{this.Vn[o]=a.keys()}),le.waitFor(u).next(()=>a)})}lookupMutationBatch(e,t){return Qi(e).get(t).next(e=>e?(T(e.userId===this.userId),ei(this.serializer,e)):null)}Sn(e,t){return this.Vn[t]?le.resolve(this.Vn[t]):this.lookupMutationBatch(e,t).next(e=>{if(e){const n=e.keys();return this.Vn[t]=n,n}return null})}getNextMutationBatchAfterBatchId(e,t){const n=t+1,r=IDBKeyRange.lowerBound([this.userId,n]);let s=null;return Qi(e).X({index:"userMutationsIndex",range:r},(e,t,r)=>{t.userId===this.userId&&(T(t.batchId>=n),s=ei(this.serializer,t)),r.done()}).next(()=>s)}getHighestUnacknowledgedBatchId(e){const t=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let n=-1;return Qi(e).X({index:"userMutationsIndex",range:t,reverse:!0},(e,t,r)=>{n=t.batchId,r.done()}).next(()=>n)}getAllMutationBatches(e){const t=IDBKeyRange.bound([this.userId,-1],[this.userId,Number.POSITIVE_INFINITY]);return Qi(e).j("userMutationsIndex",t).next(e=>e.map(e=>ei(this.serializer,e)))}getAllMutationBatchesAffectingDocumentKey(e,t){const n=ke(this.userId,t.path),r=IDBKeyRange.lowerBound(n),s=[];return Wi(e).X({range:r},(n,r,i)=>{const[o,a,c]=n,u=Ne(a);if(o===this.userId&&t.path.isEqual(u))return Qi(e).get(c).next(e=>{if(!e)throw E();T(e.userId===this.userId),s.push(ei(this.serializer,e))});i.done()}).next(()=>s)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new at(B);const r=[];return t.forEach(t=>{const s=ke(this.userId,t.path),i=IDBKeyRange.lowerBound(s),o=Wi(e).X({range:i},(e,r,s)=>{const[i,o,a]=e,c=Ne(o);i===this.userId&&t.path.isEqual(c)?n=n.add(a):s.done()});r.push(o)}),le.waitFor(r).next(()=>this.Dn(e,n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,r=n.length+1,s=ke(this.userId,n),i=IDBKeyRange.lowerBound(s);let o=new at(B);return Wi(e).X({range:i},(e,t,s)=>{const[i,a,c]=e,u=Ne(a);i===this.userId&&n.isPrefixOf(u)?u.length===r&&(o=o.add(c)):s.done()}).next(()=>this.Dn(e,o))}Dn(e,t){const n=[],r=[];return t.forEach(t=>{r.push(Qi(e).get(t).next(e=>{if(null===e)throw E();T(e.userId===this.userId),n.push(ei(this.serializer,e))}))}),le.waitFor(r).next(()=>n)}removeMutationBatch(e,t){return zi(e.ht,this.userId,t).next(n=>(e.addOnCommittedListener(()=>{this.Cn(t.batchId)}),le.forEach(n,t=>this.referenceDelegate.markPotentiallyOrphaned(e,t))))}Cn(e){delete this.Vn[e]}performConsistencyCheck(e){return this.checkEmpty(e).next(t=>{if(!t)return le.resolve();const n=IDBKeyRange.lowerBound([this.userId]),r=[];return Wi(e).X({range:n},(e,t,n)=>{if(e[0]===this.userId){const t=Ne(e[1]);r.push(t)}else n.done()}).next(()=>{T(0===r.length)})})}containsKey(e,t){return $i(e,this.userId,t)}xn(e){return Hi(e).get(this.userId).next(e=>e||{userId:this.userId,lastAcknowledgedBatchId:-1,lastStreamToken:""})}}function $i(e,t,n){const r=ke(t,n.path),s=r[1],i=IDBKeyRange.lowerBound(r);let o=!1;return Wi(e).X({range:i,Y:!0},(e,n,r)=>{const[i,a,c]=e;i===t&&a===s&&(o=!0),r.done()}).next(()=>o)}function Qi(e){return et(e,"mutations")}function Wi(e){return et(e,"documentMutations")}function Hi(e){return et(e,"mutationQueues")}
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
   */class Yi{constructor(e){this.Nn=e}next(){return this.Nn+=2,this.Nn}static kn(){return new Yi(0)}static Mn(){return new Yi(-1)}}
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
   */class Xi{constructor(e,t){this.referenceDelegate=e,this.serializer=t}allocateTargetId(e){return this.$n(e).next(t=>{const n=new Yi(t.highestTargetId);return t.highestTargetId=n.next(),this.On(e,t).next(()=>t.highestTargetId)})}getLastRemoteSnapshotVersion(e){return this.$n(e).next(e=>G.fromTimestamp(new z(e.lastRemoteSnapshotVersion.seconds,e.lastRemoteSnapshotVersion.nanoseconds)))}getHighestSequenceNumber(e){return this.$n(e).next(e=>e.highestListenSequenceNumber)}setTargetsMetadata(e,t,n){return this.$n(e).next(r=>(r.highestListenSequenceNumber=t,n&&(r.lastRemoteSnapshotVersion=n.toTimestamp()),t>r.highestListenSequenceNumber&&(r.highestListenSequenceNumber=t),this.On(e,r)))}addTargetData(e,t){return this.Fn(e,t).next(()=>this.$n(e).next(n=>(n.targetCount+=1,this.Bn(t,n),this.On(e,n))))}updateTargetData(e,t){return this.Fn(e,t)}removeTargetData(e,t){return this.removeMatchingKeysForTargetId(e,t.targetId).next(()=>Ji(e).delete(t.targetId)).next(()=>this.$n(e)).next(t=>(T(t.targetCount>0),t.targetCount-=1,this.On(e,t)))}removeTargets(e,t,n){let r=0;const s=[];return Ji(e).X((i,o)=>{const a=ti(o);a.sequenceNumber<=t&&null===n.get(a.targetId)&&(r++,s.push(this.removeTargetData(e,a)))}).next(()=>le.waitFor(s)).next(()=>r)}forEachTarget(e,t){return Ji(e).X((e,n)=>{const r=ti(n);t(r)})}$n(e){return Zi(e).get("targetGlobalKey").next(e=>(T(null!==e),e))}On(e,t){return Zi(e).put("targetGlobalKey",t)}Fn(e,t){return Ji(e).put(ni(this.serializer,t))}Bn(e,t){let n=!1;return e.targetId>t.highestTargetId&&(t.highestTargetId=e.targetId,n=!0),e.sequenceNumber>t.highestListenSequenceNumber&&(t.highestListenSequenceNumber=e.sequenceNumber,n=!0),n}getTargetCount(e){return this.$n(e).next(e=>e.targetCount)}getTargetData(e,t){const n=In(t),r=IDBKeyRange.bound([n,Number.NEGATIVE_INFINITY],[n,Number.POSITIVE_INFINITY]);let s=null;return Ji(e).X({range:r,index:"queryTargetsIndex"},(e,n,r)=>{const i=ti(n);En(t,i.target)&&(s=i,r.done())}).next(()=>s)}addMatchingKeys(e,t,n){const r=[],s=eo(e);return t.forEach(t=>{const i=xe(t.path);r.push(s.put({targetId:n,path:i})),r.push(this.referenceDelegate.addReference(e,n,t))}),le.waitFor(r)}removeMatchingKeys(e,t,n){const r=eo(e);return le.forEach(t,t=>{const s=xe(t.path);return le.waitFor([r.delete([n,s]),this.referenceDelegate.removeReference(e,n,t)])})}removeMatchingKeysForTargetId(e,t){const n=eo(e),r=IDBKeyRange.bound([t],[t+1],!1,!0);return n.delete(r)}getMatchingKeysForTargetId(e,t){const n=IDBKeyRange.bound([t],[t+1],!1,!0),r=eo(e);let s=nr();return r.X({range:n,Y:!0},(e,t,n)=>{const r=Ne(e[1]),i=new H(r);s=s.add(i)}).next(()=>s)}containsKey(e,t){const n=xe(t.path),r=IDBKeyRange.bound([n],[j(n)],!1,!0);let s=0;return eo(e).X({index:"documentTargetsIndex",Y:!0,range:r},([e,t],n,r)=>{0!==e&&(s++,r.done())}).next(()=>s>0)}le(e,t){return Ji(e).get(t).next(e=>e?ti(e):null)}}function Ji(e){return et(e,"targets")}function Zi(e){return et(e,"targetGlobal")}function eo(e){return et(e,"targetDocuments")}
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
   */function to([e,t],[n,r]){const s=B(e,n);return 0===s?B(t,r):s}class no{constructor(e){this.Ln=e,this.buffer=new at(to),this.qn=0}Un(){return++this.qn}Kn(e){const t=[e,this.Un()];if(this.buffer.size<this.Ln)this.buffer=this.buffer.add(t);else{const e=this.buffer.last();to(t,e)<0&&(this.buffer=this.buffer.delete(e).add(t))}}get maxValue(){return this.buffer.last()[0]}}class ro{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.Gn=null}start(){-1!==this.garbageCollector.params.cacheSizeCollectionThreshold&&this.Qn(6e4)}stop(){this.Gn&&(this.Gn.cancel(),this.Gn=null)}get started(){return null!==this.Gn}Qn(e){w("LruGarbageCollector",`Garbage collection scheduled in ${e}ms`),this.Gn=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.Gn=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(e){ge(e)?w("LruGarbageCollector","Ignoring IndexedDB error during garbage collection: ",e):await ue(e)}await this.Qn(3e5)})}}class so{constructor(e,t){this.jn=e,this.params=t}calculateTargetCount(e,t){return this.jn.zn(e).next(e=>Math.floor(t/100*e))}nthSequenceNumber(e,t){if(0===t)return le.resolve(Ee.ct);const n=new no(t);return this.jn.forEachTarget(e,e=>n.Kn(e.sequenceNumber)).next(()=>this.jn.Wn(e,e=>n.Kn(e))).next(()=>n.maxValue)}removeTargets(e,t,n){return this.jn.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.jn.removeOrphanedDocuments(e,t)}collect(e,t){return-1===this.params.cacheSizeCollectionThreshold?(w("LruGarbageCollector","Garbage collection skipped; disabled"),le.resolve(Ui)):this.getCacheSize(e).next(n=>n<this.params.cacheSizeCollectionThreshold?(w("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Ui):this.Hn(e,t))}getCacheSize(e){return this.jn.getCacheSize(e)}Hn(e,t){let n,r,s,i,o,a,c;const l=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(t=>(t>this.params.maximumSequenceNumbersToCollect?(w("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${t}`),r=this.params.maximumSequenceNumbersToCollect):r=t,i=Date.now(),this.nthSequenceNumber(e,r))).next(r=>(n=r,o=Date.now(),this.removeTargets(e,n,t))).next(t=>(s=t,a=Date.now(),this.removeOrphanedDocuments(e,n))).next(e=>(c=Date.now(),p()<=u.LogLevel.DEBUG&&w("LruGarbageCollector",`LRU Garbage Collection\n\tCounted targets in ${i-l}ms\n\tDetermined least recently used ${r} in `+(o-i)+"ms\n"+`\tRemoved ${s} targets in `+(a-o)+"ms\n"+`\tRemoved ${e} documents in `+(c-a)+"ms\n"+`Total Duration: ${c-l}ms`),le.resolve({didRun:!0,sequenceNumbersCollected:r,targetsRemoved:s,documentsRemoved:e})))}}function io(e,t){return new so(e,t)}
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
   */class oo{constructor(e,t){this.db=e,this.garbageCollector=io(this,t)}zn(e){const t=this.Jn(e);return this.db.getTargetCache().getTargetCount(e).next(e=>t.next(t=>e+t))}Jn(e){let t=0;return this.Wn(e,e=>{t++}).next(()=>t)}forEachTarget(e,t){return this.db.getTargetCache().forEachTarget(e,t)}Wn(e,t){return this.Yn(e,(e,n)=>t(n))}addReference(e,t,n){return ao(e,n)}removeReference(e,t,n){return ao(e,n)}removeTargets(e,t,n){return this.db.getTargetCache().removeTargets(e,t,n)}markPotentiallyOrphaned(e,t){return ao(e,t)}Xn(e,t){return(function(e,t){let n=!1;return Hi(e).Z(r=>$i(e,r,t).next(e=>(e&&(n=!0),le.resolve(!e)))).next(()=>n)})(e,t)}removeOrphanedDocuments(e,t){const n=this.db.getRemoteDocumentCache().newChangeBuffer(),r=[];let s=0;return this.Yn(e,(i,o)=>{if(o<=t){const t=this.Xn(e,i).next(t=>{if(!t)return s++,n.getEntry(e,i).next(()=>(n.removeEntry(i,G.min()),eo(e).delete([0,xe(i.path)])))});r.push(t)}}).next(()=>le.waitFor(r)).next(()=>n.apply(e)).next(()=>s)}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(e,n)}updateLimboDocument(e,t){return ao(e,t)}Yn(e,t){const n=eo(e);let r,s=Ee.ct;return n.X({index:"documentTargetsIndex"},([e,n],{path:i,sequenceNumber:o})=>{0===e?(s!==Ee.ct&&t(new H(Ne(r)),s),s=o,r=i):s=Ee.ct}).next(()=>{s!==Ee.ct&&t(new H(Ne(r)),s)})}getCacheSize(e){return this.db.getRemoteDocumentCache().getSize(e)}}function ao(e,t){return eo(e).put((function(e,t){return{targetId:0,path:xe(e.path),sequenceNumber:t}})(t,e.currentSequenceNumber))}
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
   */class co{constructor(){this.changes=new Kn(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,Qt.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const n=this.changes.get(t);return void 0!==n?le.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}
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
   */class uo{constructor(e){this.serializer=e}setIndexManager(e){this.indexManager=e}addEntry(e,t,n){return mo(e).put(n)}removeEntry(e,t,n){return mo(e).delete((function(e,t){const n=e.path.toArray();return[n.slice(0,n.length-2),n[n.length-2],Xs(t),n[n.length-1]]})(t,n))}updateMetadata(e,t){return this.getMetadata(e).next(n=>(n.byteSize+=t,this.Zn(e,n)))}getEntry(e,t){let n=Qt.newInvalidDocument(t);return mo(e).X({index:"documentKeyIndex",range:IDBKeyRange.only(go(t))},(e,r)=>{n=this.ts(t,r)}).next(()=>n)}es(e,t){let n={size:0,document:Qt.newInvalidDocument(t)};return mo(e).X({index:"documentKeyIndex",range:IDBKeyRange.only(go(t))},(e,r)=>{n={document:this.ts(t,r),size:Gi(r)}}).next(()=>n)}getEntries(e,t){let n=Qn();return this.ns(e,t,(e,t)=>{const r=this.ts(e,t);n=n.insert(e,r)}).next(()=>n)}ss(e,t){let n=Qn(),r=new st(H.comparator);return this.ns(e,t,(e,t)=>{const s=this.ts(e,t);n=n.insert(e,s),r=r.insert(e,Gi(t))}).next(()=>({documents:n,rs:r}))}ns(e,t,n){if(t.isEmpty())return le.resolve();let r=new at(yo);t.forEach(e=>r=r.add(e));const s=IDBKeyRange.bound(go(r.first()),go(r.last())),i=r.getIterator();let o=i.getNext();return mo(e).X({index:"documentKeyIndex",range:s},(e,t,r)=>{const s=H.fromSegments([...t.prefixPath,t.collectionGroup,t.documentId]);for(;o&&yo(o,s)<0;)n(o,null),o=i.getNext();o&&o.isEqual(s)&&(n(o,t),o=i.hasNext()?i.getNext():null),o?r.G(go(o)):r.done()}).next(()=>{for(;o;)n(o,null),o=i.hasNext()?i.getNext():null})}getDocumentsMatchingQuery(e,t,n,r){const s=t.path,i=[s.popLast().toArray(),s.lastSegment(),Xs(n.readTime),n.documentKey.path.isEmpty()?"":n.documentKey.path.lastSegment()],o=[s.popLast().toArray(),s.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return mo(e).j(IDBKeyRange.bound(i,o,!0)).next(e=>{let n=Qn();for(const s of e){const e=this.ts(H.fromSegments(s.prefixPath.concat(s.collectionGroup,s.documentId)),s);e.isFoundDocument()&&(Un(t,e)||r.has(e.key))&&(n=n.insert(e.key,e))}return n})}getAllFromCollectionGroup(e,t,n,r){let s=Qn();const i=po(t,n),o=po(t,ie.max());return mo(e).X({index:"collectionGroupIndex",range:IDBKeyRange.bound(i,o,!0)},(e,t,n)=>{const i=this.ts(H.fromSegments(t.prefixPath.concat(t.collectionGroup,t.documentId)),t);s=s.insert(i.key,i),s.size===r&&n.done()}).next(()=>s)}newChangeBuffer(e){return new ho(this,!!e&&e.trackRemovals)}getSize(e){return this.getMetadata(e).next(e=>e.byteSize)}getMetadata(e){return fo(e).get("remoteDocumentGlobalKey").next(e=>(T(!!e),e))}Zn(e,t){return fo(e).put("remoteDocumentGlobalKey",t)}ts(e,t){if(t){const e=Hs(this.serializer,t);if(!e.isNoDocument()||!e.version.isEqual(G.min()))return e}return Qt.newInvalidDocument(e)}}function lo(e){return new uo(e)}class ho extends co{constructor(e,t){super(),this.os=e,this.trackRemovals=t,this.us=new Kn(e=>e.toString(),(e,t)=>e.isEqual(t))}applyChanges(e){const t=[];let n=0,r=new at((e,t)=>B(e.canonicalString(),t.canonicalString()));return this.changes.forEach((s,i)=>{const o=this.us.get(s);if(t.push(this.os.removeEntry(e,s,o.readTime)),i.isValidDocument()){const a=Ys(this.os.serializer,i);r=r.add(s.path.popLast());const c=Gi(a);n+=c-o.size,t.push(this.os.addEntry(e,s,a))}else if(n-=o.size,this.trackRemovals){const n=Ys(this.os.serializer,i.convertToNoDocument(G.min()));t.push(this.os.addEntry(e,s,n))}}),r.forEach(n=>{t.push(this.os.indexManager.addToCollectionParentIndex(e,n))}),t.push(this.os.updateMetadata(e,n)),le.waitFor(t)}getFromCache(e,t){return this.os.es(e,t).next(e=>(this.us.set(t,{size:e.size,readTime:e.document.readTime}),e.document))}getAllFromCache(e,t){return this.os.ss(e,t).next(({documents:e,rs:t})=>(t.forEach((t,n)=>{this.us.set(t,{size:n,readTime:e.get(t).readTime})}),e))}}function fo(e){return et(e,"remoteDocumentGlobal")}function mo(e){return et(e,"remoteDocumentsV14")}function go(e){const t=e.path.toArray();return[t.slice(0,t.length-2),t[t.length-2],t[t.length-1]]}function po(e,t){const n=t.documentKey.path.toArray();return[e,Xs(t.readTime),n.slice(0,n.length-2),n.length>0?n[n.length-1]:""]}function yo(e,t){const n=e.path.toArray(),r=t.path.toArray();let s=0;for(let e=0;e<n.length-2&&e<r.length-2;++e)if(s=B(n[e],r[e]),s)return s;return s=B(n.length,r.length),s||(s=B(n[n.length-2],r[r.length-2]),s||B(n[n.length-1],r[r.length-1])
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
   */)}class wo{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}
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
   */class vo{constructor(e,t,n,r){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=r}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next(r=>(n=r,this.remoteDocumentCache.getEntry(e,t))).next(e=>(null!==n&&Cr(n.mutation,e,lt.empty(),z.now()),e))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(t=>this.getLocalViewOfDocuments(e,t,nr()).next(()=>t))}getLocalViewOfDocuments(e,t,n=nr()){const r=Xn();return this.populateOverlays(e,r,t).next(()=>this.computeViews(e,t,r,n).next(e=>{let t=Hn();return e.forEach((e,n)=>{t=t.insert(e,n.overlayedDocument)}),t}))}getOverlayedDocuments(e,t){const n=Xn();return this.populateOverlays(e,n,t).next(()=>this.computeViews(e,t,n,nr()))}populateOverlays(e,t,n){const r=[];return n.forEach(e=>{t.has(e)||r.push(e)}),this.documentOverlayCache.getOverlays(e,r).next(e=>{e.forEach((e,n)=>{t.set(e,n)})})}computeViews(e,t,n,r){let s=Qn();const i=Zn(),o=Zn();return t.forEach((e,t)=>{const o=n.get(t.key);r.has(t.key)&&(void 0===o||o.mutation instanceof Or)?s=s.insert(t.key,t):void 0!==o?(i.set(t.key,o.mutation.getFieldMask()),Cr(o.mutation,t,o.mutation.getFieldMask(),z.now())):i.set(t.key,lt.empty())}),this.recalculateAndSaveOverlays(e,s).next(e=>(e.forEach((e,t)=>i.set(e,t)),t.forEach((e,t)=>{var n;return o.set(e,new wo(t,null!==(n=i.get(e))&&void 0!==n?n:null))}),o))}recalculateAndSaveOverlays(e,t){const n=Zn();let r=new st((e,t)=>e-t),s=nr();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(e=>{for(const s of e)s.keys().forEach(e=>{const i=t.get(e);if(null===i)return;let o=n.get(e)||lt.empty();o=s.applyToLocalView(i,o),n.set(e,o);const a=(r.get(s.batchId)||nr()).add(e);r=r.insert(s.batchId,a)})}).next(()=>{const i=[],o=r.getReverseIterator();for(;o.hasNext();){const r=o.getNext(),a=r.key,c=r.value,u=Jn();c.forEach(e=>{if(!s.has(e)){const r=xr(t.get(e),n.get(e));null!==r&&u.set(e,r),s=s.add(e)}}),i.push(this.documentOverlayCache.saveOverlays(e,a,u))}return le.waitFor(i)}).next(()=>n)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(t=>this.recalculateAndSaveOverlays(e,t))}getDocumentsMatchingQuery(e,t,n){return(function(e){return H.isDocumentKey(e.path)&&null===e.collectionGroup&&0===e.filters.length})(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):Pn(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n):this.getDocumentsMatchingCollectionQuery(e,t,n)}getNextDocuments(e,t,n,r){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,r).next(s=>{const i=r-s.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,r-s.size):le.resolve(Xn());let o=-1,a=s;return i.next(t=>le.forEach(t,(t,n)=>(o<n.largestBatchId&&(o=n.largestBatchId),s.get(t)?le.resolve():this.remoteDocumentCache.getEntry(e,t).next(e=>{a=a.insert(t,e)}))).next(()=>this.populateOverlays(e,t,s)).next(()=>this.computeViews(e,a,t,nr())).next(e=>({batchId:o,changes:Yn(e)})))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new H(t)).next(e=>{let t=Hn();return e.isFoundDocument()&&(t=t.insert(e.key,e)),t})}getDocumentsMatchingCollectionGroupQuery(e,t,n){const r=t.collectionGroup;let s=Hn();return this.indexManager.getCollectionParents(e,r).next(i=>le.forEach(i,i=>{const o=(function(e,t){return new Dn(t,null,e.explicitOrderBy.slice(),e.filters.slice(),e.limit,e.limitType,e.startAt,e.endAt)})(t,i.child(r));return this.getDocumentsMatchingCollectionQuery(e,o,n).next(e=>{e.forEach((e,t)=>{s=s.insert(e,t)})})}).next(()=>s))}getDocumentsMatchingCollectionQuery(e,t,n){let r;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next(s=>(r=s,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,r))).next(e=>{r.forEach((t,n)=>{const r=n.getKey();null===e.get(r)&&(e=e.insert(r,Qt.newInvalidDocument(r)))});let n=Hn();return e.forEach((e,s)=>{const i=r.get(e);void 0!==i&&Cr(i.mutation,s,lt.empty(),z.now()),Un(t,s)&&(n=n.insert(e,s))}),n})}}
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
   */class bo{constructor(e){this.serializer=e,this.cs=new Map,this.hs=new Map}getBundleMetadata(e,t){return le.resolve(this.cs.get(t))}saveBundleMetadata(e,t){var n;return this.cs.set(t.id,{id:(n=t).id,version:n.version,createTime:ws(n.createTime)}),le.resolve()}getNamedQuery(e,t){return le.resolve(this.hs.get(t))}saveNamedQuery(e,t){return this.hs.set(t.name,(function(e){return{name:e.name,query:ri(e.bundledQuery),readTime:ws(e.readTime)}})(t)),le.resolve()}}
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
   */class Io{constructor(){this.overlays=new st(H.comparator),this.ls=new Map}getOverlay(e,t){return le.resolve(this.overlays.get(t))}getOverlays(e,t){const n=Xn();return le.forEach(t,t=>this.getOverlay(e,t).next(e=>{null!==e&&n.set(t,e)})).next(()=>n)}saveOverlays(e,t,n){return n.forEach((n,r)=>{this.we(e,t,r)}),le.resolve()}removeOverlaysForBatchId(e,t,n){const r=this.ls.get(n);return void 0!==r&&(r.forEach(e=>this.overlays=this.overlays.remove(e)),this.ls.delete(n)),le.resolve()}getOverlaysForCollection(e,t,n){const r=Xn(),s=t.length+1,i=new H(t.child("")),o=this.overlays.getIteratorFrom(i);for(;o.hasNext();){const e=o.getNext().value,i=e.getKey();if(!t.isPrefixOf(i.path))break;i.path.length===s&&e.largestBatchId>n&&r.set(e.getKey(),e)}return le.resolve(r)}getOverlaysForCollectionGroup(e,t,n,r){let s=new st((e,t)=>e-t);const i=this.overlays.getIterator();for(;i.hasNext();){const e=i.getNext().value;if(e.getKey().getCollectionGroup()===t&&e.largestBatchId>n){let t=s.get(e.largestBatchId);null===t&&(t=Xn(),s=s.insert(e.largestBatchId,t)),t.set(e.getKey(),e)}}const o=Xn(),a=s.getIterator();for(;a.hasNext()&&(a.getNext().value.forEach((e,t)=>o.set(e,t)),!(o.size()>=r)););return le.resolve(o)}we(e,t,n){const r=this.overlays.get(n.key);if(null!==r){const e=this.ls.get(r.largestBatchId).delete(n.key);this.ls.set(r.largestBatchId,e)}this.overlays=this.overlays.insert(n.key,new Br(t,n));let s=this.ls.get(t);void 0===s&&(s=nr(),this.ls.set(t,s)),this.ls.set(t,s.add(n.key))}}
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
   */class Eo{constructor(){this.fs=new at(To.ds),this.ws=new at(To._s)}isEmpty(){return this.fs.isEmpty()}addReference(e,t){const n=new To(e,t);this.fs=this.fs.add(n),this.ws=this.ws.add(n)}gs(e,t){e.forEach(e=>this.addReference(e,t))}removeReference(e,t){this.ys(new To(e,t))}ps(e,t){e.forEach(e=>this.removeReference(e,t))}Is(e){const t=new H(new $([])),n=new To(t,e),r=new To(t,e+1),s=[];return this.ws.forEachInRange([n,r],e=>{this.ys(e),s.push(e.key)}),s}Ts(){this.fs.forEach(e=>this.ys(e))}ys(e){this.fs=this.fs.delete(e),this.ws=this.ws.delete(e)}Es(e){const t=new H(new $([])),n=new To(t,e),r=new To(t,e+1);let s=nr();return this.ws.forEachInRange([n,r],e=>{s=s.add(e.key)}),s}containsKey(e){const t=new To(e,0),n=this.fs.firstAfterOrEqual(t);return null!==n&&e.isEqual(n.key)}}class To{constructor(e,t){this.key=e,this.As=t}static ds(e,t){return H.comparator(e.key,t.key)||B(e.As,t.As)}static _s(e,t){return B(e.As,t.As)||H.comparator(e.key,t.key)}}
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
   */class So{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.vs=1,this.Rs=new at(To.ds)}checkEmpty(e){return le.resolve(0===this.mutationQueue.length)}addMutationBatch(e,t,n,r){const s=this.vs;this.vs++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const i=new Lr(s,t,n,r);this.mutationQueue.push(i);for(const t of r)this.Rs=this.Rs.add(new To(t.key,s)),this.indexManager.addToCollectionParentIndex(e,t.key.path.popLast());return le.resolve(i)}lookupMutationBatch(e,t){return le.resolve(this.Ps(t))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,r=this.bs(n),s=r<0?0:r;return le.resolve(this.mutationQueue.length>s?this.mutationQueue[s]:null)}getHighestUnacknowledgedBatchId(){return le.resolve(0===this.mutationQueue.length?-1:this.vs-1)}getAllMutationBatches(e){return le.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const n=new To(t,0),r=new To(t,Number.POSITIVE_INFINITY),s=[];return this.Rs.forEachInRange([n,r],e=>{const t=this.Ps(e.As);s.push(t)}),le.resolve(s)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new at(B);return t.forEach(e=>{const t=new To(e,0),r=new To(e,Number.POSITIVE_INFINITY);this.Rs.forEachInRange([t,r],e=>{n=n.add(e.As)})}),le.resolve(this.Vs(n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,r=n.length+1;let s=n;H.isDocumentKey(s)||(s=s.child(""));const i=new To(new H(s),0);let o=new at(B);return this.Rs.forEachWhile(e=>{const t=e.key.path;return!!n.isPrefixOf(t)&&(t.length===r&&(o=o.add(e.As)),!0)},i),le.resolve(this.Vs(o))}Vs(e){const t=[];return e.forEach(e=>{const n=this.Ps(e);null!==n&&t.push(n)}),t}removeMutationBatch(e,t){T(0===this.Ss(t.batchId,"removed")),this.mutationQueue.shift();let n=this.Rs;return le.forEach(t.mutations,r=>{const s=new To(r.key,t.batchId);return n=n.delete(s),this.referenceDelegate.markPotentiallyOrphaned(e,r.key)}).next(()=>{this.Rs=n})}Cn(e){}containsKey(e,t){const n=new To(t,0),r=this.Rs.firstAfterOrEqual(n);return le.resolve(t.isEqual(r&&r.key))}performConsistencyCheck(e){return this.mutationQueue.length,le.resolve()}Ss(e,t){return this.bs(e)}bs(e){return 0===this.mutationQueue.length?0:e-this.mutationQueue[0].batchId}Ps(e){const t=this.bs(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}
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
   */class _o{constructor(e){this.Ds=e,this.docs=new st(H.comparator),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const n=t.key,r=this.docs.get(n),s=r?r.size:0,i=this.Ds(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:i}),this.size+=i-s,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const n=this.docs.get(t);return le.resolve(n?n.document.mutableCopy():Qt.newInvalidDocument(t))}getEntries(e,t){let n=Qn();return t.forEach(e=>{const t=this.docs.get(e);n=n.insert(e,t?t.document.mutableCopy():Qt.newInvalidDocument(e))}),le.resolve(n)}getDocumentsMatchingQuery(e,t,n,r){let s=Qn();const i=t.path,o=new H(i.child("")),a=this.docs.getIteratorFrom(o);for(;a.hasNext();){const{key:e,value:{document:o}}=a.getNext();if(!i.isPrefixOf(e.path))break;e.path.length>i.length+1||oe(se(o),n)<=0||(r.has(o.key)||Un(t,o))&&(s=s.insert(o.key,o.mutableCopy()))}return le.resolve(s)}getAllFromCollectionGroup(e,t,n,r){E()}Cs(e,t){return le.forEach(this.docs,e=>t(e))}newChangeBuffer(e){return new xo(this)}getSize(e){return le.resolve(this.size)}}class xo extends co{constructor(e){super(),this.os=e}applyChanges(e){const t=[];return this.changes.forEach((n,r)=>{r.isValidDocument()?t.push(this.os.addEntry(e,r)):this.os.removeEntry(n)}),le.waitFor(t)}getFromCache(e,t){return this.os.getEntry(e,t)}getAllFromCache(e,t){return this.os.getEntries(e,t)}}
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
   */class Do{constructor(e){this.persistence=e,this.xs=new Kn(e=>In(e),En),this.lastRemoteSnapshotVersion=G.min(),this.highestTargetId=0,this.Ns=0,this.ks=new Eo,this.targetCount=0,this.Ms=Yi.kn()}forEachTarget(e,t){return this.xs.forEach((e,n)=>t(n)),le.resolve()}getLastRemoteSnapshotVersion(e){return le.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return le.resolve(this.Ns)}allocateTargetId(e){return this.highestTargetId=this.Ms.next(),le.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.Ns&&(this.Ns=t),le.resolve()}Fn(e){this.xs.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.Ms=new Yi(t),this.highestTargetId=t),e.sequenceNumber>this.Ns&&(this.Ns=e.sequenceNumber)}addTargetData(e,t){return this.Fn(t),this.targetCount+=1,le.resolve()}updateTargetData(e,t){return this.Fn(t),le.resolve()}removeTargetData(e,t){return this.xs.delete(t.target),this.ks.Is(t.targetId),this.targetCount-=1,le.resolve()}removeTargets(e,t,n){let r=0;const s=[];return this.xs.forEach((i,o)=>{o.sequenceNumber<=t&&null===n.get(o.targetId)&&(this.xs.delete(i),s.push(this.removeMatchingKeysForTargetId(e,o.targetId)),r++)}),le.waitFor(s).next(()=>r)}getTargetCount(e){return le.resolve(this.targetCount)}getTargetData(e,t){const n=this.xs.get(t)||null;return le.resolve(n)}addMatchingKeys(e,t,n){return this.ks.gs(t,n),le.resolve()}removeMatchingKeys(e,t,n){this.ks.ps(t,n);const r=this.persistence.referenceDelegate,s=[];return r&&t.forEach(t=>{s.push(r.markPotentiallyOrphaned(e,t))}),le.waitFor(s)}removeMatchingKeysForTargetId(e,t){return this.ks.Is(t),le.resolve()}getMatchingKeysForTargetId(e,t){const n=this.ks.Es(t);return le.resolve(n)}containsKey(e,t){return le.resolve(this.ks.containsKey(t))}}
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
   */class Co{constructor(e,t){this.$s={},this.overlays={},this.Os=new Ee(0),this.Fs=!1,this.Fs=!0,this.referenceDelegate=e(this),this.Bs=new Do(this),this.indexManager=new Oi,this.remoteDocumentCache=(function(e){return new _o(e)})(e=>this.referenceDelegate.Ls(e)),this.serializer=new Ws(t),this.qs=new bo(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.Fs=!1,Promise.resolve()}get started(){return this.Fs}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new Io,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this.$s[e.toKey()];return n||(n=new So(t,this.referenceDelegate),this.$s[e.toKey()]=n),n}getTargetCache(){return this.Bs}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.qs}runTransaction(e,t,n){w("MemoryPersistence","Starting transaction:",e);const r=new No(this.Os.next());return this.referenceDelegate.Us(),n(r).next(e=>this.referenceDelegate.Ks(r).next(()=>e)).toPromise().then(e=>(r.raiseOnCommittedEvent(),e))}Gs(e,t){return le.or(Object.values(this.$s).map(n=>()=>n.containsKey(e,t)))}}class No extends ce{constructor(e){super(),this.currentSequenceNumber=e}}class Ao{constructor(e){this.persistence=e,this.Qs=new Eo,this.js=null}static zs(e){return new Ao(e)}get Ws(){if(this.js)return this.js;throw E()}addReference(e,t,n){return this.Qs.addReference(n,t),this.Ws.delete(n.toString()),le.resolve()}removeReference(e,t,n){return this.Qs.removeReference(n,t),this.Ws.add(n.toString()),le.resolve()}markPotentiallyOrphaned(e,t){return this.Ws.add(t.toString()),le.resolve()}removeTarget(e,t){this.Qs.Is(t.targetId).forEach(e=>this.Ws.add(e.toString()));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next(e=>{e.forEach(e=>this.Ws.add(e.toString()))}).next(()=>n.removeTargetData(e,t))}Us(){this.js=new Set}Ks(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return le.forEach(this.Ws,n=>{const r=H.fromPath(n);return this.Hs(e,r).next(e=>{e||t.removeEntry(r,G.min())})}).next(()=>(this.js=null,t.apply(e)))}updateLimboDocument(e,t){return this.Hs(e,t).next(e=>{e?this.Ws.delete(t.toString()):this.Ws.add(t.toString())})}Ls(e){return 0}Hs(e,t){return le.or([()=>le.resolve(this.Qs.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Gs(e,t)])}}class ko{constructor(e,t){this.persistence=e,this.Js=new Kn(e=>xe(e.path),(e,t)=>e.isEqual(t)),this.garbageCollector=io(this,t)}static zs(e,t){return new ko(e,t)}Us(){}Ks(e){return le.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}zn(e){const t=this.Jn(e);return this.persistence.getTargetCache().getTargetCount(e).next(e=>t.next(t=>e+t))}Jn(e){let t=0;return this.Wn(e,e=>{t++}).next(()=>t)}Wn(e,t){return le.forEach(this.Js,(n,r)=>this.Xn(e,n,r).next(e=>e?le.resolve():t(r)))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0;const r=this.persistence.getRemoteDocumentCache(),s=r.newChangeBuffer();return r.Cs(e,r=>this.Xn(e,r,t).next(e=>{e||(n++,s.removeEntry(r,G.min()))})).next(()=>s.apply(e)).next(()=>n)}markPotentiallyOrphaned(e,t){return this.Js.set(t,e.currentSequenceNumber),le.resolve()}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.Js.set(n,e.currentSequenceNumber),le.resolve()}removeReference(e,t,n){return this.Js.set(n,e.currentSequenceNumber),le.resolve()}updateLimboDocument(e,t){return this.Js.set(t,e.currentSequenceNumber),le.resolve()}Ls(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=Ot(e.data.value)),t}Xn(e,t,n){return le.or([()=>this.persistence.Gs(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const e=this.Js.get(t);return le.resolve(void 0!==e&&e>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}
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
   */class Oo{constructor(e){this.serializer=e}O(e,t,n,r){const s=new he("createOrUpgrade",t);n<1&&r>=1&&((function(e){e.createObjectStore("owner")})(e),(function(e){e.createObjectStore("mutationQueues",{keyPath:"userId"}),e.createObjectStore("mutations",{keyPath:"batchId",autoIncrement:!0}).createIndex("userMutationsIndex",Ae,{unique:!0}),e.createObjectStore("documentMutations")})(e),Po(e),(function(e){e.createObjectStore("remoteDocuments")})(e));let i=le.resolve();return n<3&&r>=3&&(0!==n&&((function(e){e.deleteObjectStore("targetDocuments"),e.deleteObjectStore("targets"),e.deleteObjectStore("targetGlobal")})(e),Po(e)),i=i.next(()=>(function(e){const t=e.store("targetGlobal"),n={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:G.min().toTimestamp(),targetCount:0};return t.put("targetGlobalKey",n)})(s))),n<4&&r>=4&&(0!==n&&(i=i.next(()=>(function(e,t){return t.store("mutations").j().next(n=>{e.deleteObjectStore("mutations"),e.createObjectStore("mutations",{keyPath:"batchId",autoIncrement:!0}).createIndex("userMutationsIndex",Ae,{unique:!0});const r=t.store("mutations"),s=n.map(e=>r.put(e));return le.waitFor(s)})})(e,s))),i=i.next(()=>{!(function(e){e.createObjectStore("clientMetadata",{keyPath:"clientId"})})(e)})),n<5&&r>=5&&(i=i.next(()=>this.Ys(s))),n<6&&r>=6&&(i=i.next(()=>((function(e){e.createObjectStore("remoteDocumentGlobal")})(e),this.Xs(s)))),n<7&&r>=7&&(i=i.next(()=>this.Zs(s))),n<8&&r>=8&&(i=i.next(()=>this.ti(e,s))),n<9&&r>=9&&(i=i.next(()=>{!(function(e){e.objectStoreNames.contains("remoteDocumentChanges")&&e.deleteObjectStore("remoteDocumentChanges")})(e)})),n<10&&r>=10&&(i=i.next(()=>this.ei(s))),n<11&&r>=11&&(i=i.next(()=>{!(function(e){e.createObjectStore("bundles",{keyPath:"bundleId"})})(e),(function(e){e.createObjectStore("namedQueries",{keyPath:"name"})})(e)})),n<12&&r>=12&&(i=i.next(()=>{!(function(e){const t=e.createObjectStore("documentOverlays",{keyPath:Ke});t.createIndex("collectionPathOverlayIndex",$e,{unique:!1}),t.createIndex("collectionGroupOverlayIndex",Qe,{unique:!1})})(e)})),n<13&&r>=13&&(i=i.next(()=>(function(e){const t=e.createObjectStore("remoteDocumentsV14",{keyPath:Fe});t.createIndex("documentKeyIndex",Me),t.createIndex("collectionGroupIndex",Re)})(e)).next(()=>this.ni(e,s)).next(()=>e.deleteObjectStore("remoteDocuments"))),n<14&&r>=14&&(i=i.next(()=>this.si(e,s))),n<15&&r>=15&&(i=i.next(()=>(function(e){e.createObjectStore("indexConfiguration",{keyPath:"indexId",autoIncrement:!0}).createIndex("collectionGroupIndex","collectionGroup",{unique:!1}),e.createObjectStore("indexState",{keyPath:Ue}).createIndex("sequenceNumberIndex",je,{unique:!1}),e.createObjectStore("indexEntries",{keyPath:ze}).createIndex("documentKeyIndex",Ge,{unique:!1})})(e))),i}Xs(e){let t=0;return e.store("remoteDocuments").X((e,n)=>{t+=Gi(n)}).next(()=>{const n={byteSize:t};return e.store("remoteDocumentGlobal").put("remoteDocumentGlobalKey",n)})}Ys(e){const t=e.store("mutationQueues"),n=e.store("mutations");return t.j().next(t=>le.forEach(t,t=>{const r=IDBKeyRange.bound([t.userId,-1],[t.userId,t.lastAcknowledgedBatchId]);return n.j("userMutationsIndex",r).next(n=>le.forEach(n,n=>{T(n.userId===t.userId);const r=ei(this.serializer,n);return zi(e,t.userId,r).next(()=>{})}))}))}Zs(e){const t=e.store("targetDocuments"),n=e.store("remoteDocuments");return e.store("targetGlobal").get("targetGlobalKey").next(e=>{const r=[];return n.X((n,s)=>{const i=new $(n),o=(function(e){return[0,xe(e)]})(i);r.push(t.get(o).next(n=>n?le.resolve():(n=>t.put({targetId:0,path:xe(n),sequenceNumber:e.highestListenSequenceNumber}))(i)))}).next(()=>le.waitFor(r))})}ti(e,t){e.createObjectStore("collectionParents",{keyPath:Be});const n=t.store("collectionParents"),r=new Pi,s=e=>{if(r.add(e)){const t=e.lastSegment(),r=e.popLast();return n.put({collectionId:t,parent:xe(r)})}};return t.store("remoteDocuments").X({Y:!0},(e,t)=>{const n=new $(e);return s(n.popLast())}).next(()=>t.store("documentMutations").X({Y:!0},([e,t,n],r)=>{const i=Ne(t);return s(i.popLast())}))}ei(e){const t=e.store("targets");return t.X((e,n)=>{const r=ti(n),s=ni(this.serializer,r);return t.put(s)})}ni(e,t){const n=t.store("remoteDocuments"),r=[];return n.X((e,n)=>{const s=t.store("remoteDocumentsV14"),i=(o=n,o.document?new H($.fromString(o.document.name).popFirst(5)):o.noDocument?H.fromSegments(o.noDocument.path):o.unknownDocument?H.fromSegments(o.unknownDocument.path):E()).path.toArray();var o;
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
        */const a={prefixPath:i.slice(0,i.length-2),collectionGroup:i[i.length-2],documentId:i[i.length-1],readTime:n.readTime||[0,0],unknownDocument:n.unknownDocument,noDocument:n.noDocument,document:n.document,hasCommittedMutations:!!n.hasCommittedMutations};r.push(s.put(a))}).next(()=>le.waitFor(r))}si(e,t){const n=t.store("mutations"),r=lo(this.serializer),s=new Co(Ao.zs,this.serializer.fe);return n.j().next(e=>{const n=new Map;return e.forEach(e=>{var t;let r=null!==(t=n.get(e.userId))&&void 0!==t?t:nr();ei(this.serializer,e).keys().forEach(e=>r=r.add(e)),n.set(e.userId,r)}),le.forEach(n,(e,n)=>{const i=new f(n),o=li.de(this.serializer,i),a=s.getIndexManager(i),c=Ki.de(i,this.serializer,a,s.referenceDelegate);return new vo(r,c,o,a).recalculateAndSaveOverlaysForDocumentKeys(new Ze(t,Ee.ct),e).next()})})}}function Po(e){e.createObjectStore("targetDocuments",{keyPath:Le}).createIndex("documentTargetsIndex",qe,{unique:!0}),e.createObjectStore("targets",{keyPath:"targetId"}).createIndex("queryTargetsIndex",Ve,{unique:!0}),e.createObjectStore("targetGlobal")}const Fo="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.";class Mo{constructor(e,t,n,r,s,i,o,a,c,u,l=15){if(this.allowTabSynchronization=e,this.persistenceKey=t,this.clientId=n,this.ii=s,this.window=i,this.document=o,this.ri=c,this.oi=u,this.ui=l,this.Os=null,this.Fs=!1,this.isPrimary=!1,this.networkEnabled=!0,this.ci=null,this.inForeground=!1,this.ai=null,this.hi=null,this.li=Number.NEGATIVE_INFINITY,this.fi=e=>Promise.resolve(),!Mo.D())throw new D(x.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new oo(this,r),this.di=t+"main",this.serializer=new Ws(a),this.wi=new de(this.di,this.ui,new Oo(this.serializer)),this.Bs=new Xi(this.referenceDelegate,this.serializer),this.remoteDocumentCache=lo(this.serializer),this.qs=new ai,this.window&&this.window.localStorage?this._i=this.window.localStorage:(this._i=null,!1===u&&v("IndexedDbPersistence","LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.mi().then(()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new D(x.FAILED_PRECONDITION,Fo);return this.gi(),this.yi(),this.pi(),this.runTransaction("getHighestListenSequenceNumber","readonly",e=>this.Bs.getHighestSequenceNumber(e))}).then(e=>{this.Os=new Ee(e,this.ri)}).then(()=>{this.Fs=!0}).catch(e=>(this.wi&&this.wi.close(),Promise.reject(e)))}Ii(e){return this.fi=async t=>{if(this.started)return e(t)},e(this.isPrimary)}setDatabaseDeletedListener(e){this.wi.B(async t=>{null===t.newVersion&&await e()})}setNetworkEnabled(e){this.networkEnabled!==e&&(this.networkEnabled=e,this.ii.enqueueAndForget(async()=>{this.started&&await this.mi()}))}mi(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",e=>Vo(e).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next(()=>{if(this.isPrimary)return this.Ti(e).next(e=>{e||(this.isPrimary=!1,this.ii.enqueueRetryable(()=>this.fi(!1)))})}).next(()=>this.Ei(e)).next(t=>this.isPrimary&&!t?this.Ai(e).next(()=>!1):!!t&&this.vi(e).next(()=>!0))).catch(e=>{if(ge(e))return w("IndexedDbPersistence","Failed to extend owner lease: ",e),this.isPrimary;if(!this.allowTabSynchronization)throw e;return w("IndexedDbPersistence","Releasing owner lease after error during lease refresh",e),!1}).then(e=>{this.isPrimary!==e&&this.ii.enqueueRetryable(()=>this.fi(e)),this.isPrimary=e})}Ti(e){return Ro(e).get("owner").next(e=>le.resolve(this.Ri(e)))}Pi(e){return Vo(e).delete(this.clientId)}async bi(){if(this.isPrimary&&!this.Vi(this.li,18e5)){this.li=Date.now();const e=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",e=>{const t=et(e,"clientMetadata");return t.j().next(e=>{const n=this.Si(e,18e5),r=e.filter(e=>-1===n.indexOf(e));return le.forEach(r,e=>t.delete(e.clientId)).next(()=>r)})}).catch(()=>[]);if(this._i)for(const t of e)this._i.removeItem(this.Di(t.clientId))}}pi(){this.hi=this.ii.enqueueAfterDelay("client_metadata_refresh",4e3,()=>this.mi().then(()=>this.bi()).then(()=>this.pi()))}Ri(e){return!!e&&e.ownerId===this.clientId}Ei(e){return this.oi?le.resolve(!0):Ro(e).get("owner").next(t=>{if(null!==t&&this.Vi(t.leaseTimestampMs,5e3)&&!this.Ci(t.ownerId)){if(this.Ri(t)&&this.networkEnabled)return!0;if(!this.Ri(t)){if(!t.allowTabSynchronization)throw new D(x.FAILED_PRECONDITION,Fo);return!1}}return!(!this.networkEnabled||!this.inForeground)||Vo(e).j().next(e=>void 0===this.Si(e,5e3).find(e=>{if(this.clientId!==e.clientId){const t=!this.networkEnabled&&e.networkEnabled,n=!this.inForeground&&e.inForeground,r=this.networkEnabled===e.networkEnabled;if(t||n&&r)return!0}return!1}))}).next(e=>(this.isPrimary!==e&&w("IndexedDbPersistence",`Client ${e?"is":"is not"} eligible for a primary lease.`),e))}async shutdown(){this.Fs=!1,this.xi(),this.hi&&(this.hi.cancel(),this.hi=null),this.Ni(),this.ki(),await this.wi.runTransaction("shutdown","readwrite",["owner","clientMetadata"],e=>{const t=new Ze(e,Ee.ct);return this.Ai(t).next(()=>this.Pi(t))}),this.wi.close(),this.Mi()}Si(e,t){return e.filter(e=>this.Vi(e.updateTimeMs,t)&&!this.Ci(e.clientId))}$i(){return this.runTransaction("getActiveClients","readonly",e=>Vo(e).j().next(e=>this.Si(e,18e5).map(e=>e.clientId)))}get started(){return this.Fs}getMutationQueue(e,t){return Ki.de(e,this.serializer,t,this.referenceDelegate)}getTargetCache(){return this.Bs}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(e){return new Mi(e,this.serializer.fe.databaseId)}getDocumentOverlayCache(e){return li.de(this.serializer,e)}getBundleCache(){return this.qs}runTransaction(e,t,n){w("IndexedDbPersistence","Starting transaction:",e);const r="readonly"===t?"readonly":"readwrite",s=15===(i=this.ui)?Je:14===i?Xe:13===i?Ye:12===i?He:11===i?We:void E();var i;let o;return this.wi.runTransaction(e,r,s,r=>(o=new Ze(r,this.Os?this.Os.next():Ee.ct),"readwrite-primary"===t?this.Ti(o).next(e=>!!e||this.Ei(o)).next(t=>{if(!t)throw v(`Failed to obtain primary lease for action '${e}'.`),this.isPrimary=!1,this.ii.enqueueRetryable(()=>this.fi(!1)),new D(x.FAILED_PRECONDITION,ae);return n(o)}).next(e=>this.vi(o).next(()=>e)):this.Oi(o).next(()=>n(o)))).then(e=>(o.raiseOnCommittedEvent(),e))}Oi(e){return Ro(e).get("owner").next(e=>{if(null!==e&&this.Vi(e.leaseTimestampMs,5e3)&&!this.Ci(e.ownerId)&&!this.Ri(e)&&!(this.oi||this.allowTabSynchronization&&e.allowTabSynchronization))throw new D(x.FAILED_PRECONDITION,Fo)})}vi(e){const t={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return Ro(e).put("owner",t)}static D(){return de.D()}Ai(e){const t=Ro(e);return t.get("owner").next(e=>this.Ri(e)?(w("IndexedDbPersistence","Releasing primary lease."),t.delete("owner")):le.resolve())}Vi(e,t){const n=Date.now();return!(e<n-t||e>n&&(v(`Detected an update time that is in the future: ${e} > ${n}`),1))}gi(){null!==this.document&&"function"==typeof this.document.addEventListener&&(this.ai=()=>{this.ii.enqueueAndForget(()=>(this.inForeground="visible"===this.document.visibilityState,this.mi()))},this.document.addEventListener("visibilitychange",this.ai),this.inForeground="visible"===this.document.visibilityState)}Ni(){this.ai&&(this.document.removeEventListener("visibilitychange",this.ai),this.ai=null)}yi(){var e;"function"==typeof(null===(e=this.window)||void 0===e?void 0:e.addEventListener)&&(this.ci=()=>{this.xi();const e=/(?:Version|Mobile)\/1[456]/;(0,l.isSafari)()&&(navigator.appVersion.match(e)||navigator.userAgent.match(e))&&this.ii.enterRestrictedMode(!0),this.ii.enqueueAndForget(()=>this.shutdown())},this.window.addEventListener("pagehide",this.ci))}ki(){this.ci&&(this.window.removeEventListener("pagehide",this.ci),this.ci=null)}Ci(e){var t;try{const n=null!==(null===(t=this._i)||void 0===t?void 0:t.getItem(this.Di(e)));return w("IndexedDbPersistence",`Client '${e}' ${n?"is":"is not"} zombied in LocalStorage`),n}catch(e){return v("IndexedDbPersistence","Failed to get zombied client id.",e),!1}}xi(){if(this._i)try{this._i.setItem(this.Di(this.clientId),String(Date.now()))}catch(e){v("Failed to set zombie client id.",e)}}Mi(){if(this._i)try{this._i.removeItem(this.Di(this.clientId))}catch(e){}}Di(e){return`firestore_zombie_${this.persistenceKey}_${e}`}}function Ro(e){return et(e,"owner")}function Vo(e){return et(e,"clientMetadata")}function Lo(e,t){let n=e.projectId;return e.isDefaultDatabase||(n+="."+e.database),"firestore/"+t+"/"+n+"/"
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
   */}class qo{constructor(e,t,n,r){this.targetId=e,this.fromCache=t,this.Fi=n,this.Bi=r}static Li(e,t){let n=nr(),r=nr();for(const e of t.docChanges)switch(e.type){case 0:n=n.add(e.doc.key);break;case 1:r=r.add(e.doc.key)}return new qo(e,t.fromCache,n,r)}}
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
   */class Bo{constructor(){this.qi=!1}initialize(e,t){this.Ui=e,this.indexManager=t,this.qi=!0}getDocumentsMatchingQuery(e,t,n,r){return this.Ki(e,t).next(s=>s||this.Gi(e,t,r,n)).next(n=>n||this.Qi(e,t))}Ki(e,t){if(An(t))return le.resolve(null);let n=Mn(t);return this.indexManager.getIndexType(e,n).next(r=>0===r?null:(null!==t.limit&&1===r&&(t=Vn(t,null,"F"),n=Mn(t)),this.indexManager.getDocumentsMatchingTarget(e,n).next(r=>{const s=nr(...r);return this.Ui.getDocuments(e,s).next(r=>this.indexManager.getMinOffset(e,n).next(n=>{const i=this.ji(t,r);return this.zi(t,i,s,n.readTime)?this.Ki(e,Vn(t,null,"F")):this.Wi(e,i,t,n)}))})))}Gi(e,t,n,r){return An(t)||r.isEqual(G.min())?this.Qi(e,t):this.Ui.getDocuments(e,n).next(s=>{const i=this.ji(t,s);return this.zi(t,i,n,r)?this.Qi(e,t):(p()<=u.LogLevel.DEBUG&&w("QueryEngine","Re-using previous result from %s to execute query: %s",r.toString(),Bn(t)),this.Wi(e,i,t,re(r,-1)))})}ji(e,t){let n=new at(zn(e));return t.forEach((t,r)=>{Un(e,r)&&(n=n.add(r))}),n}zi(e,t,n,r){if(null===e.limit)return!1;if(n.size!==t.size)return!0;const s="F"===e.limitType?t.last():t.first();return!!s&&(s.hasPendingWrites||s.version.compareTo(r)>0)}Qi(e,t){return p()<=u.LogLevel.DEBUG&&w("QueryEngine","Using full collection scan to execute query:",Bn(t)),this.Ui.getDocumentsMatchingQuery(e,t,ie.min())}Wi(e,t,n,r){return this.Ui.getDocumentsMatchingQuery(e,n,r).next(e=>(t.forEach(t=>{e=e.insert(t.key,t)}),e))}}
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
   */class Uo{constructor(e,t,n,r){this.persistence=e,this.Hi=t,this.serializer=r,this.Ji=new st(B),this.Yi=new Kn(e=>In(e),En),this.Xi=new Map,this.Zi=e.getRemoteDocumentCache(),this.Bs=e.getTargetCache(),this.qs=e.getBundleCache(),this.tr(n)}tr(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new vo(this.Zi,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Zi.setIndexManager(this.indexManager),this.Hi.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.Ji))}}function jo(e,t,n,r){return new Uo(e,t,n,r)}async function zo(e,t){const n=_(e);return await n.persistence.runTransaction("Handle user change","readonly",e=>{let r;return n.mutationQueue.getAllMutationBatches(e).next(s=>(r=s,n.tr(t),n.mutationQueue.getAllMutationBatches(e))).next(t=>{const s=[],i=[];let o=nr();for(const e of r){s.push(e.batchId);for(const t of e.mutations)o=o.add(t.key)}for(const e of t){i.push(e.batchId);for(const t of e.mutations)o=o.add(t.key)}return n.localDocuments.getDocuments(e,o).next(e=>({er:e,removedBatchIds:s,addedBatchIds:i}))})})}function Go(e,t){const n=_(e);return n.persistence.runTransaction("Acknowledge batch","readwrite-primary",e=>{const r=t.batch.keys(),s=n.Zi.newChangeBuffer({trackRemovals:!0});return(function(e,t,n,r){const s=n.batch,i=s.keys();let o=le.resolve();return i.forEach(e=>{o=o.next(()=>r.getEntry(t,e)).next(t=>{const i=n.docVersions.get(e);T(null!==i),t.version.compareTo(i)<0&&(s.applyToRemoteDocument(t,n),t.isValidDocument()&&(t.setReadTime(n.commitVersion),r.addEntry(t)))})}),o.next(()=>e.mutationQueue.removeMutationBatch(t,s))})(n,e,t,s).next(()=>s.apply(e)).next(()=>n.mutationQueue.performConsistencyCheck(e)).next(()=>n.documentOverlayCache.removeOverlaysForBatchId(e,r,t.batch.batchId)).next(()=>n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(e,(function(e){let t=nr();for(let n=0;n<e.mutationResults.length;++n)e.mutationResults[n].transformResults.length>0&&(t=t.add(e.batch.mutations[n].key));return t})(t))).next(()=>n.localDocuments.getDocuments(e,r))})}function Ko(e){const t=_(e);return t.persistence.runTransaction("Get last remote snapshot version","readonly",e=>t.Bs.getLastRemoteSnapshotVersion(e))}function $o(e,t){const n=_(e),r=t.snapshotVersion;let s=n.Ji;return n.persistence.runTransaction("Apply remote event","readwrite-primary",e=>{const i=n.Zi.newChangeBuffer({trackRemovals:!0});s=n.Ji;const o=[];t.targetChanges.forEach((i,a)=>{const c=s.get(a);if(!c)return;o.push(n.Bs.removeMatchingKeys(e,i.removedDocuments,a).next(()=>n.Bs.addMatchingKeys(e,i.addedDocuments,a)));let u=c.withSequenceNumber(e.currentSequenceNumber);null!==t.targetMismatches.get(a)?u=u.withResumeToken(ft.EMPTY_BYTE_STRING,G.min()).withLastLimboFreeSnapshotVersion(G.min()):i.resumeToken.approximateByteSize()>0&&(u=u.withResumeToken(i.resumeToken,r)),s=s.insert(a,u),(function(e,t,n){return 0===e.resumeToken.approximateByteSize()||(t.snapshotVersion.toMicroseconds()-e.snapshotVersion.toMicroseconds()>=3e8||n.addedDocuments.size+n.modifiedDocuments.size+n.removedDocuments.size>0)})(c,u,i)&&o.push(n.Bs.updateTargetData(e,u))});let a=Qn(),c=nr();if(t.documentUpdates.forEach(r=>{t.resolvedLimboDocuments.has(r)&&o.push(n.persistence.referenceDelegate.updateLimboDocument(e,r))}),o.push(Qo(e,i,t.documentUpdates).next(e=>{a=e.nr,c=e.sr})),!r.isEqual(G.min())){const t=n.Bs.getLastRemoteSnapshotVersion(e).next(t=>n.Bs.setTargetsMetadata(e,e.currentSequenceNumber,r));o.push(t)}return le.waitFor(o).next(()=>i.apply(e)).next(()=>n.localDocuments.getLocalViewOfDocuments(e,a,c)).next(()=>a)}).then(e=>(n.Ji=s,e))}function Qo(e,t,n){let r=nr(),s=nr();return n.forEach(e=>r=r.add(e)),t.getEntries(e,r).next(e=>{let r=Qn();return n.forEach((n,i)=>{const o=e.get(n);i.isFoundDocument()!==o.isFoundDocument()&&(s=s.add(n)),i.isNoDocument()&&i.version.isEqual(G.min())?(t.removeEntry(n,i.readTime),r=r.insert(n,i)):!o.isValidDocument()||i.version.compareTo(o.version)>0||0===i.version.compareTo(o.version)&&o.hasPendingWrites?(t.addEntry(i),r=r.insert(n,i)):w("LocalStore","Ignoring outdated watch update for ",n,". Current version:",o.version," Watch version:",i.version)}),{nr:r,sr:s}})}function Wo(e,t){const n=_(e);return n.persistence.runTransaction("Get next mutation batch","readonly",e=>(void 0===t&&(t=-1),n.mutationQueue.getNextMutationBatchAfterBatchId(e,t)))}function Ho(e,t){const n=_(e);return n.persistence.runTransaction("Allocate target","readwrite",e=>{let r;return n.Bs.getTargetData(e,t).next(s=>s?(r=s,le.resolve(r)):n.Bs.allocateTargetId(e).next(s=>(r=new Qs(t,s,"TargetPurposeListen",e.currentSequenceNumber),n.Bs.addTargetData(e,r).next(()=>r))))}).then(e=>{const r=n.Ji.get(e.targetId);return(null===r||e.snapshotVersion.compareTo(r.snapshotVersion)>0)&&(n.Ji=n.Ji.insert(e.targetId,e),n.Yi.set(t,e.targetId)),e})}async function Yo(e,t,n){const r=_(e),s=r.Ji.get(t),i=n?"readwrite":"readwrite-primary";try{n||await r.persistence.runTransaction("Release target",i,e=>r.persistence.referenceDelegate.removeTarget(e,s))}catch(e){if(!ge(e))throw e;w("LocalStore",`Failed to update sequence numbers for target ${t}: ${e}`)}r.Ji=r.Ji.remove(t),r.Yi.delete(s.target)}function Xo(e,t,n){const r=_(e);let s=G.min(),i=nr();return r.persistence.runTransaction("Execute query","readonly",e=>(function(e,t,n){const r=_(e),s=r.Yi.get(n);return void 0!==s?le.resolve(r.Ji.get(s)):r.Bs.getTargetData(t,n)})(r,e,Mn(t)).next(t=>{if(t)return s=t.lastLimboFreeSnapshotVersion,r.Bs.getMatchingKeysForTargetId(e,t.targetId).next(e=>{i=e})}).next(()=>r.Hi.getDocumentsMatchingQuery(e,t,n?s:G.min(),n?i:nr())).next(e=>(ea(r,jn(t),e),{documents:e,ir:i})))}function Jo(e,t){const n=_(e),r=_(n.Bs),s=n.Ji.get(t);return s?Promise.resolve(s.target):n.persistence.runTransaction("Get target data","readonly",e=>r.le(e,t).next(e=>e?e.target:null))}function Zo(e,t){const n=_(e),r=n.Xi.get(t)||G.min();return n.persistence.runTransaction("Get new document changes","readonly",e=>n.Zi.getAllFromCollectionGroup(e,t,re(r,-1),Number.MAX_SAFE_INTEGER)).then(e=>(ea(n,t,e),e))}function ea(e,t,n){let r=e.Xi.get(t)||G.min();n.forEach((e,t)=>{t.readTime.compareTo(r)>0&&(r=t.readTime)}),e.Xi.set(t,r)}async function ta(e,t,n,r){const s=_(e);let i=nr(),o=Qn();for(const e of n){const n=t.rr(e.metadata.name);e.document&&(i=i.add(n));const r=t.ur(e);r.setReadTime(t.cr(e.metadata.readTime)),o=o.insert(n,r)}const a=s.Zi.newChangeBuffer({trackRemovals:!0}),c=await Ho(s,(function(e){return Mn(Nn($.fromString(`__bundle__/docs/${e}`)))})(r));return s.persistence.runTransaction("Apply bundle documents","readwrite",e=>Qo(e,a,o).next(t=>(a.apply(e),t)).next(t=>s.Bs.removeMatchingKeysForTargetId(e,c.targetId).next(()=>s.Bs.addMatchingKeys(e,i,c.targetId)).next(()=>s.localDocuments.getLocalViewOfDocuments(e,t.nr,t.sr)).next(()=>t.nr)))}async function na(e,t,n=nr()){const r=await Ho(e,Mn(ri(t.bundledQuery))),s=_(e);return s.persistence.runTransaction("Save named query","readwrite",e=>{const i=ws(t.readTime);if(r.snapshotVersion.compareTo(i)>=0)return s.qs.saveNamedQuery(e,t);const o=r.withResumeToken(ft.EMPTY_BYTE_STRING,i);return s.Ji=s.Ji.insert(o.targetId,o),s.Bs.updateTargetData(e,o).next(()=>s.Bs.removeMatchingKeysForTargetId(e,r.targetId)).next(()=>s.Bs.addMatchingKeys(e,n,r.targetId)).next(()=>s.qs.saveNamedQuery(e,t))})}function ra(e,t){return`firestore_clients_${e}_${t}`}function sa(e,t,n){let r=`firestore_mutations_${e}_${n}`;return t.isAuthenticated()&&(r+=`_${t.uid}`),r}function ia(e,t){return`firestore_targets_${e}_${t}`}class oa{constructor(e,t,n,r){this.user=e,this.batchId=t,this.state=n,this.error=r}static ar(e,t,n){const r=JSON.parse(n);let s,i="object"==typeof r&&-1!==["pending","acknowledged","rejected"].indexOf(r.state)&&(void 0===r.error||"object"==typeof r.error);return i&&r.error&&(i="string"==typeof r.error.message&&"string"==typeof r.error.code,i&&(s=new D(r.error.code,r.error.message))),i?new oa(e,t,r.state,s):(v("SharedClientState",`Failed to parse mutation state for ID '${t}': ${n}`),null)}hr(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class aa{constructor(e,t,n){this.targetId=e,this.state=t,this.error=n}static ar(e,t){const n=JSON.parse(t);let r,s="object"==typeof n&&-1!==["not-current","current","rejected"].indexOf(n.state)&&(void 0===n.error||"object"==typeof n.error);return s&&n.error&&(s="string"==typeof n.error.message&&"string"==typeof n.error.code,s&&(r=new D(n.error.code,n.error.message))),s?new aa(e,n.state,r):(v("SharedClientState",`Failed to parse target state for ID '${e}': ${t}`),null)}hr(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class ca{constructor(e,t){this.clientId=e,this.activeTargetIds=t}static ar(e,t){const n=JSON.parse(t);let r="object"==typeof n&&n.activeTargetIds instanceof Array,s=sr();for(let e=0;r&&e<n.activeTargetIds.length;++e)r=_e(n.activeTargetIds[e]),s=s.add(n.activeTargetIds[e]);return r?new ca(e,s):(v("SharedClientState",`Failed to parse client data for instance '${e}': ${t}`),null)}}class ua{constructor(e,t){this.clientId=e,this.onlineState=t}static ar(e){const t=JSON.parse(e);return"object"==typeof t&&-1!==["Unknown","Online","Offline"].indexOf(t.onlineState)&&"string"==typeof t.clientId?new ua(t.clientId,t.onlineState):(v("SharedClientState",`Failed to parse online state: ${e}`),null)}}class la{constructor(){this.activeTargetIds=sr()}lr(e){this.activeTargetIds=this.activeTargetIds.add(e)}dr(e){this.activeTargetIds=this.activeTargetIds.delete(e)}hr(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class ha{constructor(e,t,n,r,s){this.window=e,this.ii=t,this.persistenceKey=n,this.wr=r,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this._r=this.mr.bind(this),this.gr=new st(B),this.started=!1,this.yr=[];const i=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=s,this.pr=ra(this.persistenceKey,this.wr),this.Ir=(function(e){return`firestore_sequence_number_${e}`}
/**
      * @license
      * Copyright 2018 Google LLC
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
      */)(this.persistenceKey),this.gr=this.gr.insert(this.wr,new la),this.Tr=new RegExp(`^firestore_clients_${i}_([^_]*)$`),this.Er=new RegExp(`^firestore_mutations_${i}_(\\d+)(?:_(.*))?$`),this.Ar=new RegExp(`^firestore_targets_${i}_(\\d+)$`),this.vr=(function(e){return`firestore_online_state_${e}`})(this.persistenceKey),this.Rr=(function(e){return`firestore_bundle_loaded_v2_${e}`})(this.persistenceKey),this.window.addEventListener("storage",this._r)}static D(e){return!(!e||!e.localStorage)}async start(){const e=await this.syncEngine.$i();for(const t of e){if(t===this.wr)continue;const e=this.getItem(ra(this.persistenceKey,t));if(e){const n=ca.ar(t,e);n&&(this.gr=this.gr.insert(n.clientId,n))}}this.Pr();const t=this.storage.getItem(this.vr);if(t){const e=this.br(t);e&&this.Vr(e)}for(const e of this.yr)this.mr(e);this.yr=[],this.window.addEventListener("pagehide",()=>this.shutdown()),this.started=!0}writeSequenceNumber(e){this.setItem(this.Ir,JSON.stringify(e))}getAllActiveQueryTargets(){return this.Sr(this.gr)}isActiveQueryTarget(e){let t=!1;return this.gr.forEach((n,r)=>{r.activeTargetIds.has(e)&&(t=!0)}),t}addPendingMutation(e){this.Dr(e,"pending")}updateMutationState(e,t,n){this.Dr(e,t,n),this.Cr(e)}addLocalQueryTarget(e){let t="not-current";if(this.isActiveQueryTarget(e)){const n=this.storage.getItem(ia(this.persistenceKey,e));if(n){const r=aa.ar(e,n);r&&(t=r.state)}}return this.Nr.lr(e),this.Pr(),t}removeLocalQueryTarget(e){this.Nr.dr(e),this.Pr()}isLocalQueryTarget(e){return this.Nr.activeTargetIds.has(e)}clearQueryState(e){this.removeItem(ia(this.persistenceKey,e))}updateQueryState(e,t,n){this.kr(e,t,n)}handleUserChange(e,t,n){t.forEach(e=>{this.Cr(e)}),this.currentUser=e,n.forEach(e=>{this.addPendingMutation(e)})}setOnlineState(e){this.Mr(e)}notifyBundleLoaded(e){this.$r(e)}shutdown(){this.started&&(this.window.removeEventListener("storage",this._r),this.removeItem(this.pr),this.started=!1)}getItem(e){const t=this.storage.getItem(e);return w("SharedClientState","READ",e,t),t}setItem(e,t){w("SharedClientState","SET",e,t),this.storage.setItem(e,t)}removeItem(e){w("SharedClientState","REMOVE",e),this.storage.removeItem(e)}mr(e){const t=e;if(t.storageArea===this.storage){if(w("SharedClientState","EVENT",t.key,t.newValue),t.key===this.pr)return void v("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.ii.enqueueRetryable(async()=>{if(this.started){if(null!==t.key)if(this.Tr.test(t.key)){if(null==t.newValue){const e=this.Or(t.key);return this.Fr(e,null)}{const e=this.Br(t.key,t.newValue);if(e)return this.Fr(e.clientId,e)}}else if(this.Er.test(t.key)){if(null!==t.newValue){const e=this.Lr(t.key,t.newValue);if(e)return this.qr(e)}}else if(this.Ar.test(t.key)){if(null!==t.newValue){const e=this.Ur(t.key,t.newValue);if(e)return this.Kr(e)}}else if(t.key===this.vr){if(null!==t.newValue){const e=this.br(t.newValue);if(e)return this.Vr(e)}}else if(t.key===this.Ir){const e=(function(e){let t=Ee.ct;if(null!=e)try{const n=JSON.parse(e);T("number"==typeof n),t=n}catch(e){v("SharedClientState","Failed to read sequence number from WebStorage",e)}return t})(t.newValue);e!==Ee.ct&&this.sequenceNumberHandler(e)}else if(t.key===this.Rr){const e=this.Gr(t.newValue);await Promise.all(e.map(e=>this.syncEngine.Qr(e)))}}else this.yr.push(t)})}}get Nr(){return this.gr.get(this.wr)}Pr(){this.setItem(this.pr,this.Nr.hr())}Dr(e,t,n){const r=new oa(this.currentUser,e,t,n),s=sa(this.persistenceKey,this.currentUser,e);this.setItem(s,r.hr())}Cr(e){const t=sa(this.persistenceKey,this.currentUser,e);this.removeItem(t)}Mr(e){const t={clientId:this.wr,onlineState:e};this.storage.setItem(this.vr,JSON.stringify(t))}kr(e,t,n){const r=ia(this.persistenceKey,e),s=new aa(e,t,n);this.setItem(r,s.hr())}$r(e){const t=JSON.stringify(Array.from(e));this.setItem(this.Rr,t)}Or(e){const t=this.Tr.exec(e);return t?t[1]:null}Br(e,t){const n=this.Or(e);return ca.ar(n,t)}Lr(e,t){const n=this.Er.exec(e),r=Number(n[1]),s=void 0!==n[2]?n[2]:null;return oa.ar(new f(s),r,t)}Ur(e,t){const n=this.Ar.exec(e),r=Number(n[1]);return aa.ar(r,t)}br(e){return ua.ar(e)}Gr(e){return JSON.parse(e)}async qr(e){if(e.user.uid===this.currentUser.uid)return this.syncEngine.jr(e.batchId,e.state,e.error);w("SharedClientState",`Ignoring mutation for non-active user ${e.user.uid}`)}Kr(e){return this.syncEngine.zr(e.targetId,e.state,e.error)}Fr(e,t){const n=t?this.gr.insert(e,t):this.gr.remove(e),r=this.Sr(this.gr),s=this.Sr(n),i=[],o=[];return s.forEach(e=>{r.has(e)||i.push(e)}),r.forEach(e=>{s.has(e)||o.push(e)}),this.syncEngine.Wr(i,o).then(()=>{this.gr=n})}Vr(e){this.gr.get(e.clientId)&&this.onlineStateHandler(e.onlineState)}Sr(e){let t=sr();return e.forEach((e,n)=>{t=t.unionWith(n.activeTargetIds)}),t}}class da{constructor(){this.Hr=new la,this.Jr={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e){return this.Hr.lr(e),this.Jr[e]||"not-current"}updateQueryState(e,t,n){this.Jr[e]=t}removeLocalQueryTarget(e){this.Hr.dr(e)}isLocalQueryTarget(e){return this.Hr.activeTargetIds.has(e)}clearQueryState(e){delete this.Jr[e]}getAllActiveQueryTargets(){return this.Hr.activeTargetIds}isActiveQueryTarget(e){return this.Hr.activeTargetIds.has(e)}start(){return this.Hr=new la,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}
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
   */class fa{Yr(e){}shutdown(){}}
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
   */class ma{constructor(){this.Xr=()=>this.Zr(),this.eo=()=>this.no(),this.so=[],this.io()}Yr(e){this.so.push(e)}shutdown(){window.removeEventListener("online",this.Xr),window.removeEventListener("offline",this.eo)}io(){window.addEventListener("online",this.Xr),window.addEventListener("offline",this.eo)}Zr(){w("ConnectivityMonitor","Network connectivity changed: AVAILABLE");for(const e of this.so)e(0)}no(){w("ConnectivityMonitor","Network connectivity changed: UNAVAILABLE");for(const e of this.so)e(1)}static D(){return"undefined"!=typeof window&&void 0!==window.addEventListener&&void 0!==window.removeEventListener}}
/**
   * @license
   * Copyright 2023 Google LLC
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
   */let ga=null;function pa(){return null===ga?ga=268435456+Math.round(2147483648*Math.random()):ga++,"0x"+ga.toString(16)
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
   */}const ya={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};
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
   */class wa{constructor(e){this.ro=e.ro,this.oo=e.oo}uo(e){this.co=e}ao(e){this.ho=e}onMessage(e){this.lo=e}close(){this.oo()}send(e){this.ro(e)}fo(){this.co()}wo(e){this.ho(e)}_o(e){this.lo(e)}}
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
   */const va="WebChannelConnection";class ba extends class{constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http";this.mo=t+"://"+e.host,this.yo="projects/"+this.databaseId.projectId+"/databases/"+this.databaseId.database+"/documents"}get po(){return!1}Io(e,t,n,r,s){const i=pa(),o=this.To(e,t);w("RestConnection",`Sending RPC '${e}' ${i}:`,o,n);const a={};return this.Eo(a,r,s),this.Ao(e,o,a,n).then(t=>(w("RestConnection",`Received RPC '${e}' ${i}: `,t),t),t=>{throw b("RestConnection",`RPC '${e}' ${i} failed with error: `,t,"url: ",o,"request:",n),t})}vo(e,t,n,r,s,i){return this.Io(e,t,n,r,s)}Eo(e,t,n){e["X-Goog-Api-Client"]="gl-js/ fire/"+m,e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach((t,n)=>e[n]=t),n&&n.headers.forEach((t,n)=>e[n]=t)}To(e,t){const n=ya[e];return`${this.mo}/v1/${t}:${n}`}}{constructor(e){super(e),this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}Ao(e,t,n,r){const s=pa();return new Promise((i,o)=>{const a=new h.XhrIo;a.setWithCredentials(!0),a.listenOnce(h.EventType.COMPLETE,()=>{try{switch(a.getLastErrorCode()){case h.ErrorCode.NO_ERROR:const t=a.getResponseJson();w(va,`XHR for RPC '${e}' ${s} received:`,JSON.stringify(t)),i(t);break;case h.ErrorCode.TIMEOUT:w(va,`RPC '${e}' ${s} timed out`),o(new D(x.DEADLINE_EXCEEDED,"Request time out"));break;case h.ErrorCode.HTTP_ERROR:const n=a.getStatus();if(w(va,`RPC '${e}' ${s} failed with status:`,n,"response text:",a.getResponseText()),n>0){let e=a.getResponseJson();Array.isArray(e)&&(e=e[0]);const t=null==e?void 0:e.error;if(t&&t.status&&t.message){const e=(function(e){const t=e.toLowerCase().replace(/_/g,"-");return Object.values(x).indexOf(t)>=0?t:x.UNKNOWN})(t.status);o(new D(e,t.message))}else o(new D(x.UNKNOWN,"Server responded with status "+a.getStatus()))}else o(new D(x.UNAVAILABLE,"Connection failed."));break;default:E()}}finally{w(va,`RPC '${e}' ${s} completed.`)}});const c=JSON.stringify(r);w(va,`RPC '${e}' ${s} sending request:`,r),a.send(t,"POST",c,n,15)})}Ro(e,t,n){const r=pa(),s=[this.mo,"/","google.firestore.v1.Firestore","/",e,"/channel"],i=(0,h.createWebChannelTransport)(),o=(0,h.getStatEventTarget)(),a={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},c=this.longPollingOptions.timeoutSeconds;void 0!==c&&(a.longPollingTimeout=Math.round(1e3*c)),this.useFetchStreams&&(a.xmlHttpFactory=new h.FetchXmlHttpFactory({})),this.Eo(a.initMessageHeaders,t,n),a.encodeInitMessageHeaders=!0;const u=s.join("");w(va,`Creating RPC '${e}' stream ${r}: ${u}`,a);const l=i.createWebChannel(u,a);let d=!1,f=!1;const m=new wa({ro:t=>{f?w(va,`Not sending because RPC '${e}' stream ${r} is closed:`,t):(d||(w(va,`Opening RPC '${e}' stream ${r} transport.`),l.open(),d=!0),w(va,`RPC '${e}' stream ${r} sending:`,t),l.send(t))},oo:()=>l.close()}),g=(e,t,n)=>{e.listen(t,e=>{try{n(e)}catch(e){setTimeout(()=>{throw e},0)}})};return g(l,h.WebChannel.EventType.OPEN,()=>{f||w(va,`RPC '${e}' stream ${r} transport opened.`)}),g(l,h.WebChannel.EventType.CLOSE,()=>{f||(f=!0,w(va,`RPC '${e}' stream ${r} transport closed`),m.wo())}),g(l,h.WebChannel.EventType.ERROR,t=>{f||(f=!0,b(va,`RPC '${e}' stream ${r} transport errored:`,t),m.wo(new D(x.UNAVAILABLE,"The operation could not be completed")))}),g(l,h.WebChannel.EventType.MESSAGE,t=>{var n;if(!f){const s=t.data[0];T(!!s);const i=s,o=i.error||(null===(n=i[0])||void 0===n?void 0:n.error);if(o){w(va,`RPC '${e}' stream ${r} received error:`,o);const t=o.status;let n=(function(e){const t=zr[e];if(void 0!==t)return $r(t)})(t),s=o.message;void 0===n&&(n=x.INTERNAL,s="Unknown error status: "+t+" with message "+o.message),f=!0,m.wo(new D(n,s)),l.close()}else w(va,`RPC '${e}' stream ${r} received:`,s),m._o(s)}}),g(o,h.Event.STAT_EVENT,t=>{t.stat===h.Stat.PROXY?w(va,`RPC '${e}' stream ${r} detected buffering proxy`):t.stat===h.Stat.NOPROXY&&w(va,`RPC '${e}' stream ${r} detected no buffering proxy`)}),setTimeout(()=>{m.fo()},0),m}}
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
   */function Ia(){return"undefined"!=typeof window?window:null}function Ea(){return"undefined"!=typeof document?document:null}
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
   */function Ta(e){return new fs(e,!0)}
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
   */class Sa{constructor(e,t,n=1e3,r=1.5,s=6e4){this.ii=e,this.timerId=t,this.Po=n,this.bo=r,this.Vo=s,this.So=0,this.Do=null,this.Co=Date.now(),this.reset()}reset(){this.So=0}xo(){this.So=this.Vo}No(e){this.cancel();const t=Math.floor(this.So+this.ko()),n=Math.max(0,Date.now()-this.Co),r=Math.max(0,t-n);r>0&&w("ExponentialBackoff",`Backing off for ${r} ms (base delay: ${this.So} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.Do=this.ii.enqueueAfterDelay(this.timerId,r,()=>(this.Co=Date.now(),e())),this.So*=this.bo,this.So<this.Po&&(this.So=this.Po),this.So>this.Vo&&(this.So=this.Vo)}Mo(){null!==this.Do&&(this.Do.skipDelay(),this.Do=null)}cancel(){null!==this.Do&&(this.Do.cancel(),this.Do=null)}ko(){return(Math.random()-.5)*this.So}}
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
   */class _a{constructor(e,t,n,r,s,i,o,a){this.ii=e,this.$o=n,this.Oo=r,this.connection=s,this.authCredentialsProvider=i,this.appCheckCredentialsProvider=o,this.listener=a,this.state=0,this.Fo=0,this.Bo=null,this.Lo=null,this.stream=null,this.qo=new Sa(e,t)}Uo(){return 1===this.state||5===this.state||this.Ko()}Ko(){return 2===this.state||3===this.state}start(){4!==this.state?this.auth():this.Go()}async stop(){this.Uo()&&await this.close(0)}Qo(){this.state=0,this.qo.reset()}jo(){this.Ko()&&null===this.Bo&&(this.Bo=this.ii.enqueueAfterDelay(this.$o,6e4,()=>this.zo()))}Wo(e){this.Ho(),this.stream.send(e)}async zo(){if(this.Ko())return this.close(0)}Ho(){this.Bo&&(this.Bo.cancel(),this.Bo=null)}Jo(){this.Lo&&(this.Lo.cancel(),this.Lo=null)}async close(e,t){this.Ho(),this.Jo(),this.qo.cancel(),this.Fo++,4!==e?this.qo.reset():t&&t.code===x.RESOURCE_EXHAUSTED?(v(t.toString()),v("Using maximum backoff delay to prevent overloading the backend."),this.qo.xo()):t&&t.code===x.UNAUTHENTICATED&&3!==this.state&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),null!==this.stream&&(this.Yo(),this.stream.close(),this.stream=null),this.state=e,await this.listener.ao(t)}Yo(){}auth(){this.state=1;const e=this.Xo(this.Fo),t=this.Fo;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([e,n])=>{this.Fo===t&&this.Zo(e,n)},t=>{e(()=>{const e=new D(x.UNKNOWN,"Fetching auth token failed: "+t.message);return this.tu(e)})})}Zo(e,t){const n=this.Xo(this.Fo);this.stream=this.eu(e,t),this.stream.uo(()=>{n(()=>(this.state=2,this.Lo=this.ii.enqueueAfterDelay(this.Oo,1e4,()=>(this.Ko()&&(this.state=3),Promise.resolve())),this.listener.uo()))}),this.stream.ao(e=>{n(()=>this.tu(e))}),this.stream.onMessage(e=>{n(()=>this.onMessage(e))})}Go(){this.state=5,this.qo.No(async()=>{this.state=0,this.start()})}tu(e){return w("PersistentStream",`close with error: ${e}`),this.stream=null,this.close(4,e)}Xo(e){return t=>{this.ii.enqueueAndForget(()=>this.Fo===e?t():(w("PersistentStream","stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class xa extends _a{constructor(e,t,n,r,s,i){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,r,i),this.serializer=s}eu(e,t){return this.connection.Ro("Listen",e,t)}onMessage(e){this.qo.reset();const t=As(this.serializer,e),n=(function(e){if(!("targetChange"in e))return G.min();const t=e.targetChange;return t.targetIds&&t.targetIds.length?G.min():t.readTime?ws(t.readTime):G.min()})(e);return this.listener.nu(t,n)}su(e){const t={};t.database=_s(this.serializer),t.addTarget=(function(e,t){let n;const r=t.target;if(n=Tn(r)?{documents:Fs(e,r)}:{query:Ms(e,r)},n.targetId=t.targetId,t.resumeToken.approximateByteSize()>0){n.resumeToken=ps(e,t.resumeToken);const r=ms(e,t.expectedCount);null!==r&&(n.expectedCount=r)}else if(t.snapshotVersion.compareTo(G.min())>0){n.readTime=gs(e,t.snapshotVersion.toTimestamp());const r=ms(e,t.expectedCount);null!==r&&(n.expectedCount=r)}return n})(this.serializer,e);const n=Vs(this.serializer,e);n&&(t.labels=n),this.Wo(t)}iu(e){const t={};t.database=_s(this.serializer),t.removeTarget=e,this.Wo(t)}}class Da extends _a{constructor(e,t,n,r,s,i){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,r,i),this.serializer=s,this.ru=!1}get ou(){return this.ru}start(){this.ru=!1,this.lastStreamToken=void 0,super.start()}Yo(){this.ru&&this.uu([])}eu(e,t){return this.connection.Ro("Write",e,t)}onMessage(e){if(T(!!e.streamToken),this.lastStreamToken=e.streamToken,this.ru){this.qo.reset();const t=Ps(e.writeResults,e.commitTime),n=ws(e.commitTime);return this.listener.cu(n,t)}return T(!e.writeResults||0===e.writeResults.length),this.ru=!0,this.listener.au()}hu(){const e={};e.database=_s(this.serializer),this.Wo(e)}uu(e){const t={streamToken:this.lastStreamToken,writes:e.map(e=>ks(this.serializer,e))};this.Wo(t)}}
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
   */class Ca extends class{}{constructor(e,t,n,r){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=r,this.lu=!1}fu(){if(this.lu)throw new D(x.FAILED_PRECONDITION,"The client has already been terminated.")}Io(e,t,n){return this.fu(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([r,s])=>this.connection.Io(e,t,n,r,s)).catch(e=>{throw"FirebaseError"===e.name?(e.code===x.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),e):new D(x.UNKNOWN,e.toString())})}vo(e,t,n,r){return this.fu(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([s,i])=>this.connection.vo(e,t,n,s,i,r)).catch(e=>{throw"FirebaseError"===e.name?(e.code===x.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),e):new D(x.UNKNOWN,e.toString())})}terminate(){this.lu=!0}}async function Na(e,t,n){var r;const s=_(e),{request:i,du:o}=(function(e,t,n){const r=Ms(e,t),s={},i=[];let o=0;return n.forEach(e=>{const t="aggregate_"+o++;s[t]=e.alias,"count"===e.yt?i.push({alias:t,count:{}}):"avg"===e.yt?i.push({alias:t,avg:{field:js(e.fieldPath)}}):"sum"===e.yt&&i.push({alias:t,sum:{field:js(e.fieldPath)}})}),{request:{structuredAggregationQuery:{aggregations:i,structuredQuery:r.structuredQuery},parent:r.parent},du:s}})(s.serializer,Mn(t),n),a=i.parent;s.connection.po||delete i.parent;const c=(await s.vo("RunAggregationQuery",a,i,1)).filter(e=>!!e.result);T(1===c.length);const u=null===(r=c[0].result)||void 0===r?void 0:r.aggregateFields;return Object.keys(u).reduce((e,t)=>(e[o[t]]=u[t],e),{})}class Aa{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.wu=0,this._u=null,this.mu=!0}gu(){0===this.wu&&(this.yu("Unknown"),this._u=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._u=null,this.pu("Backend didn't respond within 10 seconds."),this.yu("Offline"),Promise.resolve())))}Iu(e){"Online"===this.state?this.yu("Unknown"):(this.wu++,this.wu>=1&&(this.Tu(),this.pu(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.yu("Offline")))}set(e){this.Tu(),this.wu=0,"Online"===e&&(this.mu=!1),this.yu(e)}yu(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}pu(e){const t=`Could not reach Cloud Firestore backend. ${e}\nThis typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.mu?(v(t),this.mu=!1):w("OnlineStateTracker",t)}Tu(){null!==this._u&&(this._u.cancel(),this._u=null)}}
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
   */class ka{constructor(e,t,n,r,s){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.Eu=[],this.Au=new Map,this.vu=new Set,this.Ru=[],this.Pu=s,this.Pu.Yr(e=>{n.enqueueAndForget(async()=>{Ba(this)&&(w("RemoteStore","Restarting streams for network reachability change."),await(async function(e){const t=_(e);t.vu.add(4),await Pa(t),t.bu.set("Unknown"),t.vu.delete(4),await Oa(t)})(this))})}),this.bu=new Aa(n,r)}}async function Oa(e){if(Ba(e))for(const t of e.Ru)await t(!0)}async function Pa(e){for(const t of e.Ru)await t(!1)}function Fa(e,t){const n=_(e);n.Au.has(t.targetId)||(n.Au.set(t.targetId,t),qa(n)?La(n):sc(n).Ko()&&Ra(n,t))}function Ma(e,t){const n=_(e),r=sc(n);n.Au.delete(t),r.Ko()&&Va(n,t),0===n.Au.size&&(r.Ko()?r.jo():Ba(n)&&n.bu.set("Unknown"))}function Ra(e,t){if(e.Vu.qt(t.targetId),t.resumeToken.approximateByteSize()>0||t.snapshotVersion.compareTo(G.min())>0){const n=e.remoteSyncer.getRemoteKeysForTarget(t.targetId).size;t=t.withExpectedCount(n)}sc(e).su(t)}function Va(e,t){e.Vu.qt(t),sc(e).iu(t)}function La(e){e.Vu=new as({getRemoteKeysForTarget:t=>e.remoteSyncer.getRemoteKeysForTarget(t),le:t=>e.Au.get(t)||null,ue:()=>e.datastore.serializer.databaseId}),sc(e).start(),e.bu.gu()}function qa(e){return Ba(e)&&!sc(e).Uo()&&e.Au.size>0}function Ba(e){return 0===_(e).vu.size}function Ua(e){e.Vu=void 0}async function ja(e){e.Au.forEach((t,n)=>{Ra(e,t)})}async function za(e,t){Ua(e),qa(e)?(e.bu.Iu(t),La(e)):e.bu.set("Unknown")}async function Ga(e,t,n){if(e.bu.set("Online"),t instanceof is&&2===t.state&&t.cause)try{await(async function(e,t){const n=t.cause;for(const r of t.targetIds)e.Au.has(r)&&(await e.remoteSyncer.rejectListen(r,n),e.Au.delete(r),e.Vu.removeTarget(r))})(e,t)}catch(n){w("RemoteStore","Failed to remove targets %s: %s ",t.targetIds.join(","),n),await Ka(e,n)}else if(t instanceof rs?e.Vu.Ht(t):t instanceof ss?e.Vu.ne(t):e.Vu.Xt(t),!n.isEqual(G.min()))try{const t=await Ko(e.localStore);n.compareTo(t)>=0&&await(function(e,t){const n=e.Vu.ce(t);return n.targetChanges.forEach((n,r)=>{if(n.resumeToken.approximateByteSize()>0){const s=e.Au.get(r);s&&e.Au.set(r,s.withResumeToken(n.resumeToken,t))}}),n.targetMismatches.forEach((t,n)=>{const r=e.Au.get(t);if(!r)return;e.Au.set(t,r.withResumeToken(ft.EMPTY_BYTE_STRING,r.snapshotVersion)),Va(e,t);const s=new Qs(r.target,t,n,r.sequenceNumber);Ra(e,s)}),e.remoteSyncer.applyRemoteEvent(n)})(e,n)}catch(t){w("RemoteStore","Failed to raise snapshot:",t),await Ka(e,t)}}async function Ka(e,t,n){if(!ge(t))throw t;e.vu.add(1),await Pa(e),e.bu.set("Offline"),n||(n=()=>Ko(e.localStore)),e.asyncQueue.enqueueRetryable(async()=>{w("RemoteStore","Retrying IndexedDB access"),await n(),e.vu.delete(1),await Oa(e)})}function $a(e,t){return t().catch(n=>Ka(e,n,t))}async function Qa(e){const t=_(e),n=ic(t);let r=t.Eu.length>0?t.Eu[t.Eu.length-1].batchId:-1;for(;Wa(t);)try{const e=await Wo(t.localStore,r);if(null===e){0===t.Eu.length&&n.jo();break}r=e.batchId,Ha(t,e)}catch(e){await Ka(t,e)}Ya(t)&&Xa(t)}function Wa(e){return Ba(e)&&e.Eu.length<10}function Ha(e,t){e.Eu.push(t);const n=ic(e);n.Ko()&&n.ou&&n.uu(t.mutations)}function Ya(e){return Ba(e)&&!ic(e).Uo()&&e.Eu.length>0}function Xa(e){ic(e).start()}async function Ja(e){ic(e).hu()}async function Za(e){const t=ic(e);for(const n of e.Eu)t.uu(n.mutations)}async function ec(e,t,n){const r=e.Eu.shift(),s=qr.from(r,t,n);await $a(e,()=>e.remoteSyncer.applySuccessfulWrite(s)),await Qa(e)}async function tc(e,t){t&&ic(e).ou&&await(async function(e,t){if(Kr(n=t.code)&&n!==x.ABORTED){const n=e.Eu.shift();ic(e).Qo(),await $a(e,()=>e.remoteSyncer.rejectFailedWrite(n.batchId,t)),await Qa(e)}var n})(e,t),Ya(e)&&Xa(e)}async function nc(e,t){const n=_(e);n.asyncQueue.verifyOperationInProgress(),w("RemoteStore","RemoteStore received new credentials");const r=Ba(n);n.vu.add(3),await Pa(n),r&&n.bu.set("Unknown"),await n.remoteSyncer.handleCredentialChange(t),n.vu.delete(3),await Oa(n)}async function rc(e,t){const n=_(e);t?(n.vu.delete(2),await Oa(n)):t||(n.vu.add(2),await Pa(n),n.bu.set("Unknown"))}function sc(e){return e.Su||(e.Su=(function(e,t,n){const r=_(e);return r.fu(),new xa(t,r.connection,r.authCredentials,r.appCheckCredentials,r.serializer,n)
/**
    * @license
    * Copyright 2018 Google LLC
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
    */})(e.datastore,e.asyncQueue,{uo:ja.bind(null,e),ao:za.bind(null,e),nu:Ga.bind(null,e)}),e.Ru.push(async t=>{t?(e.Su.Qo(),qa(e)?La(e):e.bu.set("Unknown")):(await e.Su.stop(),Ua(e))})),e.Su}function ic(e){return e.Du||(e.Du=(function(e,t,n){const r=_(e);return r.fu(),new Da(t,r.connection,r.authCredentials,r.appCheckCredentials,r.serializer,n)})(e.datastore,e.asyncQueue,{uo:Ja.bind(null,e),ao:tc.bind(null,e),au:Za.bind(null,e),cu:ec.bind(null,e)}),e.Ru.push(async t=>{t?(e.Du.Qo(),await Qa(e)):(await e.Du.stop(),e.Eu.length>0&&(w("RemoteStore",`Stopping write stream with ${e.Eu.length} pending writes`),e.Eu=[]))})),e.Du
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
   */}class oc{constructor(e,t,n,r,s){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=r,this.removalCallback=s,this.deferred=new C,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(e=>{})}static createAndSchedule(e,t,n,r,s){const i=Date.now()+n,o=new oc(e,t,i,r,s);return o.start(n),o}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){null!==this.timerHandle&&(this.clearTimeout(),this.deferred.reject(new D(x.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>null!==this.timerHandle?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){null!==this.timerHandle&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function ac(e,t){if(v("AsyncQueue",`${t}: ${e}`),ge(e))return new D(x.UNAVAILABLE,`${t}: ${e}`);throw e}
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
   */class cc{constructor(e){this.comparator=e?(t,n)=>e(t,n)||H.comparator(t.key,n.key):(e,t)=>H.comparator(e.key,t.key),this.keyedMap=Hn(),this.sortedSet=new st(this.comparator)}static emptySet(e){return new cc(e.comparator)}has(e){return null!=this.keyedMap.get(e)}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((t,n)=>(e(t),!1))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof cc))return!1;if(this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){const e=t.getNext().key,r=n.getNext().key;if(!e.isEqual(r))return!1}return!0}toString(){const e=[];return this.forEach(t=>{e.push(t.toString())}),0===e.length?"DocumentSet ()":"DocumentSet (\n  "+e.join("  \n")+"\n)"}copy(e,t){const n=new cc;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}}
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
   */class uc{constructor(){this.Cu=new st(H.comparator)}track(e){const t=e.doc.key,n=this.Cu.get(t);n?0!==e.type&&3===n.type?this.Cu=this.Cu.insert(t,e):3===e.type&&1!==n.type?this.Cu=this.Cu.insert(t,{type:n.type,doc:e.doc}):2===e.type&&2===n.type?this.Cu=this.Cu.insert(t,{type:2,doc:e.doc}):2===e.type&&0===n.type?this.Cu=this.Cu.insert(t,{type:0,doc:e.doc}):1===e.type&&0===n.type?this.Cu=this.Cu.remove(t):1===e.type&&2===n.type?this.Cu=this.Cu.insert(t,{type:1,doc:n.doc}):0===e.type&&1===n.type?this.Cu=this.Cu.insert(t,{type:2,doc:e.doc}):E():this.Cu=this.Cu.insert(t,e)}xu(){const e=[];return this.Cu.inorderTraversal((t,n)=>{e.push(n)}),e}}class lc{constructor(e,t,n,r,s,i,o,a,c){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=r,this.mutatedKeys=s,this.fromCache=i,this.syncStateChanged=o,this.excludesMetadataChanges=a,this.hasCachedResults=c}static fromInitialDocuments(e,t,n,r,s){const i=[];return t.forEach(e=>{i.push({type:0,doc:e})}),new lc(e,t,cc.emptySet(t),i,n,r,!0,!1,s)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&Ln(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let e=0;e<t.length;e++)if(t[e].type!==n[e].type||!t[e].doc.isEqual(n[e].doc))return!1;return!0}}
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
   */class hc{constructor(){this.Nu=void 0,this.listeners=[]}}class dc{constructor(){this.queries=new Kn(e=>qn(e),Ln),this.onlineState="Unknown",this.ku=new Set}}async function fc(e,t){const n=_(e),r=t.query;let s=!1,i=n.queries.get(r);if(i||(s=!0,i=new hc),s)try{i.Nu=await n.onListen(r)}catch(e){const n=ac(e,`Initialization of query '${Bn(t.query)}' failed`);return void t.onError(n)}n.queries.set(r,i),i.listeners.push(t),t.Mu(n.onlineState),i.Nu&&t.$u(i.Nu)&&yc(n)}async function mc(e,t){const n=_(e),r=t.query;let s=!1;const i=n.queries.get(r);if(i){const e=i.listeners.indexOf(t);e>=0&&(i.listeners.splice(e,1),s=0===i.listeners.length)}if(s)return n.queries.delete(r),n.onUnlisten(r)}function gc(e,t){const n=_(e);let r=!1;for(const e of t){const t=e.query,s=n.queries.get(t);if(s){for(const t of s.listeners)t.$u(e)&&(r=!0);s.Nu=e}}r&&yc(n)}function pc(e,t,n){const r=_(e),s=r.queries.get(t);if(s)for(const e of s.listeners)e.onError(n);r.queries.delete(t)}function yc(e){e.ku.forEach(e=>{e.next()})}class wc{constructor(e,t,n){this.query=e,this.Ou=t,this.Fu=!1,this.Bu=null,this.onlineState="Unknown",this.options=n||{}}$u(e){if(!this.options.includeMetadataChanges){const t=[];for(const n of e.docChanges)3!==n.type&&t.push(n);e=new lc(e.query,e.docs,e.oldDocs,t,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Fu?this.Lu(e)&&(this.Ou.next(e),t=!0):this.qu(e,this.onlineState)&&(this.Uu(e),t=!0),this.Bu=e,t}onError(e){this.Ou.error(e)}Mu(e){this.onlineState=e;let t=!1;return this.Bu&&!this.Fu&&this.qu(this.Bu,e)&&(this.Uu(this.Bu),t=!0),t}qu(e,t){if(!e.fromCache)return!0;const n="Offline"!==t;return(!this.options.Ku||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||"Offline"===t)}Lu(e){if(e.docChanges.length>0)return!0;const t=this.Bu&&this.Bu.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&!0===this.options.includeMetadataChanges}Uu(e){e=lc.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Fu=!0,this.Ou.next(e)}}
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
   */class vc{constructor(e,t){this.Gu=e,this.byteLength=t}Qu(){return"metadata"in this.Gu}}
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
   */class bc{constructor(e){this.serializer=e}rr(e){return Es(this.serializer,e)}ur(e){return e.metadata.exists?Cs(this.serializer,e.document,!1):Qt.newNoDocument(this.rr(e.metadata.name),this.cr(e.metadata.readTime))}cr(e){return ws(e)}}class Ic{constructor(e,t,n){this.ju=e,this.localStore=t,this.serializer=n,this.queries=[],this.documents=[],this.collectionGroups=new Set,this.progress=Ec(e)}zu(e){this.progress.bytesLoaded+=e.byteLength;let t=this.progress.documentsLoaded;if(e.Gu.namedQuery)this.queries.push(e.Gu.namedQuery);else if(e.Gu.documentMetadata){this.documents.push({metadata:e.Gu.documentMetadata}),e.Gu.documentMetadata.exists||++t;const n=$.fromString(e.Gu.documentMetadata.name);this.collectionGroups.add(n.get(n.length-2))}else e.Gu.document&&(this.documents[this.documents.length-1].document=e.Gu.document,++t);return t!==this.progress.documentsLoaded?(this.progress.documentsLoaded=t,Object.assign({},this.progress)):null}Wu(e){const t=new Map,n=new bc(this.serializer);for(const r of e)if(r.metadata.queries){const e=n.rr(r.metadata.name);for(const n of r.metadata.queries){const r=(t.get(n)||nr()).add(e);t.set(n,r)}}return t}async complete(){const e=await ta(this.localStore,new bc(this.serializer),this.documents,this.ju.id),t=this.Wu(this.documents);for(const e of this.queries)await na(this.localStore,e,t.get(e.name));return this.progress.taskState="Success",{progress:this.progress,Hu:this.collectionGroups,Ju:e}}}function Ec(e){return{taskState:"Running",documentsLoaded:0,bytesLoaded:0,totalDocuments:e.totalDocuments,totalBytes:e.totalBytes}}
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
   */class Tc{constructor(e){this.key=e}}class Sc{constructor(e){this.key=e}}class _c{constructor(e,t){this.query=e,this.Yu=t,this.Xu=null,this.hasCachedResults=!1,this.current=!1,this.Zu=nr(),this.mutatedKeys=nr(),this.tc=zn(e),this.ec=new cc(this.tc)}get nc(){return this.Yu}sc(e,t){const n=t?t.ic:new uc,r=t?t.ec:this.ec;let s=t?t.mutatedKeys:this.mutatedKeys,i=r,o=!1;const a="F"===this.query.limitType&&r.size===this.query.limit?r.last():null,c="L"===this.query.limitType&&r.size===this.query.limit?r.first():null;if(e.inorderTraversal((e,t)=>{const u=r.get(e),l=Un(this.query,t)?t:null,h=!!u&&this.mutatedKeys.has(u.key),d=!!l&&(l.hasLocalMutations||this.mutatedKeys.has(l.key)&&l.hasCommittedMutations);let f=!1;u&&l?u.data.isEqual(l.data)?h!==d&&(n.track({type:3,doc:l}),f=!0):this.rc(u,l)||(n.track({type:2,doc:l}),f=!0,(a&&this.tc(l,a)>0||c&&this.tc(l,c)<0)&&(o=!0)):!u&&l?(n.track({type:0,doc:l}),f=!0):u&&!l&&(n.track({type:1,doc:u}),f=!0,(a||c)&&(o=!0)),f&&(l?(i=i.add(l),s=d?s.add(e):s.delete(e)):(i=i.delete(e),s=s.delete(e)))}),null!==this.query.limit)for(;i.size>this.query.limit;){const e="F"===this.query.limitType?i.last():i.first();i=i.delete(e.key),s=s.delete(e.key),n.track({type:1,doc:e})}return{ec:i,ic:n,zi:o,mutatedKeys:s}}rc(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n){const r=this.ec;this.ec=e.ec,this.mutatedKeys=e.mutatedKeys;const s=e.ic.xu();s.sort((e,t)=>(function(e,t){const n=e=>{switch(e){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return E()}};return n(e)-n(t)}
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
      */)(e.type,t.type)||this.tc(e.doc,t.doc)),this.oc(n);const i=t?this.uc():[],o=0===this.Zu.size&&this.current?1:0,a=o!==this.Xu;return this.Xu=o,0!==s.length||a?{snapshot:new lc(this.query,e.ec,r,s,e.mutatedKeys,0===o,a,!1,!!n&&n.resumeToken.approximateByteSize()>0),cc:i}:{cc:i}}Mu(e){return this.current&&"Offline"===e?(this.current=!1,this.applyChanges({ec:this.ec,ic:new uc,mutatedKeys:this.mutatedKeys,zi:!1},!1)):{cc:[]}}ac(e){return!this.Yu.has(e)&&!!this.ec.has(e)&&!this.ec.get(e).hasLocalMutations}oc(e){e&&(e.addedDocuments.forEach(e=>this.Yu=this.Yu.add(e)),e.modifiedDocuments.forEach(e=>{}),e.removedDocuments.forEach(e=>this.Yu=this.Yu.delete(e)),this.current=e.current)}uc(){if(!this.current)return[];const e=this.Zu;this.Zu=nr(),this.ec.forEach(e=>{this.ac(e.key)&&(this.Zu=this.Zu.add(e.key))});const t=[];return e.forEach(e=>{this.Zu.has(e)||t.push(new Sc(e))}),this.Zu.forEach(n=>{e.has(n)||t.push(new Tc(n))}),t}hc(e){this.Yu=e.ir,this.Zu=nr();const t=this.sc(e.documents);return this.applyChanges(t,!0)}lc(){return lc.fromInitialDocuments(this.query,this.ec,this.mutatedKeys,0===this.Xu,this.hasCachedResults)}}class xc{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}}class Dc{constructor(e){this.key=e,this.fc=!1}}class Cc{constructor(e,t,n,r,s,i){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=r,this.currentUser=s,this.maxConcurrentLimboResolutions=i,this.dc={},this.wc=new Kn(e=>qn(e),Ln),this._c=new Map,this.mc=new Set,this.gc=new st(H.comparator),this.yc=new Map,this.Ic=new Eo,this.Tc={},this.Ec=new Map,this.Ac=Yi.Mn(),this.onlineState="Unknown",this.vc=void 0}get isPrimaryClient(){return!0===this.vc}}async function Nc(e,t){const n=su(e);let r,s;const i=n.wc.get(t);if(i)r=i.targetId,n.sharedClientState.addLocalQueryTarget(r),s=i.view.lc();else{const e=await Ho(n.localStore,Mn(t)),i=n.sharedClientState.addLocalQueryTarget(e.targetId);r=e.targetId,s=await Ac(n,t,r,"current"===i,e.resumeToken),n.isPrimaryClient&&Fa(n.remoteStore,e)}return s}async function Ac(e,t,n,r,s){e.Rc=(t,n,r)=>(async function(e,t,n,r){let s=t.view.sc(n);s.zi&&(s=await Xo(e.localStore,t.query,!1).then(({documents:e})=>t.view.sc(e,s)));const i=r&&r.targetChanges.get(t.targetId),o=t.view.applyChanges(s,e.isPrimaryClient,i);return zc(e,t.targetId,o.cc),o.snapshot})(e,t,n,r);const i=await Xo(e.localStore,t,!0),o=new _c(t,i.ir),a=o.sc(i.documents),c=ns.createSynthesizedTargetChangeForCurrentChange(n,r&&"Offline"!==e.onlineState,s),u=o.applyChanges(a,e.isPrimaryClient,c);zc(e,n,u.cc);const l=new xc(t,n,o);return e.wc.set(t,l),e._c.has(n)?e._c.get(n).push(t):e._c.set(n,[t]),u.snapshot}async function kc(e,t){const n=_(e),r=n.wc.get(t),s=n._c.get(r.targetId);if(s.length>1)return n._c.set(r.targetId,s.filter(e=>!Ln(e,t))),void n.wc.delete(t);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(r.targetId),n.sharedClientState.isActiveQueryTarget(r.targetId)||await Yo(n.localStore,r.targetId,!1).then(()=>{n.sharedClientState.clearQueryState(r.targetId),Ma(n.remoteStore,r.targetId),Uc(n,r.targetId)}).catch(ue)):(Uc(n,r.targetId),await Yo(n.localStore,r.targetId,!0))}async function Oc(e,t,n){const r=iu(e);try{const e=await(function(e,t){const n=_(e),r=z.now(),s=t.reduce((e,t)=>e.add(t.key),nr());let i,o;return n.persistence.runTransaction("Locally write mutations","readwrite",e=>{let a=Qn(),c=nr();return n.Zi.getEntries(e,s).next(e=>{a=e,a.forEach((e,t)=>{t.isValidDocument()||(c=c.add(e))})}).next(()=>n.localDocuments.getOverlayedDocuments(e,a)).next(s=>{i=s;const o=[];for(const e of t){const t=Nr(e,i.get(e.key).overlayedDocument);null!=t&&o.push(new Or(e.key,t,$t(t.value.mapValue),Tr.exists(!0)))}return n.mutationQueue.addMutationBatch(e,r,o,t)}).next(t=>{o=t;const r=t.applyToLocalDocumentSet(i,c);return n.documentOverlayCache.saveOverlays(e,t.batchId,r)})}).then(()=>({batchId:o.batchId,changes:Yn(i)}))})(r.localStore,t);r.sharedClientState.addPendingMutation(e.batchId),(function(e,t,n){let r=e.Tc[e.currentUser.toKey()];r||(r=new st(B)),r=r.insert(t,n),e.Tc[e.currentUser.toKey()]=r})(r,e.batchId,n),await $c(r,e.changes),await Qa(r.remoteStore)}catch(e){const t=ac(e,"Failed to persist write");n.reject(t)}}async function Pc(e,t){const n=_(e);try{const e=await $o(n.localStore,t);t.targetChanges.forEach((e,t)=>{const r=n.yc.get(t);r&&(T(e.addedDocuments.size+e.modifiedDocuments.size+e.removedDocuments.size<=1),e.addedDocuments.size>0?r.fc=!0:e.modifiedDocuments.size>0?T(r.fc):e.removedDocuments.size>0&&(T(r.fc),r.fc=!1))}),await $c(n,e,t)}catch(e){await ue(e)}}function Fc(e,t,n){const r=_(e);if(r.isPrimaryClient&&0===n||!r.isPrimaryClient&&1===n){const e=[];r.wc.forEach((n,r)=>{const s=r.view.Mu(t);s.snapshot&&e.push(s.snapshot)}),(function(e,t){const n=_(e);n.onlineState=t;let r=!1;n.queries.forEach((e,n)=>{for(const e of n.listeners)e.Mu(t)&&(r=!0)}),r&&yc(n)})(r.eventManager,t),e.length&&r.dc.nu(e),r.onlineState=t,r.isPrimaryClient&&r.sharedClientState.setOnlineState(t)}}async function Mc(e,t,n){const r=_(e);r.sharedClientState.updateQueryState(t,"rejected",n);const s=r.yc.get(t),i=s&&s.key;if(i){let e=new st(H.comparator);e=e.insert(i,Qt.newNoDocument(i,G.min()));const n=nr().add(i),s=new ts(G.min(),new Map,new st(B),e,n);await Pc(r,s),r.gc=r.gc.remove(i),r.yc.delete(t),Kc(r)}else await Yo(r.localStore,t,!1).then(()=>Uc(r,t,n)).catch(ue)}async function Rc(e,t){const n=_(e),r=t.batch.batchId;try{const e=await Go(n.localStore,t);Bc(n,r,null),qc(n,r),n.sharedClientState.updateMutationState(r,"acknowledged"),await $c(n,e)}catch(e){await ue(e)}}async function Vc(e,t,n){const r=_(e);try{const e=await(function(e,t){const n=_(e);return n.persistence.runTransaction("Reject batch","readwrite-primary",e=>{let r;return n.mutationQueue.lookupMutationBatch(e,t).next(t=>(T(null!==t),r=t.keys(),n.mutationQueue.removeMutationBatch(e,t))).next(()=>n.mutationQueue.performConsistencyCheck(e)).next(()=>n.documentOverlayCache.removeOverlaysForBatchId(e,r,t)).next(()=>n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(e,r)).next(()=>n.localDocuments.getDocuments(e,r))})})(r.localStore,t);Bc(r,t,n),qc(r,t),r.sharedClientState.updateMutationState(t,"rejected",n),await $c(r,e)}catch(n){await ue(n)}}async function Lc(e,t){const n=_(e);Ba(n.remoteStore)||w("SyncEngine","The network is disabled. The task returned by 'awaitPendingWrites()' will not complete until the network is enabled.");try{const e=await(function(e){const t=_(e);return t.persistence.runTransaction("Get highest unacknowledged batch id","readonly",e=>t.mutationQueue.getHighestUnacknowledgedBatchId(e))})(n.localStore);if(-1===e)return void t.resolve();const r=n.Ec.get(e)||[];r.push(t),n.Ec.set(e,r)}catch(e){const n=ac(e,"Initialization of waitForPendingWrites() operation failed");t.reject(n)}}function qc(e,t){(e.Ec.get(t)||[]).forEach(e=>{e.resolve()}),e.Ec.delete(t)}function Bc(e,t,n){const r=_(e);let s=r.Tc[r.currentUser.toKey()];if(s){const e=s.get(t);e&&(n?e.reject(n):e.resolve(),s=s.remove(t)),r.Tc[r.currentUser.toKey()]=s}}function Uc(e,t,n=null){e.sharedClientState.removeLocalQueryTarget(t);for(const r of e._c.get(t))e.wc.delete(r),n&&e.dc.Pc(r,n);e._c.delete(t),e.isPrimaryClient&&e.Ic.Is(t).forEach(t=>{e.Ic.containsKey(t)||jc(e,t)})}function jc(e,t){e.mc.delete(t.path.canonicalString());const n=e.gc.get(t);null!==n&&(Ma(e.remoteStore,n),e.gc=e.gc.remove(t),e.yc.delete(n),Kc(e))}function zc(e,t,n){for(const r of n)r instanceof Tc?(e.Ic.addReference(r.key,t),Gc(e,r)):r instanceof Sc?(w("SyncEngine","Document no longer in limbo: "+r.key),e.Ic.removeReference(r.key,t),e.Ic.containsKey(r.key)||jc(e,r.key)):E()}function Gc(e,t){const n=t.key,r=n.path.canonicalString();e.gc.get(n)||e.mc.has(r)||(w("SyncEngine","New document in limbo: "+n),e.mc.add(r),Kc(e))}function Kc(e){for(;e.mc.size>0&&e.gc.size<e.maxConcurrentLimboResolutions;){const t=e.mc.values().next().value;e.mc.delete(t);const n=new H($.fromString(t)),r=e.Ac.next();e.yc.set(r,new Dc(n)),e.gc=e.gc.insert(n,r),Fa(e.remoteStore,new Qs(Mn(Nn(n.path)),r,"TargetPurposeLimboResolution",Ee.ct))}}async function $c(e,t,n){const r=_(e),s=[],i=[],o=[];r.wc.isEmpty()||(r.wc.forEach((e,a)=>{o.push(r.Rc(a,t,n).then(e=>{if((e||n)&&r.isPrimaryClient&&r.sharedClientState.updateQueryState(a.targetId,(null==e?void 0:e.fromCache)?"not-current":"current"),e){s.push(e);const t=qo.Li(a.targetId,e);i.push(t)}}))}),await Promise.all(o),r.dc.nu(s),await(async function(e,t){const n=_(e);try{await n.persistence.runTransaction("notifyLocalViewChanges","readwrite",e=>le.forEach(t,t=>le.forEach(t.Fi,r=>n.persistence.referenceDelegate.addReference(e,t.targetId,r)).next(()=>le.forEach(t.Bi,r=>n.persistence.referenceDelegate.removeReference(e,t.targetId,r)))))}catch(e){if(!ge(e))throw e;w("LocalStore","Failed to update sequence numbers: "+e)}for(const e of t){const t=e.targetId;if(!e.fromCache){const e=n.Ji.get(t),r=e.snapshotVersion,s=e.withLastLimboFreeSnapshotVersion(r);n.Ji=n.Ji.insert(t,s)}}})(r.localStore,i))}async function Qc(e,t){const n=_(e);if(!n.currentUser.isEqual(t)){w("SyncEngine","User change. New user:",t.toKey());const e=await zo(n.localStore,t);n.currentUser=t,(function(e){e.Ec.forEach(e=>{e.forEach(e=>{e.reject(new D(x.CANCELLED,"'waitForPendingWrites' promise is rejected due to a user change."))})}),e.Ec.clear()})(n),n.sharedClientState.handleUserChange(t,e.removedBatchIds,e.addedBatchIds),await $c(n,e.er)}}function Wc(e,t){const n=_(e),r=n.yc.get(t);if(r&&r.fc)return nr().add(r.key);{let e=nr();const r=n._c.get(t);if(!r)return e;for(const t of r){const r=n.wc.get(t);e=e.unionWith(r.view.nc)}return e}}async function Hc(e,t){const n=_(e),r=await Xo(n.localStore,t.query,!0),s=t.view.hc(r);return n.isPrimaryClient&&zc(n,t.targetId,s.cc),s}async function Yc(e,t){const n=_(e);return Zo(n.localStore,t).then(e=>$c(n,e))}async function Xc(e,t,n,r){const s=_(e),i=await(function(e,t){const n=_(e),r=_(n.mutationQueue);return n.persistence.runTransaction("Lookup mutation documents","readonly",e=>r.Sn(e,t).next(t=>t?n.localDocuments.getDocuments(e,t):le.resolve(null)))})(s.localStore,t);null!==i?("pending"===n?await Qa(s.remoteStore):"acknowledged"===n||"rejected"===n?(Bc(s,t,r||null),qc(s,t),(function(e,t){_(_(e).mutationQueue).Cn(t)})(s.localStore,t)):E(),await $c(s,i)):w("SyncEngine","Cannot apply mutation batch with id: "+t)}async function Jc(e,t){const n=_(e);if(su(n),iu(n),!0===t&&!0!==n.vc){const e=n.sharedClientState.getAllActiveQueryTargets(),t=await Zc(n,e.toArray());n.vc=!0,await rc(n.remoteStore,!0);for(const e of t)Fa(n.remoteStore,e)}else if(!1===t&&!1!==n.vc){const e=[];let t=Promise.resolve();n._c.forEach((r,s)=>{n.sharedClientState.isLocalQueryTarget(s)?e.push(s):t=t.then(()=>(Uc(n,s),Yo(n.localStore,s,!0))),Ma(n.remoteStore,s)}),await t,await Zc(n,e),(function(e){const t=_(e);t.yc.forEach((e,n)=>{Ma(t.remoteStore,n)}),t.Ic.Ts(),t.yc=new Map,t.gc=new st(H.comparator)})(n),n.vc=!1,await rc(n.remoteStore,!1)}}async function Zc(e,t,n){const r=_(e),s=[],i=[];for(const e of t){let t;const n=r._c.get(e);if(n&&0!==n.length){t=await Ho(r.localStore,Mn(n[0]));for(const e of n){const t=r.wc.get(e),n=await Hc(r,t);n.snapshot&&i.push(n.snapshot)}}else{const n=await Jo(r.localStore,e);t=await Ho(r.localStore,n),await Ac(r,eu(n),e,!1,t.resumeToken)}s.push(t)}return r.dc.nu(i),s}function eu(e){return Cn(e.path,e.collectionGroup,e.orderBy,e.filters,e.limit,"F",e.startAt,e.endAt)}function tu(e){const t=_(e);return _(_(t.localStore).persistence).$i()}async function nu(e,t,n,r){const s=_(e);if(s.vc)return void w("SyncEngine","Ignoring unexpected query state notification.");const i=s._c.get(t);if(i&&i.length>0)switch(n){case"current":case"not-current":{const e=await Zo(s.localStore,jn(i[0])),r=ts.createSynthesizedRemoteEventForCurrentChange(t,"current"===n,ft.EMPTY_BYTE_STRING);await $c(s,e,r);break}case"rejected":await Yo(s.localStore,t,!0),Uc(s,t,r);break;default:E()}}async function ru(e,t,n){const r=su(e);if(r.vc){for(const e of t){if(r._c.has(e)){w("SyncEngine","Adding an already active target "+e);continue}const t=await Jo(r.localStore,e),n=await Ho(r.localStore,t);await Ac(r,eu(t),n.targetId,!1,n.resumeToken),Fa(r.remoteStore,n)}for(const e of n)r._c.has(e)&&await Yo(r.localStore,e,!1).then(()=>{Ma(r.remoteStore,e),Uc(r,e)}).catch(ue)}}function su(e){const t=_(e);return t.remoteStore.remoteSyncer.applyRemoteEvent=Pc.bind(null,t),t.remoteStore.remoteSyncer.getRemoteKeysForTarget=Wc.bind(null,t),t.remoteStore.remoteSyncer.rejectListen=Mc.bind(null,t),t.dc.nu=gc.bind(null,t.eventManager),t.dc.Pc=pc.bind(null,t.eventManager),t}function iu(e){const t=_(e);return t.remoteStore.remoteSyncer.applySuccessfulWrite=Rc.bind(null,t),t.remoteStore.remoteSyncer.rejectFailedWrite=Vc.bind(null,t),t}function ou(e,t,n){const r=_(e);(async function(e,t,n){try{const r=await t.getMetadata();if(await(function(e,t){const n=_(e),r=ws(t.createTime);return n.persistence.runTransaction("hasNewerBundle","readonly",e=>n.qs.getBundleMetadata(e,t.id)).then(e=>!!e&&e.createTime.compareTo(r)>=0)})(e.localStore,r))return await t.close(),n._completeWith((function(e){return{taskState:"Success",documentsLoaded:e.totalDocuments,bytesLoaded:e.totalBytes,totalDocuments:e.totalDocuments,totalBytes:e.totalBytes}})(r)),Promise.resolve(new Set);n._updateProgress(Ec(r));const s=new Ic(r,e.localStore,t.serializer);let i=await t.bc();for(;i;){const e=await s.zu(i);e&&n._updateProgress(e),i=await t.bc()}const o=await s.complete();return await $c(e,o.Ju,void 0),await(function(e,t){const n=_(e);return n.persistence.runTransaction("Save bundle","readwrite",e=>n.qs.saveBundleMetadata(e,t))})(e.localStore,r),n._completeWith(o.progress),Promise.resolve(o.Hu)}catch(e){return b("SyncEngine",`Loading bundle failed with ${e}`),n._failWith(e),Promise.resolve(new Set)}}
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
    */)(r,t,n).then(e=>{r.sharedClientState.notifyBundleLoaded(e)})}class au{constructor(){this.synchronizeTabs=!1}async initialize(e){this.serializer=Ta(e.databaseInfo.databaseId),this.sharedClientState=this.createSharedClientState(e),this.persistence=this.createPersistence(e),await this.persistence.start(),this.localStore=this.createLocalStore(e),this.gcScheduler=this.createGarbageCollectionScheduler(e,this.localStore),this.indexBackfillerScheduler=this.createIndexBackfillerScheduler(e,this.localStore)}createGarbageCollectionScheduler(e,t){return null}createIndexBackfillerScheduler(e,t){return null}createLocalStore(e){return jo(this.persistence,new Bo,e.initialUser,this.serializer)}createPersistence(e){return new Co(Ao.zs,this.serializer)}createSharedClientState(e){return new da}async terminate(){this.gcScheduler&&this.gcScheduler.stop(),await this.sharedClientState.shutdown(),await this.persistence.shutdown()}}class cu extends au{constructor(e){super(),this.cacheSizeBytes=e}createGarbageCollectionScheduler(e,t){T(this.persistence.referenceDelegate instanceof ko);const n=this.persistence.referenceDelegate.garbageCollector;return new ro(n,e.asyncQueue,t)}createPersistence(e){const t=void 0!==this.cacheSizeBytes?ji.withCacheSize(this.cacheSizeBytes):ji.DEFAULT;return new Co(e=>ko.zs(e,t),this.serializer)}}class uu extends au{constructor(e,t,n){super(),this.Vc=e,this.cacheSizeBytes=t,this.forceOwnership=n,this.synchronizeTabs=!1}async initialize(e){await super.initialize(e),await this.Vc.initialize(this,e),await iu(this.Vc.syncEngine),await Qa(this.Vc.remoteStore),await this.persistence.Ii(()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve()))}createLocalStore(e){return jo(this.persistence,new Bo,e.initialUser,this.serializer)}createGarbageCollectionScheduler(e,t){const n=this.persistence.referenceDelegate.garbageCollector;return new ro(n,e.asyncQueue,t)}createIndexBackfillerScheduler(e,t){const n=new Ie(t,this.persistence);return new be(e.asyncQueue,n)}createPersistence(e){const t=Lo(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey),n=void 0!==this.cacheSizeBytes?ji.withCacheSize(this.cacheSizeBytes):ji.DEFAULT;return new Mo(this.synchronizeTabs,t,e.clientId,n,e.asyncQueue,Ia(),Ea(),this.serializer,this.sharedClientState,!!this.forceOwnership)}createSharedClientState(e){return new da}}class lu extends uu{constructor(e,t){super(e,t,!1),this.Vc=e,this.cacheSizeBytes=t,this.synchronizeTabs=!0}async initialize(e){await super.initialize(e);const t=this.Vc.syncEngine;this.sharedClientState instanceof ha&&(this.sharedClientState.syncEngine={jr:Xc.bind(null,t),zr:nu.bind(null,t),Wr:ru.bind(null,t),$i:tu.bind(null,t),Qr:Yc.bind(null,t)},await this.sharedClientState.start()),await this.persistence.Ii(async e=>{await Jc(this.Vc.syncEngine,e),this.gcScheduler&&(e&&!this.gcScheduler.started?this.gcScheduler.start():e||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(e&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():e||this.indexBackfillerScheduler.stop())})}createSharedClientState(e){const t=Ia();if(!ha.D(t))throw new D(x.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const n=Lo(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey);return new ha(t,e.asyncQueue,n,e.clientId,e.initialUser)}}class hu{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=e=>Fc(this.syncEngine,e,1),this.remoteStore.remoteSyncer.handleCredentialChange=Qc.bind(null,this.syncEngine),await rc(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return new dc}createDatastore(e){const t=Ta(e.databaseInfo.databaseId),n=(r=e.databaseInfo,new ba(r));var r;return(function(e,t,n,r){return new Ca(e,t,n,r)})(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return t=this.localStore,n=this.datastore,r=e.asyncQueue,s=e=>Fc(this.syncEngine,e,0),i=ma.D()?new ma:new fa,new ka(t,n,r,s,i);var t,n,r,s,i}createSyncEngine(e,t){return(function(e,t,n,r,s,i,o){const a=new Cc(e,t,n,r,s,i);return o&&(a.vc=!0),a})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}terminate(){return(async function(e){const t=_(e);w("RemoteStore","RemoteStore shutting down."),t.vu.add(5),await Pa(t),t.Pu.shutdown(),t.bu.set("Unknown")})(this.remoteStore)}}
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
   */function du(e,t=10240){let n=0;return{async read(){if(n<e.byteLength){const r={value:e.slice(n,n+t),done:!1};return n+=t,r}return{done:!0}},async cancel(){},releaseLock(){},closed:Promise.resolve()}}
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
   */class fu{constructor(e){this.observer=e,this.muted=!1}next(e){this.observer.next&&this.Sc(this.observer.next,e)}error(e){this.observer.error?this.Sc(this.observer.error,e):v("Uncaught Error in snapshot listener:",e.toString())}Dc(){this.muted=!0}Sc(e,t){this.muted||setTimeout(()=>{this.muted||e(t)},0)}}
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
   */class mu{constructor(e,t){this.Cc=e,this.serializer=t,this.metadata=new C,this.buffer=new Uint8Array,this.xc=new TextDecoder("utf-8"),this.Nc().then(e=>{e&&e.Qu()?this.metadata.resolve(e.Gu.metadata):this.metadata.reject(new Error(`The first element of the bundle is not a metadata, it is\n             ${JSON.stringify(null==e?void 0:e.Gu)}`))},e=>this.metadata.reject(e))}close(){return this.Cc.cancel()}async getMetadata(){return this.metadata.promise}async bc(){return await this.getMetadata(),this.Nc()}async Nc(){const e=await this.kc();if(null===e)return null;const t=this.xc.decode(e),n=Number(t);isNaN(n)&&this.Mc(`length string (${t}) is not valid number`);const r=await this.$c(n);return new vc(JSON.parse(r),e.length+n)}Oc(){return this.buffer.findIndex(e=>e==="{".charCodeAt(0))}async kc(){for(;this.Oc()<0&&!await this.Fc(););if(0===this.buffer.length)return null;const e=this.Oc();e<0&&this.Mc("Reached the end of bundle when a length string is expected.");const t=this.buffer.slice(0,e);return this.buffer=this.buffer.slice(e),t}async $c(e){for(;this.buffer.length<e;)await this.Fc()&&this.Mc("Reached the end of bundle when more is expected.");const t=this.xc.decode(this.buffer.slice(0,e));return this.buffer=this.buffer.slice(e),t}Mc(e){throw this.Cc.cancel(),new Error(`Invalid bundle format: ${e}`)}async Fc(){const e=await this.Cc.read();if(!e.done){const t=new Uint8Array(this.buffer.length+e.value.length);t.set(this.buffer),t.set(e.value,this.buffer.length),this.buffer=t}return e.done}}
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
   */class gu{constructor(e){this.datastore=e,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastWriteError=null,this.writtenDocs=new Set}async lookup(e){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw new D(x.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes.");const t=await(async function(e,t){const n=_(e),r=_s(n.serializer)+"/documents",s={documents:t.map(e=>Is(n.serializer,e))},i=await n.vo("BatchGetDocuments",r,s,t.length),o=new Map;i.forEach(e=>{const t=Ns(n.serializer,e);o.set(t.key.toString(),t)});const a=[];return t.forEach(e=>{const t=o.get(e.toString());T(!!t),a.push(t)}),a})(this.datastore,e);return t.forEach(e=>this.recordVersion(e)),t}set(e,t){this.write(t.toMutation(e,this.precondition(e))),this.writtenDocs.add(e.toString())}update(e,t){try{this.write(t.toMutation(e,this.preconditionForUpdate(e)))}catch(e){this.lastWriteError=e}this.writtenDocs.add(e.toString())}delete(e){this.write(new Rr(e,this.precondition(e))),this.writtenDocs.add(e.toString())}async commit(){if(this.ensureCommitNotCalled(),this.lastWriteError)throw this.lastWriteError;const e=this.readVersions;this.mutations.forEach(t=>{e.delete(t.key.toString())}),e.forEach((e,t)=>{const n=H.fromPath(t);this.mutations.push(new Vr(n,this.precondition(n)))}),await(async function(e,t){const n=_(e),r=_s(n.serializer)+"/documents",s={writes:t.map(e=>ks(n.serializer,e))};await n.Io("Commit",r,s)})(this.datastore,this.mutations),this.committed=!0}recordVersion(e){let t;if(e.isFoundDocument())t=e.version;else{if(!e.isNoDocument())throw E();t=G.min()}const n=this.readVersions.get(e.key.toString());if(n){if(!t.isEqual(n))throw new D(x.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(e.key.toString(),t)}precondition(e){const t=this.readVersions.get(e.toString());return!this.writtenDocs.has(e.toString())&&t?t.isEqual(G.min())?Tr.exists(!1):Tr.updateTime(t):Tr.none()}preconditionForUpdate(e){const t=this.readVersions.get(e.toString());if(!this.writtenDocs.has(e.toString())&&t){if(t.isEqual(G.min()))throw new D(x.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return Tr.updateTime(t)}return Tr.exists(!0)}write(e){this.ensureCommitNotCalled(),this.mutations.push(e)}ensureCommitNotCalled(){}}
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
   */class pu{constructor(e,t,n,r,s){this.asyncQueue=e,this.datastore=t,this.options=n,this.updateFunction=r,this.deferred=s,this.Bc=n.maxAttempts,this.qo=new Sa(this.asyncQueue,"transaction_retry")}run(){this.Bc-=1,this.Lc()}Lc(){this.qo.No(async()=>{const e=new gu(this.datastore),t=this.qc(e);t&&t.then(t=>{this.asyncQueue.enqueueAndForget(()=>e.commit().then(()=>{this.deferred.resolve(t)}).catch(e=>{this.Uc(e)}))}).catch(e=>{this.Uc(e)})})}qc(e){try{const t=this.updateFunction(e);return!Te(t)&&t.catch&&t.then?t:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(e){return this.deferred.reject(e),null}}Uc(e){this.Bc>0&&this.Kc(e)?(this.Bc-=1,this.asyncQueue.enqueueAndForget(()=>(this.Lc(),Promise.resolve()))):this.deferred.reject(e)}Kc(e){if("FirebaseError"===e.name){const t=e.code;return"aborted"===t||"failed-precondition"===t||"already-exists"===t||!Kr(t)}return!1}}
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
   */class yu{constructor(e,t,n,r){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this.databaseInfo=r,this.user=f.UNAUTHENTICATED,this.clientId=q.A(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this.authCredentials.start(n,async e=>{w("FirestoreClient","Received user=",e.uid),await this.authCredentialListener(e),this.user=e}),this.appCheckCredentials.start(n,e=>(w("FirestoreClient","Received new app check token=",e),this.appCheckCredentialListener(e,this.user)))}async getConfiguration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}verifyNotTerminated(){if(this.asyncQueue.isShuttingDown)throw new D(x.FAILED_PRECONDITION,"The client has already been terminated.")}terminate(){this.asyncQueue.enterRestrictedMode();const e=new C;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const n=ac(t,"Failed to shutdown persistence");e.reject(n)}}),e.promise}}async function wu(e,t){e.asyncQueue.verifyOperationInProgress(),w("FirestoreClient","Initializing OfflineComponentProvider");const n=await e.getConfiguration();await t.initialize(n);let r=n.initialUser;e.setCredentialChangeListener(async e=>{r.isEqual(e)||(await zo(t.localStore,e),r=e)}),t.persistence.setDatabaseDeletedListener(()=>e.terminate()),e._offlineComponents=t}async function vu(e,t){e.asyncQueue.verifyOperationInProgress();const n=await Iu(e);w("FirestoreClient","Initializing OnlineComponentProvider");const r=await e.getConfiguration();await t.initialize(n,r),e.setCredentialChangeListener(e=>nc(t.remoteStore,e)),e.setAppCheckTokenChangeListener((e,n)=>nc(t.remoteStore,n)),e._onlineComponents=t}function bu(e){return"FirebaseError"===e.name?e.code===x.FAILED_PRECONDITION||e.code===x.UNIMPLEMENTED:!("undefined"!=typeof DOMException&&e instanceof DOMException)||22===e.code||20===e.code||11===e.code}async function Iu(e){if(!e._offlineComponents)if(e._uninitializedComponentsProvider){w("FirestoreClient","Using user provided OfflineComponentProvider");try{await wu(e,e._uninitializedComponentsProvider._offline)}catch(t){const n=t;if(!bu(n))throw n;b("Error using user provided cache. Falling back to memory cache: "+n),await wu(e,new au)}}else w("FirestoreClient","Using default OfflineComponentProvider"),await wu(e,new au);return e._offlineComponents}async function Eu(e){return e._onlineComponents||(e._uninitializedComponentsProvider?(w("FirestoreClient","Using user provided OnlineComponentProvider"),await vu(e,e._uninitializedComponentsProvider._online)):(w("FirestoreClient","Using default OnlineComponentProvider"),await vu(e,new hu))),e._onlineComponents}function Tu(e){return Iu(e).then(e=>e.persistence)}function Su(e){return Iu(e).then(e=>e.localStore)}function _u(e){return Eu(e).then(e=>e.remoteStore)}function xu(e){return Eu(e).then(e=>e.syncEngine)}function Du(e){return Eu(e).then(e=>e.datastore)}async function Cu(e){const t=await Eu(e),n=t.eventManager;return n.onListen=Nc.bind(null,t.syncEngine),n.onUnlisten=kc.bind(null,t.syncEngine),n}function Nu(e){return e.asyncQueue.enqueue(async()=>{const t=await Tu(e),n=await _u(e);return t.setNetworkEnabled(!0),(function(e){const t=_(e);return t.vu.delete(0),Oa(t)})(n)})}function Au(e){return e.asyncQueue.enqueue(async()=>{const t=await Tu(e),n=await _u(e);return t.setNetworkEnabled(!1),(async function(e){const t=_(e);t.vu.add(0),await Pa(t),t.bu.set("Offline")})(n)})}function ku(e,t){const n=new C;return e.asyncQueue.enqueueAndForget(async()=>(async function(e,t,n){try{const r=await(function(e,t){const n=_(e);return n.persistence.runTransaction("read document","readonly",e=>n.localDocuments.getDocument(e,t))})(e,t);r.isFoundDocument()?n.resolve(r):r.isNoDocument()?n.resolve(null):n.reject(new D(x.UNAVAILABLE,"Failed to get document from cache. (However, this document may exist on the server. Run again without setting 'source' in the GetOptions to attempt to retrieve the document from the server.)"))}catch(e){const r=ac(e,`Failed to get document '${t} from cache`);n.reject(r)}})(await Su(e),t,n)),n.promise}function Ou(e,t,n={}){const r=new C;return e.asyncQueue.enqueueAndForget(async()=>(function(e,t,n,r,s){const i=new fu({next:i=>{t.enqueueAndForget(()=>mc(e,o));const a=i.docs.has(n);!a&&i.fromCache?s.reject(new D(x.UNAVAILABLE,"Failed to get document because the client is offline.")):a&&i.fromCache&&r&&"server"===r.source?s.reject(new D(x.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):s.resolve(i)},error:e=>s.reject(e)}),o=new wc(Nn(n.path),i,{includeMetadataChanges:!0,Ku:!0});return fc(e,o)})(await Cu(e),e.asyncQueue,t,n,r)),r.promise}function Pu(e,t){const n=new C;return e.asyncQueue.enqueueAndForget(async()=>(async function(e,t,n){try{const r=await Xo(e,t,!0),s=new _c(t,r.ir),i=s.sc(r.documents),o=s.applyChanges(i,!1);n.resolve(o.snapshot)}catch(e){const r=ac(e,`Failed to execute query '${t} against cache`);n.reject(r)}})(await Su(e),t,n)),n.promise}function Fu(e,t,n={}){const r=new C;return e.asyncQueue.enqueueAndForget(async()=>(function(e,t,n,r,s){const i=new fu({next:n=>{t.enqueueAndForget(()=>mc(e,o)),n.fromCache&&"server"===r.source?s.reject(new D(x.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):s.resolve(n)},error:e=>s.reject(e)}),o=new wc(n,i,{includeMetadataChanges:!0,Ku:!0});return fc(e,o)})(await Cu(e),e.asyncQueue,t,n,r)),r.promise}function Mu(e,t){const n=new fu(t);return e.asyncQueue.enqueueAndForget(async()=>(function(e,t){_(e).ku.add(t),t.next()})(await Cu(e),n)),()=>{n.Dc(),e.asyncQueue.enqueueAndForget(async()=>(function(e,t){_(e).ku.delete(t)})(await Cu(e),n))}}function Ru(e,t,n,r){const s=(function(e,t){let n;return n="string"==typeof e?Hr().encode(e):e,(function(e,t){return new mu(e,t)})((function(e,t){if(e instanceof Uint8Array)return du(e,t);if(e instanceof ArrayBuffer)return du(new Uint8Array(e),t);if(e instanceof ReadableStream)return e.getReader();throw new Error("Source of `toByteStreamReader` has to be a ArrayBuffer or ReadableStream")})(n),t)})(n,Ta(t));e.asyncQueue.enqueueAndForget(async()=>{ou(await xu(e),s,r)})}function Vu(e,t){return e.asyncQueue.enqueue(async()=>(function(e,t){const n=_(e);return n.persistence.runTransaction("Get named query","readonly",e=>n.qs.getNamedQuery(e,t))})(await Su(e),t))}function Lu(e,t){return e.asyncQueue.enqueue(async()=>(async function(e,t){const n=_(e),r=n.indexManager,s=[];return n.persistence.runTransaction("Configure indexes","readwrite",e=>r.getFieldIndexes(e).next(n=>
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
(function(e,t,n,r,s){e=[...e],t=[...t],e.sort(n),t.sort(n);const i=e.length,o=t.length;let a=0,c=0;for(;a<o&&c<i;){const i=n(e[c],t[a]);i<0?s(e[c++]):i>0?r(t[a++]):(a++,c++)}for(;a<o;)r(t[a++]);for(;c<i;)s(e[c++])})(n,t,Z,t=>{s.push(r.addFieldIndex(e,t))},t=>{s.push(r.deleteFieldIndex(e,t))})).next(()=>le.waitFor(s)))}
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
    */)(await Su(e),t))}
/**
   * @license
   * Copyright 2023 Google LLC
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
   */function qu(e){const t={};return void 0!==e.timeoutSeconds&&(t.timeoutSeconds=e.timeoutSeconds),t
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
   */}const Bu=new Map;
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
   */function Uu(e,t,n){if(!n)throw new D(x.INVALID_ARGUMENT,`Function ${e}() cannot be called with an empty ${t}.`)}function ju(e,t,n,r){if(!0===t&&!0===r)throw new D(x.INVALID_ARGUMENT,`${e} and ${n} cannot be used together.`)}function zu(e){if(!H.isDocumentKey(e))throw new D(x.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${e} has ${e.length}.`)}function Gu(e){if(H.isDocumentKey(e))throw new D(x.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${e} has ${e.length}.`)}function Ku(e){if(void 0===e)return"undefined";if(null===e)return"null";if("string"==typeof e)return e.length>20&&(e=`${e.substring(0,20)}...`),JSON.stringify(e);if("number"==typeof e||"boolean"==typeof e)return""+e;if("object"==typeof e){if(e instanceof Array)return"an array";{const t=(function(e){return e.constructor?e.constructor.name:null})(e);return t?`a custom ${t} object`:"an object"}}return"function"==typeof e?"a function":E()}function $u(e,t){if("_delegate"in e&&(e=e._delegate),!(e instanceof t)){if(t.name===e.constructor.name)throw new D(x.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const n=Ku(e);throw new D(x.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${n}`)}}return e}function Qu(e,t){if(t<=0)throw new D(x.INVALID_ARGUMENT,`Function ${e}() requires a positive number, but it was: ${t}.`)}
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
   */class Wu{constructor(e){var t,n;if(void 0===e.host){if(void 0!==e.ssl)throw new D(x.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host="firestore.googleapis.com",this.ssl=!0}else this.host=e.host,this.ssl=null===(t=e.ssl)||void 0===t||t;if(this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.cache=e.localCache,void 0===e.cacheSizeBytes)this.cacheSizeBytes=41943040;else{if(-1!==e.cacheSizeBytes&&e.cacheSizeBytes<1048576)throw new D(x.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}ju("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:void 0===e.experimentalAutoDetectLongPolling?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=qu(null!==(n=e.experimentalLongPollingOptions)&&void 0!==n?n:{}),(function(e){if(void 0!==e.timeoutSeconds){if(isNaN(e.timeoutSeconds))throw new D(x.INVALID_ARGUMENT,`invalid long polling timeout: ${e.timeoutSeconds} (must not be NaN)`);if(e.timeoutSeconds<5)throw new D(x.INVALID_ARGUMENT,`invalid long polling timeout: ${e.timeoutSeconds} (minimum allowed value is 5)`);if(e.timeoutSeconds>30)throw new D(x.INVALID_ARGUMENT,`invalid long polling timeout: ${e.timeoutSeconds} (maximum allowed value is 30)`)}}
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
      */)(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(t=this.experimentalLongPollingOptions,n=e.experimentalLongPollingOptions,t.timeoutSeconds===n.timeoutSeconds)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams;var t,n}}class Hu{constructor(e,t,n,r){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=r,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Wu({}),this._settingsFrozen=!1}get app(){if(!this._app)throw new D(x.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return void 0!==this._terminateTask}_setSettings(e){if(this._settingsFrozen)throw new D(x.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Wu(e),void 0!==e.credentials&&(this._authCredentials=(function(e){if(!e)return new A;switch(e.type){case"firstParty":return new F(e.sessionIndex||"0",e.iamToken||null,e.authTokenFactory||null);case"provider":return e.client;default:throw new D(x.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask||(this._terminateTask=this._terminate()),this._terminateTask}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(e){const t=Bu.get(e);t&&(w("ComponentProvider","Removing Datastore"),Bu.delete(e),t.terminate())})(this),Promise.resolve()}}function Yu(e,t,n,r={}){var s;const i=(e=$u(e,Hu))._getSettings(),o=`${t}:${n}`;if("firestore.googleapis.com"!==i.host&&i.host!==o&&b("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used."),e._setSettings(Object.assign(Object.assign({},i),{host:o,ssl:!1})),r.mockUserToken){let t,n;if("string"==typeof r.mockUserToken)t=r.mockUserToken,n=f.MOCK_USER;else{t=(0,l.createMockUserToken)(r.mockUserToken,null===(s=e._app)||void 0===s?void 0:s.options.projectId);const i=r.mockUserToken.sub||r.mockUserToken.user_id;if(!i)throw new D(x.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");n=new f(i)}e._authCredentials=new k(new N(t,n))}}
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
   */class Xu{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Zu(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new Xu(this.firestore,e,this._key)}}class Ju{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new Ju(this.firestore,e,this._query)}}class Zu extends Ju{constructor(e,t,n){super(e,t,Nn(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new Xu(this.firestore,null,new H(e))}withConverter(e){return new Zu(this.firestore,e,this._path)}}function el(e,t,...n){if(e=(0,l.getModularInstance)(e),Uu("collection","path",t),e instanceof Hu){const r=$.fromString(t,...n);return Gu(r),new Zu(e,null,r)}{if(!(e instanceof Xu||e instanceof Zu))throw new D(x.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=e._path.child($.fromString(t,...n));return Gu(r),new Zu(e.firestore,null,r)}}function tl(e,t){if(e=$u(e,Hu),Uu("collectionGroup","collection id",t),t.indexOf("/")>=0)throw new D(x.INVALID_ARGUMENT,`Invalid collection ID '${t}' passed to function collectionGroup(). Collection IDs must not contain '/'.`);return new Ju(e,null,(function(e){return new Dn($.emptyPath(),e)})(t))}function nl(e,t,...n){if(e=(0,l.getModularInstance)(e),1===arguments.length&&(t=q.A()),Uu("doc","path",t),e instanceof Hu){const r=$.fromString(t,...n);return zu(r),new Xu(e,null,new H(r))}{if(!(e instanceof Xu||e instanceof Zu))throw new D(x.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=e._path.child($.fromString(t,...n));return zu(r),new Xu(e.firestore,e instanceof Zu?e.converter:null,new H(r))}}function rl(e,t){return e=(0,l.getModularInstance)(e),t=(0,l.getModularInstance)(t),(e instanceof Xu||e instanceof Zu)&&(t instanceof Xu||t instanceof Zu)&&e.firestore===t.firestore&&e.path===t.path&&e.converter===t.converter}function sl(e,t){return e=(0,l.getModularInstance)(e),t=(0,l.getModularInstance)(t),e instanceof Ju&&t instanceof Ju&&e.firestore===t.firestore&&Ln(e._query,t._query)&&e.converter===t.converter
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
   */}class il{constructor(){this.Gc=Promise.resolve(),this.Qc=[],this.jc=!1,this.zc=[],this.Wc=null,this.Hc=!1,this.Jc=!1,this.Yc=[],this.qo=new Sa(this,"async_queue_retry"),this.Xc=()=>{const e=Ea();e&&w("AsyncQueue","Visibility state changed to "+e.visibilityState),this.qo.Mo()};const e=Ea();e&&"function"==typeof e.addEventListener&&e.addEventListener("visibilitychange",this.Xc)}get isShuttingDown(){return this.jc}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.Zc(),this.ta(e)}enterRestrictedMode(e){if(!this.jc){this.jc=!0,this.Jc=e||!1;const t=Ea();t&&"function"==typeof t.removeEventListener&&t.removeEventListener("visibilitychange",this.Xc)}}enqueue(e){if(this.Zc(),this.jc)return new Promise(()=>{});const t=new C;return this.ta(()=>this.jc&&this.Jc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Qc.push(e),this.ea()))}async ea(){if(0!==this.Qc.length){try{await this.Qc[0](),this.Qc.shift(),this.qo.reset()}catch(e){if(!ge(e))throw e;w("AsyncQueue","Operation failed with retryable error: "+e)}this.Qc.length>0&&this.qo.No(()=>this.ea())}}ta(e){const t=this.Gc.then(()=>(this.Hc=!0,e().catch(e=>{this.Wc=e,this.Hc=!1;const t=(function(e){let t=e.message||"";return e.stack&&(t=e.stack.includes(e.message)?e.stack:e.message+"\n"+e.stack),t}
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
        */)(e);throw v("INTERNAL UNHANDLED ERROR: ",t),e}).then(e=>(this.Hc=!1,e))));return this.Gc=t,t}enqueueAfterDelay(e,t,n){this.Zc(),this.Yc.indexOf(e)>-1&&(t=0);const r=oc.createAndSchedule(this,e,t,n,e=>this.na(e));return this.zc.push(r),r}Zc(){this.Wc&&E()}verifyOperationInProgress(){}async sa(){let e;do{e=this.Gc,await e}while(e!==this.Gc)}ia(e){for(const t of this.zc)if(t.timerId===e)return!0;return!1}ra(e){return this.sa().then(()=>{this.zc.sort((e,t)=>e.targetTimeMs-t.targetTimeMs);for(const t of this.zc)if(t.skipDelay(),"all"!==e&&t.timerId===e)break;return this.sa()})}oa(e){this.Yc.push(e)}na(e){const t=this.zc.indexOf(e);this.zc.splice(t,1)}}function ol(e){return(function(e){if("object"!=typeof e||null===e)return!1;const t=e;for(const e of["next","error","complete"])if(e in t&&"function"==typeof t[e])return!0;return!1}
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
    */)(e)}class al{constructor(){this._progressObserver={},this._taskCompletionResolver=new C,this._lastProgress={taskState:"Running",totalBytes:0,totalDocuments:0,bytesLoaded:0,documentsLoaded:0}}onProgress(e,t,n){this._progressObserver={next:e,error:t,complete:n}}catch(e){return this._taskCompletionResolver.promise.catch(e)}then(e,t){return this._taskCompletionResolver.promise.then(e,t)}_completeWith(e){this._updateProgress(e),this._progressObserver.complete&&this._progressObserver.complete(),this._taskCompletionResolver.resolve(e)}_failWith(e){this._lastProgress.taskState="Error",this._progressObserver.next&&this._progressObserver.next(this._lastProgress),this._progressObserver.error&&this._progressObserver.error(e),this._taskCompletionResolver.reject(e)}_updateProgress(e){this._lastProgress=e,this._progressObserver.next&&this._progressObserver.next(e)}}
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
   */const cl=-1;class ul extends Hu{constructor(e,t,n,r){super(e,t,n,r),this.type="firestore",this._queue=new il,this._persistenceKey=(null==r?void 0:r.name)||"[DEFAULT]"}_terminate(){return this._firestoreClient||fl(this),this._firestoreClient.terminate()}}function ll(e,t,n){n||(n="(default)");const r=(0,a._getProvider)(e,"firestore");if(r.isInitialized(n)){const e=r.getImmediate({identifier:n}),s=r.getOptions(n);if((0,l.deepEqual)(s,t))return e;throw new D(x.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(void 0!==t.cacheSizeBytes&&void 0!==t.localCache)throw new D(x.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(void 0!==t.cacheSizeBytes&&-1!==t.cacheSizeBytes&&t.cacheSizeBytes<1048576)throw new D(x.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return r.initialize({options:t,instanceIdentifier:n})}function hl(e,t){const n="object"==typeof e?e:(0,a.getApp)(),r="string"==typeof e?e:t||"(default)",s=(0,a._getProvider)(n,"firestore").getImmediate({identifier:r});if(!s._initialized){const e=(0,l.getDefaultEmulatorHostnameAndPort)("firestore");e&&Yu(s,...e)}return s}function dl(e){return e._firestoreClient||fl(e),e._firestoreClient.verifyNotTerminated(),e._firestoreClient}function fl(e){var t,n,r;const s=e._freezeSettings(),i=(function(e,t,n,r){return new It(e,t,n,r.host,r.ssl,r.experimentalForceLongPolling,r.experimentalAutoDetectLongPolling,qu(r.experimentalLongPollingOptions),r.useFetchStreams)})(e._databaseId,(null===(t=e._app)||void 0===t?void 0:t.options.appId)||"",e._persistenceKey,s);e._firestoreClient=new yu(e._authCredentials,e._appCheckCredentials,e._queue,i),(null===(n=s.cache)||void 0===n?void 0:n._offlineComponentProvider)&&(null===(r=s.cache)||void 0===r?void 0:r._onlineComponentProvider)&&(e._firestoreClient._uninitializedComponentsProvider={_offlineKind:s.cache.kind,_offline:s.cache._offlineComponentProvider,_online:s.cache._onlineComponentProvider})}function ml(e,t){Sl(e=$u(e,ul));const n=dl(e);if(n._uninitializedComponentsProvider)throw new D(x.FAILED_PRECONDITION,"SDK cache is already specified.");b("enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.");const r=e._freezeSettings(),s=new hu;return pl(n,s,new uu(s,r.cacheSizeBytes,null==t?void 0:t.forceOwnership))}function gl(e){Sl(e=$u(e,ul));const t=dl(e);if(t._uninitializedComponentsProvider)throw new D(x.FAILED_PRECONDITION,"SDK cache is already specified.");b("enableMultiTabIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.");const n=e._freezeSettings(),r=new hu;return pl(t,r,new lu(r,n.cacheSizeBytes))}function pl(e,t,n){const r=new C;return e.asyncQueue.enqueue(async()=>{try{await wu(e,n),await vu(e,t),r.resolve()}catch(e){const t=e;if(!bu(t))throw t;b("Error enabling indexeddb cache. Falling back to memory cache: "+t),r.reject(t)}}).then(()=>r.promise)}function yl(e){if(e._initialized&&!e._terminated)throw new D(x.FAILED_PRECONDITION,"Persistence can only be cleared before a Firestore instance is initialized or after it is terminated.");const t=new C;return e._queue.enqueueAndForgetEvenWhileRestricted(async()=>{try{await(async function(e){if(!de.D())return Promise.resolve();const t=e+"main";await de.delete(t)})(Lo(e._databaseId,e._persistenceKey)),t.resolve()}catch(e){t.reject(e)}}),t.promise}function wl(e){return(function(e){const t=new C;return e.asyncQueue.enqueueAndForget(async()=>Lc(await xu(e),t)),t.promise})(dl(e=$u(e,ul)))}function vl(e){return Nu(dl(e=$u(e,ul)))}function bl(e){return Au(dl(e=$u(e,ul)))}function Il(e){return(0,a._removeServiceInstance)(e.app,"firestore",e._databaseId.database),e._delete()}function El(e,t){const n=dl(e=$u(e,ul)),r=new al;return Ru(n,e._databaseId,t,r),r}function Tl(e,t){return Vu(dl(e=$u(e,ul)),t).then(t=>t?new Ju(e,null,t.query):null)}function Sl(e){if(e._initialized||e._terminated)throw new D(x.FAILED_PRECONDITION,"Firestore has already been started and persistence can no longer be enabled. You can only enable persistence before calling any other methods on a Firestore object.")}
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
   */class _l{constructor(e="count",t){this._aggregateType=e,this._internalFieldPath=t,this.type="AggregateField"}}class xl{constructor(e,t,n){this._userDataWriter=t,this._data=n,this.type="AggregateQuerySnapshot",this.query=e}data(){return this._userDataWriter.convertObjectMap(this._data)}}
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
   */class Dl{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Dl(ft.fromBase64String(e))}catch(e){throw new D(x.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+e)}}static fromUint8Array(e){return new Dl(ft.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}}
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
   */class Cl{constructor(...e){for(let t=0;t<e.length;++t)if(0===e[t].length)throw new D(x.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new W(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function Nl(){return new Cl("__name__")}
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
   */class Al{constructor(e){this._methodName=e}}
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
   */class kl{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new D(x.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new D(x.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}toJSON(){return{latitude:this._lat,longitude:this._long}}_compareTo(e){return B(this._lat,e._lat)||B(this._long,e._long)}}
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
   */const Ol=/^__.*__$/;class Pl{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return null!==this.fieldMask?new Or(e,this.data,this.fieldMask,t,this.fieldTransforms):new kr(e,this.data,t,this.fieldTransforms)}}class Fl{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new Or(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function Ml(e){switch(e){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw E()}}class Rl{constructor(e,t,n,r,s,i){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=r,void 0===s&&this.ua(),this.fieldTransforms=s||[],this.fieldMask=i||[]}get path(){return this.settings.path}get ca(){return this.settings.ca}aa(e){return new Rl(Object.assign(Object.assign({},this.settings),e),this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}ha(e){var t;const n=null===(t=this.path)||void 0===t?void 0:t.child(e),r=this.aa({path:n,la:!1});return r.fa(e),r}da(e){var t;const n=null===(t=this.path)||void 0===t?void 0:t.child(e),r=this.aa({path:n,la:!1});return r.ua(),r}wa(e){return this.aa({path:void 0,la:!0})}_a(e){return nh(e,this.settings.methodName,this.settings.ma||!1,this.path,this.settings.ga)}contains(e){return void 0!==this.fieldMask.find(t=>e.isPrefixOf(t))||void 0!==this.fieldTransforms.find(t=>e.isPrefixOf(t.field))}ua(){if(this.path)for(let e=0;e<this.path.length;e++)this.fa(this.path.get(e))}fa(e){if(0===e.length)throw this._a("Document fields must not be empty");if(Ml(this.ca)&&Ol.test(e))throw this._a('Document fields cannot begin and end with "__"')}}class Vl{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||Ta(e)}ya(e,t,n,r=!1){return new Rl({ca:e,methodName:t,ga:n,path:W.emptyPath(),la:!1,ma:r},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function Ll(e){const t=e._freezeSettings(),n=Ta(e._databaseId);return new Vl(e._databaseId,!!t.ignoreUndefinedProperties,n)}function ql(e,t,n,r,s,i={}){const o=e.ya(i.merge||i.mergeFields?2:0,t,n,s);Jl("Data must be an object, but it was:",o,r);const a=Yl(r,o);let c,u;if(i.merge)c=new lt(o.fieldMask),u=o.fieldTransforms;else if(i.mergeFields){const e=[];for(const r of i.mergeFields){const s=Zl(t,r,n);if(!o.contains(s))throw new D(x.INVALID_ARGUMENT,`Field '${s}' is specified in your field mask but missing from your input data.`);rh(e,s)||e.push(s)}c=new lt(e),u=o.fieldTransforms.filter(e=>c.covers(e.field))}else c=null,u=o.fieldTransforms;return new Pl(new Kt(a),c,u)}class Bl extends Al{_toFieldTransform(e){if(2!==e.ca)throw 1===e.ca?e._a(`${this._methodName}() can only appear at the top level of your update data`):e._a(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof Bl}}function Ul(e,t,n){return new Rl({ca:3,ga:t.settings.ga,methodName:e._methodName,la:n},t.databaseId,t.serializer,t.ignoreUndefinedProperties)}class jl extends Al{_toFieldTransform(e){return new br(e.path,new dr)}isEqual(e){return e instanceof jl}}class zl extends Al{constructor(e,t){super(e),this.pa=t}_toFieldTransform(e){const t=Ul(this,e,!0),n=this.pa.map(e=>Hl(e,t)),r=new fr(n);return new br(e.path,r)}isEqual(e){return this===e}}class Gl extends Al{constructor(e,t){super(e),this.pa=t}_toFieldTransform(e){const t=Ul(this,e,!0),n=this.pa.map(e=>Hl(e,t)),r=new gr(n);return new br(e.path,r)}isEqual(e){return this===e}}class Kl extends Al{constructor(e,t){super(e),this.Ia=t}_toFieldTransform(e){const t=new yr(e.serializer,ar(e.serializer,this.Ia));return new br(e.path,t)}isEqual(e){return this===e}}function $l(e,t,n,r){const s=e.ya(1,t,n);Jl("Data must be an object, but it was:",s,r);const i=[],o=Kt.empty();nt(r,(e,r)=>{const a=th(t,e,n);r=(0,l.getModularInstance)(r);const c=s.da(a);if(r instanceof Bl)i.push(a);else{const e=Hl(r,c);null!=e&&(i.push(a),o.set(a,e))}});const a=new lt(i);return new Fl(o,a,s.fieldTransforms)}function Ql(e,t,n,r,s,i){const o=e.ya(1,t,n),a=[Zl(t,r,n)],c=[s];if(i.length%2!=0)throw new D(x.INVALID_ARGUMENT,`Function ${t}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let e=0;e<i.length;e+=2)a.push(Zl(t,i[e])),c.push(i[e+1]);const u=[],h=Kt.empty();for(let e=a.length-1;e>=0;--e)if(!rh(u,a[e])){const t=a[e];let n=c[e];n=(0,l.getModularInstance)(n);const r=o.da(t);if(n instanceof Bl)u.push(t);else{const e=Hl(n,r);null!=e&&(u.push(t),h.set(t,e))}}const d=new lt(u);return new Fl(h,d,o.fieldTransforms)}function Wl(e,t,n,r=!1){return Hl(n,e.ya(r?4:3,t))}function Hl(e,t){if(Xl(e=(0,l.getModularInstance)(e)))return Jl("Unsupported field value:",t,e),Yl(e,t);if(e instanceof Al)return(function(e,t){if(!Ml(t.ca))throw t._a(`${e._methodName}() can only be used with update() and set()`);if(!t.path)throw t._a(`${e._methodName}() is not currently supported inside arrays`);const n=e._toFieldTransform(t);n&&t.fieldTransforms.push(n)})(e,t),null;if(void 0===e&&t.ignoreUndefinedProperties)return null;if(t.path&&t.fieldMask.push(t.path),e instanceof Array){if(t.settings.la&&4!==t.ca)throw t._a("Nested arrays are not supported");return(function(e,t){const n=[];let r=0;for(const s of e){let e=Hl(s,t.wa(r));null==e&&(e={nullValue:"NULL_VALUE"}),n.push(e),r++}return{arrayValue:{values:n}}})(e,t)}return(function(e,t){if(null===(e=(0,l.getModularInstance)(e)))return{nullValue:"NULL_VALUE"};if("number"==typeof e)return ar(t.serializer,e);if("boolean"==typeof e)return{booleanValue:e};if("string"==typeof e)return{stringValue:e};if(e instanceof Date){const n=z.fromDate(e);return{timestampValue:gs(t.serializer,n)}}if(e instanceof z){const n=new z(e.seconds,1e3*Math.floor(e.nanoseconds/1e3));return{timestampValue:gs(t.serializer,n)}}if(e instanceof kl)return{geoPointValue:{latitude:e.latitude,longitude:e.longitude}};if(e instanceof Dl)return{bytesValue:ps(t.serializer,e._byteString)};if(e instanceof Xu){const n=t.databaseId,r=e.firestore._databaseId;if(!r.isEqual(n))throw t._a(`Document reference is for database ${r.projectId}/${r.database} but should be for database ${n.projectId}/${n.database}`);return{referenceValue:vs(e.firestore._databaseId||t.databaseId,e._key.path)}}throw t._a(`Unsupported field value: ${Ku(e)}`)})(e,t)}function Yl(e,t){const n={};return rt(e)?t.path&&t.path.length>0&&t.fieldMask.push(t.path):nt(e,(e,r)=>{const s=Hl(r,t.ha(e));null!=s&&(n[e]=s)}),{mapValue:{fields:n}}}function Xl(e){return!("object"!=typeof e||null===e||e instanceof Array||e instanceof Date||e instanceof z||e instanceof kl||e instanceof Dl||e instanceof Xu||e instanceof Al)}function Jl(e,t,n){if(!Xl(n)||!(function(e){return"object"==typeof e&&null!==e&&(Object.getPrototypeOf(e)===Object.prototype||null===Object.getPrototypeOf(e))})(n)){const r=Ku(n);throw"an object"===r?t._a(e+" a custom object"):t._a(e+" "+r)}}function Zl(e,t,n){if((t=(0,l.getModularInstance)(t))instanceof Cl)return t._internalPath;if("string"==typeof t)return th(e,t);throw nh("Field path arguments must be of type string or ",e,!1,void 0,n)}const eh=new RegExp("[~\\*/\\[\\]]");function th(e,t,n){if(t.search(eh)>=0)throw nh(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,e,!1,void 0,n);try{return new Cl(...t.split("."))._internalPath}catch(r){throw nh(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,e,!1,void 0,n)}}function nh(e,t,n,r,s){const i=r&&!r.isEmpty(),o=void 0!==s;let a=`Function ${t}() called with invalid data`;n&&(a+=" (via `toFirestore()`)"),a+=". ";let c="";return(i||o)&&(c+=" (found",i&&(c+=` in field ${r}`),o&&(c+=` in document ${s}`),c+=")"),new D(x.INVALID_ARGUMENT,a+e+c)}function rh(e,t){return e.some(e=>e.isEqual(t))}
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
   */class sh{constructor(e,t,n,r,s){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=r,this._converter=s}get id(){return this._key.path.lastSegment()}get ref(){return new Xu(this._firestore,this._converter,this._key)}exists(){return null!==this._document}data(){if(this._document){if(this._converter){const e=new ih(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(oh("DocumentSnapshot.get",e));if(null!==t)return this._userDataWriter.convertValue(t)}}}class ih extends sh{data(){return super.data()}}function oh(e,t){return"string"==typeof t?th(e,t):t instanceof Cl?t._internalPath:t._delegate._internalPath}
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
   */function ah(e){if("L"===e.limitType&&0===e.explicitOrderBy.length)throw new D(x.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class ch{}class uh extends ch{}function lh(e,t,...n){let r=[];t instanceof ch&&r.push(t),r=r.concat(n),(function(e){const t=e.filter(e=>e instanceof fh).length,n=e.filter(e=>e instanceof hh).length;if(t>1||t>0&&n>0)throw new D(x.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}
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
    */)(r);for(const t of r)e=t._apply(e);return e}class hh extends uh{constructor(e,t,n){super(),this._field=e,this._op=t,this._value=n,this.type="where"}static _create(e,t,n){return new hh(e,t,n)}_apply(e){const t=this._parse(e);return Ah(e._query,t),new Ju(e.firestore,e.converter,Rn(e._query,t))}_parse(e){const t=Ll(e.firestore),n=(function(e,t,n,r,s,i,o){let a;if(s.isKeyField()){if("array-contains"===i||"array-contains-any"===i)throw new D(x.INVALID_ARGUMENT,`Invalid Query. You can't perform '${i}' queries on documentId().`);if("in"===i||"not-in"===i){Nh(o,i);const t=[];for(const n of o)t.push(Ch(r,e,n));a={arrayValue:{values:t}}}else a=Ch(r,e,o)}else"in"!==i&&"not-in"!==i&&"array-contains-any"!==i||Nh(o,i),a=Wl(n,"where",o,"in"===i||"not-in"===i);return en.create(s,i,a)})(e._query,0,t,e.firestore._databaseId,this._field,this._op,this._value);return n}}function dh(e,t,n){const r=t,s=oh("where",e);return hh._create(s,r,n)}class fh extends ch{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new fh(e,t)}_parse(e){const t=this._queryConstraints.map(t=>t._parse(e)).filter(e=>e.getFilters().length>0);return 1===t.length?t[0]:tn.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return 0===t.getFilters().length?e:((function(e,t){let n=e;const r=t.getFlattenedFilters();for(const e of r)Ah(n,e),n=Rn(n,e)})(e._query,t),new Ju(e.firestore,e.converter,Rn(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return"and"===this.type?"and":"or"}}function mh(...e){return e.forEach(e=>Oh("or",e)),fh._create("or",e)}function gh(...e){return e.forEach(e=>Oh("and",e)),fh._create("and",e)}class ph extends uh{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new ph(e,t)}_apply(e){const t=(function(e,t,n){if(null!==e.startAt)throw new D(x.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(null!==e.endAt)throw new D(x.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");const r=new Xt(t,n);return(function(e,t){if(null===kn(e)){const n=On(e);null!==n&&kh(e,n,t.field)}})(e,r),r})(e._query,this._field,this._direction);return new Ju(e.firestore,e.converter,(function(e,t){const n=e.explicitOrderBy.concat([t]);return new Dn(e.path,e.collectionGroup,n,e.filters.slice(),e.limit,e.limitType,e.startAt,e.endAt)})(e._query,t))}}function yh(e,t="asc"){const n=t,r=oh("orderBy",e);return ph._create(r,n)}class wh extends uh{constructor(e,t,n){super(),this.type=e,this._limit=t,this._limitType=n}static _create(e,t,n){return new wh(e,t,n)}_apply(e){return new Ju(e.firestore,e.converter,Vn(e._query,this._limit,this._limitType))}}function vh(e){return Qu("limit",e),wh._create("limit",e,"F")}function bh(e){return Qu("limitToLast",e),wh._create("limitToLast",e,"L")}class Ih extends uh{constructor(e,t,n){super(),this.type=e,this._docOrFields=t,this._inclusive=n}static _create(e,t,n){return new Ih(e,t,n)}_apply(e){const t=Dh(e,this.type,this._docOrFields,this._inclusive);return new Ju(e.firestore,e.converter,(function(e,t){return new Dn(e.path,e.collectionGroup,e.explicitOrderBy.slice(),e.filters.slice(),e.limit,e.limitType,t,e.endAt)})(e._query,t))}}function Eh(...e){return Ih._create("startAt",e,!0)}function Th(...e){return Ih._create("startAfter",e,!1)}class Sh extends uh{constructor(e,t,n){super(),this.type=e,this._docOrFields=t,this._inclusive=n}static _create(e,t,n){return new Sh(e,t,n)}_apply(e){const t=Dh(e,this.type,this._docOrFields,this._inclusive);return new Ju(e.firestore,e.converter,(function(e,t){return new Dn(e.path,e.collectionGroup,e.explicitOrderBy.slice(),e.filters.slice(),e.limit,e.limitType,e.startAt,t)})(e._query,t))}}function _h(...e){return Sh._create("endBefore",e,!1)}function xh(...e){return Sh._create("endAt",e,!0)}function Dh(e,t,n,r){if(n[0]=(0,l.getModularInstance)(n[0]),n[0]instanceof sh)return(function(e,t,n,r,s){if(!r)throw new D(x.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${n}().`);const i=[];for(const n of Fn(e))if(n.field.isKeyField())i.push(Pt(t,r.key));else{const e=r.data.field(n.field);if(wt(e))throw new D(x.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+n.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(null===e){const e=n.field.canonicalString();throw new D(x.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${e}' (used as the orderBy) does not exist.`)}i.push(e)}return new Wt(i,s)})(e._query,e.firestore._databaseId,t,n[0]._document,r);{const s=Ll(e.firestore);return(function(e,t,n,r,s,i){const o=e.explicitOrderBy;if(s.length>o.length)throw new D(x.INVALID_ARGUMENT,`Too many arguments provided to ${r}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const a=[];for(let i=0;i<s.length;i++){const c=s[i];if(o[i].field.isKeyField()){if("string"!=typeof c)throw new D(x.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${r}(), but got a ${typeof c}`);if(!Pn(e)&&-1!==c.indexOf("/"))throw new D(x.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${r}() must be a plain document ID, but '${c}' contains a slash.`);const n=e.path.child($.fromString(c));if(!H.isDocumentKey(n))throw new D(x.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${r}() must result in a valid document path, but '${n}' is not because it contains an odd number of segments.`);const s=new H(n);a.push(Pt(t,s))}else{const e=Wl(n,r,c);a.push(e)}}return new Wt(a,i)})(e._query,e.firestore._databaseId,s,t,n,r)}}function Ch(e,t,n){if("string"==typeof(n=(0,l.getModularInstance)(n))){if(""===n)throw new D(x.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Pn(t)&&-1!==n.indexOf("/"))throw new D(x.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${n}' contains a '/' character.`);const r=t.path.child($.fromString(n));if(!H.isDocumentKey(r))throw new D(x.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return Pt(e,new H(r))}if(n instanceof Xu)return Pt(e,n._key);throw new D(x.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${Ku(n)}.`)}function Nh(e,t){if(!Array.isArray(e)||0===e.length)throw new D(x.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${t.toString()}' filters.`)}function Ah(e,t){if(t.isInequality()){const n=On(e),r=t.field;if(null!==n&&!n.isEqual(r))throw new D(x.INVALID_ARGUMENT,`Invalid query. All where filters with an inequality (<, <=, !=, not-in, >, or >=) must be on the same field. But you have inequality filters on '${n.toString()}' and '${r.toString()}'`);const s=kn(e);null!==s&&kh(e,r,s)}const n=(function(e,t){for(const n of e)for(const e of n.getFlattenedFilters())if(t.indexOf(e.op)>=0)return e.op;return null})(e.filters,(function(e){switch(e){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(t.op));if(null!==n)throw n===t.op?new D(x.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${t.op.toString()}' filter.`):new D(x.INVALID_ARGUMENT,`Invalid query. You cannot use '${t.op.toString()}' filters with '${n.toString()}' filters.`)}function kh(e,t,n){if(!n.isEqual(t))throw new D(x.INVALID_ARGUMENT,`Invalid query. You have a where filter with an inequality (<, <=, !=, not-in, >, or >=) on field '${t.toString()}' and so you must also use '${t.toString()}' as your first argument to orderBy(), but your first orderBy() is on field '${n.toString()}' instead.`)}function Oh(e,t){if(!(t instanceof hh||t instanceof fh))throw new D(x.INVALID_ARGUMENT,`Function ${e}() requires AppliableConstraints created with a call to 'where(...)', 'or(...)', or 'and(...)'.`)}class Ph{convertValue(e,t="none"){switch(_t(e)){case 0:return null;case 1:return e.booleanValue;case 2:return pt(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(yt(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 10:return this.convertObject(e.mapValue,t);default:throw E()}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const n={};return nt(e,(e,r)=>{n[e]=this.convertValue(r,t)}),n}convertGeoPoint(e){return new kl(pt(e.latitude),pt(e.longitude))}convertArray(e,t){return(e.values||[]).map(e=>this.convertValue(e,t))}convertServerTimestamp(e,t){switch(t){case"previous":const n=vt(e);return null==n?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(bt(e));default:return null}}convertTimestamp(e){const t=gt(e);return new z(t.seconds,t.nanos)}convertDocumentKey(e,t){const n=$.fromString(e);T($s(n));const r=new Et(n.get(1),n.get(3)),s=new H(n.popFirst(5));return r.isEqual(t)||v(`Document ${s} contains a document reference within a different database (${r.projectId}/${r.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),s}}
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
   */function Fh(e,t,n){let r;return r=e?n&&(n.merge||n.mergeFields)?e.toFirestore(t,n):e.toFirestore(t):t,r}class Mh extends Ph{constructor(e){super(),this.firestore=e}convertBytes(e){return new Dl(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new Xu(this.firestore,null,t)}}
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
   */function Rh(e){return new _l("sum",Zl("sum",e))}function Vh(e){return new _l("avg",Zl("average",e))}function Lh(){return new _l("count")}function qh(e,t){var n,r;return e instanceof _l&&t instanceof _l&&e._aggregateType===t._aggregateType&&(null===(n=e._internalFieldPath)||void 0===n?void 0:n.canonicalString())===(null===(r=t._internalFieldPath)||void 0===r?void 0:r.canonicalString())}function Bh(e,t){return sl(e.query,t.query)&&(0,l.deepEqual)(e.data(),t.data())}
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
   */class Uh{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class jh extends sh{constructor(e,t,n,r,s,i){super(e,t,n,r,i),this._firestore=e,this._firestoreImpl=e,this.metadata=s}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new zh(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const n=this._document.data.field(oh("DocumentSnapshot.get",e));if(null!==n)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}}class zh extends jh{data(e={}){return super.data(e)}}class Gh{constructor(e,t,n,r){this._firestore=e,this._userDataWriter=t,this._snapshot=r,this.metadata=new Uh(r.hasPendingWrites,r.fromCache),this.query=n}get docs(){const e=[];return this.forEach(t=>e.push(t)),e}get size(){return this._snapshot.docs.size}get empty(){return 0===this.size}forEach(e,t){this._snapshot.docs.forEach(n=>{e.call(t,new zh(this._firestore,this._userDataWriter,n.key,n,new Uh(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new D(x.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(e,t){if(e._snapshot.oldDocs.isEmpty()){let t=0;return e._snapshot.docChanges.map(n=>{const r=new zh(e._firestore,e._userDataWriter,n.doc.key,n.doc,new Uh(e._snapshot.mutatedKeys.has(n.doc.key),e._snapshot.fromCache),e.query.converter);return n.doc,{type:"added",doc:r,oldIndex:-1,newIndex:t++}})}{let n=e._snapshot.oldDocs;return e._snapshot.docChanges.filter(e=>t||3!==e.type).map(t=>{const r=new zh(e._firestore,e._userDataWriter,t.doc.key,t.doc,new Uh(e._snapshot.mutatedKeys.has(t.doc.key),e._snapshot.fromCache),e.query.converter);let s=-1,i=-1;return 0!==t.type&&(s=n.indexOf(t.doc.key),n=n.delete(t.doc.key)),1!==t.type&&(n=n.add(t.doc),i=n.indexOf(t.doc.key)),{type:Kh(t.type),doc:r,oldIndex:s,newIndex:i}})}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}}function Kh(e){switch(e){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return E()}}function $h(e,t){return e instanceof jh&&t instanceof jh?e._firestore===t._firestore&&e._key.isEqual(t._key)&&(null===e._document?null===t._document:e._document.isEqual(t._document))&&e._converter===t._converter:e instanceof Gh&&t instanceof Gh&&e._firestore===t._firestore&&sl(e.query,t.query)&&e.metadata.isEqual(t.metadata)&&e._snapshot.isEqual(t._snapshot)}
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
   */function Qh(e){e=$u(e,Xu);const t=$u(e.firestore,ul);return Ou(dl(t),e._key).then(n=>ad(t,e,n))}class Wh extends Ph{constructor(e){super(),this.firestore=e}convertBytes(e){return new Dl(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new Xu(this.firestore,null,t)}}function Hh(e){e=$u(e,Xu);const t=$u(e.firestore,ul),n=dl(t),r=new Wh(t);return ku(n,e._key).then(n=>new jh(t,r,e._key,n,new Uh(null!==n&&n.hasLocalMutations,!0),e.converter))}function Yh(e){e=$u(e,Xu);const t=$u(e.firestore,ul);return Ou(dl(t),e._key,{source:"server"}).then(n=>ad(t,e,n))}function Xh(e){e=$u(e,Ju);const t=$u(e.firestore,ul),n=dl(t),r=new Wh(t);return ah(e._query),Fu(n,e._query).then(n=>new Gh(t,r,e,n))}function Jh(e){e=$u(e,Ju);const t=$u(e.firestore,ul),n=dl(t),r=new Wh(t);return Pu(n,e._query).then(n=>new Gh(t,r,e,n))}function Zh(e){e=$u(e,Ju);const t=$u(e.firestore,ul),n=dl(t),r=new Wh(t);return Fu(n,e._query,{source:"server"}).then(n=>new Gh(t,r,e,n))}function ed(e,t,n){e=$u(e,Xu);const r=$u(e.firestore,ul),s=Fh(e.converter,t,n);return od(r,[ql(Ll(r),"setDoc",e._key,s,null!==e.converter,n).toMutation(e._key,Tr.none())])}function td(e,t,n,...r){e=$u(e,Xu);const s=$u(e.firestore,ul),i=Ll(s);let o;return o="string"==typeof(t=(0,l.getModularInstance)(t))||t instanceof Cl?Ql(i,"updateDoc",e._key,t,n,r):$l(i,"updateDoc",e._key,t),od(s,[o.toMutation(e._key,Tr.exists(!0))])}function nd(e){return od($u(e.firestore,ul),[new Rr(e._key,Tr.none())])}function rd(e,t){const n=$u(e.firestore,ul),r=nl(e),s=Fh(e.converter,t);return od(n,[ql(Ll(e.firestore),"addDoc",r._key,s,null!==e.converter,{}).toMutation(r._key,Tr.exists(!1))]).then(()=>r)}function sd(e,...t){var n,r,s;e=(0,l.getModularInstance)(e);let i={includeMetadataChanges:!1},o=0;"object"!=typeof t[o]||ol(t[o])||(i=t[o],o++);const a={includeMetadataChanges:i.includeMetadataChanges};if(ol(t[o])){const e=t[o];t[o]=null===(n=e.next)||void 0===n?void 0:n.bind(e),t[o+1]=null===(r=e.error)||void 0===r?void 0:r.bind(e),t[o+2]=null===(s=e.complete)||void 0===s?void 0:s.bind(e)}let c,u,h;if(e instanceof Xu)u=$u(e.firestore,ul),h=Nn(e._key.path),c={next:n=>{t[o]&&t[o](ad(u,e,n))},error:t[o+1],complete:t[o+2]};else{const n=$u(e,Ju);u=$u(n.firestore,ul),h=n._query;const r=new Wh(u);c={next:e=>{t[o]&&t[o](new Gh(u,r,n,e))},error:t[o+1],complete:t[o+2]},ah(e._query)}return(function(e,t,n,r){const s=new fu(r),i=new wc(t,s,n);return e.asyncQueue.enqueueAndForget(async()=>fc(await Cu(e),i)),()=>{s.Dc(),e.asyncQueue.enqueueAndForget(async()=>mc(await Cu(e),i))}})(dl(u),h,a,c)}function id(e,t){return Mu(dl(e=$u(e,ul)),ol(t)?t:{next:t})}function od(e,t){return(function(e,t){const n=new C;return e.asyncQueue.enqueueAndForget(async()=>Oc(await xu(e),t,n)),n.promise})(dl(e),t)}function ad(e,t,n){const r=n.docs.get(t._key),s=new Wh(e);return new jh(e,s,t._key,r,new Uh(n.hasPendingWrites,n.fromCache),t.converter)}
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
   */function cd(e){return ud(e,{count:Lh()})}function ud(e,t){const n=$u(e.firestore,ul),r=dl(n),s=(function(e,t){const n=[];for(const r in e)Object.prototype.hasOwnProperty.call(e,r)&&n.push(t(e[r],r));return n})(t,(e,t)=>new Ur(t,e._aggregateType,e._internalFieldPath));return(function(e,t,n){const r=new C;return e.asyncQueue.enqueueAndForget(async()=>{try{const s=await Du(e);r.resolve(Na(s,t,n))}catch(e){r.reject(e)}}),r.promise})(r,e._query,s).then(t=>(function(e,t,n){const r=new Wh(e);return new xl(t,r,n)}
/**
    * @license
    * Copyright 2023 Google LLC
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
    */)(n,e,t))}class ld{constructor(e){this.kind="memory",this._onlineComponentProvider=new hu,(null==e?void 0:e.garbageCollector)?this._offlineComponentProvider=e.garbageCollector._offlineComponentProvider:this._offlineComponentProvider=new au}toJSON(){return{kind:this.kind}}}class hd{constructor(e){let t;this.kind="persistent",(null==e?void 0:e.tabManager)?(e.tabManager._initialize(e),t=e.tabManager):(t=bd(void 0),t._initialize(e)),this._onlineComponentProvider=t._onlineComponentProvider,this._offlineComponentProvider=t._offlineComponentProvider}toJSON(){return{kind:this.kind}}}class dd{constructor(){this.kind="memoryEager",this._offlineComponentProvider=new au}toJSON(){return{kind:this.kind}}}class fd{constructor(e){this.kind="memoryLru",this._offlineComponentProvider=new cu(e)}toJSON(){return{kind:this.kind}}}function md(){return new dd}function gd(e){return new fd(null==e?void 0:e.cacheSizeBytes)}function pd(e){return new ld(e)}function yd(e){return new hd(e)}class wd{constructor(e){this.forceOwnership=e,this.kind="persistentSingleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=new hu,this._offlineComponentProvider=new uu(this._onlineComponentProvider,null==e?void 0:e.cacheSizeBytes,this.forceOwnership)}}class vd{constructor(){this.kind="PersistentMultipleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=new hu,this._offlineComponentProvider=new lu(this._onlineComponentProvider,null==e?void 0:e.cacheSizeBytes)}}function bd(e){return new wd(null==e?void 0:e.forceOwnership)}function Id(){return new vd}
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
   */const Ed={maxAttempts:5};
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
   */class Td{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=Ll(e)}set(e,t,n){this._verifyNotCommitted();const r=Sd(e,this._firestore),s=Fh(r.converter,t,n),i=ql(this._dataReader,"WriteBatch.set",r._key,s,null!==r.converter,n);return this._mutations.push(i.toMutation(r._key,Tr.none())),this}update(e,t,n,...r){this._verifyNotCommitted();const s=Sd(e,this._firestore);let i;return i="string"==typeof(t=(0,l.getModularInstance)(t))||t instanceof Cl?Ql(this._dataReader,"WriteBatch.update",s._key,t,n,r):$l(this._dataReader,"WriteBatch.update",s._key,t),this._mutations.push(i.toMutation(s._key,Tr.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=Sd(e,this._firestore);return this._mutations=this._mutations.concat(new Rr(t._key,Tr.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new D(x.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function Sd(e,t){if((e=(0,l.getModularInstance)(e)).firestore!==t)throw new D(x.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return e}
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
   */class _d extends class{constructor(e,t){this._firestore=e,this._transaction=t,this._dataReader=Ll(e)}get(e){const t=Sd(e,this._firestore),n=new Mh(this._firestore);return this._transaction.lookup([t._key]).then(e=>{if(!e||1!==e.length)return E();const r=e[0];if(r.isFoundDocument())return new sh(this._firestore,n,r.key,r,t.converter);if(r.isNoDocument())return new sh(this._firestore,n,t._key,null,t.converter);throw E()})}set(e,t,n){const r=Sd(e,this._firestore),s=Fh(r.converter,t,n),i=ql(this._dataReader,"Transaction.set",r._key,s,null!==r.converter,n);return this._transaction.set(r._key,i),this}update(e,t,n,...r){const s=Sd(e,this._firestore);let i;return i="string"==typeof(t=(0,l.getModularInstance)(t))||t instanceof Cl?Ql(this._dataReader,"Transaction.update",s._key,t,n,r):$l(this._dataReader,"Transaction.update",s._key,t),this._transaction.update(s._key,i),this}delete(e){const t=Sd(e,this._firestore);return this._transaction.delete(t._key),this}}{constructor(e,t){super(e,t),this._firestore=e}get(e){const t=Sd(e,this._firestore),n=new Wh(this._firestore);return super.get(e).then(e=>new jh(this._firestore,n,t._key,e._document,new Uh(!1,!1),t.converter))}}function xd(e,t,n){e=$u(e,ul);const r=Object.assign(Object.assign({},Ed),n);return(function(e){if(e.maxAttempts<1)throw new D(x.INVALID_ARGUMENT,"Max attempts must be at least 1")})(r),(function(e,t,n){const r=new C;return e.asyncQueue.enqueueAndForget(async()=>{const s=await Du(e);new pu(e.asyncQueue,s,n,t,r).run()}),r.promise})(dl(e),n=>t(new _d(e,n)),r)}
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
   */function Dd(){return new Bl("deleteField")}function Cd(){return new jl("serverTimestamp")}function Nd(...e){return new zl("arrayUnion",e)}function Ad(...e){return new Gl("arrayRemove",e)}function kd(e){return new Kl("increment",e)}
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
   */function Od(e){return dl(e=$u(e,ul)),new Td(e,t=>od(e,t))
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
   */}function Pd(e,t){var n;const r=dl(e=$u(e,ul));if(!r._uninitializedComponentsProvider||"memory"===(null===(n=r._uninitializedComponentsProvider)||void 0===n?void 0:n._offlineKind))return b("Cannot enable indexes when persistence is disabled"),Promise.resolve();const s=(function(e){const t="string"==typeof e?(function(e){try{return JSON.parse(e)}catch(e){throw new D(x.INVALID_ARGUMENT,"Failed to parse JSON: "+(null==e?void 0:e.message))}})(e):e,n=[];if(Array.isArray(t.indexes))for(const e of t.indexes){const t=Fd(e,"collectionGroup"),r=[];if(Array.isArray(e.fields))for(const t of e.fields){const e=th("setIndexConfiguration",Fd(t,"fieldPath"));"CONTAINS"===t.arrayConfig?r.push(new ee(e,2)):"ASCENDING"===t.order?r.push(new ee(e,0)):"DESCENDING"===t.order&&r.push(new ee(e,1))}n.push(new Y(Y.UNKNOWN_ID,t,r,ne.empty()))}return n})(t);return Lu(r,s)}function Fd(e,t){if("string"!=typeof e[t])throw new D(x.INVALID_ARGUMENT,"Missing string value for: "+t);return e[t]}!(function(e,t=!0){!(function(e){m=e})(a.SDK_VERSION),(0,a._registerComponent)(new c.Component("firestore",(e,{instanceIdentifier:n,options:r})=>{const s=e.getProvider("app").getImmediate(),i=new ul(new O(e.getProvider("auth-internal")),new R(e.getProvider("app-check-internal")),(function(e,t){if(!Object.prototype.hasOwnProperty.apply(e.options,["projectId"]))throw new D(x.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Et(e.options.projectId,t)})(s,n),s);return r=Object.assign({useFetchStreams:t},r),i._setSettings(r),i},"PUBLIC").setMultipleInstances(!0)),(0,a.registerVersion)(d,"3.13.0",e),(0,a.registerVersion)(d,"3.13.0","esm2017")})()