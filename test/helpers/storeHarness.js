/**
 * ストアを手元だけで動かすための土台。
 *
 * JP_useScoreStore_174.js は Firebase と React Native の部品を読み込むため、
 * そのままでは node で動かない。ここで偽物に差し替えてから読み込む。
 *
 * 偽の Firestore は「何を書こうとしたか」を覚えるだけで、実際の通信はしない。
 * 通信できない状態も作れる（送信の約束が返らないまま止まる＝実物と同じ振る舞い）。
 * これで、これまで検証環境のブラウザで手作業に近い形で確かめていたことを、
 * 通信なしで一瞬で回せるようになる。
 */
'use strict';

const path = require('path');
const Module = require('module');

const SRC = path.resolve(__dirname, '../../src');

/** いつまでも決着しない約束。通信できないときの setDoc / commit と同じ */
const 決着しない = () => new Promise(() => {});

/**
 * 偽の Firestore。
 * 保管庫は { 'groups/100001/sessions': Map<id, データ> } の形で持つ。
 */
function 偽Firestore() {
  const 保管庫 = new Map();
  const 記録 = []; // 何をしたかの履歴
  const 見張り = []; // onSnapshot の登録
  // 遅延: 送信が決着するまでの時間(ms)。0 ならすぐ決着する。
  // 「送信中にもう一度編集する」場面を作るために要る。
  const 状態 = { オフライン: false, 失敗させる: false, 遅延: 0 };

  const 取り出す = (道) => {
    if (!保管庫.has(道)) 保管庫.set(道, new Map());
    return 保管庫.get(道);
  };

  const 送る = (やること) => {
    記録.push(やること);
    if (状態.オフライン) {
      // 手元には先に反映する（Firestore のオフライン永続化と同じ）
      適用(やること);
      通知();
      return 決着しない();
    }
    if (状態.失敗させる) return Promise.reject(new Error('偽の失敗'));
    if (状態.遅延 > 0) {
      // 送信中の状態を作る。決着したときに初めてクラウドへ反映する
      return new Promise((r) =>
        setTimeout(() => {
          (適用(やること), 通知(), r());
        }, 状態.遅延)
      );
    }
    適用(やること);
    通知();
    return Promise.resolve();
  };

  /**
   * serverTimestamp() の目印を、届いた時点の実際の時刻に置き換える。
   * 本物の Firestore はサーバー側でこれを行う。置き換えないと日時が読めず、
   * 突き合わせの比較が常に成立しなくなる（検査が意味を持たなくなる）。
   */
  const 解決 = (値) => {
    if (Array.isArray(値)) return 値.map(解決);
    if (値 && typeof 値 === 'object') {
      if (値.__サーバー日時) return Date.now();
      const out = {};
      for (const k in 値) out[k] = 解決(値[k]);
      return out;
    }
    return 値;
  };

  const 適用 = (やること) => {
    for (const o of やること.操作) {
      const 表 = 取り出す(o.道);
      if (o.種類 === 'delete') 表.delete(o.id);
      else if (o.種類 === 'set') 表.set(o.id, 解決(Object.assign({}, o.値)));
      else if (o.種類 === 'update')
        表.set(o.id, 解決(Object.assign({}, 表.get(o.id) || {}, o.値)));
    }
  };

  const 通知 = () => {
    for (const v of 見張り) v.発火();
  };

  const api = {
    collection: (db, 道) => ({ 道 }),
    doc: (db, 道, id) => (id === undefined ? { 道: 道, id: null } : { 道, id }),
    query: (集まり) => ({ 道: 集まり.道 }),
    where: () => ({}),
    orderBy: () => ({}),
    limit: () => ({}),
    serverTimestamp: () => ({ __サーバー日時: true }),
    getDoc: async (参照) => {
      const 値 = 取り出す(参照.道).get(参照.id);
      return { exists: () => 値 !== undefined, data: () => 値, id: 参照.id };
    },
    getDocs: async (集まり) => {
      const 表 = 取り出す(集まり.道);
      const 一覧 = [...表.entries()].map(([id, 値]) => ({
        id,
        data: () => 値,
        // 逆引き表の整理は d.ref を使って消すので、参照も返す
        ref: { 道: 集まり.道, id },
        metadata: { hasPendingWrites: false },
      }));
      return { forEach: (f) => 一覧.forEach(f), docs: 一覧, empty: 一覧.length === 0, size: 一覧.length };
    },
    setDoc: (参照, 値) => 送る({ 種別: 'setDoc', 操作: [{ 種類: 'set', 道: 参照.道, id: 参照.id, 値 }] }),
    updateDoc: (参照, 値) =>
      送る({ 種別: 'updateDoc', 操作: [{ 種類: 'update', 道: 参照.道, id: 参照.id, 値 }] }),
    deleteDoc: (参照) => 送る({ 種別: 'deleteDoc', 操作: [{ 種類: 'delete', 道: 参照.道, id: 参照.id }] }),
    writeBatch: () => {
      const 操作 = [];
      return {
        set: (参照, 値) => 操作.push({ 種類: 'set', 道: 参照.道, id: 参照.id, 値 }),
        update: (参照, 値) => 操作.push({ 種類: 'update', 道: 参照.道, id: 参照.id, 値 }),
        delete: (参照) => 操作.push({ 種類: 'delete', 道: 参照.道, id: 参照.id }),
        commit: () => 送る({ 種別: 'batch', 操作 }),
      };
    },
    onSnapshot: (対象, 受け取る) => {
      const v = {
        発火: () => {
          const 表 = 取り出す(対象.道);
          const 一覧 = [...表.entries()].map(([id, 値]) => ({
            id,
            data: () => 値,
            metadata: { hasPendingWrites: 状態.オフライン },
          }));
          受け取る({ forEach: (f) => 一覧.forEach(f), docs: 一覧, size: 一覧.length });
        },
      };
      見張り.push(v);
      v.発火();
      return () => {
        const i = 見張り.indexOf(v);
        if (i >= 0) 見張り.splice(i, 1);
      };
    },
  };

  return {
    api,
    状態,
    記録,
    通知,
    /** クラウドの中身を覗く */
    中身: (道) => [...取り出す(道).keys()].sort(),
    値: (道, id) => 取り出す(道).get(id),
    置く: (道, id, 値) => 取り出す(道).set(id, 値),
    消す: (道, id) => 取り出す(道).delete(id),
  };
}

