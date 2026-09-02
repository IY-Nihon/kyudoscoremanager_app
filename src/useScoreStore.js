/**
 * Module ID: 174
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;

const r = require;

const _i = typeof metroImport !== 'undefined' ? metroImport : undefined;

const _a = typeof id !== 'undefined' ? id : 174;

const _m = module;

const _e = exports;

const _d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
function e(e) {
  return e && e.__esModule
    ? e
    : {
        default: e,
      };
}

// 比較のひな型（よく見る組み合わせ）の決まり
const ひ = require('./comparePresets');
// ライブを置く枝の名前。団体IDそのままだと総当たりで覗かれる
const 秘 = require('./liveSecret');
// ライブに何台つないでいるか。電波の切れる弓道場で、相手に届いているかを見る
const 在 = require('./livePresence');
// ライブをURLで配る。編集用と閲覧用を分け、合言葉を掛けられる
const 共 = require('./liveShare');
// 端末に残す記録を選ぶ。放っておくと localStorage の上限に当たる
const 端 = require('./localTrim');

/**
 * 端末に書けなくなったことを、利用者にも一度だけ伝える。
 *
 * 便りは運営者にしか届かない。書けないまま記録を続けると、次に開いたときに
 * その練習ぶんが消えている。とくに個人モードは雲へ上げないので、端末に
 * 書けなければどこにも残らない（localTrim は送れていない記録を落とさないので、
 * 間引きでも空きは作れない）。
 *
 * 保存は○×を入れるたびに走るので、出すのは起動につき1回だけ。
 * 毎回出すと記録の邪魔になり、かえって読まれなくなる。
 */
let 書けないと知らせた = !1;
function 書けないことを一度だけ知らせる() {
  if (書けないと知らせた) return;
  書けないと知らせた = !0;
  try {
    require('./alertBridge').default.alert(
      '端末に保存できませんでした',
      '端末の空きが足りないようです。このまま続けると、入れた記録が次に開いたときに消えていることがあります。ほかのアプリやブラウザの保存領域を空けてから、もう一度お試しください。'
    );
  } catch (t) {
    /* 知らせが出せなくても、本来の動きは続ける */
  }
}

/**
 * 端末の置き場。書けなかったことを拾うために、素の AsyncStorage を包む。
 *
 * 記録は1件およそ20KB で、本番の最大の団体はすでに2.35MB。
 * localStorage の目安は5MB、Android の AsyncStorage は既定6MB なので、
 * いつか必ず上限に当たる。素で渡していたころは、当たっても黙って通り過ぎ、
 * 端末の控えが古いまま残っていた（次に開くと古い状態が戻る）。
 *
 * ここで拾って、不具合の便りに載せる。控えが古いままになっていることは
 * 利用者には見えないので、こちらが気づけるようにしておく
 */
const 端末の置き場 = {
  getItem: (鍵) => u.default.getItem(鍵),
  setItem: async (鍵, 値) => {
    try {
      return await u.default.setItem(鍵, 値);
    } catch (t) {
      const 大きさ = 値 && 値.length ? Math.round(値.length / 1024) : 0;
      (console.error('[Store] 端末に控えを書けませんでした（' + 大きさ + 'KB）', t),
        不具合を控える('端末の控えが書けない', 大きさ + 'KB'));
      書けないことを一度だけ知らせる();
      // 投げ返さない。書けなくても、雲への同期と画面の操作は続けられる
      return void 0;
    }
  },
  removeItem: (鍵) => u.default.removeItem(鍵),
};

// 行動を1つ控える。不具合の便りに「直前に何をしていたか」として載る。
// 氏名・的中・記録の中身は渡さない（渡すと便りに名簿が出る）
function 行動を控える(名, 中身) {
  try {
    require('./errorReporter').行動を残す(名, 中身);
  } catch (e) {
    /* 控えられなくても、本来の動きは続ける */
  }
}

/**
 * 合言葉の取り寄せ。同時に何度呼ばれても1本にまとめる。
 *
 * ライブを始めるとき・一覧を出すとき・起動したときの3か所から呼ぶので、
 * まとめないと同じ団体に別々の合言葉を書き合い、端末ごとに枝が分かれる
 */
let 合言葉の取り寄せ = null;

// ライブを置く枝。合言葉が無ければ null を返す。
// 団体IDへ落とすと、合言葉を持つ端末と持たない端末で枝が分かれ、
// 同じ練習に入っているつもりで相手の○×が見えない形になる
//
// 合言葉は端末に残る。どの団体のものかを一緒に見ないと、団体を移った直後に
// 前の団体の枝へ書き込み、向こうの部員に今の練習が見えてしまう
function ライブの枝() {
  const 状 = M.getState();
  // 閲覧用のリンクで見ているあいだは、書く先を持たない。
  // ここで団体の枝へ落とすと、部員が閲覧リンクを開いたときに、
  // その人の操作が団体の枝（参加一覧の道しるべ）を壊す
  if (状.写しを見ているか) return null;
  // 共有のライブに入っているあいだは、そのライブ専用の枝を使う。
  // 団体の合言葉を配ると、その1本で団体の全部のライブに入られてしまうので、
  // 共有するライブだけを別の枝に置いてある（src/liveShare.js）
  if (秘.枝として使えるか(状.いまのライブの枝)) return String(状.いまのライブの枝);
  const { activeGroupId: 団体, ライブの合言葉: 控え } = 状;
  if (!団体 || !控え || 控え.団体 !== 団体) return null;
  return 秘.ライブの枝(控え.合言葉);
}

/** 団体の枝。共有のライブに入っていても、こちらは団体のものを返す */
function 団体の枝() {
  const { activeGroupId: 団体, ライブの合言葉: 控え } = M.getState();
  if (!団体 || !控え || 控え.団体 !== 団体) return null;
  return 秘.ライブの枝(控え.合言葉);
}

/** 共有のライブの、参加一覧に出すための道しるべ。団体の枝の下に置く */
const 道しるべの場所 = (枝, 名前) => `live_sessions/${枝}/${名前}/state`;

/**
 * ライブが別の枝へ移っていたら、付いていく。
 *
 * 誰かが「配る」を押すと、そのライブは専用の枝へ移る（ライブを共有する）。
 * 押した本人だけが移ると、残りの台は元の枝に取り残されてライブが分裂する。
 * 元の枝に置かれた「移った先」を見て、みんなで付いていく。
 *
 * 主催者かどうかは変えない。移したのが参加者でも、主催者は主催者のまま
 */
function 移ったら付いていく(状態, e, s) {
  if (!状態) return !1;
  // 目印は2通りある。
  //   ・移った先 … 共有の枝から別の共有の枝へ移したとき
  //   ・共有の枝 … 団体の枝から移したとき。元の節点はそのまま道しるべになる
  const 先 = 秘.枝として使えるか(状態.移った先)
    ? String(状態.移った先)
    : 秘.枝として使えるか(状態.共有の枝)
      ? String(状態.共有の枝)
      : null;
  if (!先 || 先 === ライブの枝()) return !1;
  const 名前 = s().liveSessionName;
  if (!名前) return !1;
  const 主催だった = s().isHost;
  console.log('[Store] ライブが配られたので、新しい枝へ移ります');
  (s().joinLiveSync(名前, s().ライブは見るだけ, {
    枝: 先,
    閲覧枝: 状態.移った先の閲覧枝 || 状態.閲覧の枝 || null,
  }),
    e({ isHost: 主催だった }));
  return !0;
}

/** 閲覧用の写しの置き場所。書き込まれても本物の記録には届かない */
const 写しの場所 = (枝, 名前) => `live_view/${枝}/${名前}/state`;

/**
 * 盤面の書き込みを、閲覧用の写しへも流す。
 *
 * 閲覧の人には写しの枝しか渡していない。本物の枝を知らないので、
 * 写しに何を書かれても記録には届かない。これが「閲覧用」の中身。
 * 写しを汚されても、次の書き込みで上から直る。
 *
 * 共有していないライブでは何もしない（閲覧枝が無いため）。
 * 自分が写しを見ている側のときも書かない（見るだけの人が書いてしまう）
 */
function 写しへも流す(名前, 中身) {
  const { いまのライブの閲覧枝: 閲覧枝, 写しを見ているか } = M.getState();
  if (!fb.rtdb || 写しを見ているか || !名前) return;
  if (!秘.枝として使えるか(閲覧枝)) return;
  (0, i.update)((0, i.ref)(fb.rtdb, 写しの場所(閲覧枝, 名前)), 中身).catch(() => {
    /* 写しが遅れても、記録そのものには関わらせない */
  });
}

/**
 * 参加一覧の節点から、共有のライブの道しるべだけを拾う。
 *
 * 共有のライブは団体の枝に盤面を置かず、道しるべ（共有の枝の名前）だけを置く。
 * 参加するときにこれを辿らないと、中身の無い節点を見に行って何も出ない
 */
function 道しるべたちを拾う(節点) {
  const 出 = {};
  if (!節点 || typeof 節点 !== 'object') return 出;
  for (const 名 of Object.keys(節点)) {
    const 状 = (節点[名] || {}).state;
    if (状 && 秘.枝として使えるか(状.共有の枝))
      出[名] = Object.assign(
        { 共有の枝: String(状.共有の枝), 閲覧の枝: 状.閲覧の枝 || null },
        // 期限は後から足した。古い道しるべには無いので、null で埋めないこと。
        // 埋めると「期限なし」と区別がつかなくなる
        '期限' in 状 ? { 期限: 状.期限 } : null
      );
  }
  return 出;
}

// 行動の控えを捨てる。ログアウトのときに呼ぶ
function 行動の控えを捨てる() {
  try {
    require('./errorReporter').行動を捨てる();
  } catch (e) {
    /* 捨てられなくても、ログアウトそのものは進める */
  }
}

// 貯まっている便りを出し直す。errorReporter は呼ぶときに読む
function 溜まりを流し直す() {
  try {
    require('./errorReporter').溜まりを流す();
  } catch (e) {
    /* 便りを出せなくても、同期は続ける */
  }
}

// 不具合をこちらに控える。送れなければ端末に貯まり、つながったときに出し直す。
// errorReporter → useScoreStore の向きに参照があるので、ここでは呼ぶときに読む
function 不具合を控える(出どころ, 誤り) {
  try {
    require('./errorReporter').不具合を送る(出どころ, 誤り);
  } catch (e) {
    /* 控えられなくても、同期そのものは続ける */
  }
}

(Object.defineProperty(_e, '__esModule', {
  value: !0,
}),
  Object.defineProperty(_e, 'useScoreStore', {
    enumerable: !0,
    get: function () {
      return M;
    },
  }),
  // ライブ名の検査。画面から使う
  Object.defineProperty(_e, 'ライブ名に使えない字', {
    enumerable: !0,
    get: function () {
      return 同期規則.ライブ名に使えない字;
    },
  }));
var s = require('zustand'),
  _t_orig = require('./db'),
  o = require('firebase/auth'),
  a = require('firebase/firestore'),
  i = require('firebase/database'),
  n = e(require('./alertBridge')),
  c = require('./IS_WEB'),
  l = require('./uuid'),
  d = require('zustand/middleware'),
  u = e(require('@react-native-async-storage/async-storage')),
  m = e(require('@react-native-community/netinfo'));
const fb = {
  dbInstance: null,
  authInstance: null,
  get db() {
    if (fb.dbInstance) return fb.dbInstance;
    const res = require('./db');
    if (res && res.db) {
      fb.dbInstance = res.db;
      return res.db;
    }
    try {
      const fbApp = require('firebase/app').getApp();
      const firestore = require('firebase/firestore').getFirestore(fbApp);
      if (firestore) {
        fb.dbInstance = firestore;
        return firestore;
      }
    } catch (e) {}
    return undefined;
  },
  get auth() {
    if (fb.authInstance) return fb.authInstance;
    const res = require('./db');
    if (res && res.auth) {
      fb.authInstance = res.auth;
      return res.auth;
    }
    try {
      const fbApp = require('firebase/app').getApp();
      const auth = require('firebase/auth').getAuth(fbApp);
      if (auth) {
        fb.authInstance = auth;
        return auth;
      }
    } catch (e) {}
    return undefined;
  },
  get rtdb() {
    return require('./db').rtdb;
  },
};

const waitForDb = async () => {
  const mod = require('./db');
  if (mod.dbReady) {
    const dbInst = await mod.dbReady;
    fb.dbInstance = dbInst;
    return dbInst;
  }
  if (mod.db) {
    fb.dbInstance = mod.db;
    return mod.db;
  }
  return undefined;
};
let p = {};
// 同期の判断に使う純粋な関数は syncRules.js へ移した。中身は変えていない。
// 呼び出し側の書き換えを避けるため、従来の1文字の名前に割り当て直す。
const 同期規則 = require('./syncRules');
const h = 同期規則.generateUniquePersonalId,
  y = 同期規則.mergeById,
  mergeLiveArchers = 同期規則.mergeLiveArchers,
  印だけの差分 = 同期規則.印だけの差分,
  差分を当てる = 同期規則.差分を当てる,
  射数の差分 = 同期規則.射数の差分,
  射数差を当てる = 同期規則.射数差を当てる,
  盤面を射数にそろえる = 同期規則.盤面を射数にそろえる,
  項目の差分 = 同期規則.項目の差分,
  項目差分を当てる = 同期規則.項目差分を当てる,
  restampChangedArchers = 同期規則.restampChangedArchers,
  normalizeArrowLocations = 同期規則.normalizeArrowLocations,
  dropUndefinedDeep = 同期規則.dropUndefinedDeep,
  trashedAtMillis = 同期規則.trashedAtMillis,
  normalizeTag = 同期規則.normalizeTag,
  cleanUpTagsArray = 同期規則.cleanUpTagsArray,
  参加できるライブ = 同期規則.参加できるライブ,
  cleanUpSessions = 同期規則.cleanUpSessions;
const f = (e, s) => {
    if (!e) return s ? Array(s).fill('') : [];
    if (Array.isArray(e)) {
      const t = e.map((e) => (null == e ? '' : e));
      return s && t.length < s ? [...t, ...Array(s - t.length).fill('')] : t;
    }
    if ('object' == typeof e) {
      const t = Object.keys(e);
      if (t.length > 0 && t.every((e) => !isNaN(Number(e)))) {
        const o = Math.max(...t.map(Number)),
          a = s ? Math.max(s, o + 1) : o + 1,
          i = Array(a).fill('');
        return (
          t.forEach((s) => {
            const t = Number(s);
            i[t] = null === e[s] || void 0 === e[s] ? '' : e[s];
          }),
          i
        );
      }
      return Object.values(e);
    }
    return [];
  },
  S = (e, s) =>
    e && 'object' == typeof e
      ? {
          id: e.id || '',
          name: e.name || '',
          gender: e.gender || '未設定',
          grade: 'number' == typeof e.grade ? e.grade : 1,
          marks: f(e.marks, e.isSeparator ? 0 : s),
          isSeparator: !0 === e.isSeparator,
          isTotalCalculator: !0 === e.isTotalCalculator,
          isGuest: !0 === e.isGuest,
          memberId: e.memberId || void 0,
          lockedBlocks: e.lockedBlocks || {},
          substitutions: e.substitutions || {},
          substitutionIds: e.substitutionIds || {},
          bowWeight: e.bowWeight || void 0,
          lastModified: e.lastModified || 0,
          // 入っていなければ undefined のままにする。突き合わせ側が
          // 「情報が無い」と見て手元の矢所を残せるようにするため
          arrowLocations: normalizeArrowLocations(e.arrowLocations, e.isSeparator ? 0 : s || 8),
        }
      : null,
  b = (e, s) =>
    JSON.parse(
      JSON.stringify(
        e.map((e) => ({
          id: e.id,
          name: e.name || '',
          gender: e.gender || '未設定',
          grade: e.grade || 0,
          isSeparator: e.isSeparator || !1,
          isTotalCalculator: e.isTotalCalculator || !1,
          isGuest: e.isGuest || !1,
          memberId: e.memberId || null,
          lockedBlocks: e.lockedBlocks || {},
          substitutions: e.substitutions || {},
          lastModified: e.lastModified || 0,
          substitutionIds: e.substitutionIds || {},
          bowWeight: e.bowWeight || null,
          // 空欄は '' で送る（○× と同じ）。null のままだと Realtime Database が
          // 配列から落として添字のオブジェクトに変えてしまい、位置がずれる。
          // 持っていないときは null にして、受け取り側が手元の値を残せるようにする
          arrowLocations: Array.isArray(e.arrowLocations)
            ? e.arrowLocations.map((矢所) => (null == 矢所 ? '' : 矢所))
            : null,
        }))
      )
    );
/**
 * サーバーに載っていると分かっている○×。射手id ごとに文字列で持つ。
 *
 * 盤面まるごとの送信は marks_by_id を丸ごと書き換えていた。自分の盤面から
 * 作るので、まだ受け取っていない相手の1射ぶんの送信を消してしまう。
 * 鍵をかけただけでも相手の○×が消えるのはこれが理由。
 * 変わった射手のぶんだけを書けば、触っていない射手には手が届かない。
 */
let 載っている印 = {};
const 印を並べる = (m) => (Array.isArray(m) ? m : []).map((x) => (x == null ? '' : x)).join('\u0001');
/** 受け取った内容で、載っていると分かっている○×を控え直す */
const 載っている印を控える = (印の表) => {
  if (!印の表) return;
  Object.keys(印の表).forEach((id) => {
    載っている印[id] = 印を並べる(印の表[id]);
  });
};
/** ライブに出入りしたら控えは捨てる */
const 載っている印を捨てる = () => {
  載っている印 = {};
};
const v = (e, s, o) => {
    const a = Date.now(),
      n = ライブの枝();
    if (!fb.rtdb || !n) return;
    const c = (0, i.ref)(fb.rtdb, `live_sessions/${n}/${e}/state`),
      l = b(s),
      d = {};
    s.forEach((e) => {
      e && e.id && (d[e.id] = e.lastModified || 0);
    });
    // ○×は、前に載せたときから変わった射手のぶんだけ書く。
    // marks_by_id を丸ごと差し替えると、まだ受け取っていない相手の
    // 1射ぶんの送信を消してしまう
    const u = {};
    s.forEach((e) => {
      if (!e || !e.id || e.isSeparator) return;
      const 並び = 印を並べる(e.marks);
      if (載っている印[e.id] === 並び) return;
      ((u[e.id] = e.marks || []), (載っている印[e.id] = 並び));
    });
    const m = {
      archers: l,
      shotsPerRound: o,
      timestamp: a,
      // 参加一覧の「最終更新」はこちらを見る。timestamp は書いた端末の時計で、
      // 自分の送信の返りを見分けるのに使うため端末の値のままにしてある。
      // 端末の時計が狂っていると、使用中のライブが古いと見なされて消えかねない
      updated_at: (0, i.serverTimestamp)(),
      status: 'active',
    };
    // 丸ごとではなく射手ごとの道に書く。書かなかった射手の○×は残る。
    // 日時も同じ射手のぶんだけ。日時は○×の鮮度を表す値なので、○×を
    // 書かない射手の日時に触ると、相手の新しい入力を古いと誤判定させる。
    // 射手そのものの新しさは archers[].lastModified が運び、受け取り側は
    // 両者の max を取るので、書かなくても取りこぼさない
    Object.keys(u).forEach((id) => {
      ((m[`marks_by_id/${id}`] = u[id]), (m[`archer_timestamps/${id}`] = d[id] || 0));
    });
    (console.log('[Store] pushLiveAll state updated, lastPushedTimestamp:', a),
      M.getState().updateState({
        lastPushedTimestamp: a,
      }),
      (0, i.update)(c, m).catch((e) => console.error('[Store] pushLiveAll Error:', e)),
      写しへも流す(e, m));
  },
  // 自分の送信の返りから、的中の印だけを取り込む。
  //
  // 返りの archers は自分が送った時点のもので、手元にしかない射手が
  // 落ちるため、一覧は入れ替えられない。しかし同じ通知には、ほぼ同時に
  // 書いた相手の marks_by_id が載っていることがある。丸ごと捨てると
  // その手は永久に届かない（他に変化が無ければ次の通知が来ないため）。
  // そこで一覧はそのままに、相手のほうが新しい射手の印だけを入れる。
  返りの印を取り込む = (状態, e, s) => {
    // ここでも控えを取り直す。この経路は w() を通らないので、忘れると
    // 相手の○×を「まだ載っていない」と思い込んだままになる。
    // その状態で取り消すと「前と同じ」と見なして送らず、自分だけ戻る
    載っている印を控える((状態 && 状態.marks_by_id) || {});
    const 印 = (状態 && 状態.marks_by_id) || {},
      日時 = (状態 && 状態.archer_timestamps) || {},
      // 正規化は手元の射数で行う。相手の射数で揃えると、射数が食い違って
      // いるときに手元の盤面と長さの合わない marks を入れてしまう。
      // 射数そのものの変更は、返りではない通知のほうで届く
      本数 = s().shotsPerRound;
    let 変わった = !1;
    const 一覧 = (s().archers || []).map((a) => {
      if (!a || !a.id || a.isSeparator || a.isTotalCalculator) return a;
      const 相手 = 印[a.id];
      const 相手の日時 = 日時[a.id] || 0;
      if (!相手 || 相手の日時 <= (a.lastModified || 0)) return a;
      return ((変わった = !0), Object.assign({}, a, { marks: f(相手, 本数), lastModified: 相手の日時 }));
    });
    変わった && e({ archers: 一覧 });
  },
  T = (e, s, o, a, n) => {
    const c = Date.now(),
      l = ライブの枝();
    if (!fb.rtdb || !l) return;
    const d = (0, i.ref)(fb.rtdb, `live_sessions/${l}/${e}/state`),
      u = {
        [`marks_by_id/${s}/${o}`]: a,
        [`archer_timestamps/${s}`]: n,
        timestamp: c,
        updated_at: (0, i.serverTimestamp)(),
      };
    // 1射ぶんの送信でも控えを更新する。ここを飛ばすと、次に盤面まるごとを
    // 送るときに「前と同じ」と見なして送らず、取り消しが相手に届かない
    const その射手 = (M.getState().archers || []).find((x) => x && x.id === s);
    if (その射手) 載っている印[s] = 印を並べる(その射手.marks);
    (M.getState().updateState({
      lastPushedTimestamp: c,
    }),
      (0, i.update)(d, u).catch((e) => console.error('pushLiveMark Error:', e)),
      写しへも流す(e, u));
  },
  w = (e) => {
    const s = 'number' == typeof e.shotsPerRound ? e.shotsPerRound : 8,
      t = f(e.archers),
      o = e.marks_by_id || {},
      a = e.archer_timestamps || {};
    // 受け取った内容でも控え直す。自分が送った値しか覚えていないと、
    // 相手が入れた○×を「前と同じ」と見なして送らず、取り消しが相手に届かない
    載っている印を控える(o);
    return {
      archers: t
        .map((e) => {
          if (!e) return null;
          const t = S(e, s);
          return t
            ? (!e.isSeparator &&
                o[e.id] &&
                ((t.marks = f(o[e.id], s)), (t.lastModified = Math.max(t.lastModified || 0, a[e.id] || 0))),
              t)
            : null;
        })
        .filter(Boolean),
      shotsPerRound: s,
    };
  };
// ── ライブにつないでいる台数 ──────────────────────────────
// 在席はライブの枝の外に置く（共有履歴と同じ理由）。中に置くと、
// 参加一覧が節点を丸ごと読むときに付いてきて、同名の判定にも紛れ込む
const 在席の場所 = (枝, 名前) => `live_presence/${枝}/${名前}`;
/** この端末の名前。台ごとに違えばよく、秘密ではない */
const この端末 = 在.端末の名前を作る();
/** 在席の後始末。始めるたびに入れ替える */
let 在席の片付け = null;

/**
 * 閲覧用の写しを見張るのをやめる係。
 *
 * 写しは live_view にあり、ふつうのライブの道とは別。stopLiveSync の off は
 * live_sessions しか外さないので、ここで別に持たないと、抜けたあとも
 * 写しが届き続けて盤面が勝手に書き換わる
 */
let 写しの片付け = null;

/** 写しを見るのをやめる */
function 写しを見るのをやめる() {
  (写しの片付け && 写しの片付け(), (写しの片付け = null));
}

/** 在席をやめる。ライブから抜けたときに必ず呼ぶこと */
function 在席を終える(e) {
  (在席の片付け && 在席の片付け(), (在席の片付け = null));
  if (e) e({ ライブの接続台数: 0 });
}

/**
 * 在席を置き、台数を数え始める。
 *
 * onDisconnect は一度きりで、つなぎ直すと外れる。`.info/connected` を
 * 見張って掛け直さないと、二度目に切れた端末が在席に残り続ける。
 * 数えるのは台数だけで、誰が居るかは持たない
 */
function 在席を始める(名前, e) {
  在席を終える();
  const 枝 = ライブの枝();
  if (!fb.rtdb || !枝 || !名前) return;
  try {
    const 根 = 在席の場所(枝, 名前);
    const 自分 = (0, i.ref)(fb.rtdb, `${根}/${この端末}`);
    const 置き直す = () => {
      try {
        ((0, i.onDisconnect)(自分)
          .remove()
          .catch(() => {}),
          (0, i.set)(自分, { at: (0, i.serverTimestamp)() }).catch(() => {}));
      } catch (t) {
        /* 台数が出ないだけ。ライブそのものは続ける */
      }
    };
    // 切れて戻ったときだけ掛け直す。知らせが来るたびに書くと、書いたことが
    // また知らせになって堂々巡りになる（偽のRTDBで実際に止まらなくなった）
    let 前は繋がっていた = !1;
    const 繋がりの見張り = (0, i.onValue)((0, i.ref)(fb.rtdb, '.info/connected'), (x) => {
      const いま = !!x.val();
      (いま && !前は繋がっていた && 置き直す(), (前は繋がっていた = いま));
    });
    // サーバーの時計に合わせられるまでは、古さで落とさない（null を渡す）。
    // 端末の時計が進んでいると全員が「古い」に見え、居るのに0台と出る
    時差を見張る();
    const 数の見張り = (0, i.onValue)((0, i.ref)(fb.rtdb, 根), (x) => {
      e({
        ライブの接続台数: 在.在席を数える(x.val(), 時差が取れた ? Date.now() + サーバーとの時差 : null),
      });
    });
    // 電波が一瞬切れても在席が古びないように、ときどき打ち直す
    const 打ち直し = setInterval(置き直す, 在.打ち直す間隔);
    // node（検査）では、走り続ける時計があるとまとめて終われない。
    // ブラウザや端末の setInterval に unref は無いので、あるときだけ呼ぶ
    if (打ち直し && 'function' == typeof 打ち直し.unref) 打ち直し.unref();
    在席の片付け = () => {
      (clearInterval(打ち直し),
        繋がりの見張り && 繋がりの見張り(),
        数の見張り && 数の見張り());
      try {
        ((0, i.onDisconnect)(自分)
          .cancel()
          .catch(() => {}),
          (0, i.remove)(自分).catch(() => {}));
      } catch (t) {
        /* 消せなくても、古いとみなす時間で数から落ちる */
      }
    };
  } catch (t) {
    console.warn('[Store] ライブの在席を置けませんでした', t);
  }
}

