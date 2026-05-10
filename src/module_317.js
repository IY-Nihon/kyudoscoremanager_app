/**
 * Module ID: 317
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 317);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function t(t,n,f,o){void 0===o&&(o=1);for(var s=n.getItemCount(n.data),l=[],u=0;u<t.length;u++)for(var v=t[u],c=0,h=s-1;c<=h;){var M=c+(h-c>>>1),b=f(M,n),x=b.offset*o,y=(b.offset+b.length)*o;if(0===M&&v<x||0!==M&&v<=x)h=M-1;else{if(!(v>y)){l[u]=M;break}c=M+1}}return l}function n(t,n){return n.last-n.first+1-Math.max(0,1+Math.min(n.last,t.last)-Math.max(n.first,t.first))}Object.defineProperty(e,'__esModule',{value:!0}),e.elementsThatOverlapOffsets=t,e.newRangeCount=n,e.computeWindowedRenderLimits=function(f,o,s,l,u,v){var c=f.getItemCount(f.data);if(0===c)return{first:0,last:-1};var h=v.offset,M=v.velocity,b=v.visibleLength,x=v.zoomScale,y=void 0===x?1:x,w=Math.max(0,h),k=w+b,p=(s-1)*b,C=M>1?'after':M<-1?'before':'none',O=Math.max(0,w-.5*p),_=Math.max(0,k+.5*p);if(u(c-1,f).offset*y<O)return{first:Math.max(0,c-1-o),last:c-1};var j=t([O,w,k,_],f,u,y),L=j[0],S=j[1],E=j[2],I=j[3];L=null==L?0:L,S=null==S?Math.max(0,L):S,I=null==I?c-1:I,E=null==E?Math.min(I,S+o-1):E;var R={first:S,last:E},z=n(l,R);for(;!(S<=L&&E>=I);){var B=z>=o,F=S<=l.first||S>l.last,J=S>L&&(!B||!F),N=E>=l.last||E<l.first,P=E<I&&(!B||!N);if(B&&!J&&!P)break;!J||'after'===C&&P&&N||(F&&z++,S--),!P||'before'===C&&J&&F||(N&&z++,E++)}if(!(E>=S&&S>=0&&E<c&&S>=L&&E<=I&&S<=R.first&&E>=R.last))throw new Error('Bad window calculation '+JSON.stringify({first:S,last:E,itemCount:c,overscanFirst:L,overscanLast:I,visible:R}));return{first:S,last:E}},e.keyExtractor=function(t,n){if('object'==typeof t&&null!=(null==t?void 0:t.key))return t.key;if('object'==typeof t&&null!=(null==t?void 0:t.id))return t.id;return String(n)}