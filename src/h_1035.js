/**
 * Module ID: 1035
 */
"use strict";

const _g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const _r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a2 = (typeof id !== 'undefined' ? id : 1035);
const m = module;
const _e2 = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";var e,t,n;Object.defineProperty(_e2,'__esModule',{value:!0}),Object.defineProperty(_e2,"BlockReason",{enumerable:!0,get:function(){return a}}),Object.defineProperty(_e2,"ChatSession",{enumerable:!0,get:function(){return ne}}),Object.defineProperty(_e2,"DynamicRetrievalMode",{enumerable:!0,get:function(){return f}}),Object.defineProperty(_e2,"ExecutableCodeLanguage",{enumerable:!0,get:function(){return t}}),Object.defineProperty(_e2,"FinishReason",{enumerable:!0,get:function(){return c}}),Object.defineProperty(_e2,"FunctionCallingMode",{enumerable:!0,get:function(){return u}}),Object.defineProperty(_e2,"GenerativeModel",{enumerable:!0,get:function(){return re}}),Object.defineProperty(_e2,"GoogleGenerativeAI",{enumerable:!0,get:function(){return ae}}),Object.defineProperty(_e2,"GoogleGenerativeAIAbortError",{enumerable:!0,get:function(){return C}}),Object.defineProperty(_e2,"GoogleGenerativeAIError",{enumerable:!0,get:function(){return h}}),Object.defineProperty(_e2,"GoogleGenerativeAIFetchError",{enumerable:!0,get:function(){return E}}),Object.defineProperty(_e2,"GoogleGenerativeAIRequestInputError",{enumerable:!0,get:function(){return p}}),Object.defineProperty(_e2,"GoogleGenerativeAIResponseError",{enumerable:!0,get:function(){return g}}),Object.defineProperty(_e2,"HarmBlockThreshold",{enumerable:!0,get:function(){return i}}),Object.defineProperty(_e2,"HarmCategory",{enumerable:!0,get:function(){return s}}),Object.defineProperty(_e2,"HarmProbability",{enumerable:!0,get:function(){return r}}),Object.defineProperty(_e2,"Outcome",{enumerable:!0,get:function(){return n}}),Object.defineProperty(_e2,"POSSIBLE_ROLES",{enumerable:!0,get:function(){return o}}),Object.defineProperty(_e2,"SchemaType",{enumerable:!0,get:function(){return e}}),Object.defineProperty(_e2,"TaskType",{enumerable:!0,get:function(){return l}}),(function(e){e.STRING="string",e.NUMBER="number",e.INTEGER="integer",e.BOOLEAN="boolean",e.ARRAY="array",e.OBJECT="object"})(e||(e={})),(function(e){e.LANGUAGE_UNSPECIFIED="language_unspecified",e.PYTHON="python"})(t||(t={})),(function(e){e.OUTCOME_UNSPECIFIED="outcome_unspecified",e.OUTCOME_OK="outcome_ok",e.OUTCOME_FAILED="outcome_failed",e.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded"})(n||(n={}));
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
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
const o=["user","model","function","system"];var s,i,r,a,c,l,u,f;!(function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",e.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY"})(s||(s={})),(function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"})(i||(i={})),(function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"})(r||(r={})),(function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER"})(a||(a={})),(function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.LANGUAGE="LANGUAGE",e.BLOCKLIST="BLOCKLIST",e.PROHIBITED_CONTENT="PROHIBITED_CONTENT",e.SPII="SPII",e.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",e.OTHER="OTHER"})(c||(c={})),(function(e){e.TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",e.RETRIEVAL_QUERY="RETRIEVAL_QUERY",e.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",e.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",e.CLASSIFICATION="CLASSIFICATION",e.CLUSTERING="CLUSTERING"})(l||(l={})),(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"})(u||(u={})),(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"})(f||(f={}));
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
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
class h extends Error{constructor(e){super(`[GoogleGenerativeAI Error]: ${e}`)}}class g extends h{constructor(e,t){super(e),this.response=t}}class E extends h{constructor(e,t,n,o){super(e),this.status=t,this.statusText=n,this.errorDetails=o}}class p extends h{}class C extends h{}
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */var O;!(function(e){e.GENERATE_CONTENT="generateContent",e.STREAM_GENERATE_CONTENT="streamGenerateContent",e.COUNT_TOKENS="countTokens",e.EMBED_CONTENT="embedContent",e.BATCH_EMBED_CONTENTS="batchEmbedContents"})(O||(O={}));class y{constructor(e,t,n,o,s){this.model=e,this.task=t,this.apiKey=n,this.stream=o,this.requestOptions=s}toString(){var e,t;const n=(null===(e=this.requestOptions)||void 0===e?void 0:e.apiVersion)||"v1beta";let o=`${(null===(t=this.requestOptions)||void 0===t?void 0:t.baseUrl)||"https://generativelanguage.googleapis.com"}/${n}/${this.model}:${this.task}`;return this.stream&&(o+="?alt=sse"),o}}function _(e){const t=[];return(null==e?void 0:e.apiClient)&&t.push(e.apiClient),t.push("genai-js/0.24.1"),t.join(" ")}async function I(e){var t;const n=new Headers;n.append("Content-Type","application/json"),n.append("x-goog-api-client",_(e.requestOptions)),n.append("x-goog-api-key",e.apiKey);let o=null===(t=e.requestOptions)||void 0===t?void 0:t.customHeaders;if(o){if(!(o instanceof Headers))try{o=new Headers(o)}catch(e){throw new p(`unable to convert customHeaders value ${JSON.stringify(o)} to Headers: ${e.message}`)}for(const[e,t]of o.entries()){if("x-goog-api-key"===e)throw new p(`Cannot set reserved header name ${e}`);if("x-goog-api-client"===e)throw new p(`Header name ${e} can only be set using the apiClient field`);n.append(e,t)}}return n}async function v(e,t,n,o,s,i){const r=new y(e,t,n,o,i);return{url:r.toString(),fetchOptions:Object.assign(Object.assign({},N(i)),{method:"POST",headers:await I(r),body:s})}}async function b(e,t,n,o,s,i={},r=fetch){const{url:a,fetchOptions:c}=await v(e,t,n,o,s,i);return T(a,c,r)}async function T(e,t,n=fetch){let o;try{o=await n(e,t)}catch(t){R(t,e)}return o.ok||await A(o,e),o}function R(e,t){let n=e;throw"AbortError"===n.name?(n=new C(`Request aborted when fetching ${t.toString()}: ${e.message}`),n.stack=e.stack):e instanceof E||e instanceof p||(n=new h(`Error fetching from ${t.toString()}: ${e.message}`),n.stack=e.stack),n}async function A(e,t){let n,o="";try{const t=await e.json();o=t.error.message,t.error.details&&(o+=` ${JSON.stringify(t.error.details)}`,n=t.error.details)}catch(e){}throw new E(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${o}`,e.status,e.statusText,n)}function N(e){const t={};if(void 0!==(null==e?void 0:e.signal)||(null==e?void 0:e.timeout)>=0){const n=new AbortController;(null==e?void 0:e.timeout)>=0&&setTimeout(()=>n.abort(),e.timeout),(null==e?void 0:e.signal)&&e.signal.addEventListener("abort",()=>{n.abort()}),t.signal=n.signal}return t}
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function S(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),L(e.candidates[0]))throw new g(`${D(e)}`,e);return w(e)}if(e.promptFeedback)throw new g(`Text not available. ${D(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),L(e.candidates[0]))throw new g(`${D(e)}`,e);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),M(e)[0]}if(e.promptFeedback)throw new g(`Function call not available. ${D(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),L(e.candidates[0]))throw new g(`${D(e)}`,e);return M(e)}if(e.promptFeedback)throw new g(`Function call not available. ${D(e)}`,e)},e}function w(e){var t,n,o,s;const i=[];if(null===(n=null===(t=e.candidates)||void 0===t?void 0:t[0].content)||void 0===n?void 0:n.parts)for(const t of null===(s=null===(o=e.candidates)||void 0===o?void 0:o[0].content)||void 0===s?void 0:s.parts)t.text&&i.push(t.text),t.executableCode&&i.push("\n```"+t.executableCode.language+"\n"+t.executableCode.code+"\n```\n"),t.codeExecutionResult&&i.push("\n```\n"+t.codeExecutionResult.output+"\n```\n");return i.length>0?i.join(""):""}function M(e){var t,n,o,s;const i=[];if(null===(n=null===(t=e.candidates)||void 0===t?void 0:t[0].content)||void 0===n?void 0:n.parts)for(const t of null===(s=null===(o=e.candidates)||void 0===o?void 0:o[0].content)||void 0===s?void 0:s.parts)t.functionCall&&i.push(t.functionCall);return i.length>0?i:void 0}const P=[c.RECITATION,c.SAFETY,c.LANGUAGE];function L(e){return!!e.finishReason&&P.includes(e.finishReason)}function D(e){var t,n,o;let s="";if(e.candidates&&0!==e.candidates.length||!e.promptFeedback){if(null===(o=e.candidates)||void 0===o?void 0:o[0]){const t=e.candidates[0];L(t)&&(s+=`Candidate was blocked due to ${t.finishReason}`,t.finishMessage&&(s+=`: ${t.finishMessage}`))}}else s+="Response was blocked",(null===(t=e.promptFeedback)||void 0===t?void 0:t.blockReason)&&(s+=` due to ${e.promptFeedback.blockReason}`),(null===(n=e.promptFeedback)||void 0===n?void 0:n.blockReasonMessage)&&(s+=`: ${e.promptFeedback.blockReasonMessage}`);return s}function j(e){return this instanceof j?(this.v=e,this):new j(e)}function G(e,t,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var o,s=n.apply(e,t||[]),i=[];return o={},r("next"),r("throw"),r("return"),o[Symbol.asyncIterator]=function(){return this},o;function r(e){s[e]&&(o[e]=function(t){return new Promise(function(n,o){i.push([e,t,n,o])>1||a(e,t)})})}function a(e,t){try{(n=s[e](t)).value instanceof j?Promise.resolve(n.value.v).then(c,l):u(i[0][2],n)}catch(e){u(i[0][3],e)}var n}function c(e){a("next",e)}function l(e){a("throw",e)}function u(e,t){e(t),i.shift(),i.length&&a(i[0][0],i[0][1])}}"function"==typeof SuppressedError&&SuppressedError;
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
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
const x=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function H(e){const t=$(e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0}))),[n,o]=t.tee();return{stream:U(n),response:F(o)}}async function F(e){const t=[],n=e.getReader();for(;;){const{done:e,value:o}=await n.read();if(e)return S(B(t));t.push(o)}}function U(e){return G(this,arguments,function*(){const t=e.getReader();for(;;){const{value:e,done:n}=yield j(t.read());if(n)break;yield yield j(S(e))}})}function $(e){const t=e.getReader();return new ReadableStream({start(e){let n="";return(function o(){return t.read().then(({value:t,done:s})=>{if(s)return n.trim()?void e.error(new h("Failed to parse stream")):void e.close();n+=t;let i,r=n.match(x);for(;r;){try{i=JSON.parse(r[1])}catch(t){return void e.error(new h(`Error parsing JSON response: "${r[1]}"`))}e.enqueue(i),n=n.substring(r[0].length),r=n.match(x)}return o()}).catch(e=>{let t=e;throw t.stack=e.stack,t="AbortError"===t.name?new C("Request aborted when reading from the stream"):new h("Error reading from the stream"),t})})()}})}function B(e){const t=e[e.length-1],n={promptFeedback:null==t?void 0:t.promptFeedback};for(const t of e){if(t.candidates){let e=0;for(const o of t.candidates)if(n.candidates||(n.candidates=[]),n.candidates[e]||(n.candidates[e]={index:e}),n.candidates[e].citationMetadata=o.citationMetadata,n.candidates[e].groundingMetadata=o.groundingMetadata,n.candidates[e].finishReason=o.finishReason,n.candidates[e].finishMessage=o.finishMessage,n.candidates[e].safetyRatings=o.safetyRatings,o.content&&o.content.parts){n.candidates[e].content||(n.candidates[e].content={role:o.content.role||"user",parts:[]});const t={};for(const s of o.content.parts)s.text&&(t.text=s.text),s.functionCall&&(t.functionCall=s.functionCall),s.executableCode&&(t.executableCode=s.executableCode),s.codeExecutionResult&&(t.codeExecutionResult=s.codeExecutionResult),0===Object.keys(t).length&&(t.text=""),n.candidates[e].content.parts.push(t)}e++}t.usageMetadata&&(n.usageMetadata=t.usageMetadata)}return n}
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function k(e,t,n,o){return H(await b(t,O.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(n),o))}async function Y(e,t,n,o){const s=await b(t,O.GENERATE_CONTENT,e,!1,JSON.stringify(n),o);return{response:S(await s.json())}}
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */function K(e){if(null!=e)return"string"==typeof e?{role:"system",parts:[{text:e}]}:e.text?{role:"system",parts:[e]}:e.parts?e.role?e:{role:"system",parts:e.parts}:void 0}function q(e){let t=[];if("string"==typeof e)t=[{text:e}];else for(const n of e)"string"==typeof n?t.push({text:n}):t.push(n);return J(t)}function J(e){const t={role:"user",parts:[]},n={role:"function",parts:[]};let o=!1,s=!1;for(const i of e)"functionResponse"in i?(n.parts.push(i),s=!0):(t.parts.push(i),o=!0);if(o&&s)throw new h("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!o&&!s)throw new h("No content is provided for sending chat message.");return o?t:n}function V(e,t){var n;let o={model:null==t?void 0:t.model,generationConfig:null==t?void 0:t.generationConfig,safetySettings:null==t?void 0:t.safetySettings,tools:null==t?void 0:t.tools,toolConfig:null==t?void 0:t.toolConfig,systemInstruction:null==t?void 0:t.systemInstruction,cachedContent:null===(n=null==t?void 0:t.cachedContent)||void 0===n?void 0:n.name,contents:[]};const s=null!=e.generateContentRequest;if(e.contents){if(s)throw new p("CountTokensRequest must have one of contents or generateContentRequest, not both.");o.contents=e.contents}else if(s)o=Object.assign(Object.assign({},o),e.generateContentRequest);else{const t=q(e);o.contents=[t]}return{generateContentRequest:o}}function W(e){let t;if(e.contents)t=e;else{t={contents:[q(e)]}}return e.systemInstruction&&(t.systemInstruction=K(e.systemInstruction)),t}function X(e){if("string"==typeof e||Array.isArray(e)){return{content:q(e)}}return e}
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const Q=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],z={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function Z(e){let t=!1;for(const n of e){const{role:e,parts:s}=n;if(!t&&"user"!==e)throw new h(`First content should be with role 'user', got ${e}`);if(!o.includes(e))throw new h(`Each item should include role field. Got ${e} but valid roles are: ${JSON.stringify(o)}`);if(!Array.isArray(s))throw new h("Content should have 'parts' property with an array of Parts");if(0===s.length)throw new h("Each Content should have at least one part");const i={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(const e of s)for(const t of Q)t in e&&(i[t]+=1);const r=z[e];for(const t of Q)if(!r.includes(t)&&i[t]>0)throw new h(`Content with role '${e}' can't contain '${t}' part`);t=!0}}function ee(e){var t;if(void 0===e.candidates||0===e.candidates.length)return!1;const n=null===(t=e.candidates[0])||void 0===t?void 0:t.content;if(void 0===n)return!1;if(void 0===n.parts||0===n.parts.length)return!1;for(const e of n.parts){if(void 0===e||0===Object.keys(e).length)return!1;if(void 0!==e.text&&""===e.text)return!1}return!0}
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */const te="SILENT_ERROR";class ne{constructor(e,t,n,o={}){this.model=t,this.params=n,this._requestOptions=o,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=e,(null==n?void 0:n.history)&&(Z(n.history),this._history=n.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(e,t={}){var n,o,s,i,r,a;await this._sendPromise;const c=q(e),l={safetySettings:null===(n=this.params)||void 0===n?void 0:n.safetySettings,generationConfig:null===(o=this.params)||void 0===o?void 0:o.generationConfig,tools:null===(s=this.params)||void 0===s?void 0:s.tools,toolConfig:null===(i=this.params)||void 0===i?void 0:i.toolConfig,systemInstruction:null===(r=this.params)||void 0===r?void 0:r.systemInstruction,cachedContent:null===(a=this.params)||void 0===a?void 0:a.cachedContent,contents:[...this._history,c]},u=Object.assign(Object.assign({},this._requestOptions),t);let f;return this._sendPromise=this._sendPromise.then(()=>Y(this._apiKey,this.model,l,u)).then(e=>{var t;if(ee(e.response)){this._history.push(c);const n=Object.assign({parts:[],role:"model"},null===(t=e.response.candidates)||void 0===t?void 0:t[0].content);this._history.push(n)}else{const t=D(e.response);t&&console.warn(`sendMessage() was unsuccessful. ${t}. Inspect response object for details.`)}f=e}).catch(e=>{throw this._sendPromise=Promise.resolve(),e}),await this._sendPromise,f}async sendMessageStream(e,t={}){var n,o,s,i,r,a;await this._sendPromise;const c=q(e),l={safetySettings:null===(n=this.params)||void 0===n?void 0:n.safetySettings,generationConfig:null===(o=this.params)||void 0===o?void 0:o.generationConfig,tools:null===(s=this.params)||void 0===s?void 0:s.tools,toolConfig:null===(i=this.params)||void 0===i?void 0:i.toolConfig,systemInstruction:null===(r=this.params)||void 0===r?void 0:r.systemInstruction,cachedContent:null===(a=this.params)||void 0===a?void 0:a.cachedContent,contents:[...this._history,c]},u=Object.assign(Object.assign({},this._requestOptions),t),f=k(this._apiKey,this.model,l,u);return this._sendPromise=this._sendPromise.then(()=>f).catch(e=>{throw new Error(te)}).then(e=>e.response).then(e=>{if(ee(e)){this._history.push(c);const t=Object.assign({},e.candidates[0].content);t.role||(t.role="model"),this._history.push(t)}else{const t=D(e);t&&console.warn(`sendMessageStream() was unsuccessful. ${t}. Inspect response object for details.`)}}).catch(e=>{e.message!==te&&console.error(e)}),f}}
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function oe(e,t,n,o){return(await b(t,O.COUNT_TOKENS,e,!1,JSON.stringify(n),o)).json()}
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */async function se(e,t,n,o){return(await b(t,O.EMBED_CONTENT,e,!1,JSON.stringify(n),o)).json()}async function ie(e,t,n,o){const s=n.requests.map(e=>Object.assign(Object.assign({},e),{model:t}));return(await b(t,O.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:s}),o)).json()}
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class re{constructor(e,t,n={}){this.apiKey=e,this._requestOptions=n,t.model.includes("/")?this.model=t.model:this.model=`models/${t.model}`,this.generationConfig=t.generationConfig||{},this.safetySettings=t.safetySettings||[],this.tools=t.tools,this.toolConfig=t.toolConfig,this.systemInstruction=K(t.systemInstruction),this.cachedContent=t.cachedContent}async generateContent(e,t={}){var n;const o=W(e),s=Object.assign(Object.assign({},this._requestOptions),t);return Y(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(n=this.cachedContent)||void 0===n?void 0:n.name},o),s)}async generateContentStream(e,t={}){var n;const o=W(e),s=Object.assign(Object.assign({},this._requestOptions),t);return k(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(n=this.cachedContent)||void 0===n?void 0:n.name},o),s)}startChat(e){var t;return new ne(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(t=this.cachedContent)||void 0===t?void 0:t.name},e),this._requestOptions)}async countTokens(e,t={}){const n=V(e,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),o=Object.assign(Object.assign({},this._requestOptions),t);return oe(this.apiKey,this.model,n,o)}async embedContent(e,t={}){const n=X(e),o=Object.assign(Object.assign({},this._requestOptions),t);return se(this.apiKey,this.model,n,o)}async batchEmbedContents(e,t={}){const n=Object.assign(Object.assign({},this._requestOptions),t);return ie(this.apiKey,this.model,e,n)}}
/**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */class ae{constructor(e){this.apiKey=e}getGenerativeModel(e,t){if(!e.model)throw new h("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new re(this.apiKey,e,t)}getGenerativeModelFromCachedContent(e,t,n){if(!e.name)throw new p("Cached content must contain a `name` field.");if(!e.model)throw new p("Cached content must contain a `model` field.");const o=["model","systemInstruction"];for(const n of o)if((null==t?void 0:t[n])&&e[n]&&(null==t?void 0:t[n])!==e[n]){if("model"===n){if((t.model.startsWith("models/")?t.model.replace("models/",""):t.model)===(e.model.startsWith("models/")?e.model.replace("models/",""):e.model))continue}throw new p(`Different value for "${n}" specified in modelParams (${t[n]}) and cachedContent (${e[n]})`)}const s=Object.assign(Object.assign({},t),{model:e.model,tools:e.tools,toolConfig:e.toolConfig,systemInstruction:e.systemInstruction,cachedContent:e});return new re(this.apiKey,s,n)}}