/**
 * ライブ中の共有履歴に1手ぶん積む。
 *
 * 置き場所はライブの枝の外（live_history/{団体}/{名前}/{番号}）。
 * 「どこまで戻したか」の目印だけは state に置き、全員へ配る。
 * 目印を使うので問い合わせ（query）が要らず、添字で直接読める。
 *
 * 元は live_sessions/{団体}/{名前}/history に置いていた。Realtime Database は
 * 枝の途中だけを選んで読めないため、参加一覧が live_sessions/{団体} を丸ごと
 * 読むときに履歴まで降りてきていた。実測で 47KB のうち 43KB が履歴で、
 * 20人・30手だと 1ライブあたり 376KB になる。一覧には要らないので外へ出した。
 */
/**
 * 共有履歴に残す形に整える。
 * 送信用の b() は ○× を含まない（別の場所 marks_by_id で送るため）ので、
 * そのまま使うと的中が落ちる。履歴は盤面まるごとを残す必要があるため足す。
 */
const 履歴用に整える = (一覧) =>
  (Array.isArray(一覧) ? b(一覧) : []).map((射手, 番) =>
    Object.assign({}, 射手, {
      marks: ((一覧[番] && 一覧[番].marks) || []).map((m) => (null == m ? '' : m)),
    })
  );
/** 共有履歴の置き場所。ライブの枝の外に置く（上の説明を参照） */
const 共有履歴の場所 = (枝, 名前) => `live_history/${枝}/${名前}`;
/**
 * 端末の時計とサーバーの時計の差（ミリ秒）。
 *
 * 古いライブを消すかどうかは日時の引き算で決めるので、端末の時計が大きく
 * 狂っていると、使用中のライブを「古い」と見なして消しかねない。
 *
 * .info/serverTimeOffset は規則の対象外で、つないだ時点で手元に配られる。
 * 通信は増えない（実測で onValue が1ミリ秒、ふつうの枝の取得は230ミリ秒）。
 * ただし get() は「Invalid token in path」で弾かれるので onValue を使うこと。
 */
let サーバーとの時差 = 0;
// サーバーの時計に本当に合わせられたか。
// 合わせられていないまま古いライブを消すと、端末の時計が狂っているだけで
// 全部が「14日超」に見えて、保存前の盤面ごと消えてしまう
let 時差が取れた = !1;
let 時差の見張り = null;
const 時差を見張る = () => {
  if (時差の見張り || !fb.rtdb) return 時差の見張り;
  時差の見張り = new Promise((解決) => {
    let 済み = !1;
    const 終わる = () => {
      if (!済み) ((済み = !0), 解決());
    };
    try {
      ((0, i.onValue)(
        (0, i.ref)(fb.rtdb, '.info/serverTimeOffset'),
        (s) => {
          const 差 = s.val();
          if ('number' == typeof 差)
            ((サーバーとの時差 = 差),
              (時差が取れた = !0),
              console.log('[Store] サーバーとの時差:', 差, 'ミリ秒'));
          終わる();
        },
        () => 終わる()
      ),
        // つながっていなければ来ない。待ち続けない
        setTimeout(終わる, 2e3));
    } catch (e) {
      終わる();
    }
  });
  return 時差の見張り;
};
/**
 * 見張りが決まりに弾かれたときの受け。
 *
 * 期限の切れた枝は、決まりが読ませない（database.rules.json）。
 * onValue に受けを渡していないと、知らせが来ないまま「ライブ中」の
 * 表示だけが残り、盤面が空のまま何も起きない画面になる。
 *
 * 一覧の側でも期限切れは外しているが（syncRules.js の 参加できるライブ）、
 * 一覧を取り直す前に押した人はここへ来る。両方要る。
 */
function つなげなくなった(誤り, e, s) {
  if (!弾かれたか(誤り)) return void console.error('[Store] ライブの見張りが止まりました', 誤り);
  // すでに離れているなら、片付けるだけで黙っている。
  // 期限で閉じたあとにつなぎ直して弾かれると、ここも呼ばれる。
  // 断らないと、同じ出来事で知らせが二度出る
  const もう離れている = !s().isLiveActive;
  (在席を終える(e),
    写しを見るのをやめる(),
    e({ isLiveActive: !1, isHost: !1, liveSessionName: null, いまのライブの期限: null }));
  if (もう離れている) return;
  try {
    n.default.alert(
      'このライブには入れません',
      '共有の期限が切れたか、すでに終わっているようです。配った方にお確かめください。'
    );
  } catch (t) {
    /* 知らせが出せなくても、離れることはできている */
  }
}

/**
 * 決まりに弾かれた誤りか。
 *
 * Firebase は読みで「Permission denied」、書きで「permission_denied」と、
 * 大文字と区切りが揃っていない。片方だけを見ていて、期限切れを
 * 「読めませんでした」と出したことがある
 */
function 弾かれたか(誤り) {
  return /permission[ _]denied/i.test(String((誤り && (誤り.message || 誤り.code)) || 誤り));
}

/**
 * 期限が過ぎていたら、ライブから離れる。
 *
 * 決まり（database.rules.json）は切れた枝の読み書きを止めるが、効くのは
 * **つなぎ直したとき**で、すでに開いている見張りには更新が届き続ける。
 * そこで盤面に載せた期限を見て、こちらからも閉じる。
 *
 * 手元の盤面は消さない。期限が切れたのは「配ったリンク」であって、
 * その人が取った記録ではない。消すと、練習ぶんがどこにも無くなる。
 *
 * @returns {boolean} 閉じたなら true（呼び出し側はそこで打ち切る）
 */
let 期限を知らせた = 0;
/**
 * 盤面に載っている期限を控える。帯のカウントダウンはこれを見る。
 *
 * **受け口の枝分かれより前で呼ぶこと。** 主催者は自分の書き込みの返りしか
 * 受けないので、「他人の書き込み」の枝に置くと一度も拾えない。
 * 配った本人がカウントダウンを見られない、という形になっていた。
 *
 * 盤面が届くたびに合わせるので、配り直しで延びた／縮んだときも追いつく。
 */
function 期限を控える(状態, e, s) {
  const 期限 = 状態 && 'number' == typeof 状態.期限 ? 状態.期限 : 0;
  if (s().いまのライブの期限 !== (期限 || null)) e({ いまのライブの期限: 期限 || null });
  return 期限;
}

function 期限で閉じるか(状態, e, s) {
  const 期限 = 期限を控える(状態, e, s);
  if (!期限 || いまの見当() < 期限) return !1;
  const 名前 = s().liveSessionName;
  const 枝 = ライブの枝();
  (名前 &&
    枝 &&
    fb.rtdb &&
    (0, i.off)((0, i.ref)(fb.rtdb, `live_sessions/${枝}/${名前}/state`)),
    在席を終える(e),
    写しを見るのをやめる(),
    e({ isLiveActive: !1, isHost: !1, liveSessionName: null, いまのライブの期限: null }));
  // 何度も出さない。見張りが複数あると同じ通知で二度三度呼ばれる
  if (期限 !== 期限を知らせた) {
    期限を知らせた = 期限;
    try {
      n.default.alert(
        '共有の期限が切れました',
        'このライブは、配った方も含めて全員がつながらなくなりました。お手元の記録は残っています。保存するか、ライブを始め直してください。'
      );
    } catch (t) {
      /* 知らせが出せなくても、離れることはできている */
    }
  }
  return !0;
}

/**
 * 共有リンクの期限の置き場所。枝ごとに数（ミリ秒）を1つ置く。
 *
 * ライブの中ではなく別の根に置く。中に置くと、参加一覧が枝を丸ごと読むときに
 * 「期限」という名のライブとして混ざる。決まり（database.rules.json）は
 * ここを見て、切れた枝の読み書きを丸ごと止める。
 *
 * 決まりで止めるので、改造した端末でも読めない。ただし決まりが効くのは
 * **つなぎ直したとき**で、すでに開いている見張りは切れた後も更新を受け取る。
 * そこで画面の側でも期限を見て閉じる（期限を過ぎていないか）。
 * 両方あって初めて「もう見えない」が成り立つ。
 */
const 期限の場所 = (枝) => `live_limits/${枝}`;

/** サーバーに合わせた「いま」。合わせられていなければ手元の時計 */
const いまの見当 = () => Date.now() + (時差が取れた ? サーバーとの時差 : 0);

/** サーバーの時計に合わせた「いま」。取れなければ手元の時計のまま */
const サーバー時刻 = async () => {
  if (!fb.rtdb) return Date.now();
  await 時差を見張る();
  return Date.now() + サーバーとの時差;
};
/**
 * 手元の履歴が伸びたぶんを、共有履歴にも積む。
 *
 * 置き場所（番号）は runTransaction で取る。手元の historySharedLen を
 * 読んで書くだけだと、2台が同時に操作したとき同じ番号を握り合い、
 * 後に書いたほうが先の手を上書きする。上書きされた手は控えから消える
 * だけでなく、誰かが取り消したときに「相手の入力を含まない盤面」が
 * 復元され、入れたはずの○×が消える。
 */
const 共有履歴へ積む = (前の盤面, 後の盤面, s) => {
  const 枝 = ライブの枝(),
     名前 = s().liveSessionName;
  if (!fb.rtdb || !枝 || !名前) return;
  const 履歴の根 = 共有履歴の場所(枝, 名前);
  const 状態の道 = `live_sessions/${枝}/${名前}/state`;
  const 本数 = s().shotsPerRound;
  // 盤面は今のうちに写しておく。場所が取れるまでに手元が変わりうる
  const 前 = 履歴用に整える(前の盤面);
  const 後 = 履歴用に整える(後の盤面);
  (0, i.runTransaction)((0, i.ref)(fb.rtdb, `${状態の道}/history_len`), (今の値) =>
    ('number' == typeof 今の値 ? 今の値 : 0) + 1
  )
    .then((結果) => {
      if (!結果 || !結果.committed) return;
      const 次 = 結果.snapshot.val();
      const 位置 = 次 - 1;
      // 盤面まるごとに加えて、○×だけの違いなら「変えたます」も持たせる。
      // 取り消しでそこだけ戻せば、2台が同時に入れても相手の手を消さずに済む。
      // まるごとの側は消さない。古い版のアプリはそちらしか読まないため
      // ○×だけの違いなら「変えたます」、形が変わる操作なら「変わった項目」。
      // どちらも作れないとき（射手の増減・並び替え・射数の変更）は、
      // まるごとの側だけで戻す
      const 差分 = 印だけの差分(前, 後);
      const 項目 = 差分 ? null : 項目の差分(前, 後);
      // 射数の変更は○×の数が変わるので、上のどちらにもできない。
      // 長さの伸び縮みだけを控えれば、頭のますに触らずに戻せる
      const 射数 = 差分 || 項目 ? null : 射数の差分(前, 後);
      (0, i.set)(
        (0, i.ref)(fb.rtdb, `${履歴の根}/${位置}`),
        Object.assign(
          { 前: 前, 後: 後, 本数: 本数, at: Date.now() },
          差分 ? { 差分: 差分 } : null,
          項目 ? { 項目: 項目 } : null,
          射数 ? { 射数: 射数 } : null
        )
      ).catch((e) => console.error('[Store] 共有履歴の書き込みに失敗:', e));
      // 新しい操作をしたので、やり直せる分はここで打ち切る
      ((0, i.update)((0, i.ref)(fb.rtdb, 状態の道), { history_max: 次 }).catch(() => {}),
        M.getState().updateState({ historySharedLen: 次, historySharedMax: 次 }));
      // 古い手を捨てる（上限を超えた分）
      if (次 > 共有履歴の上限)
        (0, i.remove)((0, i.ref)(fb.rtdb, `${履歴の根}/${次 - 共有履歴の上限 - 1}`)).catch(() => {});
    })
    .catch((e) => console.error('[Store] 共有履歴の場所取りに失敗:', e));
};
/**
 * ライブから届いた state から、共有履歴の目印と知らせを取り込む。
 * 主催者側と参加者側の両方で同じことをするので、ここへ出してある。
 */
const 共有履歴の目印を受け取る = (状態, e, s) => {
  if (!状態) return;
  const 変更 = {};
  if ('number' == typeof 状態.history_len) 変更.historySharedLen = 状態.history_len;
  if ('number' == typeof 状態.history_max) 変更.historySharedMax = 状態.history_max;
  // 参加して最初の1通は、その場で起きたことではなく「これまでの結果」。
  // 知らせを出すと、過去に一度でも取り消しがあったライブに入るたび
  // 「取り消しされました。」が出てしまうので、目印だけ引き取る
  if (s().historyIsFirstSnapshot) {
    ((変更.historyIsFirstSnapshot = !1), (変更.historyHandledAt = 状態.history_at || 0));
  } else if (状態.history_at && 状態.history_at !== s().historyHandledAt) {
    // 自分が起こしたものでなければ、画面に知らせる材料を渡す
    ((変更.historyHandledAt = 状態.history_at),
      (変更.historyNoticeAt = 状態.history_at),
      (変更.historyNoticeKind = 状態.history_kind || '取り消し'));
  }
  Object.keys(変更).length > 0 && e(変更);
};
/**
 * 履歴の1手を、射手の一覧として取り出す。
 *
 * 積むときは射手の一覧そのままにする決まりで、店の中の14か所はそうしている。
 * 画像の取り込みだけが { archers, activeSessionID } という形で積んでいた。
 * 取り消しは配列として扱うので、そのままだと空の盤面で戻ってしまう。
 * 積むほうは直したが、また形が崩れても盤面を消さないよう、ここで受け止める。
 */
const 履歴の一手 = (項目) =>
  Array.isArray(項目) ? 項目 : 項目 && Array.isArray(項目.archers) ? 項目.archers : [];
/**
 * 控えの盤面から、そのときの射数を読む。
 *
 * ○×は射数のぶんだけ並ぶ。射手を足すときも、射数を変えるときも、画像から
 * 取り込むときも、その長さにそろえてある。だから控えを見れば射数が分かり、
 * 控えの形（射手の一覧そのまま）を変えずに射数ごと戻せる。
 * 区切りの列は○×を持たないので飛ばす。
 */
