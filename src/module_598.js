/**
 * Module ID: 598
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 598);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}});var t=require("./module_599");const n={[t.NotificationFeedbackType.Success]:[40,100,40],[t.NotificationFeedbackType.Warning]:[50,100,50],[t.NotificationFeedbackType.Error]:[60,100,60,100,60],[t.ImpactFeedbackStyle.Light]:[40],[t.ImpactFeedbackStyle.Medium]:[50],[t.ImpactFeedbackStyle.Heavy]:[60],[t.ImpactFeedbackStyle.Soft]:[35],[t.ImpactFeedbackStyle.Rigid]:[45],selection:[50]};function i(){return'undefined'!=typeof window&&'navigator'in window&&'vibrate'in navigator}function c(){try{const t=document.createElement('label');t.ariaHidden='true',t.style.display='none';const n=document.createElement('input');n.type='checkbox',n.setAttribute('switch',''),t.appendChild(n),document.head.appendChild(t),t.click(),document.head.removeChild(t)}catch{}}const o='undefined'!=typeof window&&window.matchMedia('(pointer: coarse)').matches;function s(t){i()?navigator.vibrate(t):o&&c()}var u={async notificationAsync(s){if(i())return void navigator.vibrate(n[s]);if(!o)return;const u=s===t.NotificationFeedbackType.Error?3:2;for(let t=0;t<u;t++)t>0&&await new Promise(t=>setTimeout(t,120)),c()},async impactAsync(t){s(n[t])},async selectionAsync(){s(n.selection)}}