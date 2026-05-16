/**
 * Module ID: 198
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 198);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return t}});var t=class{static alert(title,message,buttons){if(typeof window!=='undefined'&&window.document){const msg=message?`${title}\n\n${message}`:title;if(buttons&&buttons.length>0){const hasCancel=buttons.find(b=>b.style==='cancel'||b.text==='キャンセル');const hasConfirm=buttons.find(b=>b.style!=='cancel'&&b.text!=='キャンセル');if(hasCancel&&hasConfirm){if(window.confirm(msg)){hasConfirm.onPress&&hasConfirm.onPress()}else{hasCancel.onPress&&hasCancel.onPress()}}else{window.alert(msg);buttons[0]&&buttons[0].onPress&&buttons[0].onPress()}}else{window.alert(msg)}}}}