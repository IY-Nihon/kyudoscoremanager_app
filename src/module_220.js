/**
 * Module ID: 220
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 220);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.getActiveModality=function(){return s},_e.getModality=function(){return l},_e.addModalityListener=function(e){return y.add(e),()=>{y.delete(e)}},_e.testOnly_resetActiveModality=function(){v=!1,s=f,l=f};var e,t,n,o=require("./module_221"),u=require("./module_42"),c=(e=u)&&e.__esModule?e:{default:e},s='keyboard',l='keyboard',v=!1,y=new Set,f='keyboard',p='mouse',E='touch',L='contextmenu',w='mousedown',h='mousemove',b='mouseup',M='pointerdown',_='pointermove',T='scroll',k='selectionchange',K='touchcancel',A='touchmove',O='touchstart',P={passive:!0},S={capture:!0,passive:!0};function j(){null==t&&null==n||(null!=t&&(l=t,t=null),null!=n&&(s=n,n=null),q())}function x(e){var t=e.type;if('undefined'!=typeof window&&null!=window.PointerEvent){if(t===M)return void(s!==e.pointerType&&(l=e.pointerType,s=e.pointerType,q()));if(t===_)return void(l!==e.pointerType&&(l=e.pointerType,q()))}else{if(v||(t===w&&s!==p&&(l=p,s=p,q()),t===h&&l!==p&&(l=p,q())),t===O)return v=!0,e.touches&&e.touches.length>1&&(v=!1),void(s!==E&&(l=E,s=E,q()));t!==L&&t!==b&&t!==k&&t!==T&&t!==K&&t!==A||(v=!1)}}function q(){var e={activeModality:s,modality:l};y.forEach(t=>{t(e)})}c.default&&((0,o.addEventListener)(window,'blur',function(){t=l,n=s,s=f,l=f,q(),v=!1},P),(0,o.addEventListener)(window,'focus',function(){j()},P),(0,o.addEventListener)(document,'keydown',function(e){e.metaKey||e.altKey||e.ctrlKey||l!==f&&(l=f,s=f,q())},S),(0,o.addEventListener)(document,'visibilitychange',function(){'hidden'!==document.visibilityState&&j()},S),(0,o.addEventListener)(document,M,x,S),(0,o.addEventListener)(document,_,x,S),(0,o.addEventListener)(document,L,x,S),(0,o.addEventListener)(document,w,x,S),(0,o.addEventListener)(document,h,x,S),(0,o.addEventListener)(document,b,x,S),(0,o.addEventListener)(document,K,x,S),(0,o.addEventListener)(document,A,x,S),(0,o.addEventListener)(document,O,x,S),(0,o.addEventListener)(document,k,x,S),(0,o.addEventListener)(document,T,x,S))