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
      else if (o.種類 === 'set')
        // merge を渡されたときは、本物と同じく、渡した鍵だけを重ねる。
        // 差を付けないと「消えないはずの中身が消える」検査が書けない
        表.set(
          o.id,
          解決(o.重ねる ? Object.assign({}, 表.get(o.id) || {}, o.値) : Object.assign({}, o.値))
        );
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
    setDoc: (参照, 値, 選び) =>
      送る({
        種別: 'setDoc',
        操作: [{ 種類: 'set', 道: 参照.道, id: 参照.id, 値, 重ねる: !!(選び && 選び.merge) }],
      }),
    updateDoc: (参照, 値) =>
      送る({ 種別: 'updateDoc', 操作: [{ 種類: 'update', 道: 参照.道, id: 参照.id, 値 }] }),
    deleteDoc: (参照) => 送る({ 種別: 'deleteDoc', 操作: [{ 種類: 'delete', 道: 参照.道, id: 参照.id }] }),
    writeBatch: () => {
      const 操作 = [];
      return {
        set: (参照, 値, 選び) =>
          操作.push({ 種類: 'set', 道: 参照.道, id: 参照.id, 値, 重ねる: !!(選び && 選び.merge) }),
        update: (参照, 値) => 操作.push({ 種類: 'update', 道: 参照.道, id: 参照.id, 値 }),
        delete: (参照) => 操作.push({ 種類: 'delete', 道: 参照.道, id: 参照.id }),
        commit: () => 送る({ 種別: 'batch', 操作 }),
      };
    },
    onSnapshot: (対象, 受け取る) => {
      const v = {
        発火: () => {
          const 表 = 取り出す(対象.道);
          // 書類1件の購読と、集まりの購読で形が違う（本物と同じ）
          if (対象 && 対象.id != null) {
            const 値 = 表.get(対象.id);
            return void 受け取る({
              id: 対象.id,
              exists: () => 値 !== undefined,
              data: () => 値,
              metadata: { hasPendingWrites: 状態.オフライン },
            });
          }
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

/**
 * 偽の Realtime Database。ライブ記録が使う。
 *
 * 木構造を素のオブジェクトで持ち、道（'live_sessions/100001/朝練/state'）で読み書きする。
 * 本物と同じく「配列の中の null は落として添字のオブジェクトにする」までまねる。
 * ここをまねないと矢所の往復が本番と違う形になり、検査の意味が薄れる。
 */
function 偽RTDB() {
  let 木 = {};
  const 見張り = []; // { 道, 受け取る }
  const 記録 = [];
  // 遅延: 書き込みが届くまでの時間(ms)。「送ったあとに相手が消した」順序を作るために要る
  const 状態 = { オフライン: false, 失敗させる: false, 遅延: 0 };

  const 分解 = (道) => String(道).split('/').filter(Boolean);
  const 読む = (部分) => 部分.reduce((o, k) => (o == null ? undefined : o[k]), 木);
  const 写し = (値) => (値 === undefined ? null : JSON.parse(JSON.stringify(値)));
  const 書く = (部分, 値) => {
    if (部分.length === 0) return void (木 = 値 == null ? {} : 値);
    let 今 = 木;
    for (let i = 0; i < 部分.length - 1; i++) {
      if (今[部分[i]] == null || typeof 今[部分[i]] !== 'object') 今[部分[i]] = {};
      今 = 今[部分[i]];
    }
    const 末 = 部分[部分.length - 1];
    if (値 === undefined) delete 今[末];
    else 今[末] = 値;
  };

  /**
   * 本物に合わせる。Realtime Database は null の要素を保存しないので、
   * 配列の末尾の null は落ち、途中の null は穴として残る。
   * 全部 null なら値ごと消える。
   * （scripts/verify-live.mjs で実際のサーバー相手に確かめた振る舞い）
   */
  const 雲の形へ = (値) => {
    if (Array.isArray(値)) {
      if (値.some((v) => v == null)) {
        let 最後 = -1;
        値.forEach((v, i) => {
          if (v != null) 最後 = i;
        });
        if (最後 < 0) return undefined; // 全部 null は丸ごと消える
        const out = [];
        for (let i = 0; i <= 最後; i++) out.push(値[i] == null ? null : 雲の形へ(値[i]));
        return out;
      }
      return 値.map(雲の形へ);
    }
    if (値 && typeof 値 === 'object') {
      if (値.__サーバー日時) return Date.now();
      const out = {};
      for (const k in 値) if (値[k] !== undefined) out[k] = 雲の形へ(値[k]);
      return out;
    }
    return 値;
  };

  const 配る = (v) => {
    const 値 = 読む(分解(v.道));
    v.受け取る({ val: () => 写し(値), exists: () => 値 !== undefined });
  };
  const 通知 = () => {
    for (const v of [...見張り]) 配る(v);
  };

  const 送る = (やること) => {
    記録.push(やること);
    if (状態.失敗させる) return Promise.reject(new Error('偽の失敗'));
    if (状態.オフライン) return 決着しない();
    if (状態.遅延 > 0)
      return new Promise((r) =>
        setTimeout(() => {
          (やること.適用(), 通知(), r());
        }, 状態.遅延)
      );
    やること.適用();
    通知();
    return Promise.resolve();
  };

  const api = {
    getDatabase: () => ({ __偽: true }),
    ref: (db, 道) => ({ 道: 道 === undefined ? '' : String(道) }),
    serverTimestamp: () => ({ __サーバー日時: true }),
    get: async (参照) => {
      const 値 = 読む(分解(参照.道));
      return { exists: () => 値 !== undefined, val: () => 写し(値) };
    },
    set: (参照, 値) =>
      送る({
        種別: 'set',
        道: 参照.道,
        適用: () => 書く(分解(参照.道), 値 == null ? undefined : 雲の形へ(値)),
      }),
    remove: (参照) => 送る({ 種別: 'remove', 道: 参照.道, 適用: () => 書く(分解(参照.道), undefined) }),
    /**
     * 読んで書くまでを一息でやる。共有履歴の場所取りに使う。
     * 本物と同じく、いまの値を渡して、返った値を書き込む。
     * 2台が続けて呼んでも、後の呼び出しは先の結果を読む
     */
    runTransaction: (参照, 決める) => {
      const いま = 読む(分解(参照.道));
      const 新しい = 決める(いま === undefined ? null : 写し(いま));
      if (新しい === undefined) {
        return Promise.resolve({
          committed: false,
          snapshot: { exists: () => いま !== undefined, val: () => 写し(いま) },
        });
      }
      記録.push({ 種別: 'transaction', 道: 参照.道 });
      const 結果 = {
        committed: true,
        snapshot: { exists: () => 新しい !== undefined, val: () => 写し(新しい) },
      };
      if (状態.失敗させる) return Promise.reject(new Error('偽の失敗'));
      if (状態.オフライン) return 決着しない();
      // 本物は場所取りを先に確定させる（手元に当て、ぶつかればサーバーが
      // 読み直させる）。遅延があっても、次の呼び出しは確定後の値を読む。
      // ここを遅らせると、2台が同じ番号を取れてしまい実物と食い違う
      書く(分解(参照.道), 新しい == null ? undefined : 雲の形へ(新しい));
      通知();
      if (状態.遅延 > 0) return new Promise((r) => setTimeout(() => r(結果), 状態.遅延));
      return Promise.resolve(結果);
    },
    update: (参照, 値) =>
      送る({
        種別: 'update',
        道: 参照.道,
        値,
        適用: () => {
          // 鍵に '/' を含められる（marks_by_id/xxx/0 のような形）
          for (const k in 値) {
            if (値[k] === undefined) continue;
            書く([...分解(参照.道), ...分解(k)], 雲の形へ(値[k]));
          }
        },
      }),
    onValue: (参照, 受け取る) => {
      const v = { 道: 参照.道, 受け取る };
      見張り.push(v);
      配る(v);
      return () => {
        const i = 見張り.indexOf(v);
        if (i >= 0) 見張り.splice(i, 1);
      };
    },
    /** 本物と同じく、その道に付いた見張りを全部外す */
    off: (参照) => {
      for (let i = 見張り.length - 1; i >= 0; i--) if (見張り[i].道 === 参照.道) 見張り.splice(i, 1);
    },
  };

  return {
    api,
    状態,
    記録,
    見張りの数: () => 見張り.length,
    値: (道) => 写し(読む(分解(道))),
    置く: (道, 値) => (書く(分解(道), 雲の形へ(値)), 通知()),
    消す: (道) => (書く(分解(道), undefined), 通知()),
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
function ストアを用意する(既存の雲, 既存のライブ) {
  // 同じクラウドを渡すと、2台目の端末として使える（食い違いの検査用）
  const 雲 = 既存の雲 || 偽Firestore();
  const ライブ = 既存のライブ || 偽RTDB();
  // つながっている端末では、サーバーとの時差が取れる。既定はその形にしておく。
  // 「時差が取れない」場面を作りたいときは ライブ.消す(時差の道) で外す
  ライブ.置く('.info/serverTimeOffset', 0);
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
  差し替え('module_186', ライブ.api); // firebase/database
  差し替え('db_178', {
    db: { __偽: true },
    auth: { currentUser: { uid: 'test-uid' } },
    // 偽物でも真の値にしておかないと、ライブ記録の処理が入口で全部帰ってしまう
    rtdb: { __偽: true },
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

  return { store: useScoreStore, 雲, ライブ, 保存領域, 知らせ };
}

/** 少し待つ。送信の約束が片付くのを待つために使う */
const 待つ = (ms = 0) => new Promise((r) => setTimeout(r, ms));

module.exports = { ストアを用意する, 待つ, 決着しない };
