/**
 * Module ID: 501
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 501);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.createMemoryHistory=function(){let n=0,i=[];const o=[],s=()=>{o.forEach(t=>{const n=t.cb;t.cb=()=>n(!0)})};return{get index(){const t=window.history.state?.id;if(t){const n=i.findIndex(n=>n.id===t);return n>-1?n:0}return 0},get:t=>i[t],backIndex({path:t}){for(let o=n-1;o>=0;o--){if(i[o].path===t)return o}return-1},push({path:o,state:c}){s();const h=(0,t.nanoid)();i=i.slice(0,n+1),i.push({path:o,state:c,id:h}),n=i.length-1,window.history.pushState({id:h},'',o)},replace({path:o,state:c}){s();const h=window.history.state?.id??(0,t.nanoid)();let w=o;const p=w.includes('#')?'':location.hash;!i.length||i.findIndex(t=>t.id===h)<0?(w+=p,i=[{path:w,state:c,id:h}],n=0):(i[n].path===o&&(w+=p),i[n]={path:o,state:c,id:h}),window.history.replaceState({id:h},'',w)},go(t){s();const c=n+t,h=i.length-1;if(t<0&&!i[c]?(t=-n,n=0):t>0&&c>h?(t=h-n,n=h):n=c,0!==t)return new Promise((i,s)=>{const c=t=>{if(clearTimeout(h),t)return void s(new Error('History was changed during navigation.'));const{title:n}=window.document;window.document.title='',window.document.title=n,i()};o.push({ref:c,cb:c});const h=setTimeout(()=>{const t=o.findIndex(t=>t.ref===c);t>-1&&(o[t].cb(),o.splice(t,1)),n=this.index},100),w=()=>{n=this.index;const t=o.pop();window.removeEventListener('popstate',w),t?.cb()};window.addEventListener('popstate',w),window.history.go(t)})},listen(t){const i=()=>{n=this.index,o.length||t()};return window.addEventListener('popstate',i),()=>window.removeEventListener('popstate',i)}}};var t=require("./module_240")