/** require.cache に偽物を差し込む */
function 差し替え(名前, 中身) {
  const 場所 = path.join(SRC, 名前 + '.js');
  const m = new Module(場所, null);
  ((m.filename = 場所), (m.loaded = true), (m.exports = 中身));
  require.cache[場所] = m;
}

/**
 * node_modules の中身を偽物に差し替える。react-native は node では読めない
 * （ESM として解釈されて構文で落ちる）ので、使う分だけ用意する。
 */
function 外部を差し替え(名前, 中身) {
  const 場所 = path.join(path.resolve(__dirname, '../..'), 'node_modules', 名前, '__偽物__.js');
  const m = new Module(場所, null);
  ((m.filename = 場所), (m.loaded = true), (m.exports = 中身));
  require.cache[場所] = m;
  return 場所;
}

/** require の解決を横取りして、指定した名前だけ偽物へ向ける */
const 横取り = new Map();
const 元の解決 = Module._resolveFilename;
Module._resolveFilename = function (要求, ...残り) {
  if (横取り.has(要求)) return 横取り.get(要求);
  return 元の解決.call(this, 要求, ...残り);
};

/**
 * ストアを新しく読み込む。呼ぶたびにまっさらな状態になる。
 */
function ストアを用意する(既存の雲) {
  // 同じクラウドを渡すと、2台目の端末として使える（食い違いの検査用）
  const 雲 = 既存の雲 || 偽Firestore();
  const 保存領域 = new Map();
  const 知らせ = []; // 画面に出した文言（saveSession の上書き防止など）

  // IS_WEB が真なので window.alert が呼ばれる。node には無いので用意する
  if (typeof global.window === 'undefined') global.window = {};
  global.window.alert = (文) => 知らせ.push(String(文));

  // react-native は node では読めないので、使う分だけ用意する
  横取り.set(
    'react-native',
    外部を差し替え('react-native', {
      Platform: { OS: 'web', select: (o) => o.web || o.default },
      Alert: { alert: () => {} },
      Dimensions: { get: () => ({ width: 800, height: 600 }) },
      AppState: { addEventListener: () => ({ remove: () => {} }), currentState: 'active' },
      StyleSheet: { create: (o) => o, flatten: (o) => o },
      NativeModules: {},
    })
  );

  差し替え('module_188', 雲.api); // firebase/firestore
  差し替え('module_191', {
    getAuth: () => ({ currentUser: { uid: 'test-uid' } }),
    signInWithEmailAndPassword: async () => ({ user: {} }),
    sendPasswordResetEmail: async () => {},
  });
  差し替え('module_186', {
    getDatabase: () => ({}),
    ref: () => ({}),
    set: async () => {},
    update: async () => {},
    remove: async () => {},
    get: async () => ({ exists: () => false, val: () => null }),
    onValue: () => () => {},
    off: () => {},
    serverTimestamp: () => ({ __サーバー日時: true }),
  });
  差し替え('db_178', {
    db: { __偽: true },
    auth: { currentUser: { uid: 'test-uid' } },
    rtdb: null,
    dbReady: Promise.resolve({ __偽: true }),
    persistence: { state: 'ok', code: null },
  });
  // e(require(...)) の相互変換を通すので __esModule を立てる
  差し替え('useAsyncStorage_202', {
    __esModule: true,
    default: {
      getItem: async (k) => (保存領域.has(k) ? 保存領域.get(k) : null),
      setItem: async (k, v) => void 保存領域.set(k, v),
      removeItem: async (k) => void 保存領域.delete(k),
    },
  });
  差し替え('default_208', { __esModule: true, default: { addEventListener: () => () => {} } }); // NetInfo
  差し替え('module_198', {
    __esModule: true,
    default: { alert: (見出し, 文) => 知らせ.push(String(文 || 見出し)) },
  }); // Alert

  // ストア本体は毎回読み直す
  const 場所 = path.join(SRC, 'JP_useScoreStore_174.js');
  delete require.cache[場所];
  const { useScoreStore } = require(場所);

  return { store: useScoreStore, 雲, 保存領域, 知らせ };
}

/** 少し待つ。送信の約束が片付くのを待つために使う */
const 待つ = (ms = 0) => new Promise((r) => setTimeout(r, ms));

module.exports = { ストアを用意する, 待つ, 決着しない };
