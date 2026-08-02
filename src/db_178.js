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

"use strict";Object.defineProperty(_e,'__esModule',{value:!0});var e=require("./module_179"),t=require("./module_186"),n=require("./module_188"),u=require("./module_191"),o=require("./setupAppCheck_195"),st=require("firebase/storage");const c={apiKey:process.env.EXPO_PUBLIC_FIREBASE_API_KEY,authDomain:process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,databaseURL:process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,projectId:process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,storageBucket:process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,messagingSenderId:process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,appId:process.env.EXPO_PUBLIC_FIREBASE_APP_ID},p=(0,e.getApps)().length>0?(0,e.getApp)():(0,e.initializeApp)(c);console.log('[db_178] Firebase config API Key:', c.apiKey ? 'FOUND' : 'MISSING');console.log('[db_178] Firebase App:', p ? 'INITIALIZED' : 'NULL');(0,o.setupAppCheck)(p);const s = (0, n.getFirestore)(p);console.log('[db_178] Firestore Instance:', s ? 'CREATED' : 'NULL');
const storageInstance = (()=>{try{return (0, st.getStorage)(p)}catch(e){console.warn('[Firebase] Storage initialization failed:', e); return null}})();

const b = (0, u.getAuth)(p);
const l=(()=>{try{return c.databaseURL?(0,t.getDatabase)(p):null}catch(e){return console.warn('[Firebase] RTDB initialization failed:',e),null}})();

// db/auth/rtdb を先に exports に設定してから、永続化を非同期で行う
_e.db = s;
_e.auth = b;
_e.rtdb = l;
_e.storage = storageInstance;
console.log('[db_178] exports.db set:', _e.db ? 'OK' : 'FAILED');

// Firestore オフライン永続化の有効化（exports設定後に非同期実行）
_e.dbReady = (async () => {
  if (typeof window !== 'undefined') {
    try {
      await (0, n.enableIndexedDbPersistence)(s);
    } catch (err) {
      if (err.code == 'failed-precondition') {
        console.warn('[Firestore] Persistence failed: Multiple tabs open');
      } else if (err.code == 'unimplemented') {
        console.warn('[Firestore] Persistence unimplemented in this browser');
      }
    }
  }
  return s;
})();