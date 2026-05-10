/**
 * Module ID: 178
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 178);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"db",{enumerable:!0,get:function(){return s}}),Object.defineProperty(_e,"auth",{enumerable:!0,get:function(){return b}}),Object.defineProperty(_e,"rtdb",{enumerable:!0,get:function(){return l}}),Object.defineProperty(_e,"ADMIN_EMAIL",{enumerable:!0,get:function(){return f}}),Object.defineProperty(_e,"ADMIN_PASSWORD",{enumerable:!0,get:function(){return y}});var e=require("./module_179"),t=require("./module_186"),n=require("./module_188"),u=require("./module_191"),o=require("./setupAppCheck_195");const c={apiKey:"AIzaSyA5gYjOrXuIHmabyuWaKXaDWO91haI4Nlw",authDomain:"kyudoscoremanager.firebaseapp.com",databaseURL:"https://kyudoscoremanager-default-rtdb.firebaseio.com",projectId:"kyudoscoremanager",storageBucket:"kyudoscoremanager.firebasestorage.app",messagingSenderId:"850678478571",appId:"1:850678478571:web:e3603c9b00acec7c2830ae"},p=(0,e.getApps)().length>0?(0,e.getApp)():(0,e.initializeApp)(c);(0,o.setupAppCheck)(p);const s=(0,n.getFirestore)(p),b=(0,u.getAuth)(p),l=(()=>{try{return c.databaseURL?(0,t.getDatabase)(p):null}catch(e){return console.warn('[Firebase] RTDB initialization failed:',e),null}})(),f="admin@nitidai.app",y="123400"