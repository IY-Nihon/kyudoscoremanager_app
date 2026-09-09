/**
 * Module ID: 178
 */
'use strict';

const _e = exports;

('use strict');
Object.defineProperty(_e, '__esModule', { value: !0 });
var e = require('firebase/app'),
  t = require('firebase/database'),
  n = require('firebase/firestore'),
  u = require('firebase/auth'),
  o = require('./setupAppCheck');
const c = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
  p = (0, e.getApps)().length > 0 ? (0, e.getApp)() : (0, e.initializeApp)(c);
console.log('[db] Firebase config API Key:', c.apiKey ? 'FOUND' : 'MISSING');
console.log('[db] Firebase App:', p ? 'INITIALIZED' : 'NULL');
(0, o.setupAppCheck)(p);
// オフラインの控えは、作るときに渡す。
//
// 以前は getFirestore のあとに enableIndexedDbPersistence を呼んでいた。
// あの作りは1つの窓しか控えを持てず、2つ目に開いた窓は
// 「Failed to obtain exclusive access to the persistence layer」で弾かれて
// 記憶だけの控えに落ちる。落ちるだけならまだしも、本番では
// FIRESTORE INTERNAL ASSERTION FAILED (ID: b815) に化けて、その窓の
// 同期がまるごと死んでいた（2026/9/6、団体910280 で10回）。
// 新しい作りは窓どうしで控えを分け合うので、2つ開いても両方が控えを持てる。
const s = (() => {
  try {
    return (0, n.initializeFirestore)(p, {
      localCache: (0, n.persistentLocalCache)({
        tabManager: (0, n.persistentMultipleTabManager)(),
      }),
    });
  } catch (err) {
    // すでに作られている（読み込みが二重になった）ときや、
    // 控えを持てない端末のとき。同期そのものは続ける
    console.warn('[Firestore] 控えつきの初期化に失敗しました:', err);
    return (0, n.getFirestore)(p);
  }
})();
console.log('[db] Firestore Instance:', s ? 'CREATED' : 'NULL');

const b = (0, u.getAuth)(p);
const l = (() => {
  try {
    return c.databaseURL ? (0, t.getDatabase)(p) : null;
  } catch (e) {
    return (console.warn('[Firebase] RTDB initialization failed:', e), null);
  }
})();

// db/auth/rtdb を先に exports に設定してから、永続化を非同期で行う
_e.db = s;
_e.auth = b;
_e.rtdb = l;
console.log('[db] exports.db set:', _e.db ? 'OK' : 'FAILED');

// オフライン保存が効いているか。効いていないと、電波の無い場所で保存した
// 記録は、画面を閉じた時点で送信待ちごと失われる。画面に出すために持つ。
// 'ok' / 'multipleTabs' / 'unsupported' / 'error' のいずれか。
_e.persistence = { state: 'pending', code: null };

// Firestore オフライン永続化の有効化（exports設定後に非同期実行）
_e.dbReady = (async () => {
  // 控えは作るときに渡している。ここでは「この端末が控えを持てるか」だけを
  // 確かめて残す。持てない端末（プライベート閲覧など）では、電波の無い場所で
  // 保存した記録が画面を閉じた時点で消えるので、画面に出して知らせる。
  //
  // 新しい作りは、持てないときに黙って記憶だけの控えへ落ちる。落ちたことを
  // 受け取る手立てが無いので、IndexedDB そのものを開けるかで見分ける。
  if ('undefined' == typeof window) {
    _e.persistence = { state: 'ok', code: null };
    return s;
  }
  try {
    if (!window.indexedDB) throw new Error('indexedDB が無い');
    const 名 = 'kyudo-hikae-tameshi';
    await new Promise((解決, 拒否) => {
      const 求め = window.indexedDB.open(名);
      求め.onsuccess = () => {
        try {
          求め.result.close();
        } catch (e) {
          /* 閉じられなくても、開けた事実は変わらない */
        }
        解決();
      };
      求め.onerror = () => 拒否(求め.error || new Error('開けない'));
      求め.onblocked = () => 拒否(new Error('塞がれている'));
    });
    try {
      window.indexedDB.deleteDatabase(名);
    } catch (e) {
      /* 片付けられなくても実害は無い */
    }
    _e.persistence = { state: 'ok', code: null };
  } catch (err) {
    console.warn('[Firestore] この端末では控えを持てません:', err);
    _e.persistence = { state: 'unsupported', code: (err && err.name) || null };
  }
  return s;
})();