const 控えの射数 = (一覧) => {
  const 並び = Array.isArray(一覧) ? 一覧 : [];
  const 使える = (a) => a && !a.isSeparator && Array.isArray(a.marks);
  // 「計」の列は数えない。本番には、射数12なのに「計」だけ○×が20個ある
  // 記録が実在する。そこから読むと、取り消しで射数が20に化ける
  const 射手 = 並び.find((a) => 使える(a) && !a.isTotalCalculator) || 並び.find(使える);
  return 射手 ? 射手.marks.length : null;
};
let I = !1;
// ライブ中の共有履歴。取り消し・やり直しを全員で1本の履歴として扱う。
// 取り消しの適用中は、その書き換え自体を履歴に積まないための目印。
let 履歴を積まない = !1;
/** 共有履歴に残す手数の上限。射手20人でも 1手あたり15KB程度 */
const 共有履歴の上限 = 30;
const M = (0, s.create)()(
  (0, d.persist)(
    (t, s) => {
      const e = (o) => {
        let i = 'function' == typeof o ? o(s()) : o;
        (i &&
          (i.sessions && (i.sessions = cleanUpSessions(i.sessions)),
          i.trash && (i.trash = cleanUpSessions(i.trash))),
          // ライブ中に手元の履歴が伸びたら、同じものを共有履歴にも積む。
          // 各操作を1つずつ書き換えずに済むよう、ここ1箇所で拾う
          i &&
            Array.isArray(i.historyStack) &&
            !履歴を積まない &&
            i.historyStack.length > (s().historyStack || []).length &&
            s().isLiveActive &&
            s().liveSessionName &&
            共有履歴へ積む(i.historyStack[i.historyStack.length - 1], i.archers || s().archers, s),
          t(i));
      };
      return {
        enableArrowLocation: !1,
        // 誤タップ防止。入れたますを少し経ってから閉じる。
        // 同期する中身ではなく、画面の上の守りなので archers には持たせない
        自動ロックする: !0,
        // 「終了・保存」を押したときに出欠確認を出すか。
        // 切ると、出欠の窓を飛ばして保存の窓へ進む。記録に出ている人は
        // 出欠画面でそのまま出席として数えられるので、毎回聞かれたくない
        // 団体はここで切れる（遅刻・早退の区別だけ付かなくなる）
        保存時に出欠を確認する: !0,
        // 記録表の並べ方。切り替えると、名前が左・○×が右へ伸びる横の表になる。
        // 端末ごとの好みなので残す（同じ団体でも人によって持ち方が違う）
        横に並べる: !1,
        // 記録画面の上下の帯を畳んでいるか。並べ方と同じく端末ごとの好みなので残す
        帯を畳む: !1,
        // ライブに「見るだけ」で入っているか。入れているときは盤面を書き換えない。
        // 端末には残さない（次に参加するときは、そのつど選ぶ）
        ライブは見るだけ: !1,
        自動ロックまでの秒: 3,
        // { 'archerId:射番': 入れた時刻 }。時間が経ったものを閉じたとみなす
        入れた時刻: {},
        // 長押しでますを開けた時刻。記録画面がこれを見て短く知らせる。
        // 端末に残す値ではないので、保存の対象には入れない
        鍵を開けた時刻: 0,
        // 閉じたますを押した時刻。開け方が分からないまま何度も押す人が
        // いるので、押されたら記録画面が「長押しで開きます」と知らせる
        閉じたますを押した時刻: 0,
        // 閲覧用のときにますを押した時刻。こちらは「閲覧用で参加しています」
        閲覧でますを押した時刻: 0,
        // 規約とプライバシーポリシーの同意を取り直す必要があるか。
        // 起動のたびにクラウドの記録から数え直すので、端末には残さない
        同意の確認が要る: !1,
        arrowTargetType: 'kasumi36',
        activeArrowLocationEdit: null,
        activeGroupId: null,
        activeGroupName: null,
        publicGroupId: null,
        activeRole: null,
        myMemberId: null,
        myMemberName: null,
        activeUserEmail: null,
        memberAuthVersion: 0,
        archers: [],
        members: [],
        alumni: [],
        history: [],
        sessions: [],
        trash: [],
        shotsPerRound: 8,
        activeSessionID: null,
        historyStack: [],
        redoStack: [],
        viewScale: 1,
        syncStatus: '未同期',
        lastSyncTime: null,
        offlineSaveWarning: null,
        // 完全に消した記録の控え（id → 消した時刻）。ゴミ箱から完全に削除した
        // けれど、その削除がまだクラウドへ届いていないものを覚えておく。
        // これが無いと、通信できないときに「削除 → ゴミ箱を空にする」と操作し、
        // 送信待ちが失われた場合に、消したはずの記録が次の取得で戻ってくる。
        // クラウドから消えたことを確認できたら控えも消す。
        permanentlyDeleted: {},
        // 消したメンバーのうち、まだクラウドへ届いていないものの控え。
        // 名簿の受け取りは「クラウドに在って手元に無いものは足す」ので、
        // これが無いと、送信が失われたときに消したメンバーが復活する。
        // 記録側の permanentlyDeleted と同じ考え方。
        deletedMembers: {},
        isNetworkOnline: !0,
        isAdminMode: !1,
        autoPromotionEnabled: !0,
        _pendingUpdateTimers: {},
        includeInStats: !0,
        lastLocalChange: 0,
        lastResetHandled: 0,
        // 入って最初の1通かどうか。最初の1通に載っている片付けは
        // 「入る前に起きたこと」なので知らせない（共有履歴の知らせと同じ考え方）
        resetIsFirstSnapshot: !1,
        lastPushedTimestamp: 0,
        // ライブ中の共有履歴の目印。len は「いま何手ぶん適用しているか」、
        // max は「やり直せる上限」。どちらも state 経由で全員に配られる
        historySharedLen: 0,
        historySharedMax: 0,
        historyIsFirstSnapshot: !1,
        // 取り消し・やり直しの通知を出したかどうかの控え
        historyHandledAt: 0,
        // 画面へ知らせるための材料（誰かが取り消した／やり直した）
        historyNoticeAt: 0,
        historyNoticeKind: null,
        showTrash: !1,
        sessionUnsubscribe: null,
        trashUnsubscribe: null,
        memberUnsubscribe: null,
        alumniUnsubscribe: null,
        configUnsubscribe: null,
        showAlumniInAnalysis: !1,
        showAlumniInPicker: !1,
        currentFreshmanTerm: 1,
        historyViewMode: 'list',
        selectedHistorySessionId: null,
        isAdminModePending: !1,
        isLiveActive: !1,
        isHost: !1,
        liveSessionName: null,
        // 帯にカウントダウンを出すために持つ。盤面に載ってくる期限の控え。
        // 期限が無いライブでは null（「期限なし」と「まだ来ていない」は
        // どちらも null でよい。帯は期限があるときしか出さないため）
        いまのライブの期限: null,
        isIncomingLiveSync: !1,
        liveSessionsList: [],
        analysisSelectedTags: [],
        analysisTagLogic: 'AND',
        historySelectedTags: [],
        historyTagLogic: 'AND',
        currentSessionTags: [],
        tagTemplates: ['#立', '#練習試合', '#大会', '#自主練習', '#合宿'],
        initializationLogs: [],
        syncIntervalId: null,
        lastPromotionYear: null,
        // 比較のひな型。端末に持つだけで、クラウドへは送らない。
        // 誰と誰を並べて見るかは、見る人の手元の都合で、団体で揃えるものではない
        比較のひな型: [],
        // ライブを置く枝の合言葉。{ 団体, 合言葉 } の形で持つ。
        // 団体まで一緒に持たないと、移った先で前の団体の枝を使ってしまう
        ライブの合言葉: null,
        // ライブにつないでいる台数。端末には残さない（開き直せば数え直す）
        ライブの接続台数: 0,
        // 共有のライブに入っているときの、そのライブ専用の枝。
        // 入っていなければ null で、そのときは団体の枝を使う
        いまのライブの枝: null,
        // 共有のライブの閲覧用の写しを置く枝。編集する側だけが持つ
        いまのライブの閲覧枝: null,
        // 閲覧用のリンクで入っているか。写しを読むだけで、何も書かない
        写しを見ているか: !1,
        // 共有リンクだけで来ている人か（団体に入っていない）。
        // 端末には残さない。閉じたら終わり、リンクを開き直せばまた入れる
        共有の来客: !1,
        // いま入っているのが、よその団体のライブか。
        // 共有リンクで入ったときに決める。自分の団体のライブなら偽
        よその団体のライブ: !1,
        // 共有のライブの道しるべ。{ ライブ名: { 共有の枝, 閲覧の枝 } }。
        // 参加一覧を読むたびに作り直すので、端末には残さない
        共有のライブたち: {},
        _pendingMemberTimers: {},
        isHydrated: !1,
        analysisRankingSettings: {
          '月ごと': {
            type: 'ratio',
            value: 0,
          },
          '期間指定': {
            type: 'ratio',
            value: 0,
          },
          '直近30日': {
            type: 'ratio',
            value: 0,
          },
          '今年度': {
            type: 'ratio',
            value: 0,
          },
          'すべて': {
            type: 'ratio',
            value: 0,
          },
        },
        focusedMemberId: null,
        currentRouteName: null,
        updateLoadingLog: (t) => {
          const o = s().initializationLogs || [];
          (e({
            initializationLogs: [...o, t],
          }),
            console.log('[Store] Loading:', t));
        },
        setCurrentRouteName: (s) =>
          e({
            currentRouteName: s,
          }),
        setMemberAuthVersion: (s) => e({ memberAuthVersion: s }),
        setFocusedMemberId: (s) =>
          e({
            focusedMemberId: s,
          }),
        setAuth: (t, o, a, i = null, n = null, c = null, l = null) => {
          null === t
            ? // 出たら行動の控えも捨てる。次に入った人の不具合の便りに、
              // 前の人が何をしていたかが付いていくのは筋が悪い
              (行動の控えを捨てる(),
              (合言葉の取り寄せ = null),
              e({
                // ライブの合言葉も捨てる。団体を見て弾いてはいるが、
                // 出た人の端末に団体の秘密を残す理由が無い
                ライブの合言葉: null,
                activeGroupId: null,
                activeGroupName: null,
                publicGroupId: null,
                activeRole: null,
                myMemberId: null,
                myMemberName: null,
                activeUserEmail: null,
                sessions: [],
                members: [],
                history: [],
                alumni: [],
                trash: [],
                archers: [],
                activeSessionID: null,
                analysisSelectedTags: [],
                historySelectedTags: [],
                historyTagLogic: 'AND',
                tagTemplates: ['立', '練習試合', '大会', '自主練習', '合宿'],
                initializationLogs: [],
                isAdminMode: !1,
                isAdminModePending: !1,
              }),
              s().stopPeriodicSync(),
              s().stopListeningToSessions(),
              s().stopListeningToMembers(),
              s().stopListeningToAlumni(),
              s().stopListeningToTrash(),
              s().configUnsubscribe &&
                (s().configUnsubscribe(),
                e({
                  configUnsubscribe: null,
                })))
            : (e({
                activeGroupId: t,
                activeGroupName: c || s().activeGroupName,
                activeRole: o,
                myMemberId: a,
                myMemberName: l || s().myMemberName,
                activeUserEmail: i,
                publicGroupId: n || ('group' === o ? t : s().publicGroupId),
                isAdminMode: !1,
                isAdminModePending: !1,
              }),
              s().listenToConfig(),
              s().listenToSessions(),
              s().listenToMembers(),
              s().listenToAlumni(),
              s().listenToTrash());
        },
        setAnalysisSelectedTags: (s) =>
          e({
            analysisSelectedTags: s,
          }),
        toggleAnalysisTag: (t) => {
          const o = s().analysisSelectedTags || [];
          o.includes(t)
            ? e({
                analysisSelectedTags: o.filter((e) => e !== t),
              })
            : e({
                analysisSelectedTags: [...o, t],
              });
        },
        setAnalysisTagLogic: (s) =>
          e({
            analysisTagLogic: s,
          }),
        比較のひな型を足す: (名前, 部員idたち) =>
          e({
            比較のひな型: ひ.ひな型を足す(s().比較のひな型, {
              名前,
              部員idたち,
              団体id: s().activeGroupId || '',
            }),
          }),
        比較のひな型を消す: (id) =>
          e({
            比較のひな型: ひ.ひな型を消す(s().比較のひな型, id),
          }),
        setAnalysisRankingSetting: async (o, i) => {
          const n = Date.now(),
            c = s().analysisRankingSettings || {},
            l = Object.assign({}, c, {
              [o]: i,
            });
          e({
            analysisRankingSettings: l,
            lastLocalChange: n,
          });
          const { activeGroupId: d, isNetworkOnline: u } = s();
          if (u && d)
            try {
              await (0, a.setDoc)(
                (0, a.doc)(fb.db, `groups/${d}/config`, 'app_settings'),
                {
                  analysisRankingSettings: l,
                  lastModified: (0, a.serverTimestamp)(),
                },
                {
                  merge: !0,
                }
              );
            } catch (e) {
              console.error('[Store] setAnalysisRankingSetting sync error:', e);
            }
        },
        setHistorySelectedTags: (s) =>
          e({
            historySelectedTags: s,
          }),
        toggleHistoryTag: (t) => {
          const o = s().historySelectedTags || [];
          o.includes(t)
            ? e({
                historySelectedTags: o.filter((e) => e !== t),
              })
            : e({
                historySelectedTags: [...o, t],
              });
        },
        setHistoryTagLogic: (s) =>
          e({
            historyTagLogic: s,
          }),
        setCurrentSessionTags: (s) =>
          e({
            currentSessionTags: s,
          }),
        toggleCurrentSessionTag: (t) => {
          const o = s().currentSessionTags || [];
          o.includes(t)
            ? e({
                currentSessionTags: o.filter((e) => e !== t),
              })
            : e({
                currentSessionTags: [...o, t],
              });
        },
        setTagTemplates: async (o) => {
          const i = Date.now();
          const r = Array.from(new Set((o || []).map(normalizeTag).filter(Boolean)));
          e({
            tagTemplates: r,
            lastLocalChange: i,
          });
          const { activeGroupId: n, isNetworkOnline: c } = s();
          if (c && n)
            try {
              await (0, a.setDoc)(
                (0, a.doc)(fb.db, `groups/${n}/config`, 'app_settings'),
                {
                  tagTemplates: r,
                  currentFreshmanTerm: s().currentFreshmanTerm,
                  lastModified: (0, a.serverTimestamp)(),
                },
                {
                  merge: !0,
                }
              );
            } catch (e) {
              console.error('[Store] setTagTemplates sync error:', e);
            }
        },
        addTagTemplate: async (o) => {
          const i = s().tagTemplates || [];
          const r = normalizeTag(o);
          if (r && !i.includes(r)) {
            const n = Date.now(),
              c = [...i, r];
            e({
              tagTemplates: c,
              lastLocalChange: n,
            });
            const { activeGroupId: l, isNetworkOnline: d } = s();
            if (d && l)
              try {
                await (0, a.setDoc)(
                  (0, a.doc)(fb.db, `groups/${l}/config`, 'app_settings'),
                  {
                    tagTemplates: c,
                    currentFreshmanTerm: s().currentFreshmanTerm,
                    lastModified: (0, a.serverTimestamp)(),
                  },
                  {
                    merge: !0,
                  }
                );
              } catch (e) {
                console.error('[Store] addTagTemplate sync error:', e);
              }
          }
        },
        removeTagTemplate: async (o) => {
          const i = Date.now(),
            n = (s().tagTemplates || []).filter((e) => e !== o);
          e({
            tagTemplates: n,
            lastLocalChange: i,
          });
          const { activeGroupId: c, isNetworkOnline: l } = s();
          if (l && c)
            try {
              await (0, a.setDoc)(
                (0, a.doc)(fb.db, `groups/${c}/config`, 'app_settings'),
                {
                  tagTemplates: n,
                  currentFreshmanTerm: s().currentFreshmanTerm,
                  lastModified: (0, a.serverTimestamp)(),
                },
                {
                  merge: !0,
                }
              );
            } catch (e) {
              console.error('[Store] removeTagTemplate sync error:', e);
            }
        },
        setShowAlumniInAnalysis: (s) =>
          e({
            showAlumniInAnalysis: s,
          }),
        setShowAlumniInPicker: (s) =>
          e({
            showAlumniInPicker: s,
          }),
        setIncludeInStats: (s) =>
          e({
            includeInStats: s,
          }),
        addArcher: (t, o) => {
          if (s().書き換えを止めるか()) return;
          const a = Array.isArray(s().archers) ? s().archers : [],
            i = {
              id: (0, l.generateUUID)(),
              name: '',
              marks: Array(s().shotsPerRound || 8).fill(''),
              arrowLocations: Array(s().shotsPerRound || 8).fill(null),
              gender: o || '未設定',
              grade: 1,
              isGuest: !1,
              isSeparator: !1,
              isTotalCalculator: !1,
              lockedBlocks: {},
              lastModified: Date.now(),
            },
            n = 'number' != typeof t || isNaN(t) ? [...a, i] : [...a];
          if ('number' == typeof t && !isNaN(t)) {
            const e = Math.max(0, Math.min(t, n.length));
            n.splice(e, 0, i);
          }
          e({
            archers: n,
            historyStack: [...s().historyStack, a],
            redoStack: [],
            lastLocalChange: Date.now(),
          });
          const { isLiveActive: c, liveSessionName: d, shotsPerRound: u } = s();
          c && d && v(d, n, u);
        },
        addSeparator: (t) => {
          if (s().書き換えを止めるか()) return;
          const o = Array.isArray(s().archers) ? s().archers : [],
            a = {
              id: 'sep-' + (0, l.generateUUID)(),
              name: '---',
              marks: [],
              isSeparator: !0,
              gender: '未設定',
              grade: 0,
              isGuest: !1,
              isTotalCalculator: !1,
              lockedBlocks: {},
              lastModified: Date.now(),
            },
            i = 'number' == typeof t ? [...o] : [...o, a];
          ('number' == typeof t && i.splice(t, 0, a),
            e({
              archers: i,
              historyStack: [...s().historyStack, o],
              redoStack: [],
              lastLocalChange: Date.now(),
            }));
          const { isLiveActive: n, liveSessionName: c, shotsPerRound: d } = s();
          n && c && v(c, i, d);
        },
        addTotalCalculator: (t) => {
          if (s().書き換えを止めるか()) return;
          const o = Array.isArray(s().archers) ? s().archers : [],
            a = {
              id: 'total-' + (0, l.generateUUID)(),
              name: '計',
              marks: Array(s().shotsPerRound || 8).fill(''),
              arrowLocations: Array(s().shotsPerRound || 8).fill(null),
              isTotalCalculator: !0,
              gender: '未設定',
              grade: 0,
              isGuest: !1,
              isSeparator: !1,
              lockedBlocks: {},
              lastModified: Date.now(),
            },
            i = 'number' == typeof t ? [...o] : [...o, a];
          ('number' == typeof t && i.splice(t, 0, a),
            e({
              archers: i,
              historyStack: [...s().historyStack, o],
              redoStack: [],
              lastLocalChange: Date.now(),
            }));
          const { isLiveActive: n, liveSessionName: c, shotsPerRound: d } = s();
          n && c && v(c, i, d);
        },
        deleteArcher: (t) => {
          if (s().書き換えを止めるか()) return;
          const o = Array.isArray(s().archers) ? s().archers : [],
            a = o.filter((e) => e && e.id !== t),
            i = Date.now();
          e({
            historyStack: [...s().historyStack, o],
            redoStack: [],
            archers: a,
            lastLocalChange: i,
          });
          const { isLiveActive: n, liveSessionName: c, shotsPerRound: l } = s();
          n && c && v(c, a, l);
        },
        applyOCRResult: (t) => {
          if (s().書き換えを止めるか()) return; // 閲覧用では画像から読み取った結果の取り込みも止める
          const o = Array.isArray(s().archers) ? s().archers : [],
            i = Date.now();
          e({
            archers: t,
            historyStack: [...s().historyStack, o],
            redoStack: [],
            lastLocalChange: i,
          });
          const { isLiveActive: n, liveSessionName: c, shotsPerRound: l } = s();
          n && c && v(c, t, l);
        },
        set自動ロックする: (t) => e({ 自動ロックする: t, 入れた時刻: {} }),
        set保存時に出欠を確認する: (t) => e({ 保存時に出欠を確認する: t }),
        set横に並べる: (t) => e({ 横に並べる: !!t }),
        set帯を畳む: (t) => e({ 帯を畳む: !!t }),
        setライブは見るだけ: (t) => e({ ライブは見るだけ: !!t }),
        // 見るだけで入っているあいだは盤面を触らせない。
        // 画面側の isReadOnly は鍵ボタンしか止めないので、根元で止める
        書き換えを止めるか: () => !!(s().isLiveActive && s().ライブは見るだけ),
        /**
         * 保存を止めるか。
         *
         * よその団体のライブに共有リンクで入っているときは保存しない。
         * 保存すると、その練習が自分の団体の記録として残り、分析にも混ざる。
         * 記録そのものは主催者の側で保存されるので、失われはしない
         */
        保存を止めるか: () => !!(s().isLiveActive && s().よその団体のライブ),
        // まとめて入った○×に「いま入れた」印を付ける。
        // 画像からの反映は toggleMark を通らないので印が付かず、
        // そのままだと「読み込み直したもの」と見なして初めから閉じてしまう。
        // 読み取りの直しが全部長押しになるのを防ぐ
        入れた印をまとめて付ける: (一覧) =>
          s().書き換えを止めるか()
            ? void 0
            :
          e((前) => {
            const 印 = Object.assign({}, 前.入れた時刻);
            const いま = Date.now();
            (Array.isArray(一覧) ? 一覧 : []).forEach((a) => {
              if (!a || !a.id || !Array.isArray(a.marks)) return;
              a.marks.forEach((m, i) => {
                if (m) 印[a.id + ':' + i] = いま;
              });
            });
            return { 入れた時刻: 印 };
          }),
        // 長押しで、そのますだけ開ける。
        // 数え直しにしてある。開けたあと、また少し経てば閉じる。
        //
        // 開けたことを画面に知らせる。灰色が戻るだけでは、押さえが届いたのか
        // 分かりにくい。知らせは記録画面が拾って短く出す（リセットと同じ作り）
        // 閉じたますが押されたことを伝える。盤面は変えないので、
        // 見るだけで入っている人でも知らせは出す（開け方は同じだから）
        // 閲覧用のときは知らせない。閲覧用は ますを開ける も止めてあるので、
        // 「長押しで開きます」と言うと、開かないことをやらせることになる。
        // 閲覧用の知らせは記録画面が別に出す
        閉じたますが押された: () => {
          // 閲覧用は ますを開ける も止めてあるので「長押しで開きます」とは
          // 言えない。閲覧用だと伝える側へ回す
          if (s().書き換えを止めるか()) return void e({ 閲覧でますを押した時刻: Date.now() });
          e({ 閉じたますを押した時刻: Date.now() });
        },
        ますを開ける: (射手, 番) =>
          s().書き換えを止めるか()
            ? void 0
            :
          e((前) => ({
            入れた時刻: Object.assign({}, 前.入れた時刻, { [射手 + ':' + 番]: Date.now() }),
            鍵を開けた時刻: Date.now(),
          })),
        setEnableArrowLocation: (t) =>
          e({
            enableArrowLocation: t,
          }),
        setArrowTargetType: (t) =>
          e({
            arrowTargetType: t,
          }),
        setActiveArrowLocationEdit: (t) =>
          e({
            activeArrowLocationEdit: t,
          }),
        updateArrowLocation: (t, o, a) => {
          if (s().書き換えを止めるか()) return; // 閲覧用では矢所（ライブにも送られる）も止める
          const { archers: i } = s(),
            n = Date.now(),
            c = (i || []).map((e) => {
              if (e.id === t) {
                const s = [...(e.arrowLocations || [])];
                return (
                  (s[o] = a),
                  Object.assign({}, e, {
                    arrowLocations: s,
                    lastModified: n,
                  })
                );
              }
              return e;
            });
          e({
            archers: c,
            historyStack: [...s().historyStack, i],
            redoStack: [],
            lastLocalChange: n,
          });
          // ライブ中は矢所も送る。送らないと相手の画面に出ないうえ、
          // 相手からの更新で手元の矢所が消えていた
          const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = s();
          ライブ中 && ライブ名 && v(ライブ名, c, 本数);
        },
        updateMark: (t, o, a) => {
          if (s().書き換えを止めるか()) return; // 閲覧用では○×の直接の書き換えも止める
          const { archers: i, isLiveActive: n, liveSessionName: c } = s(),
            l = Date.now(),
            d = (i || []).map((e) => {
              if (e.id === t) {
                const s = [...(e.marks || [])];
                return (
                  (s[o] = a),
                  Object.assign({}, e, {
                    marks: s,
                    lastModified: l,
                  })
                );
              }
              return e;
            });
          (e({
            archers: d,
            historyStack: [...s().historyStack, i],
            redoStack: [],
            lastLocalChange: l,
          }),
            n && c && T(c, t, o, a, l));
        },
        toggleMark: (t, o) => {
          // 閲覧用は黙って何も起きないと、壊れたと思わせる
          if (s().書き換えを止めるか()) return void e({ 閲覧でますを押した時刻: Date.now() });
          const { archers: a, isLiveActive: i, liveSessionName: n } = s(),
            c = Date.now();
          let l = '';
          const d = (a || []).map((e) => {
            if (e.id === t) {
              const s = [...(e.marks || [])],
                t = s[o],
                a = '' === t ? '○' : '○' === t ? '\xd7' : '';
              return (
                (s[o] = a),
                (l = a),
                Object.assign({}, e, {
                  marks: s,
                  lastModified: c,
                })
              );
            }
            return e;
          });
          const 鍵 = t + ':' + o;
          (e({
            archers: d,
            historyStack: [...s().historyStack, a],
            redoStack: [],
            lastLocalChange: c,
            // 入れ直したますは、また少し経ってから閉じる
            入れた時刻: Object.assign({}, s().入れた時刻, { [鍵]: c }),
          }),
            i && n && T(n, t, o, l, c));
        },
        clearArcherMarks: (t) => {
          if (s().書き換えを止めるか()) return; // 閲覧用ではその人の○×の消去も止める
          const o = Array.isArray(s().archers) ? s().archers : [],
            a = Date.now(),
            i = o.map((e) =>
              e && e.id === t
                ? Object.assign({}, e, {
                    marks: Array(s().shotsPerRound).fill(''),
                    lastModified: a,
                  })
                : e
            );
          e({
            historyStack: [...s().historyStack, o],
            redoStack: [],
            lastLocalChange: a,
            archers: i,
          });
          const { isLiveActive: n, liveSessionName: c, shotsPerRound: l } = s();
          n && c && v(c, i, l);
        },
        // 1立が全部埋まって少し経つと、画面側からここが呼ばれる。
        // toggleLock と違って必ず「閉じる」側に倒す。
        // 取り消しの控えには積まない（押した覚えのない操作が戻ると分かりにくい）
        立を閉じる: (t, o) => {
          if (s().書き換えを止めるか()) return;
          const { archers: a } = s(),
            i = Array.isArray(a) ? a : [],
            n = i.findIndex((e) => e && e.id === t);
          if (-1 === n) return;
          if (i[n].lockedBlocks?.[o]) return;
          let d = n;
          for (; d > 0 && i[d - 1] && !i[d - 1].isSeparator && !i[d - 1].isTotalCalculator; ) d--;
          const u = Date.now(),
            m = i.map((e, s) => {
              if (e && s >= d && s <= n) {
                const s = Object.assign({}, e.lockedBlocks || {});
                return ((s[o] = !0), Object.assign({}, e, { lockedBlocks: s, lastModified: u }));
              }
              return e;
            });
          e({ archers: m, lastLocalChange: u });
          const { isLiveActive: p, liveSessionName: h, shotsPerRound: f } = s();
          p && h && v(h, m, f);
        },
        toggleLock: (t, o) => {
          const { archers: a } = s(),
            i = Array.isArray(a) ? a : [],
            n = i.findIndex((e) => e && e.id === t);
          if (-1 === n) return;
          const c = i[n],
            l = !c.lockedBlocks?.[o];
          let d = n;
          for (; d > 0 && i[d - 1] && !i[d - 1].isSeparator && !i[d - 1].isTotalCalculator;) d--;
          const u = Date.now(),
            m = i.map((e, s) => {
              if (e && s >= d && s <= n) {
                const s = Object.assign({}, e.lockedBlocks || {});
                return (
                  (s[o] = l),
                  Object.assign({}, e, {
                    lockedBlocks: s,
                    lastModified: u,
                  })
                );
              }
              return e;
            });
          e({
            historyStack: [...s().historyStack, i],
            redoStack: [],
            lastLocalChange: u,
            archers: m,
          });
          const { isLiveActive: p, liveSessionName: h, shotsPerRound: f } = s();
          p && h && v(h, m, f);
        },
        setArcherMember: (t, o) => {
          if (s().書き換えを止めるか()) return;
          const a = Array.isArray(s().archers) ? s().archers : [],
            i = o?.equipments?.length ? [...o.equipments].sort((e, s) => s.date - e.date)[0]?.weight : void 0,
            n = a.map((e) =>
              e && e.id === t
                ? Object.assign({}, e, {
                    name: o ? o.name : '',
                    gender: o ? o.gender : '未設定',
                    grade: o ? o.grade : 1,
                    memberId: o ? o.id : void 0,
                    isGuest: !1,
                    bowWeight: i || e.bowWeight,
                    lastModified: Date.now(),
                  })
                : e
            );
          e({
            historyStack: [...s().historyStack, a],
            redoStack: [],
            lastLocalChange: Date.now(),
            archers: n,
          });
          const { isLiveActive: c, liveSessionName: l, shotsPerRound: d } = s();
          c && l && v(l, n, d);
        },
        setArcherBowWeight: (t, o) => {
          if (s().書き換えを止めるか()) return; // 閲覧用では弓力も止める
          const a = (Array.isArray(s().archers) ? s().archers : []).map((e) =>
            e && e.id === t
              ? Object.assign({}, e, {
                  bowWeight: o,
                  lastModified: Date.now(),
                })
              : e
          );
          e({
            lastLocalChange: Date.now(),
            archers: a,
          });
          const { isLiveActive: i, liveSessionName: n, shotsPerRound: c } = s();
          i && n && v(n, s().archers, c);
        },
        setArcherGuestName: (t, o) => {
          if (s().書き換えを止めるか()) return;
          const a = (Array.isArray(s().archers) ? s().archers : []).map((e) =>
            e && e.id === t
              ? Object.assign({}, e, {
                  name: o,
                  isGuest: !0,
                  gender: '未設定',
                  memberId: void 0,
                  lastModified: Date.now(),
                })
              : e
          );
          e({
            historyStack: [...s().historyStack, Array.isArray(s().archers) ? s().archers : []],
            redoStack: [],
            lastLocalChange: Date.now(),
            archers: a,
          });
          const { isLiveActive: i, liveSessionName: n, shotsPerRound: c } = s();
          i && n && v(n, s().archers, c);
        },
        setArcherGender: (t, o) => {
          if (s().書き換えを止めるか()) return; // 閲覧用では性別も止める
          const a = (Array.isArray(s().archers) ? s().archers : []).map((e) =>
            e && e.id === t
              ? Object.assign({}, e, {
                  gender: o,
                  lastModified: Date.now(),
                })
              : e
          );
          e({
            lastLocalChange: Date.now(),
            archers: a,
          });
          const { isLiveActive: i, liveSessionName: n, shotsPerRound: c } = s();
          i && n && v(n, s().archers, c);
        },
        // ライブ中は全員で1本の履歴を使う。誰が押しても「最後の1手」が戻る
        undo: () => {
          if (s().書き換えを止めるか()) return;
          if (s().isLiveActive && s().liveSessionName) return void s().sharedUndo(-1);
          const { historyStack: t, archers: o } = s();
          if (0 === t.length) return;
          // 中身が変わった射手には新しい日時を打ち直す。打たないと、ライブ中の
          // 取り消しが相手に届かず、主催者の画面だけ戻る食い違いになる
          const 戻す元 = 履歴の一手(t[t.length - 1]);
          // 射数の変更も一手なので、控えが持っていた射数へ戻す
          const 射数 = 控えの射数(戻す元) ?? s().shotsPerRound;
          const a = restampChangedArchers(盤面を射数にそろえる(戻す元, 射数), o, Date.now());
          e({
            historyStack: t.slice(0, -1),
            redoStack: [...s().redoStack, o],
            archers: a,
            shotsPerRound: 射数,
            lastLocalChange: Date.now(),
          });
          const { isLiveActive: i, liveSessionName: n } = s();
          i && n && v(n, s().archers, 射数);
        },
        redo: () => {
          if (s().書き換えを止めるか()) return;
          if (s().isLiveActive && s().liveSessionName) return void s().sharedUndo(1);
          const { redoStack: t, archers: o } = s();
          if (0 === t.length) return;
          // 取り消しと同じ理由で日時を打ち直す。射数を戻すのも同じ
          const 戻す元 = 履歴の一手(t[t.length - 1]);
          const 射数 = 控えの射数(戻す元) ?? s().shotsPerRound;
          const a = restampChangedArchers(盤面を射数にそろえる(戻す元, 射数), o, Date.now());
          e({
            redoStack: t.slice(0, -1),
            historyStack: [...s().historyStack, o],
            archers: a,
            shotsPerRound: 射数,
            lastLocalChange: Date.now(),
          });
          const { isLiveActive: i, liveSessionName: n } = s();
          i && n && v(n, s().archers, 射数);
        },
        /**
         * ライブ中の取り消し（向き -1）・やり直し（向き +1）。
         *
         * 全員で1本の履歴を使う。誰が押しても「最後の1手」が戻り、結果は
         * 盤面としてライブへ流れるので全員の画面が揃う。
         * 同時に押された場合は重なることがあるが、盤面は必ず一致する。
         */
        sharedUndo: async (向き) => {
          // 閲覧用はライブ全体を巻き戻せない。1人が見ているだけのつもりで
          // 押しても、全員の○×が戻ってしまう
          if (s().書き換えを止めるか()) return;
          const { liveSessionName: 名前 } = s();
          const 枝 = ライブの枝();
          if (!fb.rtdb || !枝 || !名前) return;
          const 根 = `live_sessions/${枝}/${名前}`;
          try {
            // 目印は state から配られてくる。手元の控えより新しいことがある
            const 状態 = await (0, i.get)((0, i.ref)(fb.rtdb, `${根}/state`));
            const v0 = 状態.exists() ? 状態.val() || {} : {};
            const 位置 = 'number' == typeof v0.history_len ? v0.history_len : s().historySharedLen || 0;
            const 上限 = 'number' == typeof v0.history_max ? v0.history_max : s().historySharedMax || 0;
            const 読む番号 = 向き < 0 ? 位置 - 1 : 位置;
            if (向き < 0 ? 位置 <= 0 : 位置 >= 上限) return; // これ以上は戻せない／進めない
            const 手 = await (0, i.get)(
              (0, i.ref)(fb.rtdb, `${共有履歴の場所(枝, 名前)}/${読む番号}`)
            );
            if (!手.exists()) return;
            const 中身 = 手.val() || {};
            const 次 = 位置 + 向き;
            const 知らせ時刻 = Date.now();
            // 「変えたます」の控えがあれば、そこだけ戻す。盤面まるごと戻すと、
            // 2台が同時に入れたとき、控えの前に相手の入力が入っていないため
            // 相手の○×まで消える。古い版が積んだ控えには差分が無いので、
            // そのときは従来どおり盤面で戻す
            const 差分 = Array.isArray(中身.差分) ? 中身.差分 : null;
            const 項目 = Array.isArray(中身.項目) ? 中身.項目 : null;
            // 射数の控えは射手ごとの表を持つので、配列ではなく object
            const 射数 =
              !差分 && !項目 && 中身.射数 && 'number' == typeof 中身.射数.前 ? 中身.射数 : null;
            const 盤面 = 差分
              ? {
                  archers: 差分を当てる(s().archers, 差分, 向き).archers,
                  shotsPerRound: s().shotsPerRound,
                }
              : 項目
                ? {
                    archers: 項目差分を当てる(s().archers, 項目, 向き).archers,
                    shotsPerRound: s().shotsPerRound,
                  }
                : 射数
                  ? (() => {
                      const 出 = 射数差を当てる(s().archers, 射数, 向き);
                      return { archers: 出.archers, shotsPerRound: 出.本数 };
                    })()
                  : w({
                      archers: 向き < 0 ? 中身.前 : 中身.後,
                      shotsPerRound: 中身.本数,
                    });
            // 戻した内容が相手に届くよう、変わった射手の日時を打ち直す
            const 戻す = restampChangedArchers(盤面.archers, s().archers, 知らせ時刻);
            // ここでの書き換えは履歴に積まない（積むと際限がなくなる）
            履歴を積まない = !0;
            try {
              e({
                archers: 戻す,
                shotsPerRound: 盤面.shotsPerRound,
                historySharedLen: 次,
                historySharedMax: 上限,
                // 押した本人にも知らせる。自分の送信の返りは弾く作りなので、
                // ここで立てないと本人にだけ知らせが出ない。
                // historyHandledAt を同じ値にしておくと、返りが届いても二重に出ない
                historyHandledAt: 知らせ時刻,
                historyNoticeAt: 知らせ時刻,
                historyNoticeKind: 向き < 0 ? '取り消し' : 'やり直し',
                lastLocalChange: 知らせ時刻,
              });
            } finally {
              履歴を積まない = !1;
            }
            // 盤面を全員へ流し、あわせて「取り消された」ことを知らせる
            (v(名前, 戻す, 盤面.shotsPerRound),
              (0, i.update)((0, i.ref)(fb.rtdb, `${根}/state`), {
                history_len: 次,
                history_max: 上限,
                history_at: 知らせ時刻,
                history_kind: 向き < 0 ? '取り消し' : 'やり直し',
              }).catch(() => {}));
          } catch (t) {
            console.error('[Store] 共有の取り消しに失敗:', t);
          }
        },
        addMember: (o, i, c, d) => {
          if (!s().activeGroupId || 'group' !== s().activeRole)
            return void n.default.alert(
              '権限エラー',
              'メンバーの追加は団体ログイン、かつ管理者のみ可能です。'
            );
          const u = o ? o.trim() : '',
            m = {
              id: (0, l.generateUUID)(),
              personalId: h(s().members, s().alumni),
              name: u,
              gender: i,
              grade: c,
              termKi: d || s().currentFreshmanTerm - (c - 1),
              lastModified: Date.now(),
              syncStatus: '未同期',
            };
          if (
            (e({
              members: [...s().members, m],
              lastLocalChange: Date.now(),
            }),
            s().activeGroupId)
          ) {
            const o = Object.assign({}, m, {
              lastModified: (0, a.serverTimestamp)(),
              syncStatus: '同期済み',
            });
            (0, a.setDoc)((0, a.doc)(fb.db, `groups/${s().activeGroupId}/members`, m.id), o)
              .then(() => {
                s().syncMemberLookup();
                // 印を付けるのは送った版だけ。送信中に編集されると更新日時が
                // 変わるので、一致する場合に限る（記録側と同じ考え方）。
                e((e) => ({
                  members: e.members.map((e) =>
                    e && e.id === m.id && e.lastModified === m.lastModified
                      ? Object.assign({}, e, {
                          syncStatus: '同期済み',
                        })
                      : e
                  ),
                }));
              })
              .catch((e) => console.error('Add Member Sync Error:', e));
          }
        },
        updateMember: (o, i) => {
          if (!s().activeGroupId || 'group' !== s().activeRole)
            return void n.default.alert('権限エラー', 'メンバーの編集は団体ログイン時のみ可能です。');
          if (void 0 !== i.grade) {
            const e = new Date(),
              s = e.getFullYear(),
              t = e.getMonth() + 1,
              o = t >= 4 ? s : s - 1;
            5 === Number(i.grade) ? (i.graduationYear = o) : (i.graduationYear = null);
          }
          s().members.find((e) => e.id === o);
          let c = Object.assign({}, i);
          if (void 0 !== i.grade && void 0 === i.termKi) {
            const e = s().currentFreshmanTerm - (i.grade - 1);
            c.termKi = e;
          }
          const l = s().members.map((e) =>
            e.id === o
              ? Object.assign({}, e, c, {
                  lastModified: Date.now(),
                  syncStatus: '未同期',
                })
              : e
          );
          e({
            members: l,
            lastLocalChange: Date.now(),
          });
          if (void 0 !== i.name || void 0 !== i.gender || void 0 !== i.grade) {
            const n = (e) => {
                let s = !1;
                return {
                  newList: e.map((e) => {
                    if (!e || !e.archers) return e;
                    let t = !1;
                    const a = e.archers
                      .map((e) =>
                        e.memberId === o
                          ? ((t = !0),
                            Object.assign({}, e, {
                              name: void 0 !== i.name ? i.name : e.name,
                              gender: void 0 !== i.gender ? i.gender : e.gender,
                              grade: void 0 !== i.grade ? i.grade : e.grade,
                              lastModified: Date.now(),
                            }))
                          : e
                      )
                      .map((e) => {
                        if (e.substitutionIds) {
                          let s = !1;
                          const a = Object.assign({}, e.substitutions || {});
                          if (
                            (Object.entries(e.substitutionIds).forEach(([e, t]) => {
                              const n = Number(e);
                              t === o && void 0 !== i.name && ((a[n] = i.name), (s = !0));
                            }),
                            s)
                          )
                            return (
                              (t = !0),
                              Object.assign({}, e, {
                                substitutions: a,
                                lastModified: Date.now(),
                              })
                            );
                        }
                        return e;
                      });
                    if (t) {
                      s = !0;
                      const t = Array.from(
                        new Set(a.map((e) => (e && e.name ? e.name.trim() : '')).filter(Boolean))
                      );
                      return Object.assign({}, e, {
                        archers: a,
                        archerNames: t,
                        lastModified: Date.now(),
                      });
                    }
                    return e;
                  }),
                  changed: s,
                };
              },
              c = s().sessions,
              l = s().trash,
              { newList: d, changed: u } = n(c),
              { newList: m, changed: p } = n(l);
            if (
              (u || p) &&
              (e({
                sessions: d,
                trash: m,
                lastLocalChange: Date.now(),
              }),
              s().activeGroupId)
            ) {
              const e = (0, a.writeBatch)(fb.db);
              let o = 0;
              (u &&
                d.forEach((i, n) => {
                  if (i.lastModified !== c[n].lastModified) {
                    const n = JSON.parse(JSON.stringify(i));
                    ((n.lastModified = (0, a.serverTimestamp)()),
                      e.set((0, a.doc)(fb.db, `groups/${s().activeGroupId}/sessions`, i.id), n, {
                        merge: !0,
                      }),
                      o++);
                  }
                }),
                p &&
                  m.forEach((i, n) => {
                    if (i.lastModified !== l[n].lastModified) {
                      const n = JSON.parse(JSON.stringify(i));
                      ((n.lastModified = (0, a.serverTimestamp)()),
                        e.set((0, a.doc)(fb.db, `groups/${s().activeGroupId}/trash`, i.id), n, {
                          merge: !0,
                        }),
                        o++);
                    }
                  }),
                o > 0 && e.commit().catch((e) => console.error('Member Linkage Sync Error:', e)));
            }
          }
          s().activeGroupId &&
            (p[o] && clearTimeout(p[o]),
            (p[o] = setTimeout(async () => {
              const i = s().members.find((e) => e.id === o);
              if (i) {
                // 送った版の更新日時。送信中にもう一度編集された場合、その
                // 新しい内容に「同期済み」を付けないための目印。
                const 送った版 = i.lastModified;
                const n = Object.assign({}, i, {
                  lastModified: (0, a.serverTimestamp)(),
                  syncStatus: '同期済み',
                });
                (0, a.updateDoc)((0, a.doc)(fb.db, `groups/${s().activeGroupId}/members`, o), n)
                  .then(() => {
                    (console.log(`[Store] Debounced Member Sync Success: ${i.name}`),
                      e((e) => ({
                        members: e.members.map((e) =>
                          e && e.id === o && e.lastModified === 送った版
                            ? Object.assign({}, e, {
                                syncStatus: '同期済み',
                              })
                            : e
                        ),
                      })),
                      delete p[o]);
                  })
                  .catch((e) => {
                    (console.error('Update Member Sync Error:', e), delete p[o]);
                  });
              }
            }, 300)));
        },
        deleteMember: (o) => {
          if (!s().activeGroupId || 'group' !== s().activeRole)
            return void n.default.alert('権限エラー', 'メンバーの削除は団体ログイン時のみ可能です。');
          // 消したことを控えに残す。送信が失われても、次の受け取りで
          // 復活させないため。クラウドから消えたのを確かめてから控えを外す
          const 控え = Object.assign({}, s().deletedMembers);
          ((控え[o] = Date.now()),
            e({
              members: s().members.filter((e) => e.id !== o),
              deletedMembers: 控え,
              lastLocalChange: Date.now(),
            }),
            (0, a.deleteDoc)((0, a.doc)(fb.db, `groups/${s().activeGroupId}/members`, o))
              .then(() => s().syncMemberLookup())
              .catch((e) => console.error('Delete Member Sync Error:', e)));
        },
        syncMemberLookup: async () => {
          const { activeGroupId: g, activeRole: r, members: ms } = s();
          if (!g || 'group' !== r || !fb.db) return;
          try {
            const col = (0, a.collection)(fb.db, `groups/${g}/member_lookup`);
            const snap = await (0, a.getDocs)(col);
            const want = new Map();
            (ms || []).forEach((m) => {
              if (m && m.id && /^\d{4}$/.test(m.personalId || '')) want.set(m.personalId, m.id);
            });
            const batch = (0, a.writeBatch)(fb.db);
            let n = 0;
            snap.forEach((d) => {
              const w = want.get(d.id);
              if (!w) {
                batch.delete(d.ref);
                n++;
              } else if (d.data().memberId === w) {
                want.delete(d.id);
              }
            });
            want.forEach((memberId, pid) => {
              batch.set((0, a.doc)(fb.db, `groups/${g}/member_lookup`, pid), {
                memberId: memberId,
                updatedAt: Date.now(),
              });
              n++;
            });
            if (n > 0) {
              await batch.commit();
              console.log('[Store] member_lookup synced:', n);
            }
          } catch (e) {
            console.error('[Store] syncMemberLookup error:', e);
          }
        },
        ensurePersonalIds: async () => {
          const { members: o, alumni: i, activeGroupId: n } = s();
          // 名簿を書けるのは団体アカウントだけ。部員の端末で走ると、他人の
          // 個人IDを勝手に振ってしまう。しかも逆引き表（こちらは団体限定）は
          // 更新されないため、その人がログインできなくなる。
          if (!n || 'group' !== s().activeRole) return;
          const _ensureDb = await waitForDb();
          if (!_ensureDb) {
            console.warn('[Store] ensurePersonalIds: db still undefined after await, aborting');
            return;
          }
          const c = [...o],
            l = [...i];
          let d = !1;
          const u = () => [...c.map((e) => e.personalId), ...l.map((e) => e.personalId)].filter((e) => !!e),
            m = (e) => !!e && /^\d{4}$/.test(e),
            p = (e) => {
              let s = '',
                t = 0;
              do {
                ((s = Math.floor(1e3 + 9e3 * Math.random()).toString()), t++);
              } while (e.includes(s) && t < 5e3);
              return s;
            },
            h = (0, a.writeBatch)(fb.db);
          let f = 0;
          for (let e = 0; e < c.length; e++)
            if (!m(c[e].personalId)) {
              const s = u(),
                o = Date.now();
              // 送信が済むまでは「未同期」にしておく。送信が失われた場合、
              // 「同期済み」だと送り直しの対象にならず、クラウドにIDが無いまま
              // 固定される。すると別の端末が別のIDを振り、端末ごとに食い違う。
              ((c[e] = Object.assign({}, c[e], {
                personalId: p(s),
                lastModified: o,
                syncStatus: '未同期',
              })),
                h.set(
                  (0, a.doc)(fb.db, `groups/${n}/members`, c[e].id),
                  Object.assign({}, c[e], {
                    syncStatus: '同期済み',
                    lastModified: (0, a.serverTimestamp)(),
                  })
                ),
                f++,
                (d = !0));
            }
          for (let e = 0; e < l.length; e++)
            if (!m(l[e].personalId)) {
              const s = u(),
                o = Date.now();
              // メンバーと同じ理由で「未同期」にする
              ((l[e] = Object.assign({}, l[e], {
                personalId: p(s),
                lastModified: o,
                syncStatus: '未同期',
              })),
                h.set(
                  (0, a.doc)(fb.db, `groups/${n}/alumni`, l[e].id),
                  Object.assign({}, l[e], {
                    syncStatus: '同期済み',
                    lastModified: (0, a.serverTimestamp)(),
                  })
                ),
                f++,
                (d = !0));
            }
          if (d) {
            e({
              members: c,
              alumni: l,
              lastLocalChange: Date.now(),
            });
            if (f > 0) {
              // 完了は待たない。通信できないと終わらず、この先の逆引き表の
              // 更新まで止まってしまう。届いた分は syncSessions が印を
              // 付け替え、届かなければ送り直す。
              const 送った版 = new Map(
                [...c, ...l].filter((e) => e && e.id).map((e) => [e.id, e.lastModified])
              );
              h.commit()
                .then(() => {
                  e((t) => ({
                    members: t.members.map((t) =>
                      t && 送った版.has(t.id) && t.lastModified === 送った版.get(t.id)
                        ? Object.assign({}, t, { syncStatus: '同期済み' })
                        : t
                    ),
                    alumni: t.alumni.map((t) =>
                      t && 送った版.has(t.id) && t.lastModified === 送った版.get(t.id)
                        ? Object.assign({}, t, { syncStatus: '同期済み' })
                        : t
                    ),
                  }));
                })
                .catch((t) => console.error('[Store] 個人IDの送信に失敗:', t));
            }
            console.log(`Ensured personal IDs: Updated ${f} non-compliant IDs.`);
          }
          await s().syncMemberLookup();
        },
        deleteEquipment: (o, i) => {
          if (!s().activeGroupId || 'group' !== s().activeRole)
            return void n.default.alert('権限エラー', '道具管理は団体ログイン時のみ可能です。');
          const c = Date.now(),
            l = s().members.map((e) => {
              if (e.id === o) {
                const s = e.equipments || [];
                return Object.assign({}, e, {
                  equipments: s.filter((e) => e.id !== i),
                  lastModified: c,
                  syncStatus: '未同期',
                });
              }
              return e;
            });
          e({
            members: l,
            lastLocalChange: c,
          });
          const d = l.find((e) => e.id === o);
          if (d && s().activeGroupId) {
            const i = Object.assign({}, d, {
              lastModified: (0, a.serverTimestamp)(),
              syncStatus: '同期済み',
            });
            (0, a.updateDoc)((0, a.doc)(fb.db, `groups/${s().activeGroupId}/members`, o), i)
              .then(() => {
                // 印を付けるのは送った版だけ（記録側と同じ考え方）
                e((e) => ({
                  members: e.members.map((e) =>
                    e && e.id === o && e.lastModified === d.lastModified
                      ? Object.assign({}, e, {
                          syncStatus: '同期済み',
                        })
                      : e
                  ),
                }));
              })
              .catch((e) => console.error('Delete Equipment Sync Error:', e));
          }
        },
        saveSession: async (o, d, u, m, attendanceData) => {
          行動を控える('記録を保存', (s().archers || []).length + '人');

          // 閲覧用は記録として残さない。画面側でも保存の帯を薄くしてあるが、
          // 道が増えたときに漏れないよう、ここでも止める
          if (s().書き換えを止めるか()) return;
          // よその団体のライブも、自分の記録には残さない（保存を止めるか を参照）
          if (s().保存を止めるか()) return;
          const p = s().activeSessionID || (0, l.generateUUID)(),
            { archers: h, shotsPerRound: f, activeGroupId: S, activeRole: b, myMemberId: y } = s(),
            v = Array.isArray(h) ? h : [],
            T = {
              id: p,
              date: Date.now(),
              title: o,
              note: d,
              archers: JSON.parse(JSON.stringify(v)),
              archerNames: Array.from(
                new Set(v.map((e) => (e && e.name ? e.name.trim() : '')).filter(Boolean))
              ),
              shotCount: f || 8,
              includeInStats: u,
              tags: m,
              attendance: attendanceData,
              syncStatus: '未同期',
              lastModified: Date.now(),
            };
          // 個人モードでの上書きは、手元に確定する前に止める
          if (S && 'member' === b)
            try {
              if ((await (0, a.getDoc)((0, a.doc)(fb.db, `groups/${S}/sessions`, p))).exists()) {
                const e = 'この記録はすでにクラウドに存在するため、個人モードからは更新できません。';
                return void n.default.alert('保存制限', e);
              }
            } catch (e) {
              console.warn('[Store] 既存確認に失敗しました。保存は続行します:', e);
            }
          // まず手元に確定する。クラウドの応答は待たない。
          // 待つと、通信できないときに射手が消えず履歴にも出ないうえ、
          // 画面には何も知らされないままになる。
          const 元のライブ名 = s().liveSessionName;
          (s().stopLiveSync(!0),
            e((e) => ({
              sessions: [T, ...e.sessions.filter((e) => e.id !== p)],
              activeSessionID: null,
              archers: [],
              isLiveActive: !1,
              isHost: !1,
              liveSessionName: null,
              lastLocalChange: Date.now(),
              syncStatus: '未同期',
              // 盤面を片付けたので、遡れる手も捨てる。リセットと同じ扱い。
              // 残すと、保存したあとに取り消しを押すと保存済みの盤面が戻り、
              // そのままもう一度保存すると同じ記録が二重に入る
              historyStack: [],
              redoStack: [],
              historySharedLen: 0,
              historySharedMax: 0,
            })));
          // ライブ記録の後始末。届かなくても保存には影響させない
          const 枝 = ライブの枝();
          // 共有していたライブは、団体の枝の道しるべと閲覧用の写しも残る。
          // 消さないと、参加一覧に入れないライブが並び、写しも読めたままになる
          const 団 = 団体の枝();
          const 閲覧枝 = s().いまのライブの閲覧枝;
          if (元のライブ名 && fb.rtdb && 枝) {
            const e = (0, i.ref)(fb.rtdb, `live_sessions/${枝}/${元のライブ名}`);
            ((0, i.update)((0, i.ref)(fb.rtdb, `live_sessions/${枝}/${元のライブ名}/state`), {
              status: 'finished',
              timestamp: (0, i.serverTimestamp)(),
            }).catch(() => {}),
              // 見ている人にも終わったことを知らせる
              秘.枝として使えるか(閲覧枝) &&
                (0, i.update)((0, i.ref)(fb.rtdb, 写しの場所(閲覧枝, 元のライブ名)), {
                  status: 'finished',
                  timestamp: (0, i.serverTimestamp)(),
                }).catch(() => {}),
              setTimeout(async () => {
                const 落とす = (道) =>
                  (0, i.remove)((0, i.ref)(fb.rtdb, 道)).catch(() => {});
                await Promise.all([
                  (0, i.remove)(e).catch(() => {}),
                  // 共有履歴と在席は別の枝にあるので、明示的に消す
                  落とす(共有履歴の場所(枝, 元のライブ名)),
                  落とす(在席の場所(枝, 元のライブ名)),
                  // 共有していたときの道しるべと写しも消す
                  団 && 団 !== 枝 ? 落とす(`live_sessions/${団}/${元のライブ名}`) : null,
                  秘.枝として使えるか(閲覧枝)
                    ? 落とす(`live_view/${閲覧枝}/${元のライブ名}`)
                    : null,
                ]);
                // 期限は最後。中身が残っているうちは決まりが消させない
                // （消せると、期限を外してリンクをよみがえらせられてしまう）。
                // 団体の枝には期限が無いので、共有していたときだけ
                if (団 && 団 !== 枝) {
                  await 落とす(期限の場所(枝));
                  if (秘.枝として使えるか(閲覧枝)) await 落とす(期限の場所(閲覧枝));
                }
              }, 2e3));
          }
          // クラウドへ送る。ここも待たない。
          // 届くまでは「未同期」のままにしておく。そうすれば syncSessions の
          // 再送で拾われ、通信が戻ったときに自動で送られる。
          if (S) {
            const o = JSON.parse(JSON.stringify(T));
            ((o.syncStatus = '同期済み'),
              (o.lastModified = (0, a.serverTimestamp)()),
              (0, a.setDoc)((0, a.doc)(fb.db, `groups/${S}/sessions`, p), o, {
                merge: !0,
              })
                .then(() => {
                  // 印を付けるのは送った版だけ。送信中に編集されると更新日時が
                  // 変わるので、一致する場合に限る（updateSession と同じ考え方）。
                  e((e) => ({
                    sessions: e.sessions.map((e) =>
                      e && e.id === p && e.lastModified === T.lastModified
                        ? Object.assign({}, e, {
                            syncStatus: '同期済み',
                          })
                        : e
                    ),
                    syncStatus: '同期済み',
                  }));
                })
                .catch((t) => {
                  (console.error('Save Session Cloud Error:', t),
                    不具合を控える('記録の保存（クラウド）', t),
                    e({
                      syncStatus: '同期エラー',
                    }));
                }));
          }
        },
        loadSession: (t) => {
          const o = (Array.isArray(s().sessions) ? s().sessions : []).find((e) => e && e.id === t);
          o &&
            e({
              archers: o.archers,
              shotsPerRound: o.shotCount,
              activeSessionID: o.id,
              historyStack: [],
              redoStack: [],
            });
        },
        deleteSession: async (o) => {
          const i = Array.isArray(s().sessions) ? s().sessions : [],
            n = i.find((e) => e && e.id === o),
            c = i.filter((e) => e && e.id !== o);
          // 送信が済むまでは「未同期」にしておく。こうしないと、通信できない
          // ときに削除がクラウドへ届かないまま消し込まれ、次の全件取得で
          // 記録が復活しゴミ箱からも消えてしまう。
          //
          // pendingDelete は「この端末で捨てて、まだ送れていない」という印。
          // クラウドの写しを読み込んだだけの項目と区別するために要る。これが
          // ないと、ゴミ箱を空にした直後に写しを読み込んだ項目まで送り直しの
          // 対象になり、空にしたはずのものが戻ってしまう。
          e(
            n
              ? {
                  sessions: c,
                  trash: [
                    ...s().trash,
                    Object.assign({}, n, {
                      syncStatus: '未同期',
                      pendingDelete: !0,
                    }),
                  ],
                }
              : {
                  sessions: c,
                }
          );
          try {
            const e = (0, a.writeBatch)(fb.db);
            if ((e.delete((0, a.doc)(fb.db, `groups/${s().activeGroupId}/sessions`, o)), n)) {
              const i = JSON.parse(
                JSON.stringify(
                  Object.assign({}, n, {
                    syncStatus: 'trashed',
                  })
                )
              );
              ((i.lastModified = (0, a.serverTimestamp)()),
                (i.deletedAt = (0, a.serverTimestamp)()),
                e.set((0, a.doc)(fb.db, `groups/${s().activeGroupId}/trash`, o), i));
            }
            // 完了は待たない。通信できないと終わらないため、呼び出し側が
            // 待つと画面が反応しなくなる。送信は待ち行列に任せる。
            e.commit().catch((e) => console.error('Delete Session Error:', e));
          } catch (e) {
            console.error('Delete Session Error:', e);
          }
        },
        emptyTrash: async () => {
          const { trash: o, activeGroupId: n } = s();
          if (!o || 0 === o.length) return;
          const c = o.map((e) => e.id);
          // 通信できるかで送信を止めない。止めると手元からだけ消えて、クラウドの
          // ゴミ箱は残り、次の全件取得で消したはずのものが戻ってきてしまう。
          // 通信できないときは Firestore の待ち行列に入り、つながった時点で送られる。
          // 完全に消したことを控えておく。送信が失われても、次の取得で
          // 戻ってこないようにするため。
          const 控え = Object.assign({}, s().permanentlyDeleted);
          c.forEach((e) => {
            控え[e] = Date.now();
          });
          if (
            (console.log('[Store] Emptying trash:', c.length, 'items'),
            e({
              trash: [],
              permanentlyDeleted: 控え,
            }),
            n)
          )
            try {
              const e = (0, a.writeBatch)(fb.db);
              (c.forEach((s) => {
                e.delete((0, a.doc)(fb.db, `groups/${n}/trash`, s));
              }),
                // 完了は待たない（deleteSession と同じ理由）
                e
                  .commit()
                  .then(() => console.log('[Store] Cloud trash emptied'))
                  .catch((e) => console.error('[Store] Error emptying cloud trash:', e)));
            } catch (e) {
              console.error('[Store] Error emptying cloud trash:', e);
            }
        },
        deleteTrashItems: async (o) => {
          if (o && 0 !== o.length)
            try {
              const { trash: i, activeGroupId: c } = s();
              (console.log('[Store] Deleting trash items:', o),
                c && console.log(`[Store] Target Firestore path: groups/${c}/trash/`));
              const l = (i || []).filter((e) => e && !o.includes(e.id));
              // emptyTrash と同じく、完全に消したことを控えておく
              const 控え = Object.assign({}, s().permanentlyDeleted);
              o.forEach((e) => {
                e && (控え[e] = Date.now());
              });
              // emptyTrash と同じ理由で、通信できるかでは止めない
              if (
                (e({
                  trash: l,
                  permanentlyDeleted: 控え,
                }),
                c)
              ) {
                const e = (0, a.writeBatch)(fb.db);
                let s = 0;
                (o.forEach((o) => {
                  o && (e.delete((0, a.doc)(fb.db, `groups/${c}/trash`, o)), s++);
                }),
                  s > 0 &&
                    e
                      .commit()
                      .then(() => console.log('[Store] Successfully deleted trash items from cloud'))
                      .catch((e) => console.error('[Store] Delete trash items error:', e)));
              } else console.warn('[Store] Skipping cloud deletion: activeGroupId が無い');
            } catch (e) {
              console.error('[Store] Delete trash items error:', e);
            }
          else console.warn('[Store] deleteTrashItems called with no IDs');
        },
        deleteMultipleSessions: async (o) => {
          const i = s().sessions.filter((e) => o.includes(e.id)),
            n = s().sessions.filter((e) => !o.includes(e.id));
          e({
            sessions: n,
            trash: [
              ...s().trash,
              ...i.map((e) =>
                Object.assign({}, e, {
                  syncStatus: '未同期',
                  pendingDelete: !0,
                })
              ),
            ],
          });
          try {
            const e = (0, a.writeBatch)(fb.db);
            (o.forEach((o) => e.delete((0, a.doc)(fb.db, `groups/${s().activeGroupId}/sessions`, o))),
              i.forEach((o) => {
                const i = JSON.parse(
                  JSON.stringify(
                    Object.assign({}, o, {
                      syncStatus: 'trashed',
                    })
                  )
                );
                ((i.lastModified = (0, a.serverTimestamp)()),
                  (i.deletedAt = (0, a.serverTimestamp)()),
                  e.set((0, a.doc)(fb.db, `groups/${s().activeGroupId}/trash`, o.id), i));
              }),
              e.commit().catch((e) => console.error('Batch Delete Error:', e)));
          } catch (e) {
            console.error('Batch Delete Error:', e);
          }
        },
        restoreSession: async (o) => {
          const i = Array.isArray(s().trash) ? s().trash : [],
            n = i.find((e) => e && e.id === o);
          if (!n) return;
          const c = Object.assign({}, n, {
              // 送信が済むまでは「未同期」にしておく。こうしないと、通信できない
              // ときに復元がクラウドへ届かないまま同期済み扱いになり、次の全件取得
              // でゴミ箱へ戻ってしまう。
              syncStatus: '未同期',
              // ゴミ箱側の印は記録に持ち込まない
              pendingDelete: void 0,
            }),
            l = Array.isArray(s().sessions) ? s().sessions : [];
          // 戻したなら、完全に消した控えからも外す。残っていると画面に出なくなる
          const 控え = Object.assign({}, s().permanentlyDeleted);
          delete 控え[o];
          e({
            trash: i.filter((e) => e && e.id !== o),
            sessions: [c, ...l],
            permanentlyDeleted: 控え,
          });
          try {
            const e = (0, a.writeBatch)(fb.db);
            e.delete((0, a.doc)(fb.db, `groups/${s().activeGroupId}/trash`, o));
            const i = JSON.parse(JSON.stringify(c));
            ((i.lastModified = (0, a.serverTimestamp)()),
              e.set((0, a.doc)(fb.db, `groups/${s().activeGroupId}/sessions`, o), i),
              e.commit().catch((e) => console.error('Restore Session Error:', e)));
          } catch (e) {
            console.error('Restore Session Error:', e);
          }
        },
        restoreTrashItems: async (o) => {
          if (!o || 0 === o.length) return;
          const i = s().trash || [],
            n = i.filter((e) => o.includes(e.id)),
            c = i.filter((e) => !o.includes(e.id)),
            l = n.map((e) =>
              Object.assign({}, e, {
                syncStatus: '未同期',
                // ゴミ箱側の印は記録に持ち込まない
                pendingDelete: void 0,
              })
            );
          // restoreSession と同じく、完全に消した控えから外す
          const 控え = Object.assign({}, s().permanentlyDeleted);
          o.forEach((e) => delete 控え[e]);
          e({
            trash: c,
            sessions: [...l, ...s().sessions],
            permanentlyDeleted: 控え,
          });
          try {
            const e = (0, a.writeBatch)(fb.db);
            (o.forEach((o) => e.delete((0, a.doc)(fb.db, `groups/${s().activeGroupId}/trash`, o))),
              l.forEach((o) => {
                const i = JSON.parse(JSON.stringify(o));
                ((i.lastModified = (0, a.serverTimestamp)()),
                  e.set((0, a.doc)(fb.db, `groups/${s().activeGroupId}/sessions`, o.id), i));
              }),
              e.commit().catch((e) => console.error('Restore Trash Items Error:', e)));
          } catch (e) {
            console.error('Restore Trash Items Error:', e);
          }
        },
        updateState: (s) => {
          e(s);
        },
        updateSession: async (o, i) => {
          const n = s().sessions || [],
            c = n.findIndex((e) => e && e.id === o);
          if (-1 === c) return;
          const l = n[c];
          if ('member' === s().activeRole && i.archers && i.archers.length < l.archers.length)
            return void console.warn('[updateSession] Prevented accidental data stripping in member mode');
          // 送信が済むまでは「未同期」にしておく。こうしないと、通信できない
          // ときに編集がクラウドへ届かないまま同期済み扱いになり、他の記録が
          // 更新された拍子にクラウドの古い写しで上書きされて編集が消える。
          const d = Object.assign({}, n[c], i, {
              lastModified: Date.now(),
              syncStatus: '未同期',
            }),
            u = [...n];
          ((u[c] = d),
            e({
              sessions: u,
            }));
          const m = s().activeGroupId;
          if (!m) return;
          s()._pendingUpdateTimers[o] && clearTimeout(s()._pendingUpdateTimers[o]);
          const p = setTimeout(() => {
            // タイマーの控えは先に片付ける。通信できないと送信は終わらないので、
            // 送信の完了を待って片付けると残り続けてしまう。
            e((e) => {
              const s = Object.assign({}, e._pendingUpdateTimers);
              return (
                delete s[o],
                {
                  _pendingUpdateTimers: s,
                }
              );
            });
            const t = s().sessions.find((e) => e && e.id === o);
            if (!t) return;
            // 送った版の更新日時を控える。送信中にもう一度編集されると
            // 更新日時が変わるので、戻ってきたときに一致する場合だけ印を付ける。
            // これをしないと、まだ届いていない新しい内容が「同期済み」に見え、
            // 次の突き合わせでクラウドの古い写しに負けて編集が消える。
            //
            // 「同じ物を指しているか」では駄目。リスナーが中身はそのままに
            // 記録を作り直すことがあり、変わっていなくても別物になる。
            const 送った版 = t.lastModified;
            const n = JSON.parse(JSON.stringify(t));
            // 送信の完了は待たない。通信できないときは Firestore の待ち行列に
            // 入り、つながった時点で送られる。
            ((n.lastModified = (0, a.serverTimestamp)()),
              (0, a.updateDoc)((0, a.doc)(fb.db, `groups/${m}/sessions`, o), n)
                .then(() => {
                  (console.log(`[Store] Debounced sync finished for ${o}`),
                    e((e) => ({
                      sessions: e.sessions.map((e) =>
                        e && e.id === o && e.lastModified === 送った版
                          ? Object.assign({}, e, {
                              syncStatus: '同期済み',
                            })
                          : e
                      ),
                    })));
                })
                .catch((e) => {
                  console.error('Update Session Sync Error:', e);
                }));
          }, 800);
          e((e) => ({
            _pendingUpdateTimers: Object.assign({}, e._pendingUpdateTimers, {
              [o]: p,
            }),
          }));
        },
        setSubstitution: (t, o, a, i) => {
          if (s().書き換えを止めるか()) return;
          // 交代も一手として積む。積まないと、○×の取り消しを続けたときに
          // 交代を入れる前の控えまで戻り、交代ごと巻き添えで消えていた。
          // 射数の変更（setShotsPerRound）と同じ考え方
          const 変える前 = Array.isArray(s().archers) ? s().archers : [];
          const 交代の中身 = (一覧) => {
            const 射手 = (一覧 || []).find((e) => e && e.id === t);
            if (!射手) return '';
            return JSON.stringify([射手.substitutions || {}, 射手.substitutionIds || {}]);
          };
          const 前の交代 = 交代の中身(変える前);
          const n = 変える前.map((e) => {
            if (e && e.id === t) {
              const s = Object.assign({}, e.substitutions || {});
              if ('' !== a) {
                s[o] = a;
                const t = Object.assign({}, e.substitutionIds || {});
                return (
                  i ? (t[o] = i) : delete t[o],
                  Object.assign({}, e, {
                    substitutions: s,
                    substitutionIds: t,
                    lastModified: Date.now(),
                  })
                );
              }
              if ((delete s[o], e.substitutionIds)) {
                const t = Object.assign({}, e.substitutionIds);
                return (
                  delete t[o],
                  Object.assign({}, e, {
                    substitutions: s,
                    substitutionIds: t,
                    lastModified: Date.now(),
                  })
                );
              }
              return Object.assign({}, e, {
                substitutions: s,
                lastModified: Date.now(),
              });
            }
            return e;
          });
          // 同じ内容を選び直したときは積まない。押しても何も起きない
          // 一手が挟まり、取り消しが空振りして見える
          const 交代が変わる = 交代の中身(n) !== 前の交代;
          e(
            Object.assign(
              {
                archers: n,
                lastLocalChange: Date.now(),
              },
              交代が変わる ? { historyStack: [...s().historyStack, 変える前], redoStack: [] } : null
            )
          );
          const { isLiveActive: c, liveSessionName: l, shotsPerRound: d } = s();
          c && l && v(l, n, d);
        },
        setShotsPerRound: (t) => {
          if (s().書き換えを止めるか()) return;
          // 射数を減らすと○×を切り捨てる。取り消しで戻せるよう、変える前の
          // 盤面を一手として積む。控えの○×の長さがそのときの射数になるので、
          // 取り消し側はそれを見て射数ごと戻す
          const 変える前 = Array.isArray(s().archers) ? s().archers : [];
          const 射数が変わる = t !== s().shotsPerRound;
          const o = (Array.isArray(s().archers) ? s().archers : []).map((e) => {
            if (!e || e.isSeparator) return e;
            const s = Array.isArray(e.marks) ? e.marks : [],
              o = [...s];
            return (
              t > s.length ? o.push(...Array(t - s.length).fill('')) : o.splice(t),
              Object.assign({}, e, {
                marks: o,
                lastModified: Date.now(),
              })
            );
          });
          e(
            Object.assign(
              {
                shotsPerRound: t,
                archers: o,
                lastLocalChange: Date.now(),
              },
              // 同じ射数を選び直したときは積まない。押しても何も起きない
              // 一手が挟まり、取り消しが空振りして見える
              射数が変わる
                ? { historyStack: [...s().historyStack, 変える前], redoStack: [] }
                : null
            )
          );
          const { isLiveActive: a, liveSessionName: i } = s();
          a && i && v(i, o, t);
        },
        loadData: () => {
          (s().checkOfflineSave(), s().syncSessions());
        },
        // オフライン保存が効いているかを確かめ、効いていなければ画面に出す文言を持たせる。
        // 効いていない状態で電波の無い場所で保存すると、画面を閉じた時点で
        // 送信待ちごと記録が失われるため、黙って進ませない。
        checkOfflineSave: async () => {
          try {
            await waitForDb();
            const o = require('./db').persistence || {};
            if ('ok' === o.state || 'pending' === o.state)
              return void (
                s().offlineSaveWarning &&
                e({
                  offlineSaveWarning: null,
                })
              );
            const i =
              'multipleTabs' === o.state
                ? 'この記録画面が複数のタブで開かれているため、電波のない場所での保存が保護されません。他のタブを閉じて開き直してください。'
                : 'このブラウザでは電波のない場所での保存が保護されません。通信できる場所で保存してください。';
            (console.warn('[Store] オフライン保存が無効です:', o),
              e({
                offlineSaveWarning: i,
              }));
          } catch (o) {
            console.warn('[Store] オフライン保存の確認に失敗:', o);
          }
        },
        clearAllData: () =>
          e({
            sessions: [],
            members: [],
            history: [],
            alumni: [],
            trash: [],
            archers: [],
            activeSessionID: null,
          }),
        // 同意の記録を確かめる。起動のたびに1回だけ呼ぶ。
        // ・記録が無い団体（同意の画面を入れる前から使っている）
        //     運営者が口頭で同意を得ているので、記録だけを静かに補う
        // ・記録はあるが版が古い（文書を改定した）
        //     取り直しが要るので、画面に出すための印を立てる
        // 部員の端末からは団体の帳面を書き換えられないので、何もしない
        /**
         * ライブを置く枝の合言葉を用意する。
         *
         * groups/{団体} に置く。そこは所属を確かめてからでないと読めないので
         * （firestore.rules の canAccess）、正しい部員だけが知る。
         * 無ければ作って書くが、2台が同時に作ると後勝ちで食い違う。
         * 書いたあとに必ず読み直して、実際に載っているほうを採る。
         */
        ライブの合言葉を用意する: async () => {
          const { activeGroupId: 団体 } = s();
          if (!fb.db || !団体) return null;
          const 控え = s().ライブの合言葉;
          if (控え && 控え.団体 === 団体 && 秘.枝として使えるか(控え.合言葉)) return 控え.合言葉;
          // 取り寄せは1本にまとめる。3か所から呼ぶので、
          // まとめないと同じ団体に別々の合言葉を書き合ってしまう。
          // まとめてよいのは同じ団体のときだけ。団体を移った直後に前の団体ぶんを
          // 使い回すと、移った先の練習を前の団体の枝へ流してしまう
          if (合言葉の取り寄せ && 合言葉の取り寄せ.団体 === 団体) return 合言葉の取り寄せ.約束;
          const 場所 = (0, a.doc)(fb.db, `groups/${団体}`);
          const 一度 = async () => {
            const 今 = await (0, a.getDoc)(場所);
            const 有 = (今.data() || {}).liveSecret;
            if (秘.枝として使えるか(有)) return 有;
            await (0, a.setDoc)(場所, { liveSecret: 秘.合言葉を作る() }, { merge: !0 });
            // 読み直す。同時に作られていたら、相手のほうが載っている
            const 後 = await (0, a.getDoc)(場所);
            const 決 = (後.data() || {}).liveSecret;
            return 秘.枝として使えるか(決) ? 決 : null;
          };
          const 約束 = (async () => {
            // 起動の直後は Firestore がまだ繋がっておらず、読みが
            // 「client is offline」で失敗する。一度で諦めると、その画面を
            // 開いているあいだライブがまったく使えなくなるので、待って試し直す
            let 待ち = 500;
            for (let 回 = 0; 回 < 6; 回++) {
              try {
                const 決 = await 一度();
                if (決) {
                  // 待っているあいだに団体を移っていたら、この合言葉は返さない。
                  // 返すと、移った先の練習を前の団体の枝へ流してしまう
                  if (s().activeGroupId !== 団体) return null;
                  e({ ライブの合言葉: { 団体: 団体, 合言葉: 決 } });
                  return 決;
                }
              } catch (t) {
                console.warn('[Store] ライブの合言葉を用意できませんでした', t);
              }
              if (s().activeGroupId !== 団体) return null; // 団体が変わったら追わない
              await new Promise((r) => setTimeout(r, 待ち));
              待ち = Math.min(待ち * 2, 8000);
            }
            return null;
          })();
          合言葉の取り寄せ = { 団体: 団体, 約束: 約束 };
          // 片付けるのは自分が置いたものだけ。団体を移って別の取り寄せが
          // 始まっていたら、そちらを消してしまわない
          約束.finally(() => {
            if (合言葉の取り寄せ && 合言葉の取り寄せ.約束 === 約束) 合言葉の取り寄せ = null;
          });
          return 約束;
        },
        同意を確かめる: async () => {
          const { activeGroupId: 団体, activeRole: 役, publicGroupId: 公開ID } = s();
          if ('group' !== 役) return;
          const id = (公開ID || 団体 || '').toUpperCase();
          if (!id) return;
          try {
            // 帳面そのものが無い団体には、何も作らない。
            // 作ると、存在しない団体の同意記録が生まれる
            const 帳面 = await (0, a.getDoc)((0, a.doc)(fb.db, 'group_accounts', id));
            if (!帳面.exists()) return;
            // 同意の記録は private に置く。誰でも読める場所に置くと、
            // 団体IDを知る者に「いつ・どうやって同意を得たか」まで見える
            const 場所 = (0, a.doc)(fb.db, 'group_accounts', id, 'private', 'consent');
            const 中身 = await (0, a.getDoc)(場所);
            const 法 = require('./legalDocs');
            // 記録が無いのが、画面を入れる前からの団体。静かに補う
            const 版 = 中身.exists() ? (中身.data() || {}).同意の版 : undefined;
            if (!版) {
              await (0, a.setDoc)(場所, 法.口頭での同意の記録(), { merge: !0 });
              return;
            }
            // 口頭で同意を得ている移りは、画面で求め直さず記録だけ進める。
            // どの移りが済んでいるかは legalDocs.js の 口頭で済んでいる移り に書く
            if (法.口頭で済んでいるか(版)) {
              await (0, a.setDoc)(
                場所,
                法.口頭での同意の記録(`口頭（${法.同意の版} 版の内容を説明のうえ同意。前の記録は ${版}）`),
                { merge: !0 }
              );
              return;
            }
            if (法.同意を取り直すか(版)) e({ 同意の確認が要る: !0 });
          } catch (t) {
            // 確かめられなくても、使えなくする話ではない。次に入ったときにまた試す
            console.warn('[Store] 同意の確認に失敗:', t);
          }
        },

        // 同意してもらえた。記録して印を下ろす
        同意を記録する: async () => {
          const { activeGroupId: 団体, activeRole: 役, publicGroupId: 公開ID } = s();
          e({ 同意の確認が要る: !1 });
          if ('group' !== 役) return;
          const id = (公開ID || 団体 || '').toUpperCase();
          if (!id) return;
          try {
            const 場所 = (0, a.doc)(fb.db, 'group_accounts', id, 'private', 'consent');
            await (0, a.setDoc)(場所, require('./legalDocs').同意の記録(), { merge: !0 });
          } catch (t) {
            // 書けなかったときは印を立て直す。次の起動でまた聞く
            (console.warn('[Store] 同意の記録に失敗:', t), e({ 同意の確認が要る: !0 }));
          }
        },

        // あとにする。記録は残さないので、次の起動でまた出る
        同意をあとにする: () => e({ 同意の確認が要る: !1 }),

        verifyGroupPassword: async (e) => {
          const { activeUserEmail: i, activeGroupId: n, publicGroupId: c } = s();
          let l = i || fb.auth.currentUser?.email;
          if (!l && (n || c)) {
            console.log('[Store] Fetching group email for password verification...');
            const e = c || n;
            try {
              const s = (0, a.doc)(fb.db, 'group_accounts', e.toUpperCase()),
                o = await (0, a.getDoc)(s);
              o.exists() && (l = o.data().email);
            } catch (e) {
              console.error('[Store] Failed to fetch group email:', e);
            }
          }
          if (!l) return (console.warn('[Store] verifyGroupPassword: No email found to verify.'), !1);
          try {
            return (await (0, o.signInWithEmailAndPassword)(fb.auth, l, e), !0);
          } catch (e) {
            return (console.error('[Store] verifyGroupPassword error:', e), !1);
          }
        },
        setAdminMode: (s) =>
          e({
            isAdminMode: s,
            isAdminModePending: !1,
          }),
        updateGroupName: async (o) => {
          const { activeGroupId: i } = s();
          if (i) {
            e({
              activeGroupName: o,
            });
            try {
              await (0, a.setDoc)(
                (0, a.doc)(fb.db, 'groups', i),
                {
                  groupName: o,
                },
                {
                  merge: !0,
                }
              );
            } catch (e) {
              console.error('[Store] updateGroupName error:', e);
            }
          }
        },
        setAutoPromotionEnabled: async (o) => {
          const { activeGroupId: i } = s();
          if (i) {
            e({
              autoPromotionEnabled: o,
            });
            try {
              await (0, a.setDoc)(
                (0, a.doc)(fb.db, `groups/${i}/config`, 'app_settings'),
                {
                  autoPromotionEnabled: o,
                },
                {
                  merge: !0,
                }
              );
            } catch (e) {
              console.error('[Store] setAutoPromotionEnabled error:', e);
            }
          }
        },
        setIsAdminModePending: (s) =>
          e({
            isAdminModePending: s,
          }),
        setHistoryViewMode: (s) =>
          e({
            historyViewMode: s,
          }),
        setSelectedHistorySessionId: (s) =>
          e({
            selectedHistorySessionId: s,
          }),
        setViewScale: (s) =>
          e({
            viewScale: Math.max(0.5, Math.min(2, s)),
          }),
        setIsLiveActive: (o) => {
          if (
            (e({
              isLiveActive: o,
            }),
            o)
          ) {
            const e = s().activeSessionID || 'live-current',
              o = s().liveSessionName || e,
              a = s().archers || [];
            const 枝 = ライブの枝();
            fb.rtdb &&
              枝 &&
              (0, i.set)(
                (0, i.ref)(fb.rtdb, `live_sessions/${枝}/${o}/state`),
                JSON.parse(
                  JSON.stringify({
                    archers: Array.isArray(a) ? a : [],
                    shotsPerRound: s().shotsPerRound,
                    timestamp: Date.now(),
                  })
                )
              ).catch((e) => console.error('Live Sync Error:', e));
          }
        },
        checkAndAutoIncrementGrades: async () => {
          const { activeGroupId: o } = s();
          if (!o) return;
          const i = new Date(),
            n = i.getFullYear(),
            c = i.getMonth() + 1,
            l = i.getDate(),
            d = c > 4 || (4 === c && l >= 1);
          let hasPromotionRecord = !1;
          try {
            console.log('[AutoPromotion] Fetching latest app_settings...');
            const s = await (0, a.getDoc)((0, a.doc)(fb.db, `groups/${o}/config`, 'app_settings'));
            if (s.exists()) {
              const t = s.data(),
                o = {};
              ('number' == typeof t.currentFreshmanTerm && (o.currentFreshmanTerm = t.currentFreshmanTerm),
                Array.isArray(t.tagTemplates) && (o.tagTemplates = t.tagTemplates),
                'number' == typeof t.lastPromotionYear &&
                  ((hasPromotionRecord = !0), (o.lastPromotionYear = t.lastPromotionYear)),
                'boolean' == typeof t.autoPromotionEnabled &&
                  (o.autoPromotionEnabled = t.autoPromotionEnabled),
                e(o));
            }
          } catch (e) {
            return void console.error('[AutoPromotion] Failed to fetch config:', e);
          }
          if (!hasPromotionRecord) {
            const base = d ? n : n - 1;
            console.log(`[AutoPromotion] No record yet. Storing baseline year ${base} without promoting.`);
            e({
              lastPromotionYear: base,
            });
            // 送信の完了は待たない。この関数は syncSessions の先頭で待たれて
            // いるため、通信できないときにここで止まると同期そのものが動かなく
            // なる。手元の値は先に入れてあり、送信は待ち行列に任せる。
            (0, a.setDoc)(
              (0, a.doc)(fb.db, `groups/${o}/config`, 'app_settings'),
              {
                lastPromotionYear: base,
                lastModified: (0, a.serverTimestamp)(),
              },
              {
                merge: !0,
              }
            ).catch((e) => {
              console.error('[AutoPromotion] Failed to store baseline year:', e);
            });
            return;
          }
          const { autoPromotionEnabled: u, lastPromotionYear: m } = s();
          if (u && d && m < n) {
            console.log(`[AutoPromotion] Performing annual promotion for year ${n}...`);
            try {
              await s().incrementAllGrades();
            } catch (e) {
              console.error('[AutoPromotion] Failed:', e);
            }
          }
        },
        syncSessions: async () => {
          if (!s().activeGroupId) return;
          const _syncDb = await waitForDb();
          if (!_syncDb) {
            console.warn('[Store] syncSessions: db still undefined after await, aborting');
            e({
              syncStatus: '同期エラー',
            });
            return;
          }
          if ((await s().checkAndAutoIncrementGrades(), I))
            return void console.log('[syncSessions] Already syncing, skipping...');
          I = !0;
          const o = s().lastSyncTime || 0;
          (console.log(
            '[Store] Syncing:',
            `同期を開始中 (前回基準時刻: ${o ? new Date(o).toLocaleString() : 'なし'})...`
          ),
            e({
              syncStatus: '同期中',
            }));
          try {
            // この関数の後ろで局所的な M を宣言しているため、下の forEach の中で
            // M.getState() を呼ぶと「初期化前の参照」で例外になり、同期が丸ごと
            // 止まる。団体IDはここで控えておく。
            const 団体ID = s().activeGroupId;
            const i = (0, a.collection)(fb.db, `groups/${s().activeGroupId}/sessions`),
              n = (0, a.collection)(fb.db, `groups/${s().activeGroupId}/members`),
              c = (0, a.collection)(fb.db, `groups/${s().activeGroupId}/trash`),
              l = (0, a.collection)(fb.db, `groups/${s().activeGroupId}/alumni`);
            let d, u, m, p;
            if (o > 0 && s().sessions.length > 0) {
              const e = Math.max(0, o - 1e4);
              ((d = await (0, a.getDocs)((0, a.query)(i, (0, a.where)('lastModified', '>', e)))),
                (u = await (0, a.getDocs)((0, a.query)(n, (0, a.where)('lastModified', '>', e)))),
                (m = await (0, a.getDocs)((0, a.query)(c, (0, a.where)('lastModified', '>', e)))),
                (p = await (0, a.getDocs)((0, a.query)(l, (0, a.where)('lastModified', '>', e)))));
            } else
              ((d = await (0, a.getDocs)((0, a.query)(i, (0, a.orderBy)('date', 'desc'), (0, a.limit)(100)))),
                (u = await (0, a.getDocs)(n)),
                (m = await (0, a.getDocs)(c)),
                (p = await (0, a.getDocs)(l)));
            let h = o;
            const f = (e) => (e?.toMillis ? e.toMillis() : e || 0),
              S = [];
            d.forEach((e) => {
              const s = e.data(),
                t = f(s.lastModified);
              t > h && (h = t);
              const cleanedTags =
                  s.tags && Array.isArray(s.tags)
                    ? Array.from(new Set(s.tags.map(normalizeTag).filter(Boolean)))
                    : [],
                originalTags = s.tags || [],
                isModified =
                  cleanedTags.length !== originalTags.length ||
                  cleanedTags.some((e, t) => e !== originalTags[t]);
              if (isModified && fb.db && 団体ID) {
                const s = (0, a.doc)(fb.db, `groups/${団体ID}/sessions`, e.id);
                (0, a.updateDoc)(s, {
                  tags: cleanedTags,
                }).catch((e) => console.error('[Store] syncSessions Auto cleanup failed:', e));
              }
              S.push(
                Object.assign({}, s, {
                  id: e.id,
                  tags: cleanedTags,
                  lastModified: t,
                  syncStatus: '同期済み',
                })
              );
            });
            const b = [];
            u.forEach((e) => {
              const s = e.data(),
                t = f(s.lastModified);
              (t > h && (h = t),
                b.push(
                  Object.assign({}, s, {
                    id: e.id,
                    lastModified: t,
                    syncStatus: '同期済み',
                  })
                ));
            });
            const v = [];
            m.forEach((e) => {
              const s = e.data(),
                t = f(s.lastModified);
              (t > h && (h = t),
                v.push(
                  Object.assign({}, s, {
                    id: e.id,
                    lastModified: t,
                    syncStatus: '同期済み',
                  })
                ));
            });
            const T = [];
            (p.forEach((e) => {
              const s = e.data(),
                t = f(s.lastModified);
              (t > h && (h = t),
                T.push(
                  Object.assign({}, s, {
                    id: e.id,
                    lastModified: t,
                    syncStatus: '同期済み',
                  })
                ));
            }),
              console.log(
                `[syncSessions] Fetched counts: S=${S.length}, M=${b.length}, T=${v.length}, A=${T.length}`
              ));
            const w = y(s().sessions, S, !1, !1),
              I = y(s().members, b, !1, !1),
              M = y(s().trash, v, !1, !1),
              A = y(s().alumni, T, !1, !1),
              D = new Set(A.map((e) => e.id)),
              O = I.filter((e) => !D.has(e.id)),
              L = new Set(O.map((e) => e.id)),
              G = A.filter((e) => !L.has(e.id));
            w.sort((e, s) => {
              const t = e.date ? new Date(e.date).getTime() : 0;
              return (s.date ? new Date(s.date).getTime() : 0) - t;
            });
            // 戻した記録がまだクラウドへ届いていないときは、クラウド側のゴミ箱の
            // 写しで消し込まない。届くまでは手元の「戻した」状態を優先する。
            const 復元待ち = new Set(w.filter((e) => e && '未同期' === e.syncStatus).map((e) => e.id)),
              ごみ箱 = M.filter((e) => e && !復元待ち.has(e.id));
            const $ = new Set(ごみ箱.map((e) => e.id)),
              N = w.filter((e) => !$.has(e.id)),
              P = N.filter((e) => '未同期' === e.syncStatus);
            let k = N;
            // 下のブロックでは e が一括送信の入れ物に隠れるので、状態の更新役を
            // ここで控えておく（ブロックの中から外の e は参照できない）。
            const 反映 = e;
            if (P.length > 0) {
              console.log(`[syncSessions] Syncing ${P.length} pending sessions...`);
              const e = (0, a.writeBatch)(fb.db),
                o = Date.now();
              const 送った版 = new Map(P.map((x) => [x.id, x.lastModified]));
              (P.forEach((i) => {
                const n = JSON.parse(
                  JSON.stringify(
                    Object.assign({}, i, {
                      syncStatus: '同期済み',
                      lastModified: o,
                    })
                  )
                );
                (e.set(
                  (0, a.doc)(fb.db, `groups/${s().activeGroupId}/sessions`, i.id),
                  Object.assign({}, n, {
                    lastModified: (0, a.serverTimestamp)(),
                  })
                ),
                  // 戻した記録なら、クラウドのゴミ箱からも取り下げる。存在しない場合は
                  // 何も起きないので、新規の記録に対しても安全。
                  e.delete((0, a.doc)(fb.db, `groups/${s().activeGroupId}/trash`, i.id)));
              }),
                // 送信の完了は待たない。通信できないと一括送信は終わらないため、
                // 待つとこの関数自体が返らず、同期中の目印が立ったままになって
                // 以後の同期がすべて飛ばされる。届いた時点で印を付け替える。
                //
                // 印を付けるのは送った版だけ。送信中に編集されると更新日時が
                // 変わるので、一致する場合に限る。これをしないと、まだ届いて
                // いない新しい内容が同期済みに見え、次の突き合わせでクラウドの
                // 古い写しに負けて編集が消える。
                e
                  .commit()
                  .then(() => {
                    反映((t) => ({
                      sessions: t.sessions.map((t) =>
                        t && 送った版.has(t.id) && t.lastModified === 送った版.get(t.id)
                          ? Object.assign({}, t, {
                              syncStatus: '同期済み',
                              lastModified: o,
                            })
                          : t
                      ),
                    }));
                  })
                  .catch((t) => {
                    console.error('[syncSessions] 記録の送信に失敗:', t);
                  }));
            }
            // 送信が済んでいない削除を送り直す。通信できないときに削除した場合、
            // 待ち行列ごと失われることがあり、そのままだと次の全件取得で記録が
            // 復活してしまう。
            // 送り直すのは「この端末で捨てて、まだ送れていない」ものだけ。
            // クラウドの写しを読み込んだだけの項目まで送ると、ゴミ箱を空にした
            // 直後に読み込んだ分が戻ってきてしまう。
            const Y = ごみ箱.filter((e) => e && e.id && e.pendingDelete && '未同期' === e.syncStatus);
            if (Y.length > 0) {
              console.log(`[syncSessions] Syncing ${Y.length} pending deletions...`);
              try {
                const e = (0, a.writeBatch)(fb.db);
                const 送った削除 = new Map(Y.map((x) => [x.id, x.lastModified]));
                (Y.forEach((t) => {
                  e.delete((0, a.doc)(fb.db, `groups/${s().activeGroupId}/sessions`, t.id));
                  const i = dropUndefinedDeep(
                    Object.assign({}, t, {
                      syncStatus: 'trashed',
                    })
                  );
                  // pendingDelete は端末の中だけの印。クラウドへは持ち込まない
                  (delete i.pendingDelete,
                    (i.lastModified = (0, a.serverTimestamp)()),
                    (i.deletedAt = i.deletedAt || (0, a.serverTimestamp)()),
                    e.set((0, a.doc)(fb.db, `groups/${s().activeGroupId}/trash`, t.id), i));
                }),
                  // 記録の送信と同じ理由で完了は待たない。印を付けるのも
                  // 送った版だけにする。
                  e
                    .commit()
                    .then(() => {
                      反映((t) => ({
                        trash: t.trash.map((t) =>
                          t && 送った削除.has(t.id) && t.lastModified === 送った削除.get(t.id)
                            ? Object.assign({}, t, {
                                syncStatus: '同期済み',
                                pendingDelete: !1,
                              })
                            : t
                        ),
                      }));
                    })
                    .catch((t) => {
                      console.error('[syncSessions] 削除の送り直しに失敗:', t);
                    }));
              } catch (t) {
                console.error('[syncSessions] 削除の送り直しの組み立てに失敗:', t);
              }
            }
            // 完全に消したものは、クラウドにまだ残っていても画面に出さない。
            // 控えの整理と消し直しは、記録もゴミ箱も全件そろう
            // fetchAndOverwriteFromCloud 側で行う（ここは差分取得なので、
            // クラウドに残っているかを正しく判定できない）。
            const 完全削除ずみ = new Set(Object.keys(s().permanentlyDeleted || {}));
            // 送信が済んでいないメンバーを送り直す。記録やゴミ箱と同じで、
            // 通信できないときの変更は待ち行列ごと失われることがあり、
            // そのままだと手元にしかない氏名や学年が永久に届かない。
            // 名簿を書けるのは団体アカウントだけなので、部員では試みない。
            const 未送信のメンバー =
              'group' === s().activeRole ? O.filter((e) => e && e.id && '未同期' === e.syncStatus) : [];
            if (未送信のメンバー.length > 0) {
              console.log(`[syncSessions] Syncing ${未送信のメンバー.length} pending members...`);
              try {
                const e = (0, a.writeBatch)(fb.db);
                const 送ったメンバー = new Map(未送信のメンバー.map((x) => [x.id, x.lastModified]));
                (未送信のメンバー.forEach((t) => {
                  const i = dropUndefinedDeep(Object.assign({}, t, { syncStatus: '同期済み' }));
                  ((i.lastModified = (0, a.serverTimestamp)()),
                    e.set((0, a.doc)(fb.db, `groups/${s().activeGroupId}/members`, t.id), i));
                }),
                  // 完了は待たない（記録・ゴミ箱と同じ理由）
                  e
                    .commit()
                    .then(() => {
                      (反映((t) => ({
                        members: t.members.map((t) =>
                          t && 送ったメンバー.has(t.id) && t.lastModified === 送ったメンバー.get(t.id)
                            ? Object.assign({}, t, { syncStatus: '同期済み' })
                            : t
                        ),
                      })),
                        s().syncMemberLookup());
                    })
                    .catch((t) => {
                      console.error('[syncSessions] メンバーの送り直しに失敗:', t);
                    }));
              } catch (t) {
                console.error('[syncSessions] メンバーの送り直しの組み立てに失敗:', t);
              }
            }
            // 卒業生も同じ。個人IDの自動採番は卒業生にも振るので、送り直しが
            // 無いと手元にしかないIDが永久に届かず、端末ごとに食い違う。
            const 未送信の卒業生 =
              'group' === s().activeRole ? G.filter((e) => e && e.id && '未同期' === e.syncStatus) : [];
            if (未送信の卒業生.length > 0) {
              console.log(`[syncSessions] Syncing ${未送信の卒業生.length} pending alumni...`);
              try {
                const e = (0, a.writeBatch)(fb.db);
                const 送った卒業生 = new Map(未送信の卒業生.map((x) => [x.id, x.lastModified]));
                (未送信の卒業生.forEach((t) => {
                  const i = dropUndefinedDeep(Object.assign({}, t, { syncStatus: '同期済み' }));
                  ((i.lastModified = (0, a.serverTimestamp)()),
                    e.set((0, a.doc)(fb.db, `groups/${s().activeGroupId}/alumni`, t.id), i));
                }),
                  e
                    .commit()
                    .then(() => {
                      反映((t) => ({
                        alumni: t.alumni.map((t) =>
                          t && 送った卒業生.has(t.id) && t.lastModified === 送った卒業生.get(t.id)
                            ? Object.assign({}, t, { syncStatus: '同期済み' })
                            : t
                        ),
                      }));
                    })
                    .catch((t) => {
                      console.error('[syncSessions] 卒業生の送り直しに失敗:', t);
                    }));
              } catch (t) {
                console.error('[syncSessions] 卒業生の送り直しの組み立てに失敗:', t);
              }
            }
            (e({
              // 完全に消したものは、クラウドにまだ残っていても画面に出さない
              sessions: k.filter((e) => e && !完全削除ずみ.has(e.id)),
              members: O,
              trash: ごみ箱.filter((e) => e && !完全削除ずみ.has(e.id)),
              alumni: G,
              syncStatus: '同期済み',
              lastSyncTime: h,
            }),
              console.log(`[syncSessions] Finished. New lastSyncTime: ${h}`),
              setTimeout(() => {
                s().ensurePersonalIds();
              }, 500));
          } catch (s) {
            (console.error('[syncSessions] Error:', s),
              不具合を控える('記録の同期', s),
              e({
                syncStatus: '同期エラー',
              }));
          } finally {
            I = !1;
          }
        },
        syncAllToCloud: async () => {
          行動を控える('クラウドへ同期', (s().sessions || []).length + '件');

          const { activeGroupId: o, activeRole: i, isNetworkOnline: n } = s();
          if (o && n)
            if ('member' !== i) {
              (console.log('[Store] Loading:', 'クラウドへの同期を開始...'),
                e({
                  syncStatus: '同期中',
                }));
              try {
                const o = (e) => JSON.parse(JSON.stringify(e)),
                  i = [];
                // 送る時点の更新日時を控えておく。送り終えたあとに照合して、
                // 送っている最中の編集に「同期済み」を付けないようにする
                const 控える = (一覧) =>
                  new Map((一覧 || []).filter((e) => e && e.id).map((e) => [e.id, e.lastModified]));
                const 送った記録 = 控える(s().sessions),
                   送った名簿 = 控える(s().members),
                   送った卒業生 = 控える(s().alumni);
                (s().members.forEach((e) => {
                  if (e && e.id) {
                    const n = Object.assign({}, e, {
                      lastModified: Date.now(),
                    });
                    i.push({
                      type: 'set',
                      ref: (0, a.doc)(fb.db, `groups/${s().activeGroupId}/members`, e.id),
                      data: o(n),
                    });
                  }
                }),
                  s().alumni.forEach((e) => {
                    if (e && e.id) {
                      const n = Object.assign({}, e, {
                        lastModified: Date.now(),
                      });
                      i.push({
                        type: 'set',
                        ref: (0, a.doc)(fb.db, `groups/${s().activeGroupId}/alumni`, e.id),
                        data: o(n),
                      });
                    }
                  }),
                  s().sessions.forEach((e) => {
                    if (e && e.id) {
                      const n = o(
                        Object.assign({}, e, {
                          syncStatus: '同期済み',
                          lastModified: Date.now(),
                        })
                      );
                      i.push({
                        type: 'set',
                        ref: (0, a.doc)(fb.db, `groups/${s().activeGroupId}/sessions`, e.id),
                        data: n,
                      });
                    }
                  }),
                  s().trash.forEach((e) => {
                    if (e && e.id) {
                      const n = Object.assign({}, e, {
                        lastModified: Date.now(),
                      });
                      // pendingDelete は端末の中だけの印。クラウドへは持ち込まない
                      // （syncSessions の送り直しと同じ扱い）
                      delete n.pendingDelete;
                      i.push({
                        type: 'set',
                        ref: (0, a.doc)(fb.db, `groups/${s().activeGroupId}/trash`, e.id),
                        data: o(n),
                      });
                    }
                  }),
                  i.push({
                    type: 'set',
                    ref: (0, a.doc)(fb.db, `groups/${s().activeGroupId}/config`, 'app_settings'),
                    data: {
                      currentFreshmanTerm: s().currentFreshmanTerm,
                      tagTemplates: s().tagTemplates,
                      lastPromotionYear: s().lastPromotionYear,
                      lastModified: Date.now(),
                    },
                  }));
                const n = 400;
                for (let e = 0; e < i.length; e += n) {
                  const s = i.slice(e, e + n),
                    o = (0, a.writeBatch)(fb.db);
                  (s.forEach((e) => {
                    'set' === e.type ? o.set(e.ref, e.data) : 'delete' === e.type && o.delete(e.ref);
                  }),
                    await o.commit());
                }
                // 印を付けるのは「送った版」だけ。送っている最中に編集された
                // ものまで送信済みにすると、その新しい内容が送り直しの対象から
                // 外れてクラウドへ届かないままになる（記録の保存や編集と同じ考え方）
                const 済ませる = (一覧, 送った版) =>
                  一覧.map((e) =>
                    e && 送った版.has(e.id) && e.lastModified === 送った版.get(e.id)
                      ? Object.assign({}, e, { syncStatus: '同期済み' })
                      : e
                  );
                const c = 済ませる(s().sessions, 送った記録),
                  l = 済ませる(s().members, 送った名簿),
                  d = 済ませる(s().alumni, 送った卒業生);
                (e({
                  sessions: c,
                  members: l,
                  alumni: d,
                  syncStatus: '同期済み',
                  lastSyncTime: Date.now(),
                }),
                  console.log('[Store] Loading:', 'クラウドへの送信が完了しました'));
              } catch (s) {
                (console.error('Full Sync Error:', s?.message || s),
                  不具合を控える('クラウドへ同期', s),
                  e({
                    syncStatus: '同期エラー',
                  }));
              }
            } else console.log('[Store] Member role: syncAllToCloud is strictly restricted.');
        },
        /** まだ送れていないものの数を数える */
        countUnsynced: () => {
          const 数 = (一覧) =>
            Array.isArray(一覧) ? 一覧.filter((e) => e && '未同期' === e.syncStatus).length : 0;
          const { sessions: o, members: i, alumni: n, trash: c } = s();
          return 数(o) + 数(i) + 数(n) + 数(c);
        },
        /**
         * ログアウトの前に、送れていないものを送り切ろうとする。
         * 残った数を返す。0 なら失われるものは無い。
         *
         * ログアウトは手元の記録を全部捨てるので、ここで送っておかないと
         * 圏外で保存してそのまま抜けた分が失われる。送信の完了は待たない作りな
         * ので、印が「同期済み」に変わるのを少しの間だけ見張る（最大3秒）。
         */
        flushUnsyncedForLogout: async () => {
          if (0 === s().countUnsynced()) return 0;
          if (!s().isNetworkOnline) return s().countUnsynced();
          try {
            await s().syncSessions();
          } catch (e) {
            console.error('[Store] flushUnsyncedForLogout error:', e);
          }
          for (let e = 0; e < 15; e++) {
            if (0 === s().countUnsynced()) return 0;
            await new Promise((e) => setTimeout(e, 200));
          }
          return s().countUnsynced();
        },
        fetchAndOverwriteFromCloud: async () => {
          (console.log('[Store] Loading:', 'クラウドからの取得を開始...'),
            e({
              syncStatus: '同期中',
            }));
          const _fetchDb = await waitForDb();
          if (!_fetchDb) {
            console.warn('[Store] fetchAndOverwriteFromCloud: db still undefined after await, aborting');
            e({
              syncStatus: '同期エラー',
            });
            return;
          }
          try {
            const o = await (0, a.getDocs)((0, a.collection)(fb.db, `groups/${s().activeGroupId}/members`));
            let n = [];
            o.forEach((e) => n.push(e.data()));
            const c = await (0, a.getDocs)((0, a.collection)(fb.db, `groups/${s().activeGroupId}/sessions`));
            let l = [];
            (c.forEach((e) => l.push(e.data())),
              console.log('[Store] Loading:', `セッション ${l.length}件を取得しました`));
            const d = await (0, a.getDocs)((0, a.collection)(fb.db, `groups/${s().activeGroupId}/trash`));
            let u = [];
            d.forEach((e) => u.push(e.data()));
            const m = await (0, a.getDocs)((0, a.collection)(fb.db, `groups/${s().activeGroupId}/alumni`));
            let p = [];
            m.forEach((e) => p.push(e.data()));
            const h = await (0, a.getDoc)(
              (0, a.doc)(fb.db, `groups/${s().activeGroupId}/config`, 'app_settings')
            );
            let f = s().currentFreshmanTerm,
              S = s().tagTemplates,
              b = s().lastPromotionYear;
            if (h.exists()) {
              const e = h.data();
              e &&
                (void 0 !== e.currentFreshmanTerm && (f = e.currentFreshmanTerm),
                void 0 !== e.tagTemplates && (S = e.tagTemplates),
                void 0 !== e.lastPromotionYear && (b = e.lastPromotionYear));
            }
            const v = y(s().sessions, l, !1, !0),
              T = y(s().members, n, !1, !0),
              w = y(s().trash, u, !1, !0);
            // ゴミ箱に入っているものは履歴に出さない。削除がまだクラウドへ届いて
            // いないとき、ここで書き戻すと記録が復活してしまう。
            // 逆に、戻したばかりでまだ送信できていない記録は、クラウドのゴミ箱の
            // 写しがあってもゴミ箱に入れ直さない。
            const 復元待ち = new Set(v.filter((e) => e && '未同期' === e.syncStatus).map((e) => e.id)),
              ごみ箱 = w.filter((e) => e && !復元待ち.has(e.id)),
              I = new Set(ごみ箱.map((e) => e.id)),
              M = v.filter((e) => e && !I.has(e.id));
            // 完全に消したものの後始末。ここは記録もゴミ箱も全件そろっているので、
            // クラウドから本当に消えたかを正しく判定できる。
            //   ・まだ残っている → 消し直して控えは残す
            //   ・もう無い       → 消し終わったので控えから外す
            //   ・30日を過ぎた   → 手放す（控えが際限なく増えないように）
            const 控え = s().permanentlyDeleted || {};
            const 控えのid = Object.keys(控え);
            let 完全削除ずみ = new Set(控えのid);
            if (控えのid.length > 0) {
              const 期限 = Date.now() - 2592e6;
              const クラウドに有る = new Set([...l, ...u].filter((e) => e && e.id).map((e) => e.id));
              const 消し直す = 控えのid.filter((e) => 控え[e] >= 期限 && クラウドに有る.has(e));
              const 残す = {};
              消し直す.forEach((e) => {
                残す[e] = 控え[e];
              });
              完全削除ずみ = new Set(消し直す);
              if (消し直す.length !== 控えのid.length)
                console.log(`[Store] 完全削除の控えを整理: ${控えのid.length}件 → ${消し直す.length}件`);
              if (消し直す.length > 0) {
                console.log(`[Store] クラウドに残っている ${消し直す.length}件 を消し直します`);
                try {
                  const e = (0, a.writeBatch)(fb.db);
                  (消し直す.forEach((t) => {
                    (e.delete((0, a.doc)(fb.db, `groups/${s().activeGroupId}/sessions`, t)),
                      e.delete((0, a.doc)(fb.db, `groups/${s().activeGroupId}/trash`, t)));
                  }),
                    e.commit().catch((t) => {
                      console.error('[Store] 完全削除の送り直しに失敗:', t);
                    }));
                } catch (t) {
                  console.error('[Store] 完全削除の送り直しの組み立てに失敗:', t);
                }
              }
              e({
                permanentlyDeleted: 残す,
              });
            }
            // 消したメンバーの控えも同じように整理する。
            //   ・まだクラウドに残っている → 消し直して控えは残す
            //   ・もう無い                 → 消し終わったので控えから外す
            //   ・30日を過ぎた             → 手放す
            const メンバーの控え = s().deletedMembers || {};
            const メンバーの控えのid = Object.keys(メンバーの控え);
            let 削除ずみのメンバー = new Set(メンバーの控えのid);
            if (メンバーの控えのid.length > 0) {
              const 期限 = Date.now() - 2592e6;
              const クラウドに有る = new Set((n || []).filter((e) => e && e.id).map((e) => e.id));
              const 消し直す = メンバーの控えのid.filter((e) => メンバーの控え[e] >= 期限 && クラウドに有る.has(e));
              const 残す = {};
              消し直す.forEach((e) => {
                残す[e] = メンバーの控え[e];
              });
              削除ずみのメンバー = new Set(消し直す);
              if (消し直す.length > 0) {
                console.log(`[Store] クラウドに残っているメンバー ${消し直す.length}件 を消し直します`);
                try {
                  const e = (0, a.writeBatch)(fb.db);
                  (消し直す.forEach((t) => {
                    e.delete((0, a.doc)(fb.db, `groups/${s().activeGroupId}/members`, t));
                  }),
                    e.commit().catch((t) => {
                      console.error('[Store] メンバーの削除の送り直しに失敗:', t);
                    }));
                } catch (t) {
                  console.error('[Store] メンバーの削除の送り直しの組み立てに失敗:', t);
                }
              }
              e({
                deletedMembers: 残す,
              });
            }
            (e({
              members: T.filter((e) => e && !削除ずみのメンバー.has(e.id)),
              sessions: M.filter((e) => e && !完全削除ずみ.has(e.id)),
              trash: ごみ箱.filter((e) => e && !完全削除ずみ.has(e.id)),
              alumni: y(s().alumni, p, !1, !0),
              currentFreshmanTerm: f,
              tagTemplates: S,
              lastPromotionYear: b,
              syncStatus: '同期済み',
              lastSyncTime: Date.now(),
            }),
              console.log('[Store] Loading:', '同期が完了しました'));
          } catch (s) {
            (console.error('Fetch Overwrite Error:', s),
              不具合を控える('クラウドから取得', s),
              e({
                syncStatus: '同期エラー',
              }));
          }
        },
        // 戻り値は '開始した' / '同名あり' / '確認できない' の3つ。
        // 元は真偽値で、画面はどちらの理由でも「既に使用されています」と出していた。
        /**
         * ライブを始める。
         *
         * 共有 に { 編集の枝, 閲覧の枝 } を渡すと、そのライブだけを専用の枝に置く
         * （URLで配るため。src/liveShare.js）。渡さなければ団体の枝に置く。
         * 名前が空いているかは、どちらの場合も団体の枝で見る。参加一覧に出る
         * 名前はそちらで、共有の枝は毎回作りたてなので必ず空いている
         */
        startLiveSync: async (o, 共有) => {
          // ライブを移ったら控えは捨てる。前のライブで載せた○×を覚えたままだと、
          // 次のライブで「前と同じ」と見なして送らず、相手の画面に出ない
          載っている印を捨てる();
          if (!fb.rtdb) return '確認できない';
          // ライブを置く枝は団体ごとの合言葉。まだ手元に無ければ取りにいく。
          // ここで取れないまま団体IDで始めると、他団体から丸見えになる
          const 団 = 団体の枝() || (await s().ライブの合言葉を用意する());
          if (!秘.枝として使えるか(団)) return '確認できない';
          const 枝 = 共有 && 秘.枝として使えるか(共有.編集の枝) ? String(共有.編集の枝) : 団;
          // いま自分が主催しているライブを共有へ切り替えるときは、同名でよい。
          // 団体の枝にある自分の節点を、道しるべへ置き換えるだけだから
          const 自分のを置き換える = !!(共有 && s().isHost && s().liveSessionName === o);
          try {
            const e = (0, i.ref)(fb.rtdb, `live_sessions/${団}/${o}`);
            if (!自分のを置き換える && (await (0, i.get)(e)).exists()) return '同名あり';
          } catch (e) {
            // 確かめられないまま作ると、進行中の同名ライブを上書きして潰す。
            // 元はここで握りつぶして、そのまま作成へ進んでいた
            return (console.error('Session Name Check Error:', e), '確認できない');
          }
          (s().stopLiveSync(!0),
            e({
              // 共有のライブなら、そのライブ専用の枝を据える。
              // stopLiveSync より後に置くこと。先に置くと、その中で消される
              いまのライブの枝: 共有 ? 枝 : null,
              // 自分で始めたライブなので、よそではない
              よその団体のライブ: !1,
              いまのライブの閲覧枝: 共有 ? 共有.閲覧の枝 || null : null,
              写しを見ているか: !1,
              isLiveActive: !0,
              isHost: !0,
              // 主催者は必ず記録する側
              ライブは見るだけ: !1,
              liveSessionName: o,
              isIncomingLiveSync: !1,
              lastLocalChange: Date.now(),
              // 共有履歴はライブごとに別物。前のライブの目印を持ち越すと、
              // 新しいライブでいきなり取り消しが押せて、無い手を読みにいく。
              // 主催者は同名のライブを作れないので必ず新品。参加者と違って
              // 「これまでの結果」が届くことがなく、初回を飛ばす目印は要らない
              historySharedLen: 0,
              historySharedMax: 0,
              historyHandledAt: 0,
              historyIsFirstSnapshot: !1,
              // 同じ名前で始め直したとき、前回の片付けが節点に残っていることがある。
              // 最初の1通ぶんは知らせない
              resetIsFirstSnapshot: !0,
            }));
          const a = s();
          if (!fb.rtdb) return '確認できない';
          const n = (0, i.ref)(fb.rtdb, `live_sessions/${枝}/${o}/state`),
            l = Array.isArray(a.archers) ? a.archers : [];
          try {
            return (
              v(o, l, a.shotsPerRound),
              // 閲覧用の枝を、共有の枝の state にも載せておく。
              // リンクで入った記録係も写しへ流せるようにするため。
              // 載せないと、その人の○×だけ見ている人に出ない。
              // ここを読めるのは編集の枝を知っている人だけなので、閲覧の人には見えない
              共有 &&
                (0, i.update)((0, i.ref)(fb.rtdb, `live_sessions/${枝}/${o}/state`), {
                  閲覧の枝: 共有.閲覧の枝 || null,
                }).catch(() => {}),
              // 共有のライブは別の枝にあるので、参加一覧に出すための道しるべを
              // 団体の枝へ置く。部員はこれを辿って共有の枝へ入る
              共有 &&
                (0, i.set)((0, i.ref)(fb.rtdb, 道しるべの場所(団, o)), {
                  共有の枝: 枝,
                  閲覧の枝: 共有.閲覧の枝 || null,
                  status: 'active',
                  timestamp: Date.now(),
                  updated_at: (0, i.serverTimestamp)(),
                }).catch((t) => console.error('[Store] 道しるべを置けませんでした', t)),
              在席を始める(o, e),
              c.IS_WEB && console.log('ライブを開始しました: ' + o),
              (0, i.onValue)(n, (o) => {
                const a = o.val();
                if (!a) {
                  const o = s().liveSessionName;
                  return (
                    o &&
                      fb.rtdb &&
                      (0, i.off)((0, i.ref)(fb.rtdb, `live_sessions/${枝}/${o}/state`)),
                      (在席を終える(e), 写しを見るのをやめる()),
                    void e({
                      isLiveActive: !1,
                      isHost: !1,
                      liveSessionName: null,
                    })
                  );
                }
                // 期限は枝分かれの前に控える。下の「他人の書き込み」の枝だけに
                // 置くと、自分で配った主催者は自分の返りしか受けないので
                // 一度も拾えない（カウントダウンが出なかった）
                期限を控える(a, e, s);
                if (a.timestamp === s().lastPushedTimestamp) 返りの印を取り込む(a, e, s);
                if (a.timestamp !== s().lastPushedTimestamp) {
                  if ('finished' === a.status) {
                    const o = s().liveSessionName;
                    return (
                      o &&
                        fb.rtdb &&
                        (0, i.off)((0, i.ref)(fb.rtdb, `live_sessions/${枝}/${o}/state`)),
                        (在席を終える(e), 写しを見るのをやめる()),
                      void e({
                        isLiveActive: !1,
                        isHost: !1,
                        liveSessionName: null,
                      })
                    );
                  }
                  // 誰かが配ったら、その枝へ付いていく
                  // 期限より先に見る。切れているのに付いていくと、行った先でも切れている
            if (期限で閉じるか(a, e, s)) return;
            if (移ったら付いていく(a, e, s)) return;
                  共有履歴の目印を受け取る(a, e, s);
                  // 参加者側と同じ。始め直したとき、節点に前回の片付けが
                  // 残っていることがあるので、最初の1通ぶんは知らせない
                  const 主のリセット初回 = s().resetIsFirstSnapshot;
                  if (主のリセット初回) e({ resetIsFirstSnapshot: !1 });
                  if (a.reset_at && a.reset_at > (s().lastResetHandled || 0))
                    return (
                      e({
                        lastResetHandled: a.reset_at,
                      }),
                      主のリセット初回 &&
                        e({
                          lastPushedTimestamp: a.timestamp || 0,
                        }),
                      // 送信はしない。受け取ったリセットを送り返すと、相手の画面に
                      // 「リセットしました」が二度出るうえ、無駄な書き込みが増える
                      void s().resetCurrentSession(!1)
                    );
                  if (a.archers || Array.isArray(a.archers)) {
                    // 突き合わせは syncRules.js の mergeLiveArchers に出した。
                    // 主催者側と参加者側で同じ処理が二重に書かれていたため
                    const { archers: 受信, shotsPerRound: 本数 } = w(a),
                      結果 = mergeLiveArchers(s().archers, 受信, s().shotsPerRound, 本数);
                    // 受け取りの正規化は短い○×を伸ばすだけで、長いほうは切らない。
                    // 相手が射数を減らしたとき、手元の射手のほうが新しいと
                    // 射数だけ減って○×が伸びたまま残る（画面に出ないますの○が
                    // 的中数に入る）。射数が変わればここは必ず通る
                    結果.changed &&
                      e({
                        archers: 盤面を射数にそろえる(結果.archers, 本数),
                        shotsPerRound: 本数,
                      });
                  }
                }
              }),
              '開始した'
            );
          } catch (e) {
            return (console.error('Start Live Sync Error:', e), '確認できない');
          }
        },
        /**
         * いま入っているライブを、URLで配れるようにする。主催者だけができる。
         *
         * 団体の合言葉は配らない。配ると、その1本で団体の全部のライブに
         * 入られてしまう。そのライブ専用の枝を作ってそちらへ移し、リンクは
         * その枝だけを指す（src/liveShare.js）。
         *
         * 編集用と閲覧用は別々の種から作る。閲覧リンクを持っていても、
         * 編集用の枝は計算できない。
         *
         * 戻り値は { 編集の荷, 閲覧の荷, 合言葉が要るか }。失敗したら null。
         * 盤面は手元に残っているので、移っても○×は消えない
         */
        /**
         * いま入っているライブを、URLで配れるようにする。
         *
         * 主催者でなくてもよい。ただし共有は「ライブを専用の枝へ移す」操作なので、
         * 参加者が勝手に移すと主催者が元の枝に取り残されて分裂する。そこで
         * 元の枝に「移った先」を書き、ほかの台はそれを見て付いてくる。
         *
         * すでに配られているライブなら、そのときの種から同じリンクを作り直す。
         * 種は共有の枝の state に置いてあり、編集の枝を知っている人だけが読める。
         * 合言葉は要らない（リンクを組むのに種しか使わないため）。
         * これで、配った本人でなくても同じリンクを渡せる。
         */
        ライブを共有する: async (合言葉, 持ち) => {
          const { liveSessionName: 名前 } = s();
          if (!fb.rtdb || !名前) return null;
          // 見るだけの人は配れない。写しの枝しか知らないので、
          // 配っても記録できるリンクにはならない
          if (s().写しを見ているか) return null;
          const 今の枝 = ライブの枝();
          if (!今の枝) return null;
          const 状態の道 = `live_sessions/${今の枝}/${名前}/state`;

          let 今の中身 = {};
          try {
            const x = await (0, i.get)((0, i.ref)(fb.rtdb, 状態の道));
            今の中身 = x.exists() ? x.val() || {} : {};
          } catch (t) {
            return (console.error('[Store] ライブを読めませんでした', t), null);
          }
          // すでに配られている
          const 種 = 今の中身.種;
          if (種 && 種.編集 && 種.閲覧) {
            // 期限は配ったときのものを引き継ぐ。ここで付け直すと期限が延び、
            // 決まりの側（延ばせない）と食い違って、画面だけが嘘をつく
            const 元の期限 = 'number' == typeof 今の中身.期限 ? 今の中身.期限 : null;
            return {
              編集の荷: 共.共有の荷を組む({
                種: 種.編集,
                名前: 名前,
                役: 共.編集,
                鍵が要るか: !!今の中身.鍵が要るか,
                期限: 元の期限,
              }),
              閲覧の荷: 共.共有の荷を組む({
                種: 種.閲覧,
                名前: 名前,
                役: 共.閲覧,
                鍵が要るか: !!今の中身.鍵が要るか,
                期限: 元の期限,
              }),
              合言葉が要るか: !!今の中身.鍵が要るか,
              期限: 元の期限,
              すでに配られていた: !0,
            };
          }

          // ここから、まだ配られていないライブを専用の枝へ移す
          const 鍵 = String(合言葉 == null ? '' : 合言葉);
          const 編集の種 = 共.共有の種を作る();
          const 閲覧の種 = 共.共有の種を作る();
          const 編集の枝 = 共.枝を導く(編集の種, 鍵);
          const 閲覧の枝 = 共.枝を導く(閲覧の種, 鍵);
          const 団 = 団体の枝() || (await s().ライブの合言葉を用意する());
          if (!秘.枝として使えるか(団)) return null;
          // 期限はサーバーの時計で決める。手元の時計が進んでいると、
          // 配った瞬間に切れているリンクを渡してしまう
          const 期限 = 共.期限の時刻(
            'number' == typeof 持ち ? 持ち : 共.期限の既定,
            await サーバー時刻()
          );
          try {
            // 期限は盤面より先に置く。あとにすると、途中で失敗したときに
            // 「期限の無いリンク」が残る。逆なら残るのは読むもののない期限だけ
            if (期限)
              await Promise.all([
                (0, i.set)((0, i.ref)(fb.rtdb, 期限の場所(編集の枝)), 期限),
                (0, i.set)((0, i.ref)(fb.rtdb, 期限の場所(閲覧の枝)), 期限),
              ]);
            // 盤面をそのまま新しい枝へ写す。種もここに置く（編集の枝を知る人だけが読める）
            await (0, i.set)(
              (0, i.ref)(fb.rtdb, `live_sessions/${編集の枝}/${名前}/state`),
              Object.assign({}, 今の中身, {
                閲覧の枝: 閲覧の枝,
                種: { 編集: 編集の種, 閲覧: 閲覧の種 },
                鍵が要るか: !!鍵,
                期限: 期限,
                移った先: null,
                timestamp: Date.now(),
                updated_at: (0, i.serverTimestamp)(),
              })
            );
            // 閲覧用の写しも、ここで一度作っておく。作らないと、配った直後に
            // 閲覧リンクを開いた人が「見つからない」になる。
            // 種と閲覧の枝は写しに入れないこと。閲覧の人に編集側の手がかりを渡さない
            const 写しの中身 = Object.assign({}, 今の中身, { 期限: 期限 });
            (delete 写しの中身.種,
              delete 写しの中身.閲覧の枝,
              delete 写しの中身.移った先,
              delete 写しの中身.移った先の閲覧枝);
            await (0, i.set)(
              (0, i.ref)(fb.rtdb, 写しの場所(閲覧の枝, 名前)),
              Object.assign(写しの中身, {
                timestamp: Date.now(),
                updated_at: (0, i.serverTimestamp)(),
              })
            );
            // 共有履歴も引き継ぐ。取り消しの目印は state に載っているので、
            // 中身を移さないと押した瞬間に無い手を読みにいく
            const 元の履歴 = await (0, i.get)(
              (0, i.ref)(fb.rtdb, 共有履歴の場所(今の枝, 名前))
            );
            if (元の履歴.exists())
              await (0, i.set)(
                (0, i.ref)(fb.rtdb, 共有履歴の場所(編集の枝, 名前)),
                元の履歴.val()
              );
            // 参加一覧に出すための道しるべ
            await (0, i.set)((0, i.ref)(fb.rtdb, 道しるべの場所(団, 名前)), {
              共有の枝: 編集の枝,
              閲覧の枝: 閲覧の枝,
              // 参加一覧が、期限の切れたライブを外すのに使う
              // （src/syncRules.js の 参加できるライブ）
              期限: 期限 || null,
              status: 'active',
              timestamp: Date.now(),
              updated_at: (0, i.serverTimestamp)(),
            });
            // 元の枝に道しるべを置く。ほかの台はこれを見て付いてくる。
            // 置かないと、配った人だけが新しい枝へ移ってライブが分裂する
            if (今の枝 !== 団)
              await (0, i.update)((0, i.ref)(fb.rtdb, 状態の道), {
                移った先: 編集の枝,
                移った先の閲覧枝: 閲覧の枝,
                updated_at: (0, i.serverTimestamp)(),
              });
          } catch (t) {
            return (console.error('[Store] ライブを配れませんでした', t), null);
          }
          // 自分も新しい枝へ移る。主催者かどうかは変えない
          const 主催だった = s().isHost;
          s().joinLiveSync(名前, !1, { 枝: 編集の枝, 閲覧枝: 閲覧の枝 });
          e({ isHost: 主催だった, よその団体のライブ: !1 });
          return {
            編集の荷: 共.共有の荷を組む({
              種: 編集の種,
              名前: 名前,
              役: 共.編集,
              鍵が要るか: !!鍵,
              期限: 期限,
            }),
            閲覧の荷: 共.共有の荷を組む({
              種: 閲覧の種,
              名前: 名前,
              役: 共.閲覧,
              鍵が要るか: !!鍵,
              期限: 期限,
            }),
            合言葉が要るか: !!鍵,
            期限: 期限,
            すでに配られていた: !1,
          };
        },
        /**
         * 共有リンクから入る。団体に入っていなくても使える。
         *
         * 合言葉は照らし合わせない。枝の名前そのものを合言葉から導くので、
         * 違っていれば別の枝を見にいき、そこには何も無い。だから
         * 「合っていない」ことは「盤面が来ない」という形で分かる。
         *
         * 戻り値は '入った' / '見つからない' / '期限切れ' / '確認できない'
 *
 * '見つからない' は合言葉違いと終了の両方を指す。枝の名前を合言葉から導くので、
 * 違えば別の枝を見にいくだけで、どちらなのかは区別できない
         */
        共有リンクで入る: async (荷, 合言葉) => {
          if (!fb.rtdb) return '確認できない';
          const 中身 = 共.共有の荷を解く(荷);
          if (!中身) return '確認できない';
          const 枝 = 共.枝を導く(中身.種, String(合言葉 == null ? '' : 合言葉));
          if (!秘.枝として使えるか(枝)) return '確認できない';
          const 見るだけ = 中身.役 === 共.閲覧;
          const 道 = 見るだけ
            ? 写しの場所(枝, 中身.名前)
            : `live_sessions/${枝}/${中身.名前}/state`;
          // 記録する側は、写しを流す先も受け取る。受け取らないと、
          // この人が入れた○×だけが見ている人に出ない
          let 写す先 = null;
          try {
            // 合言葉が違えば別の枝になるので、ここで「無い」と分かる
            const 有 = await (0, i.get)((0, i.ref)(fb.rtdb, 道));
            if (!有.exists()) return '見つからない';
            if (!見るだけ) {
              const 中 = 有.val() || {};
              if (秘.枝として使えるか(中.閲覧の枝)) 写す先 = String(中.閲覧の枝);
            }
          } catch (t) {
            // 決まりに弾かれたときだけ、期限を見に行く。
            //
            // 先に期限を確かめる作りにしていたが、それだと期限の無いリンクでも
            // 参加のたびに問い合わせが1回増える（実測でおよそ230ミリ秒）。
            // 弾かれるのは稀なので、そのときだけ調べれば足りる。
            //
            // 荷に載っている期限は誰でも書き換えられるので、そちらは見ない。
            // ここで見るのは「期限切れです」と言い切るためだけで、
            // 切れた枝に入れないことは決まりの側が保証している
            if (弾かれたか(t))
              try {
                const 限 = await (0, i.get)((0, i.ref)(fb.rtdb, 期限の場所(枝)));
                const v = 限.exists() ? 限.val() : null;
                if ('number' == typeof v && (await サーバー時刻()) >= v) return '期限切れ';
              } catch (e2) {
                /* 期限も読めない。理由が分からないので、下の「確認できない」に落とす */
              }
            return (console.error('[Store] 共有リンクの確認に失敗:', t), '確認できない');
          }
          // 自分の団体のライブか、よその団体のライブかを見分ける。
          //
          // 自分の団体の枝に、この枝を指す道しるべがあれば自分たちの練習。
          // 部員が共有リンクを開いただけ、という筋がこれに当たる。
          // 見分けられなかったときは「よそ」として扱う。取り違えて
          // よその練習を自分の団体の記録に残すほうが困る
          let よそ = !0;
          const 団 = 団体の枝();
          if (団) {
            try {
              const 印 = await (0, i.get)(
                (0, i.ref)(fb.rtdb, 道しるべの場所(団, 中身.名前))
              );
              const v = 印.exists() ? 印.val() || {} : {};
              if (v.共有の枝 === 枝 || v.閲覧の枝 === 枝) よそ = !1;
            } catch (t) {
              console.warn('[Store] 自分の団体のライブか確かめられませんでした', t);
            }
          }
          // 団体に入っていない人は「来客」。App.js がこれを見て画面を出す
          e({ 共有の来客: !s().activeGroupId });
          if (!見るだけ) {
            // 記録する側は、部員が参加するのと同じ道を通す。受け取りの取り込みは
            // 「自分の送信の返りを無視する」「同じ通知に載った相手の印は取り込む」と
            // 込み入っていて、ここに別に書くと必ずずれる。実際、別に書いていたときは
            // 入れた○×が次の受信で消えていた
            (載っている印を捨てる(), 写しを見るのをやめる());
            s().joinLiveSync(中身.名前, !1, { 枝: 枝, 閲覧枝: 写す先 });
            // joinLiveSync が偽に戻すので、そのあとで据える
            e({ よその団体のライブ: よそ });
            return '入った';
          }
          // 見るだけの側。写しを読むだけで、何も送り返さない
          (載っている印を捨てる(), 写しを見るのをやめる());
          (s().stopLiveSync(!0),
            e({
              いまのライブの枝: null,
              いまのライブの閲覧枝: 枝,
              写しを見ているか: !0,
              よその団体のライブ: よそ,
              isLiveActive: !0,
              isHost: !1,
              ライブは見るだけ: !0,
              liveSessionName: 中身.名前,
              isIncomingLiveSync: !1,
              lastLocalChange: 0,
              lastPushedTimestamp: 0,
              historySharedLen: 0,
              historySharedMax: 0,
              historyIsFirstSnapshot: !0,
              resetIsFirstSnapshot: !0,
            }));
          写しの片付け = (0, i.onValue)((0, i.ref)(fb.rtdb, 道), (x) => {
            const v0 = x.val();
            if (!v0) return;
            if ('finished' === v0.status)
              return void e({ isLiveActive: !1, isHost: !1, liveSessionName: null, いまのライブの期限: null });
            if (期限で閉じるか(v0, e, s)) return;
            if (!v0.archers && !Array.isArray(v0.archers)) return;
            // 部員が参加するときと同じ突き合わせを通す。
            //
            // ライブの archers に○×は入っていない（○×は marks_by_id で別に送る）。
            // ここで archers をそのまま入れていたころは、○×がいつまでも出なかった。
            // w() で組み直し、mergeLiveArchers で突き合わせる
            const { archers: 受信, shotsPerRound: 本数 } = w(v0);
            const 結果 = mergeLiveArchers(s().archers, 受信, s().shotsPerRound, 本数);
            結果.changed &&
              e({
                archers: 盤面を射数にそろえる(結果.archers, 本数),
                shotsPerRound: 本数,
                isIncomingLiveSync: !0,
              });
          },
          (t) => つなげなくなった(t, e, s));
          c.IS_WEB && console.log('共有リンクで入りました（見るだけ）: ' + 中身.名前);
          return '入った';
        },
        /**
         * ライブに参加する。
         *
         * 共有 に { 枝, 閲覧枝 } を渡すと、その枝へ入る（共有リンクで来た人）。
         * 渡さなければ、参加一覧の道しるべか団体の枝から決める。
         * リンクで来た人もここを通す。受け取りの取り込みは、自分の送信の返りを
         * 見分けたり相手の印を混ぜたりと込み入っていて、別に書くと必ずずれる
         */
        joinLiveSync: (o, 見るだけ, 共有) => {
          // ライブを移ったら控えは捨てる。前のライブで載せた○×を覚えたままだと、
          // 次のライブで「前と同じ」と見なして送らず、相手の画面に出ない
          載っている印を捨てる();
          // 共有のライブは団体の枝に盤面を置いていない。道しるべを辿って、
          // そのライブ専用の枝へ入る。辿らないと空の節点を見て何も出ない
          const 道しるべ = (s().共有のライブたち || {})[o] || null;
          const 差し込み = 共有 && 秘.枝として使えるか(共有.枝) ? String(共有.枝) : null;
          // 一覧は合言葉が取れてからしか出ないので、ここへ来る時点で普通は在る。
          // 無いまま進むと「参加中」の表示だけ出て何も届かないので、先に止める
          const 枝 = 差し込み || (道しるべ ? 道しるべ.共有の枝 : 団体の枝());
          if (!枝) return;
          if (
            (s().stopLiveSync(!0),
            e({
              // 共有のライブに入るときは、そのライブ専用の枝を据える
              いまのライブの枝: 差し込み || 道しるべ ? 枝 : null,
              // 参加一覧から入ったのなら自分の団体のライブ。
              // 共有リンクから来たときは、呼ぶ側があとで決め直す
              よその団体のライブ: !1,
              いまのライブの閲覧枝: 差し込み
                ? (共有 && 共有.閲覧枝) || null
                : 道しるべ
                  ? 道しるべ.閲覧の枝
                  : null,
              写しを見ているか: !1,
              isLiveActive: !0,
              isHost: !1,
              ライブは見るだけ: !!見るだけ,
              liveSessionName: o,
              isIncomingLiveSync: !1,
              lastLocalChange: 0,
              // 参加して最初に届く1通は必ず取り込む。
              // 自分の送信の返りを無視する判定（timestamp の一致）は、
              // 最後に書き込んだのが自分自身だと1通目にも当たってしまう。
              // 当たると盤面が空のまま、誰かが次に何かするまで何も出ない
              lastPushedTimestamp: 0,
              // 主催者側と同じ理由。目印は参加したライブのものを受け取り直す
              historySharedLen: 0,
              historySharedMax: 0,
              historyIsFirstSnapshot: !0,
              resetIsFirstSnapshot: !0,
            }),
            !fb.rtdb)
          )
            return;
          const a = (0, i.ref)(fb.rtdb, `live_sessions/${枝}/${o}/state`);
          ((0, i.onValue)(a, (o) => {
            const a = o.val();
            if (!a) {
              const o = s().liveSessionName;
              return (
                o &&
                  fb.rtdb &&
                  (0, i.off)((0, i.ref)(fb.rtdb, `live_sessions/${枝}/${o}/state`)),
                  (在席を終える(e), 写しを見るのをやめる()),
                void e({
                  isLiveActive: !1,
                  isHost: !1,
                  liveSessionName: null,
                })
              );
            }
            // 自分が送ったものの返りでは、一覧を入れ替えない。入れ替えると
            // 手元の矢所が消え、まだ届いていない射手も落ちる（主催者側には
            // 元からある判定で、参加者側だけ抜けていた）。
            // ただし同じ通知に載った相手の印だけは取り込む
            if (a.timestamp === s().lastPushedTimestamp) return void 返りの印を取り込む(a, e, s);
            if ('finished' === a.status) {
              const o = s().liveSessionName;
              return (
                o &&
                  fb.rtdb &&
                  (0, i.off)((0, i.ref)(fb.rtdb, `live_sessions/${枝}/${o}/state`)),
                  (在席を終える(e), 写しを見るのをやめる()),
                // 送信しない。ここで送ると、主催者が2秒後に消す節点を書き戻してしまい、
                // 届くのが遅れた場合は「終わったはずのライブ」が一覧に残り続ける
                s().resetCurrentSession(!1),
                void e({
                  isLiveActive: !1,
                  isHost: !1,
                  liveSessionName: null,
                })
              );
            }
            // 誰かが配ったら、その枝へ付いていく
            // 期限より先に見る。切れているのに付いていくと、行った先でも切れている
            if (期限で閉じるか(a, e, s)) return;
            if (移ったら付いていく(a, e, s)) return;
            共有履歴の目印を受け取る(a, e, s);
            // 入って最初の1通かどうかを先に控える（下で旗を倒すため）
            const リセットの初回 = s().resetIsFirstSnapshot;
            if (リセットの初回) e({ resetIsFirstSnapshot: !1 });
            if (a.reset_at && a.reset_at > (s().lastResetHandled || 0)) {
              (e({
                lastResetHandled: a.reset_at,
              }),
                // 入る前に起きた片付けなら知らせない。画面は
                // lastResetHandled === lastPushedTimestamp を「自分の操作」と
                // 見なすので、そこへ合わせて黙らせる。
                //
                // 元はここが「lastResetHandled が 0 か」で判定していた。0 のままなのは
                // 一度も送信していない人なので、入った直後や見ているだけの人には
                // 片付けの知らせが永久に出なかった（reset_at と timestamp は同じ値）
                リセットの初回 &&
                  e({
                    lastPushedTimestamp: a.timestamp || 0,
                  }),
                s().resetCurrentSession(!1));
            }
            if (a.archers || Array.isArray(a.archers)) {
              // 主催者側（startLiveSync）と同じ関数を使う
              const { archers: 受信, shotsPerRound: 本数 } = w(a),
                結果 = mergeLiveArchers(s().archers, 受信, s().shotsPerRound, 本数);
              // 主催者側と同じ理由で、いまの射数にそろえる
              結果.changed &&
                e({
                  archers: 盤面を射数にそろえる(結果.archers, 本数),
                  shotsPerRound: 本数,
                });
            }
          },
            // 決まりに弾かれたら知らせる。渡さないと、盤面が空のまま
            // 「ライブ中」の表示だけが残る
            (t) => つなげなくなった(t, e, s)),
            在席を始める(o, e),
            c.IS_WEB && console.log('ライブに参加しました: ' + o));
        },
        // 抜けるのは手元だけで、ライブそのものは残す。主催者と参加者で
        // 振る舞いを分けないための作りで、どちらが抜けても残った人は
        // そのまま続けられる。ライブを終わらせるのは「終了・保存」か、
        // 参加一覧から消したときだけ
        /** 共有リンクの来客をやめる。リンクで来た人が閉じるときに使う */
        共有の来客をやめる: () => {
          (s().stopLiveSync(!0), e({ 共有の来客: !1 }));
        },
        stopLiveSync: (o = !1) => {
          // ライブを移ったら控えは捨てる。前のライブで載せた○×を覚えたままだと、
          // 次のライブで「前と同じ」と見なして送らず、相手の画面に出ない
          載っている印を捨てる();
          const a = s();
          const 枝 = ライブの枝();
          (a.liveSessionName &&
            fb.rtdb &&
            枝 &&
            (0, i.off)((0, i.ref)(fb.rtdb, `live_sessions/${枝}/${a.liveSessionName}/state`)),
            (在席を終える(e), 写しを見るのをやめる()),
            o || s().resetCurrentSession(!1),
            e({
              isLiveActive: !1,
              isHost: !1,
              liveSessionName: null,
            }));
        },
        // 参加一覧を取り直す。ここでだけ、古いライブの片付けもする。
        // 購読側（listenToLiveSessions）は変化のたびに呼ばれるので、
        // 消す処理は明示的に取りにいくこちらへ寄せてある
        fetchActiveLiveSessions: async () => {
          if (!fb.rtdb) return;
          // 一覧を出すのは団体の枝から。共有のライブに入っている最中でも、
          // 一覧に出すのは団体のライブなので、そちらを見る
          const 枝 = 団体の枝() || (await s().ライブの合言葉を用意する());
          if (!秘.枝として使えるか(枝)) return;
          const o = (0, i.ref)(fb.rtdb, `live_sessions/${枝}`);
          try {
            const s = await (0, i.get)(o);
            const 節点 = s.exists() ? s.val() : null;
            const { 出す, 古い } = 参加できるライブ(節点, await サーバー時刻());
            e({
              liveSessionsList: 出す,
              共有のライブたち: 道しるべたちを拾う(節点),
            });
            // 最終更新から日が経ったものは、一覧から外したうえで消す。
            // 共有履歴は別の枝にあるので、そちらも一緒に消す。
            //
            // 消すのはサーバーの時計に合わせられたときだけ。合っていないときは
            // 一覧から外すに留める。外すだけなら、時計が合えば次で戻ってくる。
            // 消してしまうと戻らない
            const 道しるべたち = 道しるべたちを拾う(節点);
            (時差が取れた ? 古い : []).forEach((名) => {
              // 共有していたライブは、団体の枝にあるのは道しるべだけ。
              // 道しるべを消しても、そのライブ専用の枝と閲覧用の写しは残る。
              // 消さないと、誰も辿り着けないまま的中・氏名・立ち順が残り続ける
              const 印 = 道しるべたち[名];
              // 期限の切れた枝は、決まりの側が「枝ごと消す」ときしか書かせない
              // （中の1件だけ消すのは通らない）。共有の枝はライブ1つ専用なので、
              // 枝ごと消すのが正しい。消し終えてから期限そのものを片付ける
              const 消す = async () => {
                const 落とす = (道) =>
                  (0, i.remove)((0, i.ref)(fb.rtdb, 道)).catch(() => {});
                await Promise.all([
                  落とす(`live_sessions/${枝}/${名}`),
                  落とす(共有履歴の場所(枝, 名)),
                  落とす(在席の場所(枝, 名)),
                ]);
                if (!印) return;
                const 編 = 印.共有の枝;
                const 閲 = 印.閲覧の枝;
                if (秘.枝として使えるか(編))
                  await Promise.all([
                    落とす(`live_sessions/${編}`),
                    落とす(`live_history/${編}`),
                    落とす(`live_presence/${編}`),
                  ]);
                if (秘.枝として使えるか(閲)) await 落とす(`live_view/${閲}`);
                // 期限は最後。データが残っているうちは決まりが消させない
                // （消せると、期限を外してリンクをよみがえらせられてしまう）
                await Promise.all([
                  秘.枝として使えるか(編) ? 落とす(期限の場所(編)) : null,
                  秘.枝として使えるか(閲) ? 落とす(期限の場所(閲)) : null,
                ]);
              };
              (消す(), console.log(`[Store] 使われなくなったライブを片付けました: ${名}`));
            });
          } catch (e) {
            console.error('Fetch live sessions error:', e);
          }
        },
        listenToLiveSessions: () => {
          if (!fb.rtdb) return () => {};
          // 合言葉は起動の直後にはまだ無いことがある（Firestore が繋がる前）。
          // 無いからと見張らずに帰ると、画面を開き直すまで一覧が空のままになる。
          // 届いてから見張り始め、やめる係は先に返しておく
          let 止める = null;
          let やめた = !1;
          Promise.resolve(団体の枝() || s().ライブの合言葉を用意する())
            .then((合) => {
              const 枝 = 秘.ライブの枝(合);
              if (やめた || !枝 || !fb.rtdb) return;
              const o = (0, i.ref)(fb.rtdb, `live_sessions/${枝}`);
              止める = (0, i.onValue)(
                o,
                (s) => {
                  // ここは消さないので、時計の補正は控えの値で足りる
                  const 節点 = s.exists() ? s.val() : null;
                  e({
                    liveSessionsList: 参加できるライブ(節点, Date.now() + サーバーとの時差).出す,
                    共有のライブたち: 道しるべたちを拾う(節点),
                  });
                },
                (e) => {
                  console.error('Listen to live sessions error:', e);
                }
              );
            })
            .catch((t) => console.error('Listen to live sessions error:', t));
          return () => {
            ((やめた = !0), 止める && 止める());
          };
        },
        deleteLiveSession: async (o) => {
          if (fb.rtdb)
            try {
              // 一覧から消すのは団体のライブ。共有の枝ではなく団体の枝を見る
              const 枝 = 団体の枝();
              if (!枝) return;
              const a = (0, i.ref)(fb.rtdb, `live_sessions/${枝}/${o}`);
              (await (0, i.set)(a, null),
                // 共有履歴と在席は別の枝にあるので、そちらも消す
                (0, i.remove)((0, i.ref)(fb.rtdb, 共有履歴の場所(枝, o))).catch(() => {}),
                (0, i.remove)((0, i.ref)(fb.rtdb, 在席の場所(枝, o))).catch(() => {}),
                e({
                  liveSessionsList: s().liveSessionsList.filter((e) => e !== o),
                }));
            } catch (e) {
              console.error('Delete live session error:', e);
            }
        },
        listenToSessions: async () => {
          const { activeGroupId: o, activeRole: i, myMemberId: n, myMemberName: c } = s();
          if (!o) return;
          const _sessDb = await waitForDb();
          if (!_sessDb) {
            console.warn('[Store] listenToSessions: db still undefined after await, aborting');
            return;
          }
          (s().stopListeningToSessions(), console.log('[Store] Starting real-time session listener'));
          const l = (0, a.collection)(fb.db, `groups/${o}/sessions`),
            m_30 = Date.now() - 2592000000,
            d = (0, a.query)(
              l,
              (0, a.where)('date', '>', m_30),
              (0, a.orderBy)('date', 'desc'),
              (0, a.limit)(100)
            ),
            u = (0, a.onSnapshot)(
              d,
              (t) => {
                const o = [];
                t.forEach((e) => {
                  const s = e.data(),
                    cleanedTags =
                      s.tags && Array.isArray(s.tags)
                        ? Array.from(new Set(s.tags.map(normalizeTag).filter(Boolean)))
                        : [],
                    originalTags = s.tags || [],
                    isModified =
                      cleanedTags.length !== originalTags.length ||
                      cleanedTags.some((e, t) => e !== originalTags[t]);
                  if (isModified && fb.db && fb.db._delegate && 'member' !== i) {
                    const s = (0, a.doc)(fb.db, `groups/${M.getState().activeGroupId}/sessions`, e.id);
                    (0, a.updateDoc)(s, {
                      tags: cleanedTags,
                    }).catch((e) => console.error('[Store] Auto cleanup sync failed:', e));
                  }
                  o.push(
                    Object.assign({}, s, {
                      id: e.id,
                      tags: cleanedTags,
                      syncStatus: e.metadata && e.metadata.hasPendingWrites ? '未同期' : '同期済み',
                    })
                  );
                });
                const a = s().sessions,
                  c = new Set(o.map((e) => e.id));
                const merged = o.map((cloudSession) => {
                  const pendingTimer = s()._pendingUpdateTimers[cloudSession.id];
                  const localSession = a.find((ls) => ls && ls.id === cloudSession.id);
                  // 送信待ちの編集は、クラウドの古い写しで上書きしない。タイマーが動いて
                  // いる 800ms の間だけでなく、送信が済むまで（「未同期」の間）守る。
                  if (localSession && (pendingTimer || '未同期' === localSession.syncStatus))
                    return localSession;
                  return cloudSession;
                });
                const l = a.filter((e) => !c.has(e.id) && !e.hasOwnProperty('serverCreatedTime'));
                // 完全に消したものは、クラウドにまだ残っていても画面に出さない
                const 完全削除ずみ = new Set(Object.keys(s().permanentlyDeleted || {}));
                const d = [...merged, ...l].filter((e) => e && !完全削除ずみ.has(e.id));
                d.sort((e, s) => (s.date || 0) - (e.date || 0));
                (e({
                  sessions: d,
                  syncStatus: '同期済み',
                  lastSyncTime: Date.now(),
                }),
                  console.log(
                    `[Store] Real-time session update received: ${o.length} items (reflected deletions)`
                  ));
              },
              (s) => {
                (console.error('[Store] Real-time session listener error:', s),
                  不具合を控える('記録の受信', s),
                  e({
                    syncStatus: '同期エラー',
                  }));
              }
            );
          e({
            sessionUnsubscribe: u,
          });
        },
        stopListeningToSessions: () => {
          const { sessionUnsubscribe: t } = s();
          t &&
            (console.log('[Store] Stopping real-time session listener'),
            t(),
            e({
              sessionUnsubscribe: null,
            }));
        },
        listenToTrash: async () => {
          const { activeGroupId: o } = s();
          if (!o) return;
          const _trashDb = await waitForDb();
          if (!_trashDb) {
            console.warn('[Store] listenToTrash: db still undefined after await, aborting');
            return;
          }
          (s().stopListeningToTrash(), console.log('[Store] Starting real-time trash listener'));
          const i = (0, a.collection)(fb.db, `groups/${o}/trash`),
            n = (0, a.query)(i, (0, a.limit)(200)),
            c = (0, a.onSnapshot)(
              n,
              (t) => {
                const o = [];
                t.forEach((e) => {
                  const s = e.data();
                  o.push(
                    Object.assign({}, s, {
                      id: e.id,
                      syncStatus: e.metadata && e.metadata.hasPendingWrites ? '未同期' : '同期済み',
                    })
                  );
                });
                // 手元で捨てた印は、送信が終わるまで持ち越す。クラウドの写しには
                // この印が無いので、そのまま置き換えると数百msで消えてしまい、
                // あとで送信が失われても送り直せなくなる。
                // 写しの syncStatus が「同期済み」＝送信が終わった、なので落とす。
                const 手元のゴミ箱 = new Map(
                  (s().trash || []).filter((e) => e && e.id).map((e) => [e.id, e])
                );
                const 写し = o.map((e) => {
                  const t = 手元のゴミ箱.get(e.id);
                  return t && t.pendingDelete && '未同期' === e.syncStatus
                    ? Object.assign({}, e, { pendingDelete: !0 })
                    : e;
                });
                // まだ送れていない削除は、クラウドの写しに無くても残す。ここで
                // 消すと送り直しの対象から外れ、次の全件取得で記録が復活する。
                const クラウドのid = new Set(写し.map((e) => e.id));
                const 未送信の削除 = (s().trash || []).filter(
                  (e) => e && e.id && e.pendingDelete && '未同期' === e.syncStatus && !クラウドのid.has(e.id)
                );
                const 新しいゴミ箱 = 未送信の削除.length > 0 ? [...写し, ...未送信の削除] : 写し;
                新しいゴミ箱.sort((e, s) => trashedAtMillis(s) - trashedAtMillis(e));
                // 戻したばかりでまだ送れていない記録は、クラウドのゴミ箱に写しが
                // あっても履歴から外さない。外すと復元が取り消されて見える。
                // 完全に消したものは、クラウドにまだ残っていても画面に出さない
                const 完全削除ずみ = new Set(Object.keys(s().permanentlyDeleted || {}));
                const 出すゴミ箱 = 新しいゴミ箱.filter((e) => e && !完全削除ずみ.has(e.id));
                const 捨てたid = new Set(出すゴミ箱.map((e) => e.id));
                const 残す = s().sessions.filter(
                  (e) => e && (!捨てたid.has(e.id) || '未同期' === e.syncStatus)
                );
                (e({
                  trash: 出すゴミ箱,
                  sessions: 残す.filter((e) => e && !完全削除ずみ.has(e.id)),
                }),
                  console.log(
                    `[Store] Real-time trash update received: ${o.length} items (purged from sessions)`
                  ));
              },
              (e) => {
                console.error('[Store] Real-time trash listener error:', e);
              }
            );
          e({
            trashUnsubscribe: c,
          });
        },
        stopListeningToTrash: () => {
          const { trashUnsubscribe: t } = s();
          t &&
            (console.log('[Store] Stopping real-time trash listener'),
            t(),
            e({
              trashUnsubscribe: null,
            }));
        },
        listenToMembers: async () => {
          const { activeGroupId: o } = s();
          if (!o) return;
          const _membDb = await waitForDb();
          if (!_membDb) {
            console.warn('[Store] listenToMembers: db still undefined after await, aborting');
            return;
          }
          (s().stopListeningToMembers(), console.log('[Store] Starting real-time member listener'));
          const i = (0, a.collection)(fb.db, `groups/${o}/members`),
            n = (0, a.onSnapshot)(
              i,
              (t) => {
                const o = [];
                t.forEach((e) => {
                  const s = e.data();
                  o.push(
                    Object.assign({}, s, {
                      id: e.id,
                      syncStatus: '同期済み',
                    })
                  );
                });
                // 消したのにクラウドへ届いていないメンバーは、受け取っても戻さない
                const 削除ずみ = new Set(Object.keys(s().deletedMembers || {}));
                const a = y(s().members, o, !1, !0).filter((e) => e && !削除ずみ.has(e.id));
                (e({
                  members: a,
                  lastSyncTime: Date.now(),
                }),
                  console.log(`[Store] Real-time member update received: ${o.length} items`));
              },
              (e) => {
                console.error('[Store] Real-time member listener error:', e);
              }
            );
          e({
            memberUnsubscribe: n,
          });
        },
        stopListeningToMembers: () => {
          const { memberUnsubscribe: t } = s();
          t &&
            (console.log('[Store] Stopping real-time member listener'),
            t(),
            e({
              memberUnsubscribe: null,
            }));
        },
        listenToAlumni: async () => {
          const { activeGroupId: o } = s();
          if (!o) return;
          const _alumDb = await waitForDb();
          if (!_alumDb) {
            console.warn('[Store] listenToAlumni: db still undefined after await, aborting');
            return;
          }
          (s().stopListeningToAlumni(), console.log('[Store] Starting real-time alumni listener'));
          const i = (0, a.collection)(fb.db, `groups/${o}/alumni`),
            n = (0, a.onSnapshot)(
              i,
              (t) => {
                const o = [];
                t.forEach((e) => {
                  const s = e.data();
                  o.push(
                    Object.assign({}, s, {
                      id: e.id,
                      syncStatus: '同期済み',
                    })
                  );
                });
                const a = y(s().alumni, o, !1, !0);
                (e({
                  alumni: a,
                  lastSyncTime: Date.now(),
                }),
                  console.log(`[Store] Real-time alumni update received: ${o.length} items`));
              },
              (e) => {
                console.error('[Store] Real-time alumni listener error:', e);
              }
            );
          e({
            alumniUnsubscribe: n,
          });
        },
        stopListeningToAlumni: () => {
          const { alumniUnsubscribe: t } = s();
          t &&
            (console.log('[Store] Stopping real-time alumni listener'),
            t(),
            e({
              alumniUnsubscribe: null,
            }));
        },
        startPeriodicSync: () => {
          (s().stopPeriodicSync(),
            console.log('[Store] Starting sync (Real-time listeners + 5min config sync)'),
            s().listenToConfig(),
            s().listenToSessions(),
            s().listenToTrash(),
            s().listenToMembers(),
            s().listenToAlumni(),
            s().syncSessions());
          const t = setInterval(() => {
            s().syncSessions();
          }, 3e5);
          e({
            syncIntervalId: t,
          });
        },
        stopPeriodicSync: () => {
          const t = s().syncIntervalId;
          (t &&
            (console.log('[Store] Stopping periodic sync'),
            clearInterval(t),
            e({
              syncIntervalId: null,
            })),
            s().stopListeningToSessions(),
            s().stopListeningToTrash(),
            s().stopListeningToMembers(),
            s().stopListeningToAlumni());
        },
        setupNetworkListener: () => {
          console.log('[Store] Setting up network listener');
          return m.default.addEventListener((t) => {
            const o = s().isNetworkOnline,
              a = !(!t.isConnected || !1 === t.isInternetReachable);
            a !== o &&
              (console.log('[Store] Network state changed: ' + (a ? 'Online' : 'Offline')),
              e({
                isNetworkOnline: a,
              }),
              a &&
                !o &&
                (console.log('[Store] Connection restored. Triggering auto-sync...'),
                // 電波が切れている最中にこそ失敗するので、戻ったときに出し直す。
                // 便りの仕組みが転んでも、自動同期まで巻き添えにしない
                溜まりを流し直す(),
                s()
                  .syncSessions()
                  .catch((e) => console.error('[Store] Auto-sync failed:', e))));
          });
        },
        incrementAllGrades: async () => {
          const { activeGroupId: o, alumni: c, currentFreshmanTerm: l, isNetworkOnline: d } = s();
          if (!o) return;
          const u = Date.now(),
            m = new Date().getFullYear();
          if (!d) return void console.warn('[incrementAllGrades] Offline. Skipping promotion until online.');
          try {
            const s = await (0, a.getDoc)((0, a.doc)(fb.db, `groups/${o}/config`, 'app_settings'));
            if (s.exists()) {
              const t = s.data();
              if (t.lastPromotionYear && t.lastPromotionYear >= m)
                return (
                  console.log(
                    `[incrementAllGrades] Skipped: Promotion for year ${
                      m
                    } already completed according to Firestore.`
                  ),
                  void e({
                    lastPromotionYear: t.lastPromotionYear,
                  })
                );
            }
          } catch (e) {
            return void console.error('[incrementAllGrades] Failed to re-verify settings:', e);
          }
          let i;
          try {
            const t = await (0, a.getDocs)((0, a.collection)(fb.db, `groups/${o}/members`));
            ((i = []),
              t.forEach((e) =>
                i.push(
                  Object.assign({}, e.data(), {
                    id: e.id,
                  })
                )
              ));
          } catch (e) {
            return void console.error('[incrementAllGrades] Failed to fetch members:', e);
          }
          console.log(
            `[Store] incrementAllGrades: Starting atomic promotion process... (${
              i.length
            } members from cloud)`
          );
          const dropUndefined = (o) => {
            const t = {};
            for (const k in o) void 0 !== o[k] && (t[k] = o[k]);
            return t;
          };
          const gradeOf = (e) => {
            const v = e ? e.grade : null;
            if (null == v || '' === v) return NaN;
            const n = Number(v);
            return isNaN(n) ? NaN : n;
          };
          const skippedGrades = i.filter((e) => isNaN(gradeOf(e))).map((e) => e.name || e.id);
          if (skippedGrades.length)
            console.warn('[incrementAllGrades] 学年が未設定のため据え置いたメンバー:', skippedGrades);
          const p = [];
          i.forEach((e) => {
            const s = gradeOf(e);
            if (isNaN(s) || s < 1 || s >= 5)
              p.push(
                Object.assign({}, e, {
                  lastModified: u,
                  syncStatus: '同期済み',
                })
              );
            else if (s >= 4)
              p.push(
                Object.assign({}, e, {
                  grade: 5,
                  lastModified: u,
                  syncStatus: '同期済み',
                })
              );
            else
              p.push(
                Object.assign({}, e, {
                  grade: s + 1,
                  lastModified: u,
                  syncStatus: '同期済み',
                })
              );
          });
          const f = (l || 0) + 1;
          if (d)
            try {
              const e = [];
              (p.forEach((s) => {
                e.push({
                  type: 'set',
                  ref: (0, a.doc)(fb.db, `groups/${o}/members`, s.id),
                  data: dropUndefined(
                    Object.assign({}, s, {
                      lastModified: (0, a.serverTimestamp)(),
                    })
                  ),
                });
              }),
                e.push({
                  type: 'set',
                  ref: (0, a.doc)(fb.db, `groups/${o}/config`, 'app_settings'),
                  data: {
                    currentFreshmanTerm: f,
                    lastPromotionYear: m,
                    lastModified: (0, a.serverTimestamp)(),
                  },
                }));
              for (let s = 0; s < e.length; s += 400) {
                const o = e.slice(s, s + 400),
                  i = (0, a.writeBatch)(fb.db);
                (o.forEach((e) => {
                  'set' === e.type
                    ? i.set(e.ref, e.data, {
                        merge: !0,
                      })
                    : 'delete' === e.type && i.delete(e.ref);
                }),
                  await i.commit());
              }
              console.log('[Store] incrementAllGrades: Cloud sync successful.');
            } catch (e) {
              return (
                console.error('[incrementAllGrades] Cloud sync failed:', e),
                void n.default.alert(
                  '進級処理エラー',
                  'クラウドとの同期に失敗しました。時間をおいて再度お試しください。'
                )
              );
            }
          const S = c;
          (e({
            members: p,
            alumni: S,
            currentFreshmanTerm: f,
            lastPromotionYear: m,
            lastLocalChange: u,
            lastSyncTime: u,
          }),
            console.log('[Store] incrementAllGrades: Promotion process completed.'));
        },
        updateCurrentFreshmanTerm: async (o) => {
          const {
            activeGroupId: i,
            autoPromotionEnabled: n,
            tagTemplates: c,
            lastPromotionYear: l,
            isNetworkOnline: d,
          } = s();
          if (
            (e({
              currentFreshmanTerm: o,
              lastLocalChange: Date.now(),
            }),
            d && i)
          )
            try {
              (await (0, a.setDoc)(
                (0, a.doc)(fb.db, `groups/${i}/config`, 'app_settings'),
                {
                  currentFreshmanTerm: o,
                  autoPromotionEnabled: n,
                  tagTemplates: c,
                  lastPromotionYear: l,
                  lastModified: (0, a.serverTimestamp)(),
                },
                {
                  merge: !0,
                }
              ),
                e({
                  syncStatus: '同期済み',
                  lastSyncTime: Date.now(),
                }));
            } catch (s) {
              (console.error('Update Term Sync Error:', s),
                不具合を控える('期の更新', s),
                e({
                  syncStatus: '同期エラー',
                }));
            }
        },
        resetCurrentSession: (o = !0) => {
          if (s().書き換えを止めるか()) return;
          const a = Date.now();
          // 片付けるとサーバーの marks_by_id も空になるので、控えも捨てる。
          // 残すと「前と同じだから送らなくてよい」と誤って判断する。片付けた
          // あと同じ記録を読み込み直すと、○×が片付ける前と一字一句同じに
          // なり、その送信が丸ごと飛ばされて相手の画面に出ない。
          // 知らせを受け取った側（o が偽）も、サーバーは同じく空なので捨てる
          載っている印を捨てる();
          e({
            archers: [],
            historyStack: [],
            redoStack: [],
            activeSessionID: null,
            currentSessionTags: [],
            lastLocalChange: a,
            lastResetHandled: o ? a : s().lastResetHandled,
            // 盤面を捨てたので、遡れる手も捨てる。ライブ中でないときに
            // historyStack を空にするのと同じ扱い。残すと、リセットしたあとの
            // 取り消しで、消したはずの盤面が戻ってくる
            historySharedLen: 0,
            historySharedMax: 0,
          });
          const { isLiveActive: n, liveSessionName: c } = s();
          const 枝 = ライブの枝();
          if (o && n && c && fb.rtdb && 枝) {
            const s = (0, i.ref)(fb.rtdb, `live_sessions/${枝}/${c}/state`);
            ((0, i.update)(s, {
              archers: [],
              marks_by_id: {},
              archer_timestamps: {},
              reset_at: a,
              timestamp: a,
              updated_at: (0, i.serverTimestamp)(),
              // 共有履歴の目印も全員ぶん戻す
              history_len: 0,
              history_max: 0,
            }).catch((e) => console.error('Reset Live Sync Error:', e)),
              e({
                lastPushedTimestamp: a,
              }));
          }
        },
        recoverPassword: async (e) => {
          if (!s().isNetworkOnline)
            return {
              success: !1,
              error: 'オフラインのため実行できません',
            };
          try {
            return (
              await (0, o.sendPasswordResetEmail)(fb.auth, e),
              // 住所そのものは出さない。部活の共用端末では、次に使う人が
              // 開発者ツールで読める（復旧用の住所なので、知られたくない）
              console.log('[Store] パスワード再設定のメールを送りました'),
              {
                success: !0,
              }
            );
          } catch (e) {
            return (
              console.error('Password Recovery Error:', e),
              {
                success: !1,
                error: e.message || 'パスワードリセットメールの送信に失敗しました',
              }
            );
          }
        },
        listenToConfig: async () => {
          const { activeGroupId: o } = s();
          if (!o) return;
          const _cfgDb = await waitForDb();
          if (!_cfgDb) {
            console.warn('[Store] listenToConfig: db still undefined after await, aborting');
            return;
          }
          try {
            const i = await (0, a.getDoc)((0, a.doc)(fb.db, `groups/${o}/config`, 'app_settings'));
            if (i.exists()) {
              const t = i.data();
              (console.log('[Store] Config initial fetch from cloud:', t),
                e({
                  autoPromotionEnabled: !1 !== t.autoPromotionEnabled,
                  currentFreshmanTerm: t.currentFreshmanTerm || s().currentFreshmanTerm,
                  tagTemplates: t.tagTemplates || s().tagTemplates,
                  lastPromotionYear: t.lastPromotionYear || s().lastPromotionYear,
                }));
            }
            const n = await (0, a.getDoc)((0, a.doc)(fb.db, 'groups', o));
            if (n.exists()) {
              const s = n.data();
              s.groupName &&
                e({
                  activeGroupName: s.groupName,
                });
            }
          } catch (e) {
            console.warn('[Store] Initial config fetch failed (offline?), falling back to local.', e);
          }
          const _existing = s().configUnsubscribe;
          if (_existing) {
            _existing();
            e({ configUnsubscribe: null });
            console.log('[Store] listenToConfig: stopped existing listener');
          }
          const i = (0, a.onSnapshot)((0, a.doc)(fb.db, `groups/${o}/config`, 'app_settings'), (t) => {
              if (t.exists()) {
                const o = t.data();
                (console.log('[Store] Config updated from cloud (snapshot):', o),
                  e({
                    autoPromotionEnabled: !1 !== o.autoPromotionEnabled,
                    currentFreshmanTerm: o.currentFreshmanTerm || s().currentFreshmanTerm,
                    tagTemplates: o.tagTemplates || s().tagTemplates,
                    lastPromotionYear: o.lastPromotionYear || s().lastPromotionYear,
                    analysisRankingSettings: o.analysisRankingSettings || s().analysisRankingSettings,
                  }));
              }
            }),
            n = (0, a.onSnapshot)((0, a.doc)(fb.db, 'groups', o), (s) => {
              if (s.exists()) {
                const t = s.data();
                t.groupName &&
                  e({
                    activeGroupName: t.groupName,
                  });
              }
            });
          e({
            configUnsubscribe: () => {
              (i(), n());
            },
          });
        },
      };
    },
    {
      name: 'archery-score-storage',
      storage: (0, d.createJSONStorage)(() => 端末の置き場),
      partialize: (e) => ({
        archers: e.archers,
        members: e.members,
        // 端末には、予算に収まるぶんだけ残す。雲には全部あるので、
        // 次に開いたときに取り直せる。まだ送れていない記録は必ず残す
        //（落とすとその練習ぶんがどこにも無くなる。src/localTrim.js）
        sessions: 端.端末に残す記録(e.sessions, { 最後に送った時刻: e.lastSyncTime || 0 }),
        history: e.history,
        alumni: e.alumni,
        trash: e.trash,
        permanentlyDeleted: e.permanentlyDeleted,
        deletedMembers: e.deletedMembers,
        shotsPerRound: e.shotsPerRound,
        activeSessionID: e.activeSessionID,
        viewScale: e.viewScale,
        includeInStats: e.includeInStats,
        lastSessionTags: e.tagTemplates,
        currentSessionTags: e.currentSessionTags,
        activeGroupId: e.activeGroupId,
        activeGroupName: e.activeGroupName,
        publicGroupId: e.publicGroupId,
        activeRole: e.activeRole,
        activeUserEmail: e.activeUserEmail,
        myMemberId: e.myMemberId,
        myMemberName: e.myMemberName,
        memberAuthVersion: e.memberAuthVersion,
        analysisSelectedTags: e.analysisSelectedTags,
        analysisTagLogic: e.analysisTagLogic,
        historySelectedTags: e.historySelectedTags,
        historyTagLogic: e.historyTagLogic,
        tagTemplates: e.tagTemplates,
        currentFreshmanTerm: e.currentFreshmanTerm,
        lastPromotionYear: e.lastPromotionYear,
        lastSyncTime: e.lastSyncTime,
        isAdminMode: e.isAdminMode,
        autoPromotionEnabled: e.autoPromotionEnabled,
        analysisRankingSettings: e.analysisRankingSettings,
        enableArrowLocation: e.enableArrowLocation,
        自動ロックする: e.自動ロックする,
        保存時に出欠を確認する: e.保存時に出欠を確認する,
        横に並べる: e.横に並べる,
        帯を畳む: e.帯を畳む,
        arrowTargetType: e.arrowTargetType,
        比較のひな型: e.比較のひな型,
        ライブの合言葉: e.ライブの合言葉,
      }),
      onRehydrateStorage: () => {
        console.log('[Store] Hydration starting...');
        const e = Date.now();
        return (s, t) => {
          const o = Date.now() - e;
          if (t) console.error(`[Store] Hydration error (after ${o}ms):`, t);
          else if (s) {
            console.log(`[Store] Hydration finished successfully (Duration: ${o}ms)`);
            const updates = {
              isHydrated: !0,
            };
            if (s.sessions) {
              updates.sessions = cleanUpSessions(s.sessions);
            }
            if (s.trash) {
              updates.trash = cleanUpSessions(s.trash);
            }
            if (s.historySelectedTags) {
              updates.historySelectedTags = cleanUpTagsArray(s.historySelectedTags);
            }
            if (s.analysisSelectedTags) {
              updates.analysisSelectedTags = cleanUpTagsArray(s.analysisSelectedTags);
            }
            if (s.currentSessionTags) {
              updates.currentSessionTags = cleanUpTagsArray(s.currentSessionTags);
            }
            if (s.tagTemplates) {
              updates.tagTemplates = cleanUpTagsArray(s.tagTemplates);
            }
            if (!Array.isArray(s.archers)) {
              console.warn('[Store] archers was not an array, recovering...');
              updates.archers = [];
            }
            if ('number' != typeof s.viewScale || isNaN(s.viewScale) || s.viewScale <= 0) {
              console.warn('[Store] Invalid viewScale detected during hydration, resetting to 1.0');
              updates.viewScale = 1;
            }
            if ('function' == typeof s.updateState) {
              s.updateState(updates);
            }
            if ('function' == typeof s.ensurePersonalIds) {
              s.ensurePersonalIds();
            }
          } else {
            console.warn(`[Store] Hydration yielded empty state (after ${o}ms)`);
            const e = M.getState();
            if (e && !1 === e.isHydrated && 'function' == typeof e.updateState) {
              console.log('[Store] Forcing isHydrated: true even for empty state');
              e.updateState({
                isHydrated: !0,
              });
            }
          }
        };
      },
    }
  )
);
