'use strict';

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
// 団体アカウントの削除（写してから消す）
const 消去 = require('./accountDeletion');
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
let 書けないと知らせた = false;
function 書けないことを一度だけ知らせる() {
  if (書けないと知らせた) return;
  書けないと知らせた = true;
  try {
    require('./alertBridge').default.alert(
      '端末に保存できませんでした',
      '端末の空きが足りないようです。このまま続けると、入れた記録が次に開いたときに消えていることがあります。ほかのアプリやブラウザの保存領域を空けてから、もう一度お試しください。'
    );
  } catch (_) {
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
  getItem: (鍵) => AsyncStorage.getItem(鍵),
  setItem: async (鍵, 値) => {
    try {
      return await AsyncStorage.setItem(鍵, 値);
    } catch (誤り) {
      const 大きさ = 値 && 値.length ? Math.round(値.length / 1024) : 0;
      console.error('[Store] 端末に控えを書けませんでした（' + 大きさ + 'KB）', 誤り);
      不具合を控える('端末の控えが書けない', 大きさ + 'KB');
      書けないことを一度だけ知らせる();
      // 投げ返さない。書けなくても、雲への同期と画面の操作は続けられる
      return undefined;
    }
  },
  removeItem: (鍵) => AsyncStorage.removeItem(鍵),
};
/**
 * 端末への控えは、少しまとめてから書く。
 *
 * persist は状態が変わるたびに、控え全体を JSON にして書き直す。控えは
 * 大きい団体で 1.4MB あり、古い端末（CPU が 6 倍遅い見当）だと JSON にするのに
 * 35ms、書くのに 32ms かかった。○×を 1 つ押すたびにこれが走ると、描き直しの
 * 50ms と合わせて 100ms を超え、押した手応えが遅れる。
 *
 * そこで、状態の写しだけ受け取っておき、少し待ってから 1 回だけ JSON にして書く。
 * 続けて押したぶんは 1 回にまとまる。画面が隠れる・閉じるときは待たずに書く
 * （そこで書かないと、閉じた直後のぶんが端末に残らない）。雲への同期とライブは
 * ここを通らないので、遅らせても相手に届く速さは変わらない。
 */
const 控えの書き出し = {
  待ち: null, // { 名, 値 } … まだ書いていない最新の写し
  札: null,
  遅らせ: 600, // ms。検査では 0 にして待たずに書く
  予約(名, 値) {
    this.待ち = { 名, 値 };
    if (this.札 !== null) return;
    this.札 = setTimeout(() => this.今すぐ(), this.遅らせ);
  },
  async 今すぐ() {
    if (this.札 !== null) clearTimeout(this.札);
    this.札 = null;
    const 待ち = this.待ち;
    this.待ち = null;
    if (!待ち) return;
    await 端末の置き場.setItem(待ち.名, JSON.stringify(待ち.値));
  },
  捨てる() {
    if (this.札 !== null) clearTimeout(this.札);
    this.札 = null;
    this.待ち = null;
  },
};
// 画面が隠れる・閉じるときは待たずに書く（web）。端末では裏に回ったとき
try {
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) 控えの書き出し.今すぐ();
    });
  }
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('pagehide', () => 控えの書き出し.今すぐ());
    window.addEventListener('beforeunload', () => 控えの書き出し.今すぐ());
  }
  const AppState = require('react-native').AppState;
  if (AppState && AppState.addEventListener) {
    AppState.addEventListener('change', (様子) => {
      if (様子 !== 'active') 控えの書き出し.今すぐ();
    });
  }
} catch (誤り) {
  /* 聞き手が付けられない場でも、時間で書くほうは動く */
}
// 検査（e2e）は「端末に書かれる中身」を localStorage から読む。書くのを遅らせたので、
// まだ書いていない写しがあればそれを返す口と、待たずに書かせる口を置く。
// 後者は auth.setup が storageState を取る前に呼ぶ（Playwright は本物の
// localStorage を写すので、遅らせたぶんが入っていないと入り直しになる）。
// 本番では誰も呼ばない
if (typeof globalThis !== 'undefined') {
  globalThis.__弓道の控え = () => (控えの書き出し.待ち ? JSON.stringify(控えの書き出し.待ち.値) : null);
  globalThis.__弓道の控えを書く = () => 控えの書き出し.今すぐ();
}
/** persist に渡す置き場。JSON にするのは書くときだけ（控えの書き出し） */
const 控えの置き場 = {
  getItem: async (名) => {
    const 文 = await 端末の置き場.getItem(名);
    return 文 === null || 文 === undefined ? null : JSON.parse(文);
  },
  setItem: (名, 値) => {
    控えの書き出し.予約(名, 値);
  },
  removeItem: async (名) => {
    控えの書き出し.捨てる();
    await 端末の置き場.removeItem(名);
  },
};
// 行動を1つ控える。不具合の便りに「直前に何をしていたか」として載る。
// 氏名・的中・記録の中身は渡さない（渡すと便りに名簿が出る）
function 行動を控える(名, 中身) {
  try {
    require('./errorReporter').行動を残す(名, 中身);
  } catch (誤り) {
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
  const 状 = useScoreStore.getState();
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
  const { activeGroupId: 団体, ライブの合言葉: 控え } = useScoreStore.getState();
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
function 移ったら付いていく(届いた状態, 書く, 状態) {
  if (!届いた状態) return false;
  // 目印は2通りある。
  //   ・移った先 … 共有の枝から別の共有の枝へ移したとき
  //   ・共有の枝 … 団体の枝から移したとき。元の節点はそのまま道しるべになる
  const 先 = 秘.枝として使えるか(届いた状態.移った先)
    ? String(届いた状態.移った先)
    : 秘.枝として使えるか(届いた状態.共有の枝)
      ? String(届いた状態.共有の枝)
      : null;
  if (!先 || 先 === ライブの枝()) return false;
  const 名前 = 状態().liveSessionName;
  if (!名前) return false;
  const 主催だった = 状態().isHost;
  console.log('[Store] ライブが配られたので、新しい枝へ移ります');
  状態().joinLiveSync(名前, 状態().ライブは見るだけ, {
    枝: 先,
    閲覧枝: 届いた状態.移った先の閲覧枝 || 届いた状態.閲覧の枝 || null,
  });
  書く({ isHost: 主催だった });
  return true;
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
  const { いまのライブの閲覧枝: 閲覧枝, 写しを見ているか } = useScoreStore.getState();
  if (!Firebaseの器.rtdb || 写しを見ているか || !名前) return;
  if (!秘.枝として使えるか(閲覧枝)) return;
  RTDB.update(RTDB.ref(Firebaseの器.rtdb, 写しの場所(閲覧枝, 名前)), 中身).catch(() => {
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
  } catch (誤り) {
    /* 捨てられなくても、ログアウトそのものは進める */
  }
}
// 貯まっている便りを出し直す。errorReporter は呼ぶときに読む
function 溜まりを流し直す() {
  try {
    require('./errorReporter').溜まりを流す();
  } catch (誤り) {
    /* 便りを出せなくても、同期は続ける */
  }
}
// 不具合をこちらに控える。送れなければ端末に貯まり、つながったときに出し直す。
// errorReporter → useScoreStore の向きに参照があるので、ここでは呼ぶときに読む
/**
 * その失敗が「入り直せば直るもの」か。
 *
 * 端末のサインインが外れると、雲への読み書きがすべて permission-denied で
 * 断られる。画面は端末の控えから出るので一見データはあり、利用者からは
 * 「同期エラー」としか見えない。何をすればよいか分からないまま、記録だけが
 * 届かなくなる（2026-09-09、団体910280 で便り20通ぶん溜まった）。
 * 見分けて、入り直すよう伝える。
 */
function 入り直せば直るか(誤り) {
  if (!誤り) return false;
  const 符 = 誤り.code || 誤り.name || '';
  if ('permission-denied' === 符 || 'unauthenticated' === 符) return true;
  return /Missing or insufficient permissions|permission-denied|unauthenticated/i.test(
    String(誤り.message || '')
  );
}
/** 入り直しの案内。画面の帯に出す */
const 入り直しの案内 =
  'ログインの有効期限が切れています。設定からログアウトして、もう一度ログインしてください。（記録は残ります）';
function 不具合を控える(出どころ, 誤り) {
  try {
    require('./errorReporter').不具合を送る(出どころ, 誤り);
  } catch (中の誤り) {
    /* 控えられなくても、同期そのものは続ける */
  }
}
Object.defineProperty(exports, '__esModule', { value: true });
// 端末への控えを待たずに書く／待ちを変える（検査と、閉じる前に確実に書きたいとき用）
exports.控えを今すぐ書く = () => 控えの書き出し.今すぐ();
exports.控えの待ちを変える = (ms) => {
  控えの書き出し.遅らせ = ms;
};
Object.defineProperty(exports, 'useScoreStore', {
  enumerable: true,
  get: function () {
    return useScoreStore;
  },
});
// ライブ名の検査。画面から使う
Object.defineProperty(exports, 'ライブ名に使えない字', {
  enumerable: true,
  get: function () {
    return 同期規則.ライブ名に使えない字;
  },
});
const zustand = require('zustand');
const _t_orig = require('./db');
const FirebaseAuth = require('firebase/auth');
const Firestore = require('firebase/firestore');
const RTDB = require('firebase/database');
const Alert = require('./alertBridge').default;
const { IS_WEB } = require('./IS_WEB');
const { generateUUID } = require('./uuid');
const middleware = require('zustand/middleware');
const AsyncStorage =
  require('@react-native-async-storage/async-storage').default ??
  require('@react-native-async-storage/async-storage');
const netinfo =
  require('@react-native-community/netinfo').default ?? require('@react-native-community/netinfo');
const Firebaseの器 = {
  dbInstance: null,
  authInstance: null,
  get db() {
    if (Firebaseの器.dbInstance) return Firebaseの器.dbInstance;
    const res = require('./db');
    if (res && res.db) {
      Firebaseの器.dbInstance = res.db;
      return res.db;
    }
    try {
      const fbApp = require('firebase/app').getApp();
      const firestore = require('firebase/firestore').getFirestore(fbApp);
      if (firestore) {
        Firebaseの器.dbInstance = firestore;
        return firestore;
      }
    } catch (誤り) {
      /* まだ用意できていないだけ。undefined を返すと waitForDb が待つ */
    }
    return undefined;
  },
  get auth() {
    if (Firebaseの器.authInstance) return Firebaseの器.authInstance;
    const res = require('./db');
    if (res && res.auth) {
      Firebaseの器.authInstance = res.auth;
      return res.auth;
    }
    try {
      const fbApp = require('firebase/app').getApp();
      const auth = require('firebase/auth').getAuth(fbApp);
      if (auth) {
        Firebaseの器.authInstance = auth;
        return auth;
      }
    } catch (誤り) {
      /* まだ用意できていないだけ。undefined を返すと waitForDb が待つ */
    }
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
    Firebaseの器.dbInstance = dbInst;
    return dbInst;
  }
  if (mod.db) {
    Firebaseの器.dbInstance = mod.db;
    return mod.db;
  }
  return undefined;
};
let 部員を送る予約 = {};
// 同期の判断に使う純粋な関数は syncRules.js へ移した。中身は変えていない。
// 呼び出し側の書き換えを避けるため、従来の1文字の名前に割り当て直す。
const 同期規則 = require('./syncRules');
const generateUniquePersonalId = 同期規則.generateUniquePersonalId;
const mergeById = 同期規則.mergeById;
const mergeLiveArchers = 同期規則.mergeLiveArchers;
const 印だけの差分 = 同期規則.印だけの差分;
const 差分を当てる = 同期規則.差分を当てる;
const 射数の差分 = 同期規則.射数の差分;
const 射数差を当てる = 同期規則.射数差を当てる;
const 盤面を射数にそろえる = 同期規則.盤面を射数にそろえる;
const 項目の差分 = 同期規則.項目の差分;
const 項目差分を当てる = 同期規則.項目差分を当てる;
const restampChangedArchers = 同期規則.restampChangedArchers;
const normalizeArrowLocations = 同期規則.normalizeArrowLocations;
const dropUndefinedDeep = 同期規則.dropUndefinedDeep;
const trashedAtMillis = 同期規則.trashedAtMillis;
const normalizeTag = 同期規則.normalizeTag;
const cleanUpTagsArray = 同期規則.cleanUpTagsArray;
const 参加できるライブ = 同期規則.参加できるライブ;
const cleanUpSessions = 同期規則.cleanUpSessions;
const 記録の射手を整える = 同期規則.記録の射手を整える;
const 印の列にそろえる = (値, 本数) => {
  if (!値) return 本数 ? Array(本数).fill('') : [];
  if (Array.isArray(値)) {
    const 列 = 値.map((印) => (null == 印 ? '' : 印));
    return 本数 && 列.length < 本数 ? [...列, ...Array(本数 - 列.length).fill('')] : 列;
  }
  if ('object' == typeof 値) {
    const 鍵たち = Object.keys(値);
    if (鍵たち.length > 0 && 鍵たち.every((鍵) => !isNaN(Number(鍵)))) {
      const 最大の添字 = Math.max(...鍵たち.map(Number));
      const 長さ = 本数 ? Math.max(本数, 最大の添字 + 1) : 最大の添字 + 1;
      const 列 = Array(長さ).fill('');
      return (
        鍵たち.forEach((鍵) => {
          const 添字 = Number(鍵);
          列[添字] = null === 値[鍵] || undefined === 値[鍵] ? '' : 値[鍵];
        }),
        列
      );
    }
    return Object.values(値);
  }
  return [];
};
const 射手の形にそろえる = (射手, 本数) =>
  射手 && 'object' == typeof 射手
    ? {
        id: 射手.id || '',
        name: 射手.name || '',
        gender: 射手.gender || '未設定',
        grade: 'number' == typeof 射手.grade ? 射手.grade : 1,
        marks: 印の列にそろえる(射手.marks, 射手.isSeparator ? 0 : 本数),
        isSeparator: true === 射手.isSeparator,
        isTotalCalculator: true === 射手.isTotalCalculator,
        // 手前の計もまとめて数える合計かどうか。写し忘れると、読み直した
        // ときにふつうの「計」に戻り、複数立ちの合計が消える
        またぐ合計: true === 射手.またぐ合計,
        isGuest: true === 射手.isGuest,
        // 区切りに付けたチーム名（リーグの大学名）。ここに書かないと
        // 読み直しや同期のたびに落ちて、色分けが消える
        teamName: 射手.teamName || undefined,
        memberId: 射手.memberId || undefined,
        lockedBlocks: 射手.lockedBlocks || {},
        substitutions: 射手.substitutions || {},
        substitutionIds: 射手.substitutionIds || {},
        bowWeight: 射手.bowWeight || undefined,
        lastModified: 射手.lastModified || 0,
        // 入っていなければ undefined のままにする。突き合わせ側が
        // 「情報が無い」と見て手元の矢所を残せるようにするため
        arrowLocations: normalizeArrowLocations(射手.arrowLocations, 射手.isSeparator ? 0 : 本数 || 8),
      }
    : null;
const ライブへ送る形の射手 = (一覧, 本数) =>
  JSON.parse(
    JSON.stringify(
      一覧.map((射手) => ({
        id: 射手.id,
        name: 射手.name || '',
        gender: 射手.gender || '未設定',
        grade: 射手.grade || 0,
        isSeparator: 射手.isSeparator || false,
        isTotalCalculator: 射手.isTotalCalculator || false,
        // 手前の計もまとめる合計かどうか。ライブでも相手に同じ数が出るようにする
        またぐ合計: 射手.またぐ合計 || false,
        isGuest: 射手.isGuest || false,
        // 区切りのチーム名。ライブでも相手に伝わるようにする
        teamName: 射手.teamName || null,
        memberId: 射手.memberId || null,
        lockedBlocks: 射手.lockedBlocks || {},
        substitutions: 射手.substitutions || {},
        lastModified: 射手.lastModified || 0,
        substitutionIds: 射手.substitutionIds || {},
        bowWeight: 射手.bowWeight || null,
        // 空欄は '' で送る（○× と同じ）。null のままだと Realtime Database が
        // 配列から落として添字のオブジェクトに変えてしまい、位置がずれる。
        // 持っていないときは null にして、受け取り側が手元の値を残せるようにする
        arrowLocations: Array.isArray(射手.arrowLocations)
          ? 射手.arrowLocations.map((矢所) => (null == 矢所 ? '' : 矢所))
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
const 印を並べる = (印) =>
  (Array.isArray(印) ? 印 : []).map((一つ) => (一つ == null ? '' : 一つ)).join('\u0001');
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
const ライブへ盤面を送る = (名前, 一覧, 本数) => {
  const 今 = Date.now();
  const 枝 = ライブの枝();
  if (!Firebaseの器.rtdb || !枝) return;
  const 場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`);
  const 送る射手 = ライブへ送る形の射手(一覧);
  const 日時の表 = {};
  一覧.forEach((射手) => {
    射手 && 射手.id && (日時の表[射手.id] = 射手.lastModified || 0);
  });
  // ○×は、前に載せたときから変わった射手のぶんだけ書く。
  // marks_by_id を丸ごと差し替えると、まだ受け取っていない相手の
  // 1射ぶんの送信を消してしまう
  const 変わった印 = {};
  一覧.forEach((射手) => {
    if (!射手 || !射手.id || 射手.isSeparator) return;
    const 並び = 印を並べる(射手.marks);
    if (載っている印[射手.id] === 並び) return;
    変わった印[射手.id] = 射手.marks || [];
    載っている印[射手.id] = 並び;
  });
  const 中身 = {
    archers: 送る射手,
    shotsPerRound: 本数,
    timestamp: 今,
    // 参加一覧の「最終更新」はこちらを見る。timestamp は書いた端末の時計で、
    // 自分の送信の返りを見分けるのに使うため端末の値のままにしてある。
    // 端末の時計が狂っていると、使用中のライブが古いと見なされて消えかねない
    updated_at: RTDB.serverTimestamp(),
    status: 'active',
  };
  // 丸ごとではなく射手ごとの道に書く。書かなかった射手の○×は残る。
  // 日時も同じ射手のぶんだけ。日時は○×の鮮度を表す値なので、○×を
  // 書かない射手の日時に触ると、相手の新しい入力を古いと誤判定させる。
  // 射手そのものの新しさは archers[].lastModified が運び、受け取り側は
  // 両者の max を取るので、書かなくても取りこぼさない
  Object.keys(変わった印).forEach((id) => {
    中身[`marks_by_id/${id}`] = 変わった印[id];
    中身[`archer_timestamps/${id}`] = 日時の表[id] || 0;
  });
  console.log('[Store] pushLiveAll state updated, lastPushedTimestamp:', 今);
  useScoreStore.getState().updateState({ lastPushedTimestamp: 今 });
  RTDB.update(場所, 中身).catch((誤り) => console.error('[Store] pushLiveAll Error:', 誤り));
  写しへも流す(名前, 中身);
};
const // 自分の送信の返りから、的中の印だけを取り込む。
  //
  // 返りの archers は自分が送った時点のもので、手元にしかない射手が
  // 落ちるため、一覧は入れ替えられない。しかし同じ通知には、ほぼ同時に
  // 書いた相手の marks_by_id が載っていることがある。丸ごと捨てると
  // その手は永久に届かない（他に変化が無ければ次の通知が来ないため）。
  // そこで一覧はそのままに、相手のほうが新しい射手の印だけを入れる。
  返りの印を取り込む = (届いた状態, 書く, 状態) => {
    // ここでも控えを取り直す。この経路は w() を通らないので、忘れると
    // 相手の○×を「まだ載っていない」と思い込んだままになる。
    // その状態で取り消すと「前と同じ」と見なして送らず、自分だけ戻る
    載っている印を控える((届いた状態 && 届いた状態.marks_by_id) || {});
    const 印 = (届いた状態 && 届いた状態.marks_by_id) || {};
    const 日時 = (届いた状態 && 届いた状態.archer_timestamps) || {};
    const // 正規化は手元の射数で行う。相手の射数で揃えると、射数が食い違って
      // いるときに手元の盤面と長さの合わない marks を入れてしまう。
      // 射数そのものの変更は、返りではない通知のほうで届く
      本数 = 状態().shotsPerRound;
    let 変わった = false;
    const 一覧 = (状態().archers || []).map((射手) => {
      if (!射手 || !射手.id || 射手.isSeparator || 射手.isTotalCalculator) return 射手;
      const 相手 = 印[射手.id];
      const 相手の日時 = 日時[射手.id] || 0;
      if (!相手 || 相手の日時 <= (射手.lastModified || 0)) return 射手;
      return (
        (変わった = true),
        Object.assign({}, 射手, { marks: 印の列にそろえる(相手, 本数), lastModified: 相手の日時 })
      );
    });
    if (変わった) 書く({ archers: 一覧 });
  };
const ライブへ1射を送る = (名前, 射手ID, 添字, 印, 日時) => {
  const 今 = Date.now();
  const 枝 = ライブの枝();
  if (!Firebaseの器.rtdb || !枝) return;
  const 場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`);
  const 中身 = {
    [`marks_by_id/${射手ID}/${添字}`]: 印,
    [`archer_timestamps/${射手ID}`]: 日時,
    timestamp: 今,
    updated_at: RTDB.serverTimestamp(),
  };
  // 1射ぶんの送信でも控えを更新する。ここを飛ばすと、次に盤面まるごとを
  // 送るときに「前と同じ」と見なして送らず、取り消しが相手に届かない
  const その射手 = (useScoreStore.getState().archers || []).find((射手) => 射手 && 射手.id === 射手ID);
  if (その射手) 載っている印[射手ID] = 印を並べる(その射手.marks);
  useScoreStore.getState().updateState({ lastPushedTimestamp: 今 });
  RTDB.update(場所, 中身).catch((誤り) => console.error('pushLiveMark Error:', 誤り));
  写しへも流す(名前, 中身);
};
const ライブの盤面を読み取る = (盤面) => {
  const 本数 = 'number' == typeof 盤面.shotsPerRound ? 盤面.shotsPerRound : 8;
  const 射手の元 = 印の列にそろえる(盤面.archers);
  const 印の表 = 盤面.marks_by_id || {};
  const 日時の表 = 盤面.archer_timestamps || {};
  // 受け取った内容でも控え直す。自分が送った値しか覚えていないと、
  // 相手が入れた○×を「前と同じ」と見なして送らず、取り消しが相手に届かない
  載っている印を控える(印の表);
  return {
    archers: 射手の元
      .map((元) => {
        if (!元) return null;
        const 射手 = 射手の形にそろえる(元, 本数);
        return 射手
          ? (!元.isSeparator &&
              印の表[元.id] &&
              ((射手.marks = 印の列にそろえる(印の表[元.id], 本数)),
              (射手.lastModified = Math.max(射手.lastModified || 0, 日時の表[元.id] || 0))),
            射手)
          : null;
      })
      .filter(Boolean),
    shotsPerRound: 本数,
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
  if (写しの片付け) 写しの片付け();
  写しの片付け = null;
}
/** 在席をやめる。ライブから抜けたときに必ず呼ぶこと */
function 在席を終える(書く) {
  if (在席の片付け) 在席の片付け();
  在席の片付け = null;
  if (書く) 書く({ ライブの接続台数: 0 });
}
/**
 * 在席を置き、台数を数え始める。
 *
 * onDisconnect は一度きりで、つなぎ直すと外れる。`.info/connected` を
 * 見張って掛け直さないと、二度目に切れた端末が在席に残り続ける。
 * 数えるのは台数だけで、誰が居るかは持たない
 */
function 在席を始める(名前, 書く) {
  在席を終える();
  const 枝 = ライブの枝();
  if (!Firebaseの器.rtdb || !枝 || !名前) return;
  try {
    const 根 = 在席の場所(枝, 名前);
    const 自分 = RTDB.ref(Firebaseの器.rtdb, `${根}/${この端末}`);
    const 置き直す = () => {
      try {
        RTDB.onDisconnect(自分)
          .remove()
          .catch(() => {});
        RTDB.set(自分, { at: RTDB.serverTimestamp() }).catch(() => {});
      } catch (誤り) {
        /* 台数が出ないだけ。ライブそのものは続ける */
      }
    };
    // 切れて戻ったときだけ掛け直す。知らせが来るたびに書くと、書いたことが
    // また知らせになって堂々巡りになる（偽のRTDBで実際に止まらなくなった）
    let 前は繋がっていた = false;
    const 繋がりの見張り = RTDB.onValue(RTDB.ref(Firebaseの器.rtdb, '.info/connected'), (返り) => {
      const いま = !!返り.val();
      if (いま && !前は繋がっていた) 置き直す();
      前は繋がっていた = いま;
    });
    // サーバーの時計に合わせられるまでは、古さで落とさない（null を渡す）。
    // 端末の時計が進んでいると全員が「古い」に見え、居るのに0台と出る
    時差を見張る();
    const 数の見張り = RTDB.onValue(RTDB.ref(Firebaseの器.rtdb, 根), (返り) => {
      書く({
        ライブの接続台数: 在.在席を数える(返り.val(), 時差が取れた ? Date.now() + サーバーとの時差 : null),
      });
    });
    // 電波が一瞬切れても在席が古びないように、ときどき打ち直す
    const 打ち直し = setInterval(置き直す, 在.打ち直す間隔);
    // node（検査）では、走り続ける時計があるとまとめて終われない。
    // ブラウザや端末の setInterval に unref は無いので、あるときだけ呼ぶ
    if (打ち直し && 'function' == typeof 打ち直し.unref) 打ち直し.unref();
    在席の片付け = () => {
      clearInterval(打ち直し);
      if (繋がりの見張り) 繋がりの見張り();
      if (数の見張り) 数の見張り();
      try {
        RTDB.onDisconnect(自分)
          .cancel()
          .catch(() => {});
        RTDB.remove(自分).catch(() => {});
      } catch (誤り) {
        /* 消せなくても、古いとみなす時間で数から落ちる */
      }
    };
  } catch (誤り) {
    console.warn('[Store] ライブの在席を置けませんでした', 誤り);
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
  (Array.isArray(一覧) ? ライブへ送る形の射手(一覧) : []).map((射手, 番) =>
    Object.assign({}, 射手, {
      marks: ((一覧[番] && 一覧[番].marks) || []).map((印) => (null == 印 ? '' : 印)),
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
let 時差が取れた = false;
let 時差の見張り = null;
const 時差を見張る = () => {
  if (時差の見張り || !Firebaseの器.rtdb) return 時差の見張り;
  時差の見張り = new Promise((解決) => {
    let 済み = false;
    const 終わる = () => {
      if (!済み) {
        済み = true;
        解決();
      }
    };
    try {
      RTDB.onValue(
        RTDB.ref(Firebaseの器.rtdb, '.info/serverTimeOffset'),
        (返り) => {
          const 差 = 返り.val();
          if ('number' == typeof 差) {
            サーバーとの時差 = 差;
            時差が取れた = true;
            console.log('[Store] サーバーとの時差:', 差, 'ミリ秒');
          }
          終わる();
        },
        () => 終わる()
      );
      // つながっていなければ来ない。待ち続けない
      setTimeout(終わる, 2e3);
    } catch (誤り) {
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
function つなげなくなった(誤り, 書く, 状態) {
  if (!弾かれたか(誤り)) return void console.error('[Store] ライブの見張りが止まりました', 誤り);
  // すでに離れているなら、片付けるだけで黙っている。
  // 期限で閉じたあとにつなぎ直して弾かれると、ここも呼ばれる。
  // 断らないと、同じ出来事で知らせが二度出る
  const もう離れている = !状態().isLiveActive;
  在席を終える(書く);
  写しを見るのをやめる();
  書く({
    isLiveActive: false,
    ライブの続き: null,
    isHost: false,
    liveSessionName: null,
    いまのライブの期限: null,
  });
  if (もう離れている) return;
  try {
    Alert.alert(
      'このライブには入れません',
      '共有の期限が切れたか、すでに終わっているようです。配った方にお確かめください。'
    );
  } catch (中の誤り) {
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
function 期限を控える(届いた状態, 書く, 状態) {
  const 期限 = 届いた状態 && 'number' == typeof 届いた状態.期限 ? 届いた状態.期限 : 0;
  if (状態().いまのライブの期限 !== (期限 || null)) 書く({ いまのライブの期限: 期限 || null });
  return 期限;
}
function 期限で閉じるか(届いた状態, 書く, 状態) {
  const 期限 = 期限を控える(届いた状態, 書く, 状態);
  if (!期限 || いまの見当() < 期限) return false;
  const 名前 = 状態().liveSessionName;
  const 枝 = ライブの枝();
  if (名前 && 枝 && Firebaseの器.rtdb)
    RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`));
  在席を終える(書く);
  写しを見るのをやめる();
  書く({
    isLiveActive: false,
    ライブの続き: null,
    isHost: false,
    liveSessionName: null,
    いまのライブの期限: null,
  }); // 何度も出さない。見張りが複数あると同じ通知で二度三度呼ばれる
  if (期限 !== 期限を知らせた) {
    期限を知らせた = 期限;
    try {
      Alert.alert(
        '共有の期限が切れました',
        'このライブは、配った方も含めて全員がつながらなくなりました。お手元の記録は残っています。保存するか、ライブを始め直してください。'
      );
    } catch (誤り) {
      /* 知らせが出せなくても、離れることはできている */
    }
  }
  return true;
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
  if (!Firebaseの器.rtdb) return Date.now();
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
const 共有履歴へ積む = (前の盤面, 後の盤面, 状態) => {
  const 枝 = ライブの枝();
  const 名前 = 状態().liveSessionName;
  if (!Firebaseの器.rtdb || !枝 || !名前) return;
  const 履歴の根 = 共有履歴の場所(枝, 名前);
  const 状態の道 = `live_sessions/${枝}/${名前}/state`;
  const 本数 = 状態().shotsPerRound;
  // 盤面は今のうちに写しておく。場所が取れるまでに手元が変わりうる
  const 前 = 履歴用に整える(前の盤面);
  const 後 = 履歴用に整える(後の盤面);
  RTDB.runTransaction(
    RTDB.ref(Firebaseの器.rtdb, `${状態の道}/history_len`),
    (今の値) => ('number' == typeof 今の値 ? 今の値 : 0) + 1
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
      RTDB.set(
        RTDB.ref(Firebaseの器.rtdb, `${履歴の根}/${位置}`),
        Object.assign(
          { 前, 後, 本数, at: Date.now() },
          差分 ? { 差分 } : null,
          項目 ? { 項目 } : null,
          射数 ? { 射数 } : null
        )
      ).catch((誤り) => console.error('[Store] 共有履歴の書き込みに失敗:', 誤り));
      // 新しい操作をしたので、やり直せる分はここで打ち切る
      RTDB.update(RTDB.ref(Firebaseの器.rtdb, 状態の道), { history_max: 次 }).catch(() => {});
      useScoreStore.getState().updateState({ historySharedLen: 次, historySharedMax: 次 }); // 古い手を捨てる（上限を超えた分）
      if (次 > 共有履歴の上限)
        RTDB.remove(RTDB.ref(Firebaseの器.rtdb, `${履歴の根}/${次 - 共有履歴の上限 - 1}`)).catch(() => {});
    })
    .catch((誤り) => console.error('[Store] 共有履歴の場所取りに失敗:', 誤り));
};
/**
 * ライブから届いた state から、共有履歴の目印と知らせを取り込む。
 * 主催者側と参加者側の両方で同じことをするので、ここへ出してある。
 */
const 共有履歴の目印を受け取る = (届いた状態, 書く, 状態) => {
  if (!届いた状態) return;
  const 変更 = {};
  if ('number' == typeof 届いた状態.history_len) 変更.historySharedLen = 届いた状態.history_len;
  if ('number' == typeof 届いた状態.history_max) 変更.historySharedMax = 届いた状態.history_max;
  // 参加して最初の1通は、その場で起きたことではなく「これまでの結果」。
  // 知らせを出すと、過去に一度でも取り消しがあったライブに入るたび
  // 「取り消しされました。」が出てしまうので、目印だけ引き取る
  if (状態().historyIsFirstSnapshot) {
    変更.historyIsFirstSnapshot = false;
    変更.historyHandledAt = 届いた状態.history_at || 0;
  } else if (届いた状態.history_at && 届いた状態.history_at !== 状態().historyHandledAt) {
    // 自分が起こしたものでなければ、画面に知らせる材料を渡す
    変更.historyHandledAt = 届いた状態.history_at;
    変更.historyNoticeAt = 届いた状態.history_at;
    変更.historyNoticeKind = 届いた状態.history_kind || '取り消し';
  }
  if (Object.keys(変更).length > 0) 書く(変更);
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
  const 使える = (一人) => 一人 && !一人.isSeparator && Array.isArray(一人.marks);
  // 「計」の列は数えない。本番には、射数12なのに「計」だけ○×が20個ある
  // 記録が実在する。そこから読むと、取り消しで射数が20に化ける
  const 射手 = 並び.find((一人) => 使える(一人) && !一人.isTotalCalculator) || 並び.find(使える);
  return 射手 ? 射手.marks.length : null;
};
let 進級の確認を済ませた = false;
// ライブ中の共有履歴。取り消し・やり直しを全員で1本の履歴として扱う。
// 取り消しの適用中は、その書き換え自体を履歴に積まないための目印。
let 履歴を積まない = false;
/** 共有履歴に残す手数の上限。射手20人でも 1手あたり15KB程度 */
const 共有履歴の上限 = 30;
const useScoreStore = zustand.create()(
  middleware.persist(
    (そのまま書く, 状態) => {
      const 書く = (変更) => {
        let 中身 = 'function' == typeof 変更 ? 変更(状態()) : 変更;
        // 同期できたなら、入り直しの案内は下ろす。書き換えは幾つもあるので、
        // 1つずつ消して回らずにここで拾う
        中身 && '同期済み' === 中身.syncStatus && (中身.再ログインの案内 = null);
        中身 &&
          (中身.sessions && (中身.sessions = cleanUpSessions(中身.sessions)),
          中身.trash && (中身.trash = cleanUpSessions(中身.trash)));
        if (
          中身 &&
          Array.isArray(中身.historyStack) &&
          !履歴を積まない &&
          中身.historyStack.length > (状態().historyStack || []).length &&
          状態().isLiveActive &&
          状態().liveSessionName
        )
          共有履歴へ積む(
            中身.historyStack[中身.historyStack.length - 1],
            中身.archers || 状態().archers,
            状態
          );
        そのまま書く(中身);
      };
      return {
        // 矢所の記録は既定でオフ。要る団体だけが設定で入れる
        enableArrowLocation: false,
        // 誤タップ防止。入れたますを少し経ってから閉じる。
        // 同期する中身ではなく、画面の上の守りなので archers には持たせない。
        // 既定はオフ（2026-09-13、使う人の指示。以前はオンだった。端末に残っている
        // 設定はそのまま。入れ直したい人は設定で切り替える）
        自動ロックする: false,
        // 「終了・保存」を押したときに出欠確認を出すか。
        // 切ると、出欠の窓を飛ばして保存の窓へ進む。記録に出ている人は
        // 出欠画面でそのまま出席として数えられるので、毎回聞かれたくない
        // 団体はここで切れる（遅刻・早退の区別だけ付かなくなる）
        保存時に出欠を確認する: true,
        // 記録表の並べ方。切り替えると、名前が左・○×が右へ伸びる横の表になる。
        // 端末ごとの好みなので残す（同じ団体でも人によって持ち方が違う）
        横に並べる: false,
        // 記録画面の上下の帯を畳んでいるか。並べ方と同じく端末ごとの好みなので残す
        帯を畳む: false,
        // 帯を畳む取っ手を左上に置いているか（既定は右上）。指で引いて動かせる。
        // 右利きは右、左利きは左が押しやすいので、端末ごとの好みとして残す
        帯の取っ手は左: false,
        // ライブに「見るだけ」で入っているか。入れているときは盤面を書き換えない。
        // 端末には残さない（次に参加するときは、そのつど選ぶ）
        ライブは見るだけ: false,
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
        同意の確認が要る: false,
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
        // 履歴の記録を記録画面で直しているあいだの目印。{ id, 控え }。
        // 控え は直す前の盤面（archers など）で、終えるときに据え直す
        履歴の編集: null,
        viewScale: 1,
        syncStatus: '未同期',
        lastSyncTime: null,
        offlineSaveWarning: null,
        // 入り直しが要るときの案内。permission-denied を拾ったときだけ立てる
        再ログインの案内: null,
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
        isNetworkOnline: true,
        isAdminMode: false,
        autoPromotionEnabled: true,
        _pendingUpdateTimers: {},
        includeInStats: true,
        lastLocalChange: 0,
        lastResetHandled: 0,
        // 入って最初の1通かどうか。最初の1通に載っている片付けは
        // 「入る前に起きたこと」なので知らせない（共有履歴の知らせと同じ考え方）
        resetIsFirstSnapshot: false,
        lastPushedTimestamp: 0,
        // ライブ中の共有履歴の目印。len は「いま何手ぶん適用しているか」、
        // max は「やり直せる上限」。どちらも state 経由で全員に配られる
        historySharedLen: 0,
        historySharedMax: 0,
        historyIsFirstSnapshot: false,
        // 取り消し・やり直しの通知を出したかどうかの控え
        historyHandledAt: 0,
        // 画面へ知らせるための材料（誰かが取り消した／やり直した）
        historyNoticeAt: 0,
        historyNoticeKind: null,
        showTrash: false,
        sessionUnsubscribe: null,
        trashUnsubscribe: null,
        memberUnsubscribe: null,
        alumniUnsubscribe: null,
        configUnsubscribe: null,
        showAlumniInAnalysis: false,
        showAlumniInPicker: false,
        currentFreshmanTerm: 1,
        historyViewMode: 'list',
        selectedHistorySessionId: null,
        isAdminModePending: false,
        isLiveActive: false,
        ライブの続き: null,
        isHost: false,
        liveSessionName: null,
        // 帯にカウントダウンを出すために持つ。盤面に載ってくる期限の控え。
        // 期限が無いライブでは null（「期限なし」と「まだ来ていない」は
        // どちらも null でよい。帯は期限があるときしか出さないため）
        いまのライブの期限: null,
        isIncomingLiveSync: false,
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
        写しを見ているか: false,
        // 共有リンクだけで来ている人か（団体に入っていない）。
        // 端末には残さない。閉じたら終わり、リンクを開き直せばまた入れる
        共有の来客: false,
        // いま入っているのが、よその団体のライブか。
        // 共有リンクで入ったときに決める。自分の団体のライブなら偽
        よその団体のライブ: false,
        // 共有のライブの道しるべ。{ ライブ名: { 共有の枝, 閲覧の枝 } }。
        // 参加一覧を読むたびに作り直すので、端末には残さない
        共有のライブたち: {},
        _pendingMemberTimers: {},
        isHydrated: false,
        analysisRankingSettings: {
          '月ごと': { type: 'ratio', value: 0 },
          '期間指定': { type: 'ratio', value: 0 },
          '直近30日': { type: 'ratio', value: 0 },
          '今年度': { type: 'ratio', value: 0 },
          'すべて': { type: 'ratio', value: 0 },
        },
        focusedMemberId: null,
        currentRouteName: null,
        updateLoadingLog: (文) => {
          const 今まで = 状態().initializationLogs || [];
          書く({ initializationLogs: [...今まで, 文] });
          console.log('[Store] Loading:', 文);
        },
        setCurrentRouteName: (名前) => 書く({ currentRouteName: 名前 }),
        setMemberAuthVersion: (版) => 書く({ memberAuthVersion: 版 }),
        setFocusedMemberId: (id) => 書く({ focusedMemberId: id }),
        setAuth: (団体ID, 役割, 部員ID, メール = null, 公開の団体ID = null, 団体名 = null, 部員名 = null) => {
          null === 団体ID
            ? // 出たら行動の控えも捨てる。次に入った人の不具合の便りに、
              // 前の人が何をしていたかが付いていくのは筋が悪い
              (行動の控えを捨てる(),
              (合言葉の取り寄せ = null),
              書く({
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
                // 履歴の記録を直している途中の控えも、団体を離れるときに捨てる
                履歴の編集: null,
                analysisSelectedTags: [],
                historySelectedTags: [],
                historyTagLogic: 'AND',
                tagTemplates: ['立', '練習試合', '大会', '自主練習', '合宿'],
                initializationLogs: [],
                isAdminMode: false,
                isAdminModePending: false,
              }),
              状態().stopPeriodicSync(),
              状態().stopListeningToSessions(),
              状態().stopListeningToMembers(),
              状態().stopListeningToAlumni(),
              状態().stopListeningToTrash(),
              状態().configUnsubscribe && (状態().configUnsubscribe(), 書く({ configUnsubscribe: null })))
            : (書く({
                activeGroupId: 団体ID,
                activeGroupName: 団体名 || 状態().activeGroupName,
                activeRole: 役割,
                myMemberId: 部員ID,
                myMemberName: 部員名 || 状態().myMemberName,
                activeUserEmail: メール,
                publicGroupId: 公開の団体ID || ('group' === 役割 ? 団体ID : 状態().publicGroupId),
                isAdminMode: false,
                isAdminModePending: false,
              }),
              状態().listenToConfig(),
              状態().listenToSessions(),
              状態().listenToMembers(),
              状態().listenToAlumni(),
              状態().listenToTrash());
        },
        setAnalysisSelectedTags: (タグたち) => 書く({ analysisSelectedTags: タグたち }),
        toggleAnalysisTag: (タグ) => {
          const 今の = 状態().analysisSelectedTags || [];
          if (今の.includes(タグ)) 書く({ analysisSelectedTags: 今の.filter((タグ1つ) => タグ1つ !== タグ) });
          else 書く({ analysisSelectedTags: [...今の, タグ] });
        },
        setAnalysisTagLogic: (論理) => 書く({ analysisTagLogic: 論理 }),
        比較のひな型を足す: (名前, 部員idたち) =>
          書く({
            比較のひな型: ひ.ひな型を足す(状態().比較のひな型, {
              名前,
              部員idたち,
              団体id: 状態().activeGroupId || '',
            }),
          }),
        比較のひな型を消す: (id) => 書く({ 比較のひな型: ひ.ひな型を消す(状態().比較のひな型, id) }),
        setAnalysisRankingSetting: async (鍵, 値) => {
          const 今 = Date.now();
          const 今の設定 = 状態().analysisRankingSettings || {};
          const 新しい設定 = Object.assign({}, 今の設定, { [鍵]: 値 });
          書く({ analysisRankingSettings: 新しい設定, lastLocalChange: 今 });
          const { activeGroupId, isNetworkOnline } = 状態();
          if (isNetworkOnline && activeGroupId)
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                { analysisRankingSettings: 新しい設定, lastModified: Firestore.serverTimestamp() },
                { merge: true }
              );
            } catch (誤り) {
              console.error('[Store] setAnalysisRankingSetting sync error:', 誤り);
            }
        },
        setHistorySelectedTags: (タグたち) => 書く({ historySelectedTags: タグたち }),
        toggleHistoryTag: (タグ) => {
          const 今の = 状態().historySelectedTags || [];
          if (今の.includes(タグ)) 書く({ historySelectedTags: 今の.filter((タグ1つ) => タグ1つ !== タグ) });
          else 書く({ historySelectedTags: [...今の, タグ] });
        },
        setHistoryTagLogic: (論理) => 書く({ historyTagLogic: 論理 }),
        setCurrentSessionTags: (タグたち) => 書く({ currentSessionTags: タグたち }),
        toggleCurrentSessionTag: (タグ) => {
          const 今の = 状態().currentSessionTags || [];
          if (今の.includes(タグ)) 書く({ currentSessionTags: 今の.filter((タグ1つ) => タグ1つ !== タグ) });
          else 書く({ currentSessionTags: [...今の, タグ] });
        },
        setTagTemplates: async (タグたち) => {
          const 今 = Date.now();
          const 整えた = Array.from(new Set((タグたち || []).map(normalizeTag).filter(Boolean)));
          書く({ tagTemplates: 整えた, lastLocalChange: 今 });
          const { activeGroupId, isNetworkOnline } = 状態();
          if (isNetworkOnline && activeGroupId)
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                {
                  tagTemplates: 整えた,
                  currentFreshmanTerm: 状態().currentFreshmanTerm,
                  lastModified: Firestore.serverTimestamp(),
                },
                { merge: true }
              );
            } catch (誤り) {
              console.error('[Store] setTagTemplates sync error:', 誤り);
            }
        },
        addTagTemplate: async (タグ) => {
          const 今の = 状態().tagTemplates || [];
          const 整えた = normalizeTag(タグ);
          if (整えた && !今の.includes(整えた)) {
            const 今 = Date.now();
            const 新しい一覧 = [...今の, 整えた];
            書く({ tagTemplates: 新しい一覧, lastLocalChange: 今 });
            const { activeGroupId, isNetworkOnline } = 状態();
            if (isNetworkOnline && activeGroupId)
              try {
                await Firestore.setDoc(
                  Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                  {
                    tagTemplates: 新しい一覧,
                    currentFreshmanTerm: 状態().currentFreshmanTerm,
                    lastModified: Firestore.serverTimestamp(),
                  },
                  { merge: true }
                );
              } catch (誤り) {
                console.error('[Store] addTagTemplate sync error:', 誤り);
              }
          }
        },
        removeTagTemplate: async (タグ) => {
          const 今 = Date.now();
          const 新しい一覧 = (状態().tagTemplates || []).filter((タグ1つ) => タグ1つ !== タグ);
          書く({ tagTemplates: 新しい一覧, lastLocalChange: 今 });
          const { activeGroupId, isNetworkOnline } = 状態();
          if (isNetworkOnline && activeGroupId)
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                {
                  tagTemplates: 新しい一覧,
                  currentFreshmanTerm: 状態().currentFreshmanTerm,
                  lastModified: Firestore.serverTimestamp(),
                },
                { merge: true }
              );
            } catch (誤り) {
              console.error('[Store] removeTagTemplate sync error:', 誤り);
            }
        },
        setShowAlumniInAnalysis: (値) => 書く({ showAlumniInAnalysis: 値 }),
        setShowAlumniInPicker: (値) => 書く({ showAlumniInPicker: 値 }),
        setIncludeInStats: (値) => 書く({ includeInStats: 値 }),
        addArcher: (位置, 性別) => {
          if (状態().書き換えを止めるか()) return;
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          const 新しい射手 = {
            id: generateUUID(),
            name: '',
            marks: Array(状態().shotsPerRound || 8).fill(''),
            arrowLocations: Array(状態().shotsPerRound || 8).fill(null),
            gender: 性別 || '未設定',
            grade: 1,
            isGuest: false,
            isSeparator: false,
            isTotalCalculator: false,
            lockedBlocks: {},
            lastModified: Date.now(),
          };
          const 直した = 'number' != typeof 位置 || isNaN(位置) ? [...元, 新しい射手] : [...元];
          if ('number' == typeof 位置 && !isNaN(位置)) {
            const 差し込む場所 = Math.max(0, Math.min(位置, 直した.length));
            直した.splice(差し込む場所, 0, 新しい射手);
          }
          書く({
            archers: 直した,
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: Date.now(),
          });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
        },
        addSeparator: (位置) => {
          if (状態().書き換えを止めるか()) return;
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          const 区切り = {
            id: 'sep-' + generateUUID(),
            name: '---',
            marks: [],
            isSeparator: true,
            gender: '未設定',
            grade: 0,
            isGuest: false,
            isTotalCalculator: false,
            lockedBlocks: {},
            lastModified: Date.now(),
          };
          const 直した = 'number' == typeof 位置 ? [...元] : [...元, 区切り];
          if ('number' == typeof 位置) 直した.splice(位置, 0, 区切り);
          書く({
            archers: 直した,
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: Date.now(),
          });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
        },
        /**
         * 区切りにチーム名を付ける（リーグで大学名を出すため）。
         *
         * 区切りから右が、そのチームになる。次の区切りまで続く。
         * 区切りを1つ置いて名前を入れるだけで複数人にまとめて付くので、
         * 射手を一人ずつ設定しなくてよい。
         * 空文字にすると名前が外れ、ただの間隔に戻る。
         */
        setSeparatorTeam: (区切りのid, 名前) => {
          if (状態().書き換えを止めるか()) return;
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          const 整えた = String(名前 == null ? '' : 名前)
            .trim()
            .slice(0, 20);
          let 触った = false;
          const 直した = 元.map((列) => {
            if (!列 || 列.id !== 区切りのid || !列.isSeparator) return 列;
            触った = true;
            return Object.assign({}, 列, {
              teamName: 整えた,
              // 名前が付いた区切りは、ただの隙間ではなく見出しになる。
              // 画面はこの name を出すので、外したら元の '---' に戻す
              name: 整えた || '---',
              lastModified: Date.now(),
            });
          });
          if (!触った) return;
          書く({
            archers: 直した,
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: Date.now(),
          });
          const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = 状態();
          if (ライブ中 && ライブ名) ライブへ盤面を送る(ライブ名, 直した, 本数);
        },
        /**
         * 合計の列が数える範囲を切り替える。
         *
         * 「計」（この立ちだけ・区切りで止まる）と
         * 「総計」（区切りをまたいで端まで）を行き来する。
         *
         * ボタンを増やしたり長押しを覚えてもらう代わりに、入れた列を押して
         * 切り替える。交代の内訳と合算を押して切り替えるのと同じ流儀
         */
        toggleTotalScope: (列のid) => {
          if (状態().書き換えを止めるか()) return;
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          let 触った = false;
          const 直した = 元.map((列) => {
            if (!列 || 列.id !== 列のid || !列.isTotalCalculator) return 列;
            触った = true;
            const 次 = !列.またぐ合計;
            return Object.assign({}, 列, {
              またぐ合計: 次,
              name: 次 ? '総計' : '計',
              lastModified: Date.now(),
            });
          });
          if (!触った) return;
          書く({
            archers: 直した,
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: Date.now(),
          });
          const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = 状態();
          if (ライブ中 && ライブ名) ライブへ盤面を送る(ライブ名, 直した, 本数);
        },
        /**
         * 立ち順を入れ替える。押した列を、並びで1つ前か後ろへ動かす。
         *
         * 画面の言葉（左・右）では受け取らない。縦の表は右から左へ並び
         * （row-reverse）、横の表は上から下へ積むので、同じ「並びの後ろへ」が
         * 縦では左、横では下になる。画面の言葉で受け取ると、並べ方を変えた
         * とたんにボタンの字と動く向きが食い違う（実際そうなった）。
         * 字をどう出すかは、並べ方を知っている画面側が決める。
         *
         * 隣が区切りでも合計でも、そのまま入れ替える。またいで射手だけを
         * 選ぶ作りにすると、押しても何も動かないことがあって分かりにくい。
         *
         * ○×・矢所・鍵は列そのものが持っているので、列ごと動かせば付いていく。
         *
         * @param {string} 列のid 動かす列
         * @param {'前'|'後'} 向き 並びの向き（前＝大前寄り／後＝落寄り）
         */
        列を動かす: (列のid, 向き) => {
          if (状態().書き換えを止めるか()) return;
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          const いま = 元.findIndex((列) => 列 && 列.id === 列のid);
          if (いま < 0) return;
          const 先 = '後' === 向き ? いま + 1 : いま - 1;
          if (先 < 0 || 先 >= 元.length) return;
          const 直した = [...元];
          直した[いま] = 元[先];
          直した[先] = 元[いま];
          書く({
            archers: 直した,
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: Date.now(),
          });
          const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = 状態();
          if (ライブ中 && ライブ名) ライブへ盤面を送る(ライブ名, 直した, 本数);
        },
        /**
         * 立ち順を入れ替える。掴んだ列を、指した場所へ移す。
         *
         * 指で滑らせて動かすとき（ドラッグ）に、離した所で1回だけ呼ぶ。
         * 途中経過は書かないので、1回動かす＝取り消し1回で戻る。
         *
         * 場所は「いまの並び」での番号。抜いてから差し込むので、離した先に
         * 居た列の場所へそのまま入る。
         *
         * @param {string} 列のid     動かす列
         * @param {number} 新しい位置 いまの並びでの番号
         */
        列を並べ替える: (列のid, 新しい位置) => {
          if (状態().書き換えを止めるか()) return;
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          const いま = 元.findIndex((列) => 列 && 列.id === 列のid);
          if (いま < 0) return;
          const 数 = Number(新しい位置);
          if (!Number.isFinite(数)) return;
          const 先 = Math.max(0, Math.min(Math.trunc(数), 元.length - 1));
          if (先 === いま) return;
          const 直した = [...元];
          const 取り出した = 直した.splice(いま, 1)[0];
          直した.splice(先, 0, 取り出した);
          書く({
            archers: 直した,
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: Date.now(),
          });
          const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = 状態();
          if (ライブ中 && ライブ名) ライブへ盤面を送る(ライブ名, 直した, 本数);
        },
        /**
         * 合計の列を足す。
         *
         * @param {number} [位置] 差し込む場所。省くと末尾
         * @param {boolean} [またぐ] 手前の計もまとめて数えるか（間隔では止まる）
         *
         * ふつうの「計」は隣から左へ数え、区切りに当たると止まる（1立ぶん）。
         * またぐ合計は区切りで止まらず、端まで数える（複数立ちの合計）。
         * 前の立ちと後ろの立ちを区切りで分けているとき、両方を足せる
         */
        addTotalCalculator: (位置, またぐ) => {
          if (状態().書き換えを止めるか()) return;
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          const 合計の列 = {
            id: 'total-' + generateUUID(),
            name: またぐ ? '総計' : '計',
            marks: Array(状態().shotsPerRound || 8).fill(''),
            arrowLocations: Array(状態().shotsPerRound || 8).fill(null),
            isTotalCalculator: true,
            // 手前の計もまとめて数える印。ふつうの「計」と混ぜないよう別に持つ
            またぐ合計: !!またぐ,
            gender: '未設定',
            grade: 0,
            isGuest: false,
            isSeparator: false,
            lockedBlocks: {},
            lastModified: Date.now(),
          };
          const 直した = 'number' == typeof 位置 ? [...元] : [...元, 合計の列];
          if ('number' == typeof 位置) 直した.splice(位置, 0, 合計の列);
          書く({
            archers: 直した,
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: Date.now(),
          });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
        },
        deleteArcher: (射手ID) => {
          if (状態().書き換えを止めるか()) return;
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          const 残り = 元.filter((射手) => 射手 && 射手.id !== 射手ID);
          const 今 = Date.now();
          書く({
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            archers: 残り,
            lastLocalChange: 今,
          });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 残り, shotsPerRound);
        },
        applyOCRResult: (読み取った射手) => {
          if (状態().書き換えを止めるか()) return; // 閲覧用では画像から読み取った結果の取り込みも止める
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          const 今 = Date.now();
          書く({
            archers: 読み取った射手,
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: 今,
          });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName)
            ライブへ盤面を送る(liveSessionName, 読み取った射手, shotsPerRound);
        },
        set自動ロックする: (値) => 書く({ 自動ロックする: 値, 入れた時刻: {} }),
        set保存時に出欠を確認する: (値) => 書く({ 保存時に出欠を確認する: 値 }),
        set横に並べる: (値) => 書く({ 横に並べる: !!値 }),
        set帯を畳む: (値) => 書く({ 帯を畳む: !!値 }),
        set帯の取っ手は左: (値) => 書く({ 帯の取っ手は左: !!値 }),
        setライブは見るだけ: (値) => 書く({ ライブは見るだけ: !!値 }),
        // 見るだけで入っているあいだは盤面を触らせない。
        // 画面側の isReadOnly は鍵ボタンしか止めないので、根元で止める
        書き換えを止めるか: () => !!(状態().isLiveActive && 状態().ライブは見るだけ),
        /**
         * 保存を止めるか。
         *
         * よその団体のライブに共有リンクで入っているときは保存しない。
         * 保存すると、その練習が自分の団体の記録として残り、分析にも混ざる。
         * 記録そのものは主催者の側で保存されるので、失われはしない
         */
        保存を止めるか: () => !!(状態().isLiveActive && 状態().よその団体のライブ),
        /**
         * その人の弓具を扱ってよいか。見るのも直すのも、この一つで判定する。
         *
         * 団体アカウント … 全員ぶん
         * 個人ログイン   … 自分のぶんだけ（他人の弓具は見せない）
         *
         * 画面側でも隠すが、隠すだけでは道が増えたときに漏れる。根元で止める
         */
        弓具を触れるか: (memberId, 黙って) => {
          const { activeGroupId: 団体, activeRole: 役, myMemberId: 自分 } = 状態();
          if (!団体) return false;
          if ('group' === 役) return true;
          if ('member' === 役 && 自分 && String(自分) === String(memberId)) return true;
          if (!黙って) Alert.alert('権限エラー', '弓具を扱えるのは、団体アカウントか、本人だけです。');
          return false;
        },
        // まとめて入った○×に「いま入れた」印を付ける。
        // 画像からの反映は toggleMark を通らないので印が付かず、
        // そのままだと「読み込み直したもの」と見なして初めから閉じてしまう。
        // 読み取りの直しが全部長押しになるのを防ぐ
        入れた印をまとめて付ける: (一覧) =>
          状態().書き換えを止めるか()
            ? undefined
            : 書く((前) => {
                const 印 = Object.assign({}, 前.入れた時刻);
                const いま = Date.now();
                (Array.isArray(一覧) ? 一覧 : []).forEach((射手) => {
                  if (!射手 || !射手.id || !Array.isArray(射手.marks)) return;
                  射手.marks.forEach((一つ, 番) => {
                    if (一つ) 印[射手.id + ':' + 番] = いま;
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
          if (状態().書き換えを止めるか()) return void 書く({ 閲覧でますを押した時刻: Date.now() });
          書く({ 閉じたますを押した時刻: Date.now() });
        },
        ますを開ける: (射手, 番) =>
          状態().書き換えを止めるか()
            ? undefined
            : 書く((前) => ({
                入れた時刻: Object.assign({}, 前.入れた時刻, { [射手 + ':' + 番]: Date.now() }),
                鍵を開けた時刻: Date.now(),
              })),
        setEnableArrowLocation: (値) => 書く({ enableArrowLocation: 値 }),
        setArrowTargetType: (値) => 書く({ arrowTargetType: 値 }),
        setActiveArrowLocationEdit: (値) => 書く({ activeArrowLocationEdit: 値 }),
        updateArrowLocation: (射手ID, 番, 矢所) => {
          if (状態().書き換えを止めるか()) return; // 閲覧用では矢所（ライブにも送られる）も止める
          const { archers } = 状態();
          const 今 = Date.now();
          const 直した = (archers || []).map((射手) => {
            if (射手.id === 射手ID) {
              const 列 = [...(射手.arrowLocations || [])];
              return ((列[番] = 矢所), Object.assign({}, 射手, { arrowLocations: 列, lastModified: 今 }));
            }
            return 射手;
          });
          書く({
            archers: 直した,
            historyStack: [...状態().historyStack, archers],
            redoStack: [],
            lastLocalChange: 今,
          });
          // ライブ中は矢所も送る。送らないと相手の画面に出ないうえ、
          // 相手からの更新で手元の矢所が消えていた
          const { isLiveActive: ライブ中, liveSessionName: ライブ名, shotsPerRound: 本数 } = 状態();
          if (ライブ中 && ライブ名) ライブへ盤面を送る(ライブ名, 直した, 本数);
        },
        updateMark: (射手ID, 番, 印) => {
          if (状態().書き換えを止めるか()) return; // 閲覧用では○×の直接の書き換えも止める
          const { archers: 元, isLiveActive, liveSessionName } = 状態();
          const 今 = Date.now();
          const 直した = (元 || []).map((射手) => {
            if (射手.id === 射手ID) {
              const 列 = [...(射手.marks || [])];
              return ((列[番] = 印), Object.assign({}, 射手, { marks: 列, lastModified: 今 }));
            }
            return 射手;
          });
          書く({
            archers: 直した,
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: 今,
          });
          if (isLiveActive && liveSessionName) ライブへ1射を送る(liveSessionName, 射手ID, 番, 印, 今);
        },
        toggleMark: (射手ID, 番) => {
          // 閲覧用は黙って何も起きないと、壊れたと思わせる
          if (状態().書き換えを止めるか()) return void 書く({ 閲覧でますを押した時刻: Date.now() });
          const { archers: 元, isLiveActive, liveSessionName } = 状態();
          const 今 = Date.now();
          let 新しい印 = '';
          const 直した = (元 || []).map((射手) => {
            if (射手.id === 射手ID) {
              const 列 = [...(射手.marks || [])];
              const 前の印 = 列[番];
              const 次の印 = '' === 前の印 ? '○' : '○' === 前の印 ? '\xd7' : '';
              return (
                (列[番] = 次の印),
                (新しい印 = 次の印),
                Object.assign({}, 射手, { marks: 列, lastModified: 今 })
              );
            }
            return 射手;
          });
          const 鍵 = 射手ID + ':' + 番;
          書く({
            archers: 直した,
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: 今,
            // 入れ直したますは、また少し経ってから閉じる
            入れた時刻: Object.assign({}, 状態().入れた時刻, { [鍵]: 今 }),
          });
          if (isLiveActive && liveSessionName) ライブへ1射を送る(liveSessionName, 射手ID, 番, 新しい印, 今);
        },
        clearArcherMarks: (射手ID) => {
          if (状態().書き換えを止めるか()) return; // 閲覧用ではその人の○×の消去も止める
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          const 今 = Date.now();
          const 直した = 元.map((射手) =>
            射手 && 射手.id === 射手ID
              ? Object.assign({}, 射手, { marks: Array(状態().shotsPerRound).fill(''), lastModified: 今 })
              : 射手
          );
          書く({
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: 今,
            archers: 直した,
          });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
        },
        // 1立が全部埋まって少し経つと、画面側からここが呼ばれる。
        // toggleLock と違って必ず「閉じる」側に倒す。
        // 取り消しの控えには積まない（押した覚えのない操作が戻ると分かりにくい）
        立を閉じる: (射手ID, 塊) => {
          if (状態().書き換えを止めるか()) return;
          const { archers } = 状態();
          const 元 = Array.isArray(archers) ? archers : [];
          const 押した列 = 元.findIndex((射手) => 射手 && 射手.id === 射手ID);
          if (-1 === 押した列) return;
          if (元[押した列].lockedBlocks?.[塊]) return;
          let 塊の頭 = 押した列;
          for (
            ;
            塊の頭 > 0 && 元[塊の頭 - 1] && !元[塊の頭 - 1].isSeparator && !元[塊の頭 - 1].isTotalCalculator;
          )
            塊の頭--;
          const 今 = Date.now();
          const 直した = 元.map((射手, 番) => {
            if (射手 && 番 >= 塊の頭 && 番 <= 押した列) {
              const 鍵の表 = Object.assign({}, 射手.lockedBlocks || {});
              return (
                (鍵の表[塊] = true),
                Object.assign({}, 射手, { lockedBlocks: 鍵の表, lastModified: 今 })
              );
            }
            return 射手;
          });
          書く({ archers: 直した, lastLocalChange: 今 });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
        },
        toggleLock: (射手ID, 塊) => {
          const { archers } = 状態();
          const 元 = Array.isArray(archers) ? archers : [];
          const 押した列 = 元.findIndex((射手) => 射手 && 射手.id === 射手ID);
          if (-1 === 押した列) return;
          const その射手 = 元[押した列];
          const 掛ける = !その射手.lockedBlocks?.[塊];
          let 塊の頭 = 押した列;
          for (
            ;
            塊の頭 > 0 && 元[塊の頭 - 1] && !元[塊の頭 - 1].isSeparator && !元[塊の頭 - 1].isTotalCalculator;
          )
            塊の頭--;
          const 今 = Date.now();
          const 直した = 元.map((射手, 番) => {
            if (射手 && 番 >= 塊の頭 && 番 <= 押した列) {
              const 鍵の表 = Object.assign({}, 射手.lockedBlocks || {});
              return (
                (鍵の表[塊] = 掛ける),
                Object.assign({}, 射手, { lockedBlocks: 鍵の表, lastModified: 今 })
              );
            }
            return 射手;
          });
          書く({
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: 今,
            archers: 直した,
          });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
        },
        setArcherMember: (射手ID, 部員) => {
          if (状態().書き換えを止めるか()) return;
          const 元 = Array.isArray(状態().archers) ? 状態().archers : [];
          const 弓力 = 部員?.equipments?.length
            ? [...部員.equipments].sort((甲, 乙) => 乙.date - 甲.date)[0]?.weight
            : undefined;
          const 直した = 元.map((射手) =>
            射手 && 射手.id === 射手ID
              ? Object.assign({}, 射手, {
                  name: 部員 ? 部員.name : '',
                  gender: 部員 ? 部員.gender : '未設定',
                  grade: 部員 ? 部員.grade : 1,
                  memberId: 部員 ? 部員.id : undefined,
                  isGuest: false,
                  bowWeight: 弓力 || 射手.bowWeight,
                  lastModified: Date.now(),
                })
              : 射手
          );
          書く({
            historyStack: [...状態().historyStack, 元],
            redoStack: [],
            lastLocalChange: Date.now(),
            archers: 直した,
          });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
        },
        setArcherBowWeight: (射手ID, 弓力) => {
          if (状態().書き換えを止めるか()) return; // 閲覧用では弓力も止める
          const 直した = (Array.isArray(状態().archers) ? 状態().archers : []).map((射手) =>
            射手 && 射手.id === 射手ID
              ? Object.assign({}, 射手, { bowWeight: 弓力, lastModified: Date.now() })
              : 射手
          );
          書く({ lastLocalChange: Date.now(), archers: 直した });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName)
            ライブへ盤面を送る(liveSessionName, 状態().archers, shotsPerRound);
        },
        setArcherGuestName: (射手ID, 名前) => {
          if (状態().書き換えを止めるか()) return;
          const 直した = (Array.isArray(状態().archers) ? 状態().archers : []).map((射手) =>
            射手 && 射手.id === 射手ID
              ? Object.assign({}, 射手, {
                  name: 名前,
                  isGuest: true,
                  gender: '未設定',
                  memberId: undefined,
                  lastModified: Date.now(),
                })
              : 射手
          );
          書く({
            historyStack: [...状態().historyStack, Array.isArray(状態().archers) ? 状態().archers : []],
            redoStack: [],
            lastLocalChange: Date.now(),
            archers: 直した,
          });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName)
            ライブへ盤面を送る(liveSessionName, 状態().archers, shotsPerRound);
        },
        setArcherGender: (射手ID, 性別) => {
          if (状態().書き換えを止めるか()) return; // 閲覧用では性別も止める
          const 直した = (Array.isArray(状態().archers) ? 状態().archers : []).map((射手) =>
            射手 && 射手.id === 射手ID
              ? Object.assign({}, 射手, { gender: 性別, lastModified: Date.now() })
              : 射手
          );
          書く({ lastLocalChange: Date.now(), archers: 直した });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName)
            ライブへ盤面を送る(liveSessionName, 状態().archers, shotsPerRound);
        },
        // ライブ中は全員で1本の履歴を使う。誰が押しても「最後の1手」が戻る
        undo: () => {
          if (状態().書き換えを止めるか()) return;
          if (状態().isLiveActive && 状態().liveSessionName) return void 状態().sharedUndo(-1);
          const { historyStack, archers: 今の射手 } = 状態();
          if (0 === historyStack.length) return;
          // 中身が変わった射手には新しい日時を打ち直す。打たないと、ライブ中の
          // 取り消しが相手に届かず、主催者の画面だけ戻る食い違いになる
          const 戻す元 = 履歴の一手(historyStack[historyStack.length - 1]);
          // 射数の変更も一手なので、控えが持っていた射数へ戻す
          const 射数 = 控えの射数(戻す元) ?? 状態().shotsPerRound;
          const 戻した = restampChangedArchers(盤面を射数にそろえる(戻す元, 射数), 今の射手, Date.now());
          書く({
            historyStack: historyStack.slice(0, -1),
            redoStack: [...状態().redoStack, 今の射手],
            archers: 戻した,
            shotsPerRound: 射数,
            lastLocalChange: Date.now(),
          });
          const { isLiveActive, liveSessionName } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 状態().archers, 射数);
        },
        redo: () => {
          if (状態().書き換えを止めるか()) return;
          if (状態().isLiveActive && 状態().liveSessionName) return void 状態().sharedUndo(1);
          const { redoStack, archers: 今の射手 } = 状態();
          if (0 === redoStack.length) return;
          // 取り消しと同じ理由で日時を打ち直す。射数を戻すのも同じ
          const 戻す元 = 履歴の一手(redoStack[redoStack.length - 1]);
          const 射数 = 控えの射数(戻す元) ?? 状態().shotsPerRound;
          const 進めた = restampChangedArchers(盤面を射数にそろえる(戻す元, 射数), 今の射手, Date.now());
          書く({
            redoStack: redoStack.slice(0, -1),
            historyStack: [...状態().historyStack, 今の射手],
            archers: 進めた,
            shotsPerRound: 射数,
            lastLocalChange: Date.now(),
          });
          const { isLiveActive, liveSessionName } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 状態().archers, 射数);
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
          if (状態().書き換えを止めるか()) return;
          const { liveSessionName: 名前 } = 状態();
          const 枝 = ライブの枝();
          if (!Firebaseの器.rtdb || !枝 || !名前) return;
          const 根 = `live_sessions/${枝}/${名前}`;
          try {
            // 目印は state から配られてくる。手元の控えより新しいことがある
            const 届いた状態 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, `${根}/state`));
            const 盤面の値 = 届いた状態.exists() ? 届いた状態.val() || {} : {};
            const 位置 =
              'number' == typeof 盤面の値.history_len ? 盤面の値.history_len : 状態().historySharedLen || 0;
            const 上限 =
              'number' == typeof 盤面の値.history_max ? 盤面の値.history_max : 状態().historySharedMax || 0;
            const 読む番号 = 向き < 0 ? 位置 - 1 : 位置;
            if (向き < 0 ? 位置 <= 0 : 位置 >= 上限) return; // これ以上は戻せない／進めない
            const 手 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, `${共有履歴の場所(枝, 名前)}/${読む番号}`));
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
            const 射数 = !差分 && !項目 && 中身.射数 && 'number' == typeof 中身.射数.前 ? 中身.射数 : null;
            const 盤面 = 差分
              ? {
                  archers: 差分を当てる(状態().archers, 差分, 向き).archers,
                  shotsPerRound: 状態().shotsPerRound,
                }
              : 項目
                ? {
                    archers: 項目差分を当てる(状態().archers, 項目, 向き).archers,
                    shotsPerRound: 状態().shotsPerRound,
                  }
                : 射数
                  ? (() => {
                      const 出 = 射数差を当てる(状態().archers, 射数, 向き);
                      return { archers: 出.archers, shotsPerRound: 出.本数 };
                    })()
                  : ライブの盤面を読み取る({
                      archers: 向き < 0 ? 中身.前 : 中身.後,
                      shotsPerRound: 中身.本数,
                    });
            // 戻した内容が相手に届くよう、変わった射手の日時を打ち直す
            const 戻す = restampChangedArchers(盤面.archers, 状態().archers, 知らせ時刻);
            // ここでの書き換えは履歴に積まない（積むと際限がなくなる）
            履歴を積まない = true;
            try {
              書く({
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
              履歴を積まない = false;
            }
            // 盤面を全員へ流し、あわせて「取り消された」ことを知らせる
            ライブへ盤面を送る(名前, 戻す, 盤面.shotsPerRound);
            RTDB.update(RTDB.ref(Firebaseの器.rtdb, `${根}/state`), {
              history_len: 次,
              history_max: 上限,
              history_at: 知らせ時刻,
              history_kind: 向き < 0 ? '取り消し' : 'やり直し',
            }).catch(() => {});
          } catch (誤り) {
            console.error('[Store] 共有の取り消しに失敗:', 誤り);
          }
        },
        addMember: (名前, 性別, 学年, 期) => {
          if (!状態().activeGroupId || 'group' !== 状態().activeRole)
            return void Alert.alert('権限エラー', 'メンバーの追加は団体ログイン、かつ管理者のみ可能です。');
          const 整えた名前 = 名前 ? 名前.trim() : '';
          const 新しい部員 = {
            id: generateUUID(),
            personalId: generateUniquePersonalId(状態().members, 状態().alumni),
            name: 整えた名前,
            gender: 性別,
            grade: 学年,
            termKi: 期 || 状態().currentFreshmanTerm - (学年 - 1),
            lastModified: Date.now(),
            syncStatus: '未同期',
          };
          if (
            (書く({ members: [...状態().members, 新しい部員], lastLocalChange: Date.now() }),
            状態().activeGroupId)
          ) {
            const 送る中身 = Object.assign({}, 新しい部員, {
              lastModified: Firestore.serverTimestamp(),
              syncStatus: '同期済み',
            });
            Firestore.setDoc(
              Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 新しい部員.id),
              送る中身
            )
              .then(() => {
                状態().syncMemberLookup();
                // 印を付けるのは送った版だけ。送信中に編集されると更新日時が
                // 変わるので、一致する場合に限る（記録側と同じ考え方）。
                書く((前) => ({
                  members: 前.members.map((部員) =>
                    部員 && 部員.id === 新しい部員.id && 部員.lastModified === 新しい部員.lastModified
                      ? Object.assign({}, 部員, { syncStatus: '同期済み' })
                      : 部員
                  ),
                }));
              })
              .catch((誤り) => console.error('Add Member Sync Error:', 誤り));
          }
        },
        updateMember: (部員ID, 変更) => {
          if (!状態().activeGroupId || 'group' !== 状態().activeRole)
            return void Alert.alert('権限エラー', 'メンバーの編集は団体ログイン時のみ可能です。');
          if (undefined !== 変更.grade) {
            const 今日 = new Date();
            const 年 = 今日.getFullYear();
            const 月 = 今日.getMonth() + 1;
            const 年度 = 月 >= 4 ? 年 : 年 - 1;
            5 === Number(変更.grade) ? (変更.graduationYear = 年度) : (変更.graduationYear = null);
          }
          状態().members.find((部員) => 部員.id === 部員ID);
          let 直す中身 = Object.assign({}, 変更);
          if (undefined !== 変更.grade && undefined === 変更.termKi) {
            const 期 = 状態().currentFreshmanTerm - (変更.grade - 1);
            直す中身.termKi = 期;
          }
          const 直した部員 = 状態().members.map((部員) =>
            部員.id === 部員ID
              ? Object.assign({}, 部員, 直す中身, { lastModified: Date.now(), syncStatus: '未同期' })
              : 部員
          );
          書く({ members: 直した部員, lastLocalChange: Date.now() });
          if (undefined !== 変更.name || undefined !== 変更.gender || undefined !== 変更.grade) {
            const 記録に写す = (一覧) => {
              let 変わった = false;
              return {
                newList: 一覧.map((記録) => {
                  if (!記録 || !記録.archers) return 記録;
                  let 触った = false;
                  const 直した射手 = 記録.archers
                    .map((射手) =>
                      射手.memberId === 部員ID
                        ? ((触った = true),
                          Object.assign({}, 射手, {
                            name: undefined !== 変更.name ? 変更.name : 射手.name,
                            gender: undefined !== 変更.gender ? 変更.gender : 射手.gender,
                            grade: undefined !== 変更.grade ? 変更.grade : 射手.grade,
                            lastModified: Date.now(),
                          }))
                        : 射手
                    )
                    .map((射手) => {
                      if (射手.substitutionIds) {
                        let 交代を直した = false;
                        const 交代 = Object.assign({}, 射手.substitutions || {});
                        if (
                          (Object.entries(射手.substitutionIds).forEach(([番, id]) => {
                            const 添字 = Number(番);
                            id === 部員ID &&
                              undefined !== 変更.name &&
                              ((交代[添字] = 変更.name), (交代を直した = true));
                          }),
                          交代を直した)
                        )
                          return (
                            (触った = true),
                            Object.assign({}, 射手, { substitutions: 交代, lastModified: Date.now() })
                          );
                      }
                      return 射手;
                    });
                  if (触った) {
                    変わった = true;
                    const 名前たち = Array.from(
                      new Set(
                        直した射手.map((射手) => (射手 && 射手.name ? 射手.name.trim() : '')).filter(Boolean)
                      )
                    );
                    return Object.assign({}, 記録, {
                      archers: 直した射手,
                      archerNames: 名前たち,
                      lastModified: Date.now(),
                    });
                  }
                  return 記録;
                }),
                changed: 変わった,
              };
            };
            const 元の記録 = 状態().sessions;
            const 元のごみ箱 = 状態().trash;
            const { newList, changed } = 記録に写す(元の記録);
            const { newList: ごみ箱の一覧, changed: ごみ箱が変わった } = 記録に写す(元のごみ箱);
            if (
              (changed || ごみ箱が変わった) &&
              (書く({ sessions: newList, trash: ごみ箱の一覧, lastLocalChange: Date.now() }),
              状態().activeGroupId)
            ) {
              const 一括 = Firestore.writeBatch(Firebaseの器.db);
              let 件数 = 0;
              if (changed)
                newList.forEach((記録, 番) => {
                  if (記録.lastModified !== 元の記録[番].lastModified) {
                    const 送る中身 = JSON.parse(JSON.stringify(記録));
                    送る中身.lastModified = Firestore.serverTimestamp();
                    一括.set(
                      Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録.id),
                      送る中身,
                      { merge: true }
                    );
                    件数++;
                  }
                });
              if (ごみ箱が変わった)
                ごみ箱の一覧.forEach((記録, 番) => {
                  if (記録.lastModified !== 元のごみ箱[番].lastModified) {
                    const 送る中身 = JSON.parse(JSON.stringify(記録));
                    送る中身.lastModified = Firestore.serverTimestamp();
                    一括.set(
                      Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id),
                      送る中身,
                      { merge: true }
                    );
                    件数++;
                  }
                });
              if (件数 > 0) 一括.commit().catch((誤り) => console.error('Member Linkage Sync Error:', 誤り));
            }
          }
          状態().activeGroupId &&
            (部員を送る予約[部員ID] && clearTimeout(部員を送る予約[部員ID]),
            (部員を送る予約[部員ID] = setTimeout(async () => {
              const 部員 = 状態().members.find((部員1人) => 部員1人.id === 部員ID);
              if (部員) {
                // 送った版の更新日時。送信中にもう一度編集された場合、その
                // 新しい内容に「同期済み」を付けないための目印。
                const 送った版 = 部員.lastModified;
                const 送る中身 = Object.assign({}, 部員, {
                  lastModified: Firestore.serverTimestamp(),
                  syncStatus: '同期済み',
                });
                Firestore.updateDoc(
                  Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 部員ID),
                  送る中身
                )
                  .then(() => {
                    console.log(`[Store] Debounced Member Sync Success: ${部員.name}`);
                    書く((前) => ({
                      members: 前.members.map((部員1人) =>
                        部員1人 && 部員1人.id === 部員ID && 部員1人.lastModified === 送った版
                          ? Object.assign({}, 部員1人, { syncStatus: '同期済み' })
                          : 部員1人
                      ),
                    }));
                    delete 部員を送る予約[部員ID];
                  })
                  .catch((誤り) => {
                    console.error('Update Member Sync Error:', 誤り);
                    delete 部員を送る予約[部員ID];
                  });
              }
            }, 300)));
        },
        deleteMember: (部員ID) => {
          if (!状態().activeGroupId || 'group' !== 状態().activeRole)
            return void Alert.alert('権限エラー', 'メンバーの削除は団体ログイン時のみ可能です。');
          // 消したことを控えに残す。送信が失われても、次の受け取りで
          // 復活させないため。クラウドから消えたのを確かめてから控えを外す
          const 控え = Object.assign({}, 状態().deletedMembers);
          控え[部員ID] = Date.now();
          書く({
            members: 状態().members.filter((部員) => 部員.id !== 部員ID),
            deletedMembers: 控え,
            lastLocalChange: Date.now(),
          });
          Firestore.deleteDoc(
            Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 部員ID)
          )
            .then(() => 状態().syncMemberLookup())
            .catch((誤り) => console.error('Delete Member Sync Error:', 誤り));
        },
        syncMemberLookup: async () => {
          const { activeGroupId: 団体, activeRole, members } = 状態();
          if (!団体 || 'group' !== activeRole || !Firebaseの器.db) return;
          try {
            const col = Firestore.collection(Firebaseの器.db, `groups/${団体}/member_lookup`);
            const snap = await Firestore.getDocs(col);
            const want = new Map();
            (members || []).forEach((部員) => {
              if (部員 && 部員.id && /^\d{4}$/.test(部員.personalId || ''))
                want.set(部員.personalId, 部員.id);
            });
            const batch = Firestore.writeBatch(Firebaseの器.db);
            let 件数 = 0;
            snap.forEach((文書) => {
              const 欲しい部員ID = want.get(文書.id);
              if (!欲しい部員ID) {
                batch.delete(文書.ref);
                件数++;
              } else if (文書.data().memberId === 欲しい部員ID) {
                want.delete(文書.id);
              }
            });
            want.forEach((memberId, pid) => {
              batch.set(Firestore.doc(Firebaseの器.db, `groups/${団体}/member_lookup`, pid), {
                memberId,
                updatedAt: Date.now(),
              });
              件数++;
            });
            if (件数 > 0) {
              await batch.commit();
              console.log('[Store] member_lookup synced:', 件数);
            }
          } catch (誤り) {
            console.error('[Store] syncMemberLookup error:', 誤り);
          }
        },
        ensurePersonalIds: async () => {
          const { members: 部員たち, alumni, activeGroupId: 団体 } = 状態();
          // 名簿を書けるのは団体アカウントだけ。部員の端末で走ると、他人の
          // 個人IDを勝手に振ってしまう。しかも逆引き表（こちらは団体限定）は
          // 更新されないため、その人がログインできなくなる。
          if (!団体 || 'group' !== 状態().activeRole) return;
          const _ensureDb = await waitForDb();
          if (!_ensureDb) {
            console.warn('[Store] ensurePersonalIds: db still undefined after await, aborting');
            return;
          }
          const 部員の写し = [...部員たち];
          const 卒業生の写し = [...alumni];
          let 変わった = false;
          const 使われている個人ID = () =>
            [
              ...部員の写し.map((部員) => 部員.personalId),
              ...卒業生の写し.map((卒業生) => 卒業生.personalId),
            ].filter((個人ID) => !!個人ID);
          const 形が正しい = (id) => !!id && /^\d{4}$/.test(id);
          const 空いている番号を作る = (使われている) => {
            let 候補 = '';
            let 回数 = 0;
            do {
              候補 = Math.floor(1e3 + 9e3 * Math.random()).toString();
              回数++;
            } while (使われている.includes(候補) && 回数 < 5e3);
            return 候補;
          };
          const 一括 = Firestore.writeBatch(Firebaseの器.db);
          let 件数 = 0;
          for (let 番 = 0; 番 < 部員の写し.length; 番++)
            if (!形が正しい(部員の写し[番].personalId)) {
              const 使われている = 使われている個人ID();
              const 今 = Date.now();
              // 送信が済むまでは「未同期」にしておく。送信が失われた場合、
              // 「同期済み」だと送り直しの対象にならず、クラウドにIDが無いまま
              // 固定される。すると別の端末が別のIDを振り、端末ごとに食い違う。
              部員の写し[番] = Object.assign({}, 部員の写し[番], {
                personalId: 空いている番号を作る(使われている),
                lastModified: 今,
                syncStatus: '未同期',
              });
              一括.set(
                Firestore.doc(Firebaseの器.db, `groups/${団体}/members`, 部員の写し[番].id),
                Object.assign({}, 部員の写し[番], {
                  syncStatus: '同期済み',
                  lastModified: Firestore.serverTimestamp(),
                })
              );
              件数++;
              変わった = true;
            }
          for (let 番 = 0; 番 < 卒業生の写し.length; 番++)
            if (!形が正しい(卒業生の写し[番].personalId)) {
              const 使われている = 使われている個人ID();
              const 今 = Date.now();
              // メンバーと同じ理由で「未同期」にする
              卒業生の写し[番] = Object.assign({}, 卒業生の写し[番], {
                personalId: 空いている番号を作る(使われている),
                lastModified: 今,
                syncStatus: '未同期',
              });
              一括.set(
                Firestore.doc(Firebaseの器.db, `groups/${団体}/alumni`, 卒業生の写し[番].id),
                Object.assign({}, 卒業生の写し[番], {
                  syncStatus: '同期済み',
                  lastModified: Firestore.serverTimestamp(),
                })
              );
              件数++;
              変わった = true;
            }
          if (変わった) {
            書く({ members: 部員の写し, alumni: 卒業生の写し, lastLocalChange: Date.now() });
            if (件数 > 0) {
              // 完了は待たない。通信できないと終わらず、この先の逆引き表の
              // 更新まで止まってしまう。届いた分は syncSessions が印を
              // 付け替え、届かなければ送り直す。
              const 送った版 = new Map(
                [...部員の写し, ...卒業生の写し]
                  .filter((人) => 人 && 人.id)
                  .map((人) => [人.id, 人.lastModified])
              );
              一括.commit()
                .then(() => {
                  書く((前) => ({
                    members: 前.members.map((部員) =>
                      部員 && 送った版.has(部員.id) && 部員.lastModified === 送った版.get(部員.id)
                        ? Object.assign({}, 部員, { syncStatus: '同期済み' })
                        : 部員
                    ),
                    alumni: 前.alumni.map((卒業生) =>
                      卒業生 && 送った版.has(卒業生.id) && 卒業生.lastModified === 送った版.get(卒業生.id)
                        ? Object.assign({}, 卒業生, { syncStatus: '同期済み' })
                        : 卒業生
                    ),
                  }));
                })
                .catch((誤り) => console.error('[Store] 個人IDの送信に失敗:', 誤り));
            }
            console.log(`Ensured personal IDs: Updated ${件数} non-compliant IDs.`);
          }
          await 状態().syncMemberLookup();
        },
        // 弓具の履歴を足す。
        //
        // ここが無いまま MemberScreen が addEquipment を取り出していたため、
        // 「履歴を追加」を押しても何も起きなかった（消すほうだけ在った）。
        // 消すほうと同じ形にそろえてある：手元を先に直し、送れたら印を下ろす。
        addEquipment: (memberId, 中身) => {
          if (!状態().弓具を触れるか(memberId)) return;
          const 今 = Date.now();
          const 新しい記録 = {
            id: generateUUID(),
            date: Number(中身?.date) || 今,
            note: (中身?.note || '').trim(),
            weight: (中身?.weight || '').trim(),
          };
          const 直した = 状態().members.map((部員) => {
            if (部員.id !== memberId) return 部員;
            // 新しいものが上に来るように、日付の降順で並べておく。
            // 画面側もそう並べて見せている
            const 並び = [...(部員.equipments || []), 新しい記録].sort((a, b) => b.date - a.date);
            return Object.assign({}, 部員, { equipments: 並び, lastModified: 今, syncStatus: '未同期' });
          });
          書く({ members: 直した, lastLocalChange: 今 });
          const 本人 = 直した.find((部員) => 部員.id === memberId);
          if (本人 && 状態().activeGroupId) {
            const 送る形 = Object.assign({}, 本人, {
              lastModified: Firestore.serverTimestamp(),
              syncStatus: '同期済み',
            });
            Firestore.updateDoc(
              Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, memberId),
              送る形
            )
              .then(() => {
                // 印を付けるのは送った版だけ（消すほうと同じ考え方）
                書く((前) => ({
                  members: 前.members.map((部員) =>
                    部員 && 部員.id === memberId && 部員.lastModified === 本人.lastModified
                      ? Object.assign({}, 部員, { syncStatus: '同期済み' })
                      : 部員
                  ),
                }));
              })
              .catch((err) => console.error('Add Equipment Sync Error:', err));
          }
        },
        deleteEquipment: (memberId, 記録ID) => {
          if (!状態().弓具を触れるか(memberId)) return;
          const 今 = Date.now();
          const 直した = 状態().members.map((部員) => {
            if (部員.id === memberId) {
              const 今の弓具 = 部員.equipments || [];
              return Object.assign({}, 部員, {
                equipments: 今の弓具.filter((記録) => 記録.id !== 記録ID),
                lastModified: 今,
                syncStatus: '未同期',
              });
            }
            return 部員;
          });
          書く({ members: 直した, lastLocalChange: 今 });
          const 本人 = 直した.find((部員) => 部員.id === memberId);
          if (本人 && 状態().activeGroupId) {
            const 送る形 = Object.assign({}, 本人, {
              lastModified: Firestore.serverTimestamp(),
              syncStatus: '同期済み',
            });
            Firestore.updateDoc(
              Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, memberId),
              送る形
            )
              .then(() => {
                // 印を付けるのは送った版だけ（記録側と同じ考え方）
                書く((前) => ({
                  members: 前.members.map((部員) =>
                    部員 && 部員.id === memberId && 部員.lastModified === 本人.lastModified
                      ? Object.assign({}, 部員, { syncStatus: '同期済み' })
                      : 部員
                  ),
                }));
              })
              .catch((誤り) => console.error('Delete Equipment Sync Error:', 誤り));
          }
        },
        saveSession: async (題, 覚え書き, 統計に入れる, タグ, attendanceData) => {
          行動を控える('記録を保存', (状態().archers || []).length + '人');
          // 閲覧用は記録として残さない。画面側でも保存の帯を薄くしてあるが、
          // 道が増えたときに漏れないよう、ここでも止める
          if (状態().書き換えを止めるか()) return;
          // よその団体のライブも、自分の記録には残さない（保存を止めるか を参照）
          if (状態().保存を止めるか()) return;
          const 記録ID = 状態().activeSessionID || generateUUID();
          const { archers, shotsPerRound, activeGroupId, activeRole, myMemberId } = 状態();
          const 射手たち = Array.isArray(archers) ? archers : [];
          const 記録 = {
            id: 記録ID,
            date: Date.now(),
            title: 題,
            note: 覚え書き,
            archers: JSON.parse(JSON.stringify(射手たち)),
            archerNames: Array.from(
              new Set(射手たち.map((射手) => (射手 && 射手.name ? 射手.name.trim() : '')).filter(Boolean))
            ),
            shotCount: shotsPerRound || 8,
            includeInStats: 統計に入れる,
            tags: タグ,
            attendance: attendanceData,
            syncStatus: '未同期',
            lastModified: Date.now(),
          };
          // 個人モードでの上書きは、手元に確定する前に止める
          if (activeGroupId && 'member' === activeRole)
            try {
              if (
                (
                  await Firestore.getDoc(
                    Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/sessions`, 記録ID)
                  )
                ).exists()
              ) {
                const 文 = 'この記録はすでにクラウドに存在するため、個人モードからは更新できません。';
                return void Alert.alert('保存制限', 文);
              }
            } catch (誤り) {
              console.warn('[Store] 既存確認に失敗しました。保存は続行します:', 誤り);
            }
          // まず手元に確定する。クラウドの応答は待たない。
          // 待つと、通信できないときに射手が消えず履歴にも出ないうえ、
          // 画面には何も知らされないままになる。
          const 元のライブ名 = 状態().liveSessionName;
          状態().stopLiveSync(true);
          書く((前) => ({
            sessions: [記録, ...前.sessions.filter((記録1件) => 記録1件.id !== 記録ID)],
            activeSessionID: null,
            archers: [],
            isLiveActive: false,
            ライブの続き: null,
            isHost: false,
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
          })); // ライブ記録の後始末。届かなくても保存には影響させない
          const 枝 = ライブの枝();
          // 共有していたライブは、団体の枝の道しるべと閲覧用の写しも残る。
          // 消さないと、参加一覧に入れないライブが並び、写しも読めたままになる
          const 団 = 団体の枝();
          const 閲覧枝 = 状態().いまのライブの閲覧枝;
          if (元のライブ名 && Firebaseの器.rtdb && 枝) {
            const ライブの節点 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${元のライブ名}`);
            RTDB.update(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${元のライブ名}/state`), {
              status: 'finished',
              timestamp: RTDB.serverTimestamp(),
            }).catch(() => {});
            if (秘.枝として使えるか(閲覧枝))
              RTDB.update(RTDB.ref(Firebaseの器.rtdb, 写しの場所(閲覧枝, 元のライブ名)), {
                status: 'finished',
                timestamp: RTDB.serverTimestamp(),
              }).catch(() => {});
            setTimeout(async () => {
              const 落とす = (道) => RTDB.remove(RTDB.ref(Firebaseの器.rtdb, 道)).catch(() => {});
              await Promise.all([
                RTDB.remove(ライブの節点).catch(() => {}),
                // 共有履歴と在席は別の枝にあるので、明示的に消す
                落とす(共有履歴の場所(枝, 元のライブ名)),
                落とす(在席の場所(枝, 元のライブ名)),
                // 共有していたときの道しるべと写しも消す
                団 && 団 !== 枝 ? 落とす(`live_sessions/${団}/${元のライブ名}`) : null,
                秘.枝として使えるか(閲覧枝) ? 落とす(`live_view/${閲覧枝}/${元のライブ名}`) : null,
              ]);
              // 期限は最後。中身が残っているうちは決まりが消させない
              // （消せると、期限を外してリンクをよみがえらせられてしまう）。
              // 団体の枝には期限が無いので、共有していたときだけ
              if (団 && 団 !== 枝) {
                await 落とす(期限の場所(枝));
                if (秘.枝として使えるか(閲覧枝)) await 落とす(期限の場所(閲覧枝));
              }
            }, 2e3);
          }
          // クラウドへ送る。ここも待たない。
          // 届くまでは「未同期」のままにしておく。そうすれば syncSessions の
          // 再送で拾われ、通信が戻ったときに自動で送られる。
          if (activeGroupId) {
            const 送る形 = JSON.parse(JSON.stringify(記録));
            送る形.syncStatus = '同期済み';
            送る形.lastModified = Firestore.serverTimestamp();
            Firestore.setDoc(
              Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/sessions`, 記録ID),
              送る形,
              { merge: true }
            )
              .then(() => {
                // 印を付けるのは送った版だけ。送信中に編集されると更新日時が
                // 変わるので、一致する場合に限る（updateSession と同じ考え方）。
                書く((前) => ({
                  sessions: 前.sessions.map((記録1件) =>
                    記録1件 && 記録1件.id === 記録ID && 記録1件.lastModified === 記録.lastModified
                      ? Object.assign({}, 記録1件, { syncStatus: '同期済み' })
                      : 記録1件
                  ),
                  syncStatus: '同期済み',
                }));
              })
              .catch((誤り) => {
                console.error('Save Session Cloud Error:', 誤り);
                不具合を控える('記録の保存（クラウド）', 誤り);
                書く({ syncStatus: '同期エラー' });
              });
          }
        },
        loadSession: (記録ID) => {
          const 記録 = (Array.isArray(状態().sessions) ? 状態().sessions : []).find(
            (記録1件) => 記録1件 && 記録1件.id === 記録ID
          );
          if (記録)
            書く({
              archers: 記録.archers,
              shotsPerRound: 記録.shotCount,
              activeSessionID: 記録.id,
              historyStack: [],
              redoStack: [],
            });
        },
        /**
         * 履歴の記録を、記録画面に載せて直す（管理者モードの履歴から）。
         *
         * 履歴の詳細で直せるのは ○×・鍵・名前・削除だけで、人や間隔や計を足す、
         * 並べ替える、矢所、射数を変える、はできなかった（使う人：「普通の記録表で
         * できることをすべて」2026-09-17）。記録画面そのものに載せ替えれば道具は
         * 全部そのまま使える。いま記録中の盤面は 控え に取り、終えるときに据え直す。
         * 端末に残す（partialize）ので、途中で閉じても元の盤面は失われない。
         *
         * ライブ中は載せ替えない（盤面がライブと結びついている）。
         * @returns {boolean} 載せ替えたか
         */
        履歴の記録を記録画面で開く: (id) => {
          const 店 = 状態();
          if (店.履歴の編集 || 店.isLiveActive) return false;
          const 記録 = (Array.isArray(店.sessions) ? 店.sessions : []).find(
            (記録1件) => 記録1件 && 記録1件.id === id
          );
          if (!記録) return false;
          行動を控える('履歴の記録を記録画面で開く', id);
          書く({
            履歴の編集: {
              id,
              控え: {
                archers: 店.archers,
                shotsPerRound: 店.shotsPerRound,
                activeSessionID: 店.activeSessionID,
                historyStack: 店.historyStack,
                redoStack: 店.redoStack,
              },
            },
            archers: JSON.parse(JSON.stringify(記録の射手を整える(記録))),
            shotsPerRound: 記録.shotCount || 8,
            // 記録中の id を外す。付けたままだと「終了・保存」やライブがその記録に結びつく
            activeSessionID: null,
            historyStack: [],
            redoStack: [],
          });
          return true;
        },
        /**
         * 記録画面での履歴の直しを終える。保存するなら記録を書き戻し（題・メモ・タグ・日付は
         * そのまま）、どちらでも直す前の盤面を据え直す
         */
        履歴の編集を終える: (保存する) => {
          const 店 = 状態();
          const 編集 = 店.履歴の編集;
          if (!編集) return;
          if (保存する) {
            const 射手たち = JSON.parse(JSON.stringify(Array.isArray(店.archers) ? 店.archers : []));
            店.updateSession(編集.id, {
              archers: 射手たち,
              shotCount: 店.shotsPerRound,
              archerNames: Array.from(
                new Set(射手たち.map((射手) => (射手 && 射手.name ? 射手.name.trim() : '')).filter(Boolean))
              ),
            });
          }
          行動を控える('履歴の編集を終える', 保存する ? '保存' : '取りやめ');
          書く(Object.assign({ 履歴の編集: null }, 編集.控え));
        },
        deleteSession: async (記録ID) => {
          const 元 = Array.isArray(状態().sessions) ? 状態().sessions : [];
          const 消す記録 = 元.find((記録) => 記録 && 記録.id === 記録ID);
          const 残り = 元.filter((記録) => 記録 && 記録.id !== 記録ID);
          // 送信が済むまでは「未同期」にしておく。こうしないと、通信できない
          // ときに削除がクラウドへ届かないまま消し込まれ、次の全件取得で
          // 記録が復活しゴミ箱からも消えてしまう。
          //
          // pendingDelete は「この端末で捨てて、まだ送れていない」という印。
          // クラウドの写しを読み込んだだけの項目と区別するために要る。これが
          // ないと、ゴミ箱を空にした直後に写しを読み込んだ項目まで送り直しの
          // 対象になり、空にしたはずのものが戻ってしまう。
          書く(
            消す記録
              ? {
                  sessions: 残り,
                  trash: [
                    ...状態().trash,
                    Object.assign({}, 消す記録, { syncStatus: '未同期', pendingDelete: true }),
                  ],
                }
              : { sessions: 残り }
          );
          try {
            const 一括 = Firestore.writeBatch(Firebaseの器.db);
            if (
              (一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録ID)),
              消す記録)
            ) {
              const ごみ箱に置く形 = JSON.parse(
                JSON.stringify(Object.assign({}, 消す記録, { syncStatus: 'trashed' }))
              );
              ごみ箱に置く形.lastModified = Firestore.serverTimestamp();
              ごみ箱に置く形.deletedAt = Firestore.serverTimestamp();
              一括.set(
                Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録ID),
                ごみ箱に置く形
              );
            }
            // 完了は待たない。通信できないと終わらないため、呼び出し側が
            // 待つと画面が反応しなくなる。送信は待ち行列に任せる。
            一括.commit().catch((誤り) => console.error('Delete Session Error:', 誤り));
          } catch (誤り) {
            console.error('Delete Session Error:', 誤り);
          }
        },
        emptyTrash: async () => {
          const { trash, activeGroupId: 団体 } = 状態();
          if (!trash || 0 === trash.length) return;
          const 消すID = trash.map((記録) => 記録.id);
          // 通信できるかで送信を止めない。止めると手元からだけ消えて、クラウドの
          // ゴミ箱は残り、次の全件取得で消したはずのものが戻ってきてしまう。
          // 通信できないときは Firestore の待ち行列に入り、つながった時点で送られる。
          // 完全に消したことを控えておく。送信が失われても、次の取得で
          // 戻ってこないようにするため。
          const 控え = Object.assign({}, 状態().permanentlyDeleted);
          消すID.forEach((id) => {
            控え[id] = Date.now();
          });
          if (
            (console.log('[Store] Emptying trash:', 消すID.length, 'items'),
            書く({ trash: [], permanentlyDeleted: 控え }),
            団体)
          )
            try {
              const 一括 = Firestore.writeBatch(Firebaseの器.db);
              消すID.forEach((id) => {
                一括.delete(Firestore.doc(Firebaseの器.db, `groups/${団体}/trash`, id));
              });
              // 完了は待たない（deleteSession と同じ理由）
              一括.commit()
                .then(() => console.log('[Store] Cloud trash emptied'))
                .catch((誤り) => console.error('[Store] Error emptying cloud trash:', 誤り));
            } catch (誤り) {
              console.error('[Store] Error emptying cloud trash:', 誤り);
            }
        },
        deleteTrashItems: async (消すID) => {
          if (消すID && 0 !== 消すID.length)
            try {
              const { trash: ごみ箱, activeGroupId: 団体 } = 状態();
              console.log('[Store] Deleting trash items:', 消すID);
              if (団体) console.log(`[Store] Target Firestore path: groups/${団体}/trash/`);
              const 残り = (ごみ箱 || []).filter((記録) => 記録 && !消すID.includes(記録.id));
              // emptyTrash と同じく、完全に消したことを控えておく
              const 控え = Object.assign({}, 状態().permanentlyDeleted);
              消すID.forEach((id) => {
                id && (控え[id] = Date.now());
              });
              // emptyTrash と同じ理由で、通信できるかでは止めない
              if ((書く({ trash: 残り, permanentlyDeleted: 控え }), 団体)) {
                const 一括 = Firestore.writeBatch(Firebaseの器.db);
                let 件数 = 0;
                消すID.forEach((id) => {
                  id && (一括.delete(Firestore.doc(Firebaseの器.db, `groups/${団体}/trash`, id)), 件数++);
                });
                if (件数 > 0)
                  一括.commit()
                    .then(() => console.log('[Store] Successfully deleted trash items from cloud'))
                    .catch((誤り) => console.error('[Store] Delete trash items error:', 誤り));
              } else console.warn('[Store] Skipping cloud deletion: activeGroupId が無い');
            } catch (誤り) {
              console.error('[Store] Delete trash items error:', 誤り);
            }
          else console.warn('[Store] deleteTrashItems called with no IDs');
        },
        deleteMultipleSessions: async (消すID) => {
          const 消す記録 = 状態().sessions.filter((記録) => 消すID.includes(記録.id));
          const 残り = 状態().sessions.filter((記録) => !消すID.includes(記録.id));
          書く({
            sessions: 残り,
            trash: [
              ...状態().trash,
              ...消す記録.map((記録) =>
                Object.assign({}, 記録, { syncStatus: '未同期', pendingDelete: true })
              ),
            ],
          });
          try {
            const 一括 = Firestore.writeBatch(Firebaseの器.db);
            消すID.forEach((id) =>
              一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, id))
            );
            消す記録.forEach((記録) => {
              const ごみ箱に置く形 = JSON.parse(
                JSON.stringify(Object.assign({}, 記録, { syncStatus: 'trashed' }))
              );
              ごみ箱に置く形.lastModified = Firestore.serverTimestamp();
              ごみ箱に置く形.deletedAt = Firestore.serverTimestamp();
              一括.set(
                Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id),
                ごみ箱に置く形
              );
            });
            一括.commit().catch((誤り) => console.error('Batch Delete Error:', 誤り));
          } catch (誤り) {
            console.error('Batch Delete Error:', 誤り);
          }
        },
        restoreSession: async (記録ID) => {
          const ごみ箱 = Array.isArray(状態().trash) ? 状態().trash : [];
          const 戻す記録 = ごみ箱.find((記録) => 記録 && 記録.id === 記録ID);
          if (!戻す記録) return;
          const 戻した形 = Object.assign({}, 戻す記録, {
            // 送信が済むまでは「未同期」にしておく。こうしないと、通信できない
            // ときに復元がクラウドへ届かないまま同期済み扱いになり、次の全件取得
            // でゴミ箱へ戻ってしまう。
            syncStatus: '未同期',
            // ゴミ箱側の印は記録に持ち込まない
            pendingDelete: undefined,
          });
          const 今の記録 = Array.isArray(状態().sessions) ? 状態().sessions : [];
          // 戻したなら、完全に消した控えからも外す。残っていると画面に出なくなる
          const 控え = Object.assign({}, 状態().permanentlyDeleted);
          delete 控え[記録ID];
          書く({
            trash: ごみ箱.filter((記録) => 記録 && 記録.id !== 記録ID),
            sessions: [戻した形, ...今の記録],
            permanentlyDeleted: 控え,
          });
          try {
            const 一括 = Firestore.writeBatch(Firebaseの器.db);
            一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録ID));
            const 送る形 = JSON.parse(JSON.stringify(戻した形));
            送る形.lastModified = Firestore.serverTimestamp();
            一括.set(
              Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録ID),
              送る形
            );
            一括.commit().catch((誤り) => console.error('Restore Session Error:', 誤り));
          } catch (誤り) {
            console.error('Restore Session Error:', 誤り);
          }
        },
        restoreTrashItems: async (戻すID) => {
          if (!戻すID || 0 === 戻すID.length) return;
          const ごみ箱 = 状態().trash || [];
          const 戻す記録 = ごみ箱.filter((記録) => 戻すID.includes(記録.id));
          const 残り = ごみ箱.filter((記録) => !戻すID.includes(記録.id));
          const 戻した形 = 戻す記録.map((記録) =>
            Object.assign({}, 記録, {
              syncStatus: '未同期',
              // ゴミ箱側の印は記録に持ち込まない
              pendingDelete: undefined,
            })
          );
          // restoreSession と同じく、完全に消した控えから外す
          const 控え = Object.assign({}, 状態().permanentlyDeleted);
          戻すID.forEach((id) => delete 控え[id]);
          書く({ trash: 残り, sessions: [...戻した形, ...状態().sessions], permanentlyDeleted: 控え });
          try {
            const 一括 = Firestore.writeBatch(Firebaseの器.db);
            戻すID.forEach((id) =>
              一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, id))
            );
            戻した形.forEach((記録) => {
              const 送る形 = JSON.parse(JSON.stringify(記録));
              送る形.lastModified = Firestore.serverTimestamp();
              一括.set(
                Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録.id),
                送る形
              );
            });
            一括.commit().catch((誤り) => console.error('Restore Trash Items Error:', 誤り));
          } catch (誤り) {
            console.error('Restore Trash Items Error:', 誤り);
          }
        },
        updateState: (変更) => {
          書く(変更);
        },
        updateSession: async (記録ID, 変更) => {
          const 今の記録 = 状態().sessions || [];
          const 位置 = 今の記録.findIndex((記録) => 記録 && 記録.id === 記録ID);
          if (-1 === 位置) return;
          const 元の記録 = 今の記録[位置];
          if ('member' === 状態().activeRole && 変更.archers && 変更.archers.length < 元の記録.archers.length)
            return void console.warn('[updateSession] Prevented accidental data stripping in member mode');
          // 送信が済むまでは「未同期」にしておく。こうしないと、通信できない
          // ときに編集がクラウドへ届かないまま同期済み扱いになり、他の記録が
          // 更新された拍子にクラウドの古い写しで上書きされて編集が消える。
          const 直した記録 = Object.assign({}, 今の記録[位置], 変更, {
            lastModified: Date.now(),
            syncStatus: '未同期',
          });
          const 直した一覧 = [...今の記録];
          直した一覧[位置] = 直した記録;
          書く({ sessions: 直した一覧 });
          const 団体 = 状態().activeGroupId;
          if (!団体) return;
          if (状態()._pendingUpdateTimers[記録ID]) clearTimeout(状態()._pendingUpdateTimers[記録ID]);
          const 予約 = setTimeout(() => {
            // タイマーの控えは先に片付ける。通信できないと送信は終わらないので、
            // 送信の完了を待って片付けると残り続けてしまう。
            書く((前) => {
              const 予約の表 = Object.assign({}, 前._pendingUpdateTimers);
              return (delete 予約の表[記録ID], { _pendingUpdateTimers: 予約の表 });
            });
            const 記録 = 状態().sessions.find((記録1件) => 記録1件 && 記録1件.id === 記録ID);
            if (!記録) return;
            // 送った版の更新日時を控える。送信中にもう一度編集されると
            // 更新日時が変わるので、戻ってきたときに一致する場合だけ印を付ける。
            // これをしないと、まだ届いていない新しい内容が「同期済み」に見え、
            // 次の突き合わせでクラウドの古い写しに負けて編集が消える。
            //
            // 「同じ物を指しているか」では駄目。リスナーが中身はそのままに
            // 記録を作り直すことがあり、変わっていなくても別物になる。
            const 送った版 = 記録.lastModified;
            const 送る形 = JSON.parse(JSON.stringify(記録));
            // 送信の完了は待たない。通信できないときは Firestore の待ち行列に
            // 入り、つながった時点で送られる。
            送る形.lastModified = Firestore.serverTimestamp();
            Firestore.updateDoc(Firestore.doc(Firebaseの器.db, `groups/${団体}/sessions`, 記録ID), 送る形)
              .then(() => {
                console.log(`[Store] Debounced sync finished for ${記録ID}`);
                書く((前) => ({
                  sessions: 前.sessions.map((記録1件) =>
                    記録1件 && 記録1件.id === 記録ID && 記録1件.lastModified === 送った版
                      ? Object.assign({}, 記録1件, { syncStatus: '同期済み' })
                      : 記録1件
                  ),
                }));
              })
              .catch((誤り) => {
                console.error('Update Session Sync Error:', 誤り);
              });
          }, 800);
          書く((前) => ({
            _pendingUpdateTimers: Object.assign({}, 前._pendingUpdateTimers, { [記録ID]: 予約 }),
          }));
        },
        setSubstitution: (射手ID, 番, 名前, 部員ID) => {
          if (状態().書き換えを止めるか()) return;
          // 交代も一手として積む。積まないと、○×の取り消しを続けたときに
          // 交代を入れる前の控えまで戻り、交代ごと巻き添えで消えていた。
          // 射数の変更（setShotsPerRound）と同じ考え方
          const 変える前 = Array.isArray(状態().archers) ? 状態().archers : [];
          const 交代の中身 = (一覧) => {
            const 射手 = (一覧 || []).find((射手1人) => 射手1人 && 射手1人.id === 射手ID);
            if (!射手) return '';
            return JSON.stringify([射手.substitutions || {}, 射手.substitutionIds || {}]);
          };
          const 前の交代 = 交代の中身(変える前);
          const 直した = 変える前.map((射手) => {
            if (射手 && 射手.id === 射手ID) {
              const 交代 = Object.assign({}, 射手.substitutions || {});
              if ('' !== 名前) {
                交代[番] = 名前;
                const 交代の部員 = Object.assign({}, 射手.substitutionIds || {});
                return (
                  部員ID ? (交代の部員[番] = 部員ID) : delete 交代の部員[番],
                  Object.assign({}, 射手, {
                    substitutions: 交代,
                    substitutionIds: 交代の部員,
                    lastModified: Date.now(),
                  })
                );
              }
              if ((delete 交代[番], 射手.substitutionIds)) {
                const 交代の部員 = Object.assign({}, 射手.substitutionIds);
                return (
                  delete 交代の部員[番],
                  Object.assign({}, 射手, {
                    substitutions: 交代,
                    substitutionIds: 交代の部員,
                    lastModified: Date.now(),
                  })
                );
              }
              return Object.assign({}, 射手, { substitutions: 交代, lastModified: Date.now() });
            }
            return 射手;
          });
          // 同じ内容を選び直したときは積まない。押しても何も起きない
          // 一手が挟まり、取り消しが空振りして見える
          const 交代が変わる = 交代の中身(直した) !== 前の交代;
          書く(
            Object.assign(
              { archers: 直した, lastLocalChange: Date.now() },
              交代が変わる ? { historyStack: [...状態().historyStack, 変える前], redoStack: [] } : null
            )
          );
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
        },
        setShotsPerRound: (本数) => {
          if (状態().書き換えを止めるか()) return;
          // 射数を減らすと○×を切り捨てる。取り消しで戻せるよう、変える前の
          // 盤面を一手として積む。控えの○×の長さがそのときの射数になるので、
          // 取り消し側はそれを見て射数ごと戻す
          const 変える前 = Array.isArray(状態().archers) ? 状態().archers : [];
          const 射数が変わる = 本数 !== 状態().shotsPerRound;
          const 直した = (Array.isArray(状態().archers) ? 状態().archers : []).map((射手) => {
            if (!射手 || 射手.isSeparator) return 射手;
            const 今の印 = Array.isArray(射手.marks) ? 射手.marks : [];
            const 新しい印 = [...今の印];
            return (
              本数 > 今の印.length
                ? 新しい印.push(...Array(本数 - 今の印.length).fill(''))
                : 新しい印.splice(本数),
              Object.assign({}, 射手, { marks: 新しい印, lastModified: Date.now() })
            );
          });
          書く(
            Object.assign(
              { shotsPerRound: 本数, archers: 直した, lastLocalChange: Date.now() },
              // 同じ射数を選び直したときは積まない。押しても何も起きない
              // 一手が挟まり、取り消しが空振りして見える
              射数が変わる ? { historyStack: [...状態().historyStack, 変える前], redoStack: [] } : null
            )
          );
          const { isLiveActive, liveSessionName } = 状態();
          if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, 本数);
        },
        loadData: () => {
          状態().checkOfflineSave();
          状態().syncSessions();
        },
        // オフライン保存が効いているかを確かめ、効いていなければ画面に出す文言を持たせる。
        // 効いていない状態で電波の無い場所で保存すると、画面を閉じた時点で
        // 送信待ちごと記録が失われるため、黙って進ませない。
        checkOfflineSave: async () => {
          try {
            await waitForDb();
            const 控えの様子 = require('./db').persistence || {};
            if ('ok' === 控えの様子.state || 'pending' === 控えの様子.state)
              return void (状態().offlineSaveWarning && 書く({ offlineSaveWarning: null }));
            const 文 =
              'multipleTabs' === 控えの様子.state
                ? 'この記録画面が複数のタブで開かれているため、電波のない場所での保存が保護されません。他のタブを閉じて開き直してください。'
                : 'このブラウザでは電波のない場所での保存が保護されません。通信できる場所で保存してください。';
            console.warn('[Store] オフライン保存が無効です:', 控えの様子);
            書く({ offlineSaveWarning: 文 });
          } catch (誤り) {
            console.warn('[Store] オフライン保存の確認に失敗:', 誤り);
          }
        },
        clearAllData: () =>
          書く({
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
          const { activeGroupId: 団体 } = 状態();
          if (!Firebaseの器.db || !団体) return null;
          const 控え = 状態().ライブの合言葉;
          if (控え && 控え.団体 === 団体 && 秘.枝として使えるか(控え.合言葉)) return 控え.合言葉;
          // 取り寄せは1本にまとめる。3か所から呼ぶので、
          // まとめないと同じ団体に別々の合言葉を書き合ってしまう。
          // まとめてよいのは同じ団体のときだけ。団体を移った直後に前の団体ぶんを
          // 使い回すと、移った先の練習を前の団体の枝へ流してしまう
          if (合言葉の取り寄せ && 合言葉の取り寄せ.団体 === 団体) return 合言葉の取り寄せ.約束;
          const 場所 = Firestore.doc(Firebaseの器.db, `groups/${団体}`);
          const 一度 = async () => {
            const 今 = await Firestore.getDoc(場所);
            const 有 = (今.data() || {}).liveSecret;
            if (秘.枝として使えるか(有)) return 有;
            await Firestore.setDoc(場所, { liveSecret: 秘.合言葉を作る() }, { merge: true });
            // 読み直す。同時に作られていたら、相手のほうが載っている
            const 後 = await Firestore.getDoc(場所);
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
                  if (状態().activeGroupId !== 団体) return null;
                  書く({ ライブの合言葉: { 団体, 合言葉: 決 } });
                  return 決;
                }
              } catch (誤り) {
                console.warn('[Store] ライブの合言葉を用意できませんでした', 誤り);
              }
              if (状態().activeGroupId !== 団体) return null; // 団体が変わったら追わない
              await new Promise((解く) => setTimeout(解く, 待ち));
              待ち = Math.min(待ち * 2, 8000);
            }
            return null;
          })();
          合言葉の取り寄せ = { 団体, 約束 };
          // 片付けるのは自分が置いたものだけ。団体を移って別の取り寄せが
          // 始まっていたら、そちらを消してしまわない
          約束.finally(() => {
            if (合言葉の取り寄せ && 合言葉の取り寄せ.約束 === 約束) 合言葉の取り寄せ = null;
          });
          return 約束;
        },
        同意を確かめる: async () => {
          const { activeGroupId: 団体, activeRole: 役, publicGroupId: 公開ID } = 状態();
          if ('group' !== 役) return;
          const id = (公開ID || 団体 || '').toUpperCase();
          if (!id) return;
          try {
            // 帳面そのものが無い団体には、何も作らない。
            // 作ると、存在しない団体の同意記録が生まれる
            const 帳面 = await Firestore.getDoc(Firestore.doc(Firebaseの器.db, 'group_accounts', id));
            if (!帳面.exists()) return;
            // 同意の記録は private に置く。誰でも読める場所に置くと、
            // 団体IDを知る者に「いつ・どうやって同意を得たか」まで見える
            const 場所 = Firestore.doc(Firebaseの器.db, 'group_accounts', id, 'private', 'consent');
            const 中身 = await Firestore.getDoc(場所);
            const 法 = require('./legalDocs');
            // 記録が無いのが、画面を入れる前からの団体。静かに補う
            const 版 = 中身.exists() ? (中身.data() || {}).同意の版 : undefined;
            if (!版) {
              await Firestore.setDoc(場所, 法.口頭での同意の記録(), { merge: true });
              return;
            }
            // 口頭で同意を得ている移りは、画面で求め直さず記録だけ進める。
            // どの移りが済んでいるかは legalDocs.js の 口頭で済んでいる移り に書く
            if (法.口頭で済んでいるか(版)) {
              await Firestore.setDoc(
                場所,
                法.口頭での同意の記録(`口頭（${法.同意の版} 版の内容を説明のうえ同意。前の記録は ${版}）`),
                { merge: true }
              );
              return;
            }
            if (法.同意を取り直すか(版)) 書く({ 同意の確認が要る: true });
          } catch (誤り) {
            // 確かめられなくても、使えなくする話ではない。次に入ったときにまた試す
            console.warn('[Store] 同意の確認に失敗:', 誤り);
          }
        },
        // 同意してもらえた。記録して印を下ろす
        同意を記録する: async () => {
          const { activeGroupId: 団体, activeRole: 役, publicGroupId: 公開ID } = 状態();
          書く({ 同意の確認が要る: false });
          if ('group' !== 役) return;
          const id = (公開ID || 団体 || '').toUpperCase();
          if (!id) return;
          try {
            const 場所 = Firestore.doc(Firebaseの器.db, 'group_accounts', id, 'private', 'consent');
            await Firestore.setDoc(場所, require('./legalDocs').同意の記録(), { merge: true });
          } catch (誤り) {
            // 書けなかったときは印を立て直す。次の起動でまた聞く
            console.warn('[Store] 同意の記録に失敗:', 誤り);
            書く({ 同意の確認が要る: true });
          }
        },
        // あとにする。記録は残さないので、次の起動でまた出る
        同意をあとにする: () => 書く({ 同意の確認が要る: false }),
        verifyGroupPassword: async (合言葉) => {
          const { activeUserEmail, activeGroupId, publicGroupId } = 状態();
          let 宛先 = activeUserEmail || Firebaseの器.auth.currentUser?.email;
          if (!宛先 && (activeGroupId || publicGroupId)) {
            console.log('[Store] Fetching group email for password verification...');
            const 団体ID = publicGroupId || activeGroupId;
            try {
              const 帳面の場所 = Firestore.doc(Firebaseの器.db, 'group_accounts', 団体ID.toUpperCase());
              const 帳面 = await Firestore.getDoc(帳面の場所);
              帳面.exists() && (宛先 = 帳面.data().email);
            } catch (誤り) {
              console.error('[Store] Failed to fetch group email:', 誤り);
            }
          }
          if (!宛先) return (console.warn('[Store] verifyGroupPassword: No email found to verify.'), false);
          try {
            return (await FirebaseAuth.signInWithEmailAndPassword(Firebaseの器.auth, 宛先, 合言葉), true);
          } catch (誤り) {
            return (console.error('[Store] verifyGroupPassword error:', 誤り), false);
          }
        },
        setAdminMode: (値) => 書く({ isAdminMode: 値, isAdminModePending: false }),
        /**
         * 団体アカウントを消す（設定 → アカウント → アカウントを削除する）。
         * 団体アカウントで入っていて、管理者モードで、ライブ中でないときだけ。
         * 中身は src/accountDeletion.js。返り値は { ok, 訳 }。ok なら呼ぶ側で
         * setAuth(null) して入口へ戻す
         */
        deleteGroupAccount: async (合言葉, 進み) => {
          const {
            activeGroupId: 団体ID,
            activeRole: 役,
            isAdminMode: 管理者,
            isLiveActive: ライブ中,
            activeUserEmail: 控えの宛先,
          } = 状態();
          if ('group' !== 役 || !団体ID)
            return { ok: false, 訳: '団体アカウントで入っているときだけ消せます' };
          if (!管理者) return { ok: false, 訳: '管理者モードをオンにしてください' };
          if (ライブ中) return { ok: false, 訳: 'ライブ記録中は消せません。先にライブを止めてください' };
          if (!合言葉) return { ok: false, 訳: 'パスワードを入れてください' };
          let 宛先 = 控えの宛先 || Firebaseの器.auth.currentUser?.email;
          if (!宛先) {
            try {
              const 帳面 = await Firestore.getDoc(Firestore.doc(Firebaseの器.db, 'group_accounts', 団体ID));
              帳面.exists() && (宛先 = 帳面.data().email);
            } catch (誤り) {
              console.error('[Store] deleteGroupAccount: email lookup failed', 誤り);
            }
          }
          if (!宛先) return { ok: false, 訳: 'メールアドレスが分かりません' };
          try {
            状態().stopPeriodicSync();
            状態().stopListeningToSessions();
            状態().stopListeningToMembers();
            状態().stopListeningToAlumni();
            状態().stopListeningToTrash();
            const 結果 = await 消去.団体を消す(
              { db: Firebaseの器.db, a: Firestore, auth: Firebaseの器.auth, o: FirebaseAuth },
              { 団体ID, email: 宛先, 合言葉, 進み }
            );
            return { ok: true, 件数: 結果.件数 };
          } catch (誤り) {
            console.error('[Store] deleteGroupAccount failed:', 誤り);
            const 符号 = String((誤り && 誤り.code) || '');
            const 訳 = /wrong-password|invalid-credential|invalid-login/.test(符号)
              ? 'パスワードが正しくありません'
              : /permission-denied/.test(符号)
                ? '削除の権限がありません（決まりが古いままかもしれません）'
                : /network/.test(符号)
                  ? '通信エラーが発生しました。電波の良い場所でもう一度お試しください'
                  : '削除に失敗しました: ' + String((誤り && 誤り.message) || 誤り);
            return { ok: false, 訳 };
          }
        },
        updateGroupName: async (名前) => {
          const { activeGroupId } = 状態();
          if (activeGroupId) {
            書く({ activeGroupName: 名前 });
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, 'groups', activeGroupId),
                { groupName: 名前 },
                { merge: true }
              );
            } catch (誤り) {
              console.error('[Store] updateGroupName error:', 誤り);
            }
          }
        },
        setAutoPromotionEnabled: async (入れる) => {
          const { activeGroupId } = 状態();
          if (activeGroupId) {
            書く({ autoPromotionEnabled: 入れる });
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                { autoPromotionEnabled: 入れる },
                { merge: true }
              );
            } catch (誤り) {
              console.error('[Store] setAutoPromotionEnabled error:', 誤り);
            }
          }
        },
        setIsAdminModePending: (値) => 書く({ isAdminModePending: 値 }),
        setHistoryViewMode: (値) => 書く({ historyViewMode: 値 }),
        setSelectedHistorySessionId: (値) => 書く({ selectedHistorySessionId: 値 }),
        setViewScale: (値) => 書く({ viewScale: Math.max(0.5, Math.min(2, 値)) }),
        setIsLiveActive: (入れる) => {
          if ((書く({ isLiveActive: 入れる }), 入れる)) {
            const 記録ID = 状態().activeSessionID || 'live-current';
            const 名前 = 状態().liveSessionName || 記録ID;
            const 射手たち = 状態().archers || [];
            const 枝 = ライブの枝();
            if (Firebaseの器.rtdb && 枝)
              RTDB.set(
                RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`),
                JSON.parse(
                  JSON.stringify({
                    archers: Array.isArray(射手たち) ? 射手たち : [],
                    shotsPerRound: 状態().shotsPerRound,
                    timestamp: Date.now(),
                  })
                )
              ).catch((誤り) => console.error('Live Sync Error:', 誤り));
          }
        },
        checkAndAutoIncrementGrades: async () => {
          const { activeGroupId: 団体 } = 状態();
          if (!団体) return;
          const 今日 = new Date();
          const 年 = 今日.getFullYear();
          const 月 = 今日.getMonth() + 1;
          const 日 = 今日.getDate();
          const 四月を過ぎた = 月 > 4 || (4 === 月 && 日 >= 1);
          let hasPromotionRecord = false;
          try {
            console.log('[AutoPromotion] Fetching latest app_settings...');
            const 設定の帳面 = await Firestore.getDoc(
              Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings')
            );
            if (設定の帳面.exists()) {
              const 設定 = 設定の帳面.data();
              const 取り込む = {};
              'number' == typeof 設定.currentFreshmanTerm &&
                (取り込む.currentFreshmanTerm = 設定.currentFreshmanTerm);
              Array.isArray(設定.tagTemplates) && (取り込む.tagTemplates = 設定.tagTemplates);
              'number' == typeof 設定.lastPromotionYear &&
                ((hasPromotionRecord = true), (取り込む.lastPromotionYear = 設定.lastPromotionYear));
              'boolean' == typeof 設定.autoPromotionEnabled &&
                (取り込む.autoPromotionEnabled = 設定.autoPromotionEnabled);
              書く(取り込む);
            }
          } catch (誤り) {
            return void console.error('[AutoPromotion] Failed to fetch config:', 誤り);
          }
          if (!hasPromotionRecord) {
            const base = 四月を過ぎた ? 年 : 年 - 1;
            console.log(`[AutoPromotion] No record yet. Storing baseline year ${base} without promoting.`);
            書く({ lastPromotionYear: base });
            // 送信の完了は待たない。この関数は syncSessions の先頭で待たれて
            // いるため、通信できないときにここで止まると同期そのものが動かなく
            // なる。手元の値は先に入れてあり、送信は待ち行列に任せる。
            Firestore.setDoc(
              Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings'),
              { lastPromotionYear: base, lastModified: Firestore.serverTimestamp() },
              { merge: true }
            ).catch((誤り) => {
              console.error('[AutoPromotion] Failed to store baseline year:', 誤り);
            });
            return;
          }
          const { autoPromotionEnabled, lastPromotionYear } = 状態();
          if (autoPromotionEnabled && 四月を過ぎた && lastPromotionYear < 年) {
            console.log(`[AutoPromotion] Performing annual promotion for year ${年}...`);
            try {
              await 状態().incrementAllGrades();
            } catch (誤り) {
              console.error('[AutoPromotion] Failed:', 誤り);
            }
          }
        },
        syncSessions: async () => {
          if (!状態().activeGroupId) return;
          const _syncDb = await waitForDb();
          if (!_syncDb) {
            console.warn('[Store] syncSessions: db still undefined after await, aborting');
            // ここは黙って同期エラーにしていた。利用者の画面には帯が出るのに
            // こちらには何も残らないので、原因が分からないまま止まる
            //（2026-09-09、スマホで同期に失敗したときに便りが1通も無かった）
            不具合を控える('記録の同期', new Error('雲との連絡口が用意できませんでした'));
            書く({ syncStatus: '同期エラー' });
            return;
          }
          if ((await 状態().checkAndAutoIncrementGrades(), 進級の確認を済ませた))
            return void console.log('[syncSessions] Already syncing, skipping...');
          進級の確認を済ませた = true;
          const 前回の同期時刻 = 状態().lastSyncTime || 0;
          console.log(
            '[Store] Syncing:',
            `同期を開始中 (前回基準時刻: ${前回の同期時刻 ? new Date(前回の同期時刻).toLocaleString() : 'なし'})...`
          );
          書く({ syncStatus: '同期中' });
          try {
            // この関数の後ろで局所的な M を宣言しているため、下の forEach の中で
            // M.getState() を呼ぶと「初期化前の参照」で例外になり、同期が丸ごと
            // 止まる。団体IDはここで控えておく。
            const 団体ID = 状態().activeGroupId;
            const 記録の置き場 = Firestore.collection(
              Firebaseの器.db,
              `groups/${状態().activeGroupId}/sessions`
            );
            const 部員の置き場 = Firestore.collection(
              Firebaseの器.db,
              `groups/${状態().activeGroupId}/members`
            );
            const ごみ箱の置き場 = Firestore.collection(
              Firebaseの器.db,
              `groups/${状態().activeGroupId}/trash`
            );
            const 卒業生の置き場 = Firestore.collection(
              Firebaseの器.db,
              `groups/${状態().activeGroupId}/alumni`
            );
            let 記録の返り;
            let 部員の返り;
            let ごみ箱の返り;
            let 卒業生の返り;
            if (前回の同期時刻 > 0 && 状態().sessions.length > 0) {
              const 基準時刻 = Math.max(0, 前回の同期時刻 - 1e4);
              記録の返り = await Firestore.getDocs(
                Firestore.query(記録の置き場, Firestore.where('lastModified', '>', 基準時刻))
              );
              部員の返り = await Firestore.getDocs(
                Firestore.query(部員の置き場, Firestore.where('lastModified', '>', 基準時刻))
              );
              ごみ箱の返り = await Firestore.getDocs(
                Firestore.query(ごみ箱の置き場, Firestore.where('lastModified', '>', 基準時刻))
              );
              卒業生の返り = await Firestore.getDocs(
                Firestore.query(卒業生の置き場, Firestore.where('lastModified', '>', 基準時刻))
              );
            } else {
              記録の返り = await Firestore.getDocs(
                Firestore.query(記録の置き場, Firestore.orderBy('date', 'desc'), Firestore.limit(100))
              );
              部員の返り = await Firestore.getDocs(部員の置き場);
              ごみ箱の返り = await Firestore.getDocs(ごみ箱の置き場);
              卒業生の返り = await Firestore.getDocs(卒業生の置き場);
            }
            let 最新の時刻 = 前回の同期時刻;
            const ミリ秒にする = (値) => (値?.toMillis ? 値.toMillis() : 値 || 0);
            const 雲の記録 = [];
            記録の返り.forEach((文書) => {
              const 中身 = 文書.data();
              const 更新時刻 = ミリ秒にする(中身.lastModified);
              更新時刻 > 最新の時刻 && (最新の時刻 = 更新時刻);
              const cleanedTags =
                中身.tags && Array.isArray(中身.tags)
                  ? Array.from(new Set(中身.tags.map(normalizeTag).filter(Boolean)))
                  : [];
              const originalTags = 中身.tags || [];
              const isModified =
                cleanedTags.length !== originalTags.length ||
                cleanedTags.some((タグ, 番) => タグ !== originalTags[番]);
              if (isModified && Firebaseの器.db && 団体ID) {
                const 場所 = Firestore.doc(Firebaseの器.db, `groups/${団体ID}/sessions`, 文書.id);
                Firestore.updateDoc(場所, { tags: cleanedTags }).catch((誤り) =>
                  console.error('[Store] syncSessions Auto cleanup failed:', 誤り)
                );
              }
              雲の記録.push(
                Object.assign({}, 中身, {
                  id: 文書.id,
                  tags: cleanedTags,
                  // 見張りと同じように形を整える。ここを抜かすと、
                  // 取りにいった方から壊れた記録がそのまま入ってくる
                  archers: 記録の射手を整える(中身),
                  lastModified: 更新時刻,
                  syncStatus: '同期済み',
                })
              );
            });
            const 雲の部員 = [];
            部員の返り.forEach((文書) => {
              const 中身 = 文書.data();
              const 更新時刻 = ミリ秒にする(中身.lastModified);
              更新時刻 > 最新の時刻 && (最新の時刻 = 更新時刻);
              雲の部員.push(
                Object.assign({}, 中身, { id: 文書.id, lastModified: 更新時刻, syncStatus: '同期済み' })
              );
            });
            const 雲のごみ箱 = [];
            ごみ箱の返り.forEach((文書) => {
              const 中身 = 文書.data();
              const 更新時刻 = ミリ秒にする(中身.lastModified);
              更新時刻 > 最新の時刻 && (最新の時刻 = 更新時刻);
              雲のごみ箱.push(
                Object.assign({}, 中身, { id: 文書.id, lastModified: 更新時刻, syncStatus: '同期済み' })
              );
            });
            const 雲の卒業生 = [];
            卒業生の返り.forEach((文書) => {
              const 中身 = 文書.data();
              const 更新時刻 = ミリ秒にする(中身.lastModified);
              更新時刻 > 最新の時刻 && (最新の時刻 = 更新時刻);
              雲の卒業生.push(
                Object.assign({}, 中身, { id: 文書.id, lastModified: 更新時刻, syncStatus: '同期済み' })
              );
            });
            console.log(
              `[syncSessions] Fetched counts: S=${雲の記録.length}, M=${雲の部員.length}, T=${雲のごみ箱.length}, A=${雲の卒業生.length}`
            );
            const 記録の合流 = mergeById(状態().sessions, 雲の記録, false, false);
            const 部員の合流 = mergeById(状態().members, 雲の部員, false, false);
            const ごみ箱の合流 = mergeById(状態().trash, 雲のごみ箱, false, false);
            const 卒業生の合流 = mergeById(状態().alumni, 雲の卒業生, false, false);
            const 卒業生のID = new Set(卒業生の合流.map((卒業生1人) => 卒業生1人.id));
            const 部員 = 部員の合流.filter((部員1人) => !卒業生のID.has(部員1人.id));
            const 部員のID = new Set(部員.map((部員1人) => 部員1人.id));
            const 卒業生 = 卒業生の合流.filter((卒業生1人) => !部員のID.has(卒業生1人.id));
            記録の合流.sort((甲, 乙) => {
              const 甲の時刻 = 甲.date ? new Date(甲.date).getTime() : 0;
              return (乙.date ? new Date(乙.date).getTime() : 0) - 甲の時刻;
            });
            // 戻した記録がまだクラウドへ届いていないときは、クラウド側のゴミ箱の
            // 写しで消し込まない。届くまでは手元の「戻した」状態を優先する。
            const 復元待ち = new Set(
              記録の合流
                .filter((記録1件) => 記録1件 && '未同期' === 記録1件.syncStatus)
                .map((記録1件) => 記録1件.id)
            );
            const ごみ箱 = ごみ箱の合流.filter((記録1件) => 記録1件 && !復元待ち.has(記録1件.id));
            const ごみ箱のID = new Set(ごみ箱.map((記録1件) => 記録1件.id));
            const 記録 = 記録の合流.filter((記録1件) => !ごみ箱のID.has(記録1件.id));
            const 未送信の記録 = 記録.filter((記録1件) => '未同期' === 記録1件.syncStatus);
            let 記録の一覧 = 記録;
            // 下のブロックでは e が一括送信の入れ物に隠れるので、状態の更新役を
            // ここで控えておく（ブロックの中から外の e は参照できない）。
            const 反映 = 書く;
            if (未送信の記録.length > 0) {
              console.log(`[syncSessions] Syncing ${未送信の記録.length} pending sessions...`);
              const 一括 = Firestore.writeBatch(Firebaseの器.db);
              const 今 = Date.now();
              const 送った版 = new Map(未送信の記録.map((記録) => [記録.id, 記録.lastModified]));
              未送信の記録.forEach((記録) => {
                const 送る形 = JSON.parse(
                  JSON.stringify(Object.assign({}, 記録, { syncStatus: '同期済み', lastModified: 今 }))
                );
                一括.set(
                  Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録.id),
                  Object.assign({}, 送る形, { lastModified: Firestore.serverTimestamp() })
                );
                // 戻した記録なら、クラウドのゴミ箱からも取り下げる。存在しない場合は
                // 何も起きないので、新規の記録に対しても安全。
                一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id));
              });
              // 送信の完了は待たない。通信できないと一括送信は終わらないため、
              // 待つとこの関数自体が返らず、同期中の目印が立ったままになって
              // 以後の同期がすべて飛ばされる。届いた時点で印を付け替える。
              //
              // 印を付けるのは送った版だけ。送信中に編集されると更新日時が
              // 変わるので、一致する場合に限る。これをしないと、まだ届いて
              // いない新しい内容が同期済みに見え、次の突き合わせでクラウドの
              // 古い写しに負けて編集が消える。
              一括.commit()
                .then(() => {
                  反映((前) => ({
                    sessions: 前.sessions.map((記録) =>
                      記録 && 送った版.has(記録.id) && 記録.lastModified === 送った版.get(記録.id)
                        ? Object.assign({}, 記録, { syncStatus: '同期済み', lastModified: 今 })
                        : 記録
                    ),
                  }));
                })
                .catch((誤り) => {
                  console.error('[syncSessions] 記録の送信に失敗:', 誤り);
                });
            }
            // 送信が済んでいない削除を送り直す。通信できないときに削除した場合、
            // 待ち行列ごと失われることがあり、そのままだと次の全件取得で記録が
            // 復活してしまう。
            // 送り直すのは「この端末で捨てて、まだ送れていない」ものだけ。
            // クラウドの写しを読み込んだだけの項目まで送ると、ゴミ箱を空にした
            // 直後に読み込んだ分が戻ってきてしまう。
            const 未送信の削除 = ごみ箱.filter(
              (記録1件) => 記録1件 && 記録1件.id && 記録1件.pendingDelete && '未同期' === 記録1件.syncStatus
            );
            if (未送信の削除.length > 0) {
              console.log(`[syncSessions] Syncing ${未送信の削除.length} pending deletions...`);
              try {
                const 一括 = Firestore.writeBatch(Firebaseの器.db);
                const 送った削除 = new Map(未送信の削除.map((記録) => [記録.id, 記録.lastModified]));
                未送信の削除.forEach((記録) => {
                  一括.delete(
                    Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録.id)
                  );
                  const 送る形 = dropUndefinedDeep(Object.assign({}, 記録, { syncStatus: 'trashed' }));
                  // pendingDelete は端末の中だけの印。クラウドへは持ち込まない
                  delete 送る形.pendingDelete;
                  送る形.lastModified = Firestore.serverTimestamp();
                  送る形.deletedAt = 送る形.deletedAt || Firestore.serverTimestamp();
                  一括.set(
                    Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id),
                    送る形
                  );
                });
                // 記録の送信と同じ理由で完了は待たない。印を付けるのも
                // 送った版だけにする。
                一括.commit()
                  .then(() => {
                    反映((前) => ({
                      trash: 前.trash.map((記録) =>
                        記録 && 送った削除.has(記録.id) && 記録.lastModified === 送った削除.get(記録.id)
                          ? Object.assign({}, 記録, { syncStatus: '同期済み', pendingDelete: false })
                          : 記録
                      ),
                    }));
                  })
                  .catch((誤り) => {
                    console.error('[syncSessions] 削除の送り直しに失敗:', 誤り);
                  });
              } catch (誤り) {
                console.error('[syncSessions] 削除の送り直しの組み立てに失敗:', 誤り);
              }
            }
            // 完全に消したものは、クラウドにまだ残っていても画面に出さない。
            // 控えの整理と消し直しは、記録もゴミ箱も全件そろう
            // fetchAndOverwriteFromCloud 側で行う（ここは差分取得なので、
            // クラウドに残っているかを正しく判定できない）。
            const 完全削除ずみ = new Set(Object.keys(状態().permanentlyDeleted || {}));
            // 送信が済んでいないメンバーを送り直す。記録やゴミ箱と同じで、
            // 通信できないときの変更は待ち行列ごと失われることがあり、
            // そのままだと手元にしかない氏名や学年が永久に届かない。
            // 名簿を書けるのは団体アカウントだけなので、部員では試みない。
            const 未送信のメンバー =
              'group' === 状態().activeRole
                ? 部員.filter((部員1人) => 部員1人 && 部員1人.id && '未同期' === 部員1人.syncStatus)
                : [];
            if (未送信のメンバー.length > 0) {
              console.log(`[syncSessions] Syncing ${未送信のメンバー.length} pending members...`);
              try {
                const 一括 = Firestore.writeBatch(Firebaseの器.db);
                const 送ったメンバー = new Map(
                  未送信のメンバー.map((部員1人) => [部員1人.id, 部員1人.lastModified])
                );
                未送信のメンバー.forEach((一人) => {
                  const 送る形 = dropUndefinedDeep(Object.assign({}, 一人, { syncStatus: '同期済み' }));
                  送る形.lastModified = Firestore.serverTimestamp();
                  一括.set(
                    Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 一人.id),
                    送る形
                  );
                });
                // 完了は待たない（記録・ゴミ箱と同じ理由）
                一括.commit()
                  .then(() => {
                    反映((前) => ({
                      members: 前.members.map((一人) =>
                        一人 &&
                        送ったメンバー.has(一人.id) &&
                        一人.lastModified === 送ったメンバー.get(一人.id)
                          ? Object.assign({}, 一人, { syncStatus: '同期済み' })
                          : 一人
                      ),
                    }));
                    状態().syncMemberLookup();
                  })
                  .catch((誤り) => {
                    console.error('[syncSessions] メンバーの送り直しに失敗:', 誤り);
                  });
              } catch (誤り) {
                console.error('[syncSessions] メンバーの送り直しの組み立てに失敗:', 誤り);
              }
            }
            // 卒業生も同じ。個人IDの自動採番は卒業生にも振るので、送り直しが
            // 無いと手元にしかないIDが永久に届かず、端末ごとに食い違う。
            const 未送信の卒業生 =
              'group' === 状態().activeRole
                ? 卒業生.filter((卒業生1人) => 卒業生1人 && 卒業生1人.id && '未同期' === 卒業生1人.syncStatus)
                : [];
            if (未送信の卒業生.length > 0) {
              console.log(`[syncSessions] Syncing ${未送信の卒業生.length} pending alumni...`);
              try {
                const 一括 = Firestore.writeBatch(Firebaseの器.db);
                const 送った卒業生 = new Map(未送信の卒業生.map((一人) => [一人.id, 一人.lastModified]));
                未送信の卒業生.forEach((一人) => {
                  const 送る形 = dropUndefinedDeep(Object.assign({}, 一人, { syncStatus: '同期済み' }));
                  送る形.lastModified = Firestore.serverTimestamp();
                  一括.set(
                    Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/alumni`, 一人.id),
                    送る形
                  );
                });
                一括.commit()
                  .then(() => {
                    反映((前) => ({
                      alumni: 前.alumni.map((一人) =>
                        一人 && 送った卒業生.has(一人.id) && 一人.lastModified === 送った卒業生.get(一人.id)
                          ? Object.assign({}, 一人, { syncStatus: '同期済み' })
                          : 一人
                      ),
                    }));
                  })
                  .catch((誤り) => {
                    console.error('[syncSessions] 卒業生の送り直しに失敗:', 誤り);
                  });
              } catch (誤り) {
                console.error('[syncSessions] 卒業生の送り直しの組み立てに失敗:', 誤り);
              }
            }
            書く({
              // 完全に消したものは、クラウドにまだ残っていても画面に出さない
              sessions: 記録の一覧.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)),
              members: 部員,
              trash: ごみ箱.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)),
              alumni: 卒業生,
              syncStatus: '同期済み',
              lastSyncTime: 最新の時刻,
            });
            console.log(`[syncSessions] Finished. New lastSyncTime: ${最新の時刻}`);
            setTimeout(() => {
              状態().ensurePersonalIds();
            }, 500);
          } catch (誤り) {
            console.error('[syncSessions] Error:', 誤り);
            不具合を控える('記録の同期', 誤り);
            書く({ syncStatus: '同期エラー' });
            if (入り直せば直るか(誤り)) 書く({ 再ログインの案内: 入り直しの案内 });
          } finally {
            進級の確認を済ませた = false;
          }
        },
        syncAllToCloud: async () => {
          行動を控える('クラウドへ同期', (状態().sessions || []).length + '件');
          const { activeGroupId, activeRole, isNetworkOnline } = 状態();
          if (activeGroupId && isNetworkOnline)
            if ('member' !== activeRole) {
              console.log('[Store] Loading:', 'クラウドへの同期を開始...');
              書く({ syncStatus: '同期中' });
              try {
                const 写す = (値) => JSON.parse(JSON.stringify(値));
                const 書き込み = [];
                // 送る時点の更新日時を控えておく。送り終えたあとに照合して、
                // 送っている最中の編集に「同期済み」を付けないようにする
                const 控える = (一覧) =>
                  new Map(
                    (一覧 || []).filter((一つ) => 一つ && 一つ.id).map((一つ) => [一つ.id, 一つ.lastModified])
                  );
                const 送った記録 = 控える(状態().sessions);
                const 送った名簿 = 控える(状態().members);
                const 送った卒業生 = 控える(状態().alumni);
                状態().members.forEach((部員) => {
                  if (部員 && 部員.id) {
                    const 送る形 = Object.assign({}, 部員, { lastModified: Date.now() });
                    書き込み.push({
                      type: 'set',
                      ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 部員.id),
                      data: 写す(送る形),
                    });
                  }
                });
                状態().alumni.forEach((卒業生) => {
                  if (卒業生 && 卒業生.id) {
                    const 送る形 = Object.assign({}, 卒業生, { lastModified: Date.now() });
                    書き込み.push({
                      type: 'set',
                      ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/alumni`, 卒業生.id),
                      data: 写す(送る形),
                    });
                  }
                });
                状態().sessions.forEach((記録) => {
                  if (記録 && 記録.id) {
                    const 送る形 = 写す(
                      Object.assign({}, 記録, { syncStatus: '同期済み', lastModified: Date.now() })
                    );
                    書き込み.push({
                      type: 'set',
                      ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録.id),
                      data: 送る形,
                    });
                  }
                });
                状態().trash.forEach((記録) => {
                  if (記録 && 記録.id) {
                    const 送る形 = Object.assign({}, 記録, { lastModified: Date.now() });
                    // pendingDelete は端末の中だけの印。クラウドへは持ち込まない
                    // （syncSessions の送り直しと同じ扱い）
                    delete 送る形.pendingDelete;
                    書き込み.push({
                      type: 'set',
                      ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id),
                      data: 写す(送る形),
                    });
                  }
                });
                書き込み.push({
                  type: 'set',
                  ref: Firestore.doc(
                    Firebaseの器.db,
                    `groups/${状態().activeGroupId}/config`,
                    'app_settings'
                  ),
                  data: {
                    currentFreshmanTerm: 状態().currentFreshmanTerm,
                    tagTemplates: 状態().tagTemplates,
                    lastPromotionYear: 状態().lastPromotionYear,
                    lastModified: Date.now(),
                  },
                });
                const 一括の上限 = 400;
                for (let 頭 = 0; 頭 < 書き込み.length; 頭 += 一括の上限) {
                  const 切れ端 = 書き込み.slice(頭, 頭 + 一括の上限);
                  const 一括 = Firestore.writeBatch(Firebaseの器.db);
                  切れ端.forEach((書き込み1件) => {
                    'set' === 書き込み1件.type
                      ? 一括.set(書き込み1件.ref, 書き込み1件.data)
                      : 'delete' === 書き込み1件.type && 一括.delete(書き込み1件.ref);
                  });
                  await 一括.commit();
                }
                // 印を付けるのは「送った版」だけ。送っている最中に編集された
                // ものまで送信済みにすると、その新しい内容が送り直しの対象から
                // 外れてクラウドへ届かないままになる（記録の保存や編集と同じ考え方）
                const 済ませる = (一覧, 送った版) =>
                  一覧.map((一つ) =>
                    一つ && 送った版.has(一つ.id) && 一つ.lastModified === 送った版.get(一つ.id)
                      ? Object.assign({}, 一つ, { syncStatus: '同期済み' })
                      : 一つ
                  );
                const 記録 = 済ませる(状態().sessions, 送った記録);
                const 部員 = 済ませる(状態().members, 送った名簿);
                const 卒業生 = 済ませる(状態().alumni, 送った卒業生);
                書く({
                  sessions: 記録,
                  members: 部員,
                  alumni: 卒業生,
                  syncStatus: '同期済み',
                  lastSyncTime: Date.now(),
                });
                console.log('[Store] Loading:', 'クラウドへの送信が完了しました');
              } catch (誤り) {
                console.error('Full Sync Error:', 誤り?.message || 誤り);
                不具合を控える('クラウドへ同期', 誤り);
                書く({ syncStatus: '同期エラー' });
              }
            } else console.log('[Store] Member role: syncAllToCloud is strictly restricted.');
        },
        /** まだ送れていないものの数を数える */
        countUnsynced: () => {
          const 数 = (一覧) =>
            Array.isArray(一覧) ? 一覧.filter((一つ) => 一つ && '未同期' === 一つ.syncStatus).length : 0;
          const { sessions, members, alumni, trash } = 状態();
          return 数(sessions) + 数(members) + 数(alumni) + 数(trash);
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
          if (0 === 状態().countUnsynced()) return 0;
          if (!状態().isNetworkOnline) return 状態().countUnsynced();
          try {
            await 状態().syncSessions();
          } catch (誤り) {
            console.error('[Store] flushUnsyncedForLogout error:', 誤り);
          }
          for (let 回 = 0; 回 < 15; 回++) {
            if (0 === 状態().countUnsynced()) return 0;
            await new Promise((解く) => setTimeout(解く, 200));
          }
          return 状態().countUnsynced();
        },
        fetchAndOverwriteFromCloud: async () => {
          console.log('[Store] Loading:', 'クラウドからの取得を開始...');
          書く({ syncStatus: '同期中' });
          const _fetchDb = await waitForDb();
          if (!_fetchDb) {
            console.warn('[Store] fetchAndOverwriteFromCloud: db still undefined after await, aborting');
            // 同期と同じく、黙って終わらせない
            不具合を控える('クラウドから取得', new Error('雲との連絡口が用意できませんでした'));
            書く({ syncStatus: '同期エラー' });
            return;
          }
          try {
            const 部員の返り = await Firestore.getDocs(
              Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/members`)
            );
            let 部員 = [];
            部員の返り.forEach((文書) => 部員.push(文書.data()));
            const 記録の返り = await Firestore.getDocs(
              Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`)
            );
            let 記録 = [];
            記録の返り.forEach((文書) => 記録.push(文書.data()));
            console.log('[Store] Loading:', `セッション ${記録.length}件を取得しました`);
            const ごみ箱の返り = await Firestore.getDocs(
              Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`)
            );
            let 雲のごみ箱 = [];
            ごみ箱の返り.forEach((文書) => 雲のごみ箱.push(文書.data()));
            const 卒業生の返り = await Firestore.getDocs(
              Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/alumni`)
            );
            let 卒業生 = [];
            卒業生の返り.forEach((文書) => 卒業生.push(文書.data()));
            const 設定の帳面 = await Firestore.getDoc(
              Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/config`, 'app_settings')
            );
            let currentFreshmanTerm = 状態().currentFreshmanTerm;
            let tagTemplates = 状態().tagTemplates;
            let lastPromotionYear = 状態().lastPromotionYear;
            if (設定の帳面.exists()) {
              const 設定 = 設定の帳面.data();
              設定 &&
                (undefined !== 設定.currentFreshmanTerm && (currentFreshmanTerm = 設定.currentFreshmanTerm),
                undefined !== 設定.tagTemplates && (tagTemplates = 設定.tagTemplates),
                undefined !== 設定.lastPromotionYear && (lastPromotionYear = 設定.lastPromotionYear));
            }
            const 記録の合流 = mergeById(状態().sessions, 記録, false, true);
            const 部員の合流 = mergeById(状態().members, 部員, false, true);
            const ごみ箱の合流 = mergeById(状態().trash, 雲のごみ箱, false, true);
            // ゴミ箱に入っているものは履歴に出さない。削除がまだクラウドへ届いて
            // いないとき、ここで書き戻すと記録が復活してしまう。
            // 逆に、戻したばかりでまだ送信できていない記録は、クラウドのゴミ箱の
            // 写しがあってもゴミ箱に入れ直さない。
            const 復元待ち = new Set(
              記録の合流
                .filter((記録1件) => 記録1件 && '未同期' === 記録1件.syncStatus)
                .map((記録1件) => 記録1件.id)
            );
            const ごみ箱 = ごみ箱の合流.filter((記録1件) => 記録1件 && !復元待ち.has(記録1件.id));
            const ごみ箱のID = new Set(ごみ箱.map((記録1件) => 記録1件.id));
            const 残る記録 = 記録の合流.filter((記録1件) => 記録1件 && !ごみ箱のID.has(記録1件.id));
            // 完全に消したものの後始末。ここは記録もゴミ箱も全件そろっているので、
            // クラウドから本当に消えたかを正しく判定できる。
            //   ・まだ残っている → 消し直して控えは残す
            //   ・もう無い       → 消し終わったので控えから外す
            //   ・30日を過ぎた   → 手放す（控えが際限なく増えないように）
            const 控え = 状態().permanentlyDeleted || {};
            const 控えのid = Object.keys(控え);
            let 完全削除ずみ = new Set(控えのid);
            if (控えのid.length > 0) {
              const 期限 = Date.now() - 2592e6;
              const クラウドに有る = new Set(
                [...記録, ...雲のごみ箱]
                  .filter((記録1件) => 記録1件 && 記録1件.id)
                  .map((記録1件) => 記録1件.id)
              );
              const 消し直す = 控えのid.filter((id) => 控え[id] >= 期限 && クラウドに有る.has(id));
              const 残す = {};
              消し直す.forEach((id) => {
                残す[id] = 控え[id];
              });
              完全削除ずみ = new Set(消し直す);
              if (消し直す.length !== 控えのid.length)
                console.log(`[Store] 完全削除の控えを整理: ${控えのid.length}件 → ${消し直す.length}件`);
              if (消し直す.length > 0) {
                console.log(`[Store] クラウドに残っている ${消し直す.length}件 を消し直します`);
                try {
                  const 一括 = Firestore.writeBatch(Firebaseの器.db);
                  消し直す.forEach((id) => {
                    一括.delete(
                      Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, id)
                    );
                    一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, id));
                  });
                  一括.commit().catch((誤り) => {
                    console.error('[Store] 完全削除の送り直しに失敗:', 誤り);
                  });
                } catch (誤り) {
                  console.error('[Store] 完全削除の送り直しの組み立てに失敗:', 誤り);
                }
              }
              書く({ permanentlyDeleted: 残す });
            }
            // 消したメンバーの控えも同じように整理する。
            //   ・まだクラウドに残っている → 消し直して控えは残す
            //   ・もう無い                 → 消し終わったので控えから外す
            //   ・30日を過ぎた             → 手放す
            const メンバーの控え = 状態().deletedMembers || {};
            const メンバーの控えのid = Object.keys(メンバーの控え);
            let 削除ずみのメンバー = new Set(メンバーの控えのid);
            if (メンバーの控えのid.length > 0) {
              const 期限 = Date.now() - 2592e6;
              const クラウドに有る = new Set(
                (部員 || []).filter((部員1人) => 部員1人 && 部員1人.id).map((部員1人) => 部員1人.id)
              );
              const 消し直す = メンバーの控えのid.filter(
                (id) => メンバーの控え[id] >= 期限 && クラウドに有る.has(id)
              );
              const 残す = {};
              消し直す.forEach((id) => {
                残す[id] = メンバーの控え[id];
              });
              削除ずみのメンバー = new Set(消し直す);
              if (消し直す.length > 0) {
                console.log(`[Store] クラウドに残っているメンバー ${消し直す.length}件 を消し直します`);
                try {
                  const 一括 = Firestore.writeBatch(Firebaseの器.db);
                  消し直す.forEach((id) => {
                    一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, id));
                  });
                  一括.commit().catch((誤り) => {
                    console.error('[Store] メンバーの削除の送り直しに失敗:', 誤り);
                  });
                } catch (誤り) {
                  console.error('[Store] メンバーの削除の送り直しの組み立てに失敗:', 誤り);
                }
              }
              書く({ deletedMembers: 残す });
            }
            書く({
              members: 部員の合流.filter((部員1人) => 部員1人 && !削除ずみのメンバー.has(部員1人.id)),
              sessions: 残る記録.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)),
              trash: ごみ箱.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)),
              alumni: mergeById(状態().alumni, 卒業生, false, true),
              currentFreshmanTerm,
              tagTemplates,
              lastPromotionYear,
              syncStatus: '同期済み',
              lastSyncTime: Date.now(),
            });
            console.log('[Store] Loading:', '同期が完了しました');
          } catch (誤り) {
            console.error('Fetch Overwrite Error:', 誤り);
            不具合を控える('クラウドから取得', 誤り);
            書く({ syncStatus: '同期エラー' });
            if (入り直せば直るか(誤り)) 書く({ 再ログインの案内: 入り直しの案内 });
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
        startLiveSync: async (名前, 共有) => {
          // ライブを移ったら控えは捨てる。前のライブで載せた○×を覚えたままだと、
          // 次のライブで「前と同じ」と見なして送らず、相手の画面に出ない
          載っている印を捨てる();
          if (!Firebaseの器.rtdb) return '確認できない';
          // ライブを置く枝は団体ごとの合言葉。まだ手元に無ければ取りにいく。
          // ここで取れないまま団体IDで始めると、他団体から丸見えになる
          const 団 = 団体の枝() || (await 状態().ライブの合言葉を用意する());
          if (!秘.枝として使えるか(団)) return '確認できない';
          const 枝 = 共有 && 秘.枝として使えるか(共有.編集の枝) ? String(共有.編集の枝) : 団;
          // いま自分が主催しているライブを共有へ切り替えるときは、同名でよい。
          // 団体の枝にある自分の節点を、道しるべへ置き換えるだけだから
          const 自分のを置き換える = !!(共有 && 状態().isHost && 状態().liveSessionName === 名前);
          try {
            const 節点 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${団}/${名前}`);
            if (!自分のを置き換える && (await RTDB.get(節点)).exists()) return '同名あり';
          } catch (誤り) {
            // 確かめられないまま作ると、進行中の同名ライブを上書きして潰す。
            // 元はここで握りつぶして、そのまま作成へ進んでいた
            return (console.error('Session Name Check Error:', 誤り), '確認できない');
          }
          状態().stopLiveSync(true);
          書く({
            // 共有のライブなら、そのライブ専用の枝を据える。
            // stopLiveSync より後に置くこと。先に置くと、その中で消される
            いまのライブの枝: 共有 ? 枝 : null,
            // 自分で始めたライブなので、よそではない
            よその団体のライブ: false,
            いまのライブの閲覧枝: 共有 ? 共有.閲覧の枝 || null : null,
            写しを見ているか: false,
            isLiveActive: true,
            isHost: true,
            // 主催者は必ず記録する側
            ライブは見るだけ: false,
            liveSessionName: 名前,
            isIncomingLiveSync: false,
            lastLocalChange: Date.now(),
            // 共有履歴はライブごとに別物。前のライブの目印を持ち越すと、
            // 新しいライブでいきなり取り消しが押せて、無い手を読みにいく。
            // 主催者は同名のライブを作れないので必ず新品。参加者と違って
            // 「これまでの結果」が届くことがなく、初回を飛ばす目印は要らない
            historySharedLen: 0,
            historySharedMax: 0,
            historyHandledAt: 0,
            historyIsFirstSnapshot: false,
            // 同じ名前で始め直したとき、前回の片付けが節点に残っていることがある。
            // 最初の1通ぶんは知らせない
            resetIsFirstSnapshot: true,
            // アプリを閉じて戻ったときに、このライブへ戻るための控え（端末に残す）
            ライブの続き: {
              名前,
              枝: 共有 ? 枝 : null,
              閲覧枝: 共有 ? 共有.閲覧の枝 || null : null,
              主催: true,
              見るだけ: false,
              よそ: false,
              団体: 状態().activeGroupId || null,
            },
          });
          const いま = 状態();
          if (!Firebaseの器.rtdb) return '確認できない';
          const 盤面の場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`);
          const 射手たち = Array.isArray(いま.archers) ? いま.archers : [];
          try {
            return (
              ライブへ盤面を送る(名前, 射手たち, いま.shotsPerRound),
              // 閲覧用の枝を、共有の枝の state にも載せておく。
              // リンクで入った記録係も写しへ流せるようにするため。
              // 載せないと、その人の○×だけ見ている人に出ない。
              // ここを読めるのは編集の枝を知っている人だけなので、閲覧の人には見えない
              共有 &&
                RTDB.update(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`), {
                  閲覧の枝: 共有.閲覧の枝 || null,
                }).catch(() => {}),
              // 共有のライブは別の枝にあるので、参加一覧に出すための道しるべを
              // 団体の枝へ置く。部員はこれを辿って共有の枝へ入る
              共有 &&
                RTDB.set(RTDB.ref(Firebaseの器.rtdb, 道しるべの場所(団, 名前)), {
                  共有の枝: 枝,
                  閲覧の枝: 共有.閲覧の枝 || null,
                  status: 'active',
                  timestamp: Date.now(),
                  updated_at: RTDB.serverTimestamp(),
                }).catch((誤り) => console.error('[Store] 道しるべを置けませんでした', 誤り)),
              在席を始める(名前, 書く),
              IS_WEB && console.log('ライブを開始しました: ' + 名前),
              RTDB.onValue(盤面の場所, (返り) => {
                const 届いた = 返り.val();
                if (!届いた) {
                  const 今の名前 = 状態().liveSessionName;
                  return (
                    今の名前 &&
                      Firebaseの器.rtdb &&
                      RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${今の名前}/state`)),
                    在席を終える(書く),
                    写しを見るのをやめる(),
                    void 書く({
                      isLiveActive: false,
                      ライブの続き: null,
                      isHost: false,
                      liveSessionName: null,
                    })
                  );
                }
                // 期限は枝分かれの前に控える。下の「他人の書き込み」の枝だけに
                // 置くと、自分で配った主催者は自分の返りしか受けないので
                // 一度も拾えない（カウントダウンが出なかった）
                期限を控える(届いた, 書く, 状態);
                if (届いた.timestamp === 状態().lastPushedTimestamp) 返りの印を取り込む(届いた, 書く, 状態);
                if (届いた.timestamp !== 状態().lastPushedTimestamp) {
                  if ('finished' === 届いた.status) {
                    const 今の名前 = 状態().liveSessionName;
                    return (
                      今の名前 &&
                        Firebaseの器.rtdb &&
                        RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${今の名前}/state`)),
                      在席を終える(書く),
                      写しを見るのをやめる(),
                      void 書く({
                        isLiveActive: false,
                        ライブの続き: null,
                        isHost: false,
                        liveSessionName: null,
                      })
                    );
                  }
                  // 誰かが配ったら、その枝へ付いていく
                  // 期限より先に見る。切れているのに付いていくと、行った先でも切れている
                  if (期限で閉じるか(届いた, 書く, 状態)) return;
                  if (移ったら付いていく(届いた, 書く, 状態)) return;
                  共有履歴の目印を受け取る(届いた, 書く, 状態);
                  // 参加者側と同じ。始め直したとき、節点に前回の片付けが
                  // 残っていることがあるので、最初の1通ぶんは知らせない
                  const 主のリセット初回 = 状態().resetIsFirstSnapshot;
                  if (主のリセット初回) 書く({ resetIsFirstSnapshot: false });
                  if (届いた.reset_at && 届いた.reset_at > (状態().lastResetHandled || 0))
                    return (
                      書く({ lastResetHandled: 届いた.reset_at }),
                      主のリセット初回 && 書く({ lastPushedTimestamp: 届いた.timestamp || 0 }),
                      // 送信はしない。受け取ったリセットを送り返すと、相手の画面に
                      // 「リセットしました」が二度出るうえ、無駄な書き込みが増える
                      void 状態().resetCurrentSession(false)
                    );
                  if (届いた.archers || Array.isArray(届いた.archers)) {
                    // 突き合わせは syncRules.js の mergeLiveArchers に出した。
                    // 主催者側と参加者側で同じ処理が二重に書かれていたため
                    const { archers: 受信, shotsPerRound: 本数 } = ライブの盤面を読み取る(届いた);
                    const 結果 = mergeLiveArchers(状態().archers, 受信, 状態().shotsPerRound, 本数);
                    // 受け取りの正規化は短い○×を伸ばすだけで、長いほうは切らない。
                    // 相手が射数を減らしたとき、手元の射手のほうが新しいと
                    // 射数だけ減って○×が伸びたまま残る（画面に出ないますの○が
                    // 的中数に入る）。射数が変わればここは必ず通る
                    if (結果.changed)
                      書く({ archers: 盤面を射数にそろえる(結果.archers, 本数), shotsPerRound: 本数 });
                  }
                }
              }),
              '開始した'
            );
          } catch (誤り) {
            return (console.error('Start Live Sync Error:', 誤り), '確認できない');
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
          const { liveSessionName: 名前 } = 状態();
          if (!Firebaseの器.rtdb || !名前) return null;
          // 見るだけの人は配れない。写しの枝しか知らないので、
          // 配っても記録できるリンクにはならない
          if (状態().写しを見ているか) return null;
          const 今の枝 = ライブの枝();
          if (!今の枝) return null;
          const 状態の道 = `live_sessions/${今の枝}/${名前}/state`;
          let 今の中身 = {};
          try {
            const 返り = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, 状態の道));
            今の中身 = 返り.exists() ? 返り.val() || {} : {};
          } catch (誤り) {
            return (console.error('[Store] ライブを読めませんでした', 誤り), null);
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
                名前,
                役: 共.編集,
                鍵が要るか: !!今の中身.鍵が要るか,
                期限: 元の期限,
              }),
              閲覧の荷: 共.共有の荷を組む({
                種: 種.閲覧,
                名前,
                役: 共.閲覧,
                鍵が要るか: !!今の中身.鍵が要るか,
                期限: 元の期限,
              }),
              合言葉が要るか: !!今の中身.鍵が要るか,
              期限: 元の期限,
              すでに配られていた: true,
            };
          }
          // ここから、まだ配られていないライブを専用の枝へ移す
          const 鍵 = String(合言葉 == null ? '' : 合言葉);
          const 編集の種 = 共.共有の種を作る();
          const 閲覧の種 = 共.共有の種を作る();
          const 編集の枝 = 共.枝を導く(編集の種, 鍵);
          const 閲覧の枝 = 共.枝を導く(閲覧の種, 鍵);
          const 団 = 団体の枝() || (await 状態().ライブの合言葉を用意する());
          if (!秘.枝として使えるか(団)) return null;
          // 期限はサーバーの時計で決める。手元の時計が進んでいると、
          // 配った瞬間に切れているリンクを渡してしまう
          const 期限 = 共.期限の時刻('number' == typeof 持ち ? 持ち : 共.期限の既定, await サーバー時刻());
          try {
            // 期限は盤面より先に置く。あとにすると、途中で失敗したときに
            // 「期限の無いリンク」が残る。逆なら残るのは読むもののない期限だけ
            if (期限)
              await Promise.all([
                RTDB.set(RTDB.ref(Firebaseの器.rtdb, 期限の場所(編集の枝)), 期限),
                RTDB.set(RTDB.ref(Firebaseの器.rtdb, 期限の場所(閲覧の枝)), 期限),
              ]);
            // 盤面をそのまま新しい枝へ写す。種もここに置く（編集の枝を知る人だけが読める）
            await RTDB.set(
              RTDB.ref(Firebaseの器.rtdb, `live_sessions/${編集の枝}/${名前}/state`),
              Object.assign({}, 今の中身, {
                閲覧の枝,
                種: { 編集: 編集の種, 閲覧: 閲覧の種 },
                鍵が要るか: !!鍵,
                期限,
                移った先: null,
                timestamp: Date.now(),
                updated_at: RTDB.serverTimestamp(),
              })
            );
            // 閲覧用の写しも、ここで一度作っておく。作らないと、配った直後に
            // 閲覧リンクを開いた人が「見つからない」になる。
            // 種と閲覧の枝は写しに入れないこと。閲覧の人に編集側の手がかりを渡さない
            const 写しの中身 = Object.assign({}, 今の中身, { 期限 });
            delete 写しの中身.種;
            delete 写しの中身.閲覧の枝;
            delete 写しの中身.移った先;
            delete 写しの中身.移った先の閲覧枝;
            await RTDB.set(
              RTDB.ref(Firebaseの器.rtdb, 写しの場所(閲覧の枝, 名前)),
              Object.assign(写しの中身, { timestamp: Date.now(), updated_at: RTDB.serverTimestamp() })
            );
            // 共有履歴も引き継ぐ。取り消しの目印は state に載っているので、
            // 中身を移さないと押した瞬間に無い手を読みにいく
            const 元の履歴 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, 共有履歴の場所(今の枝, 名前)));
            if (元の履歴.exists())
              await RTDB.set(RTDB.ref(Firebaseの器.rtdb, 共有履歴の場所(編集の枝, 名前)), 元の履歴.val());
            // 参加一覧に出すための道しるべ
            await RTDB.set(RTDB.ref(Firebaseの器.rtdb, 道しるべの場所(団, 名前)), {
              共有の枝: 編集の枝,
              閲覧の枝,
              // 参加一覧が、期限の切れたライブを外すのに使う
              // （src/syncRules.js の 参加できるライブ）
              期限: 期限 || null,
              status: 'active',
              timestamp: Date.now(),
              updated_at: RTDB.serverTimestamp(),
            });
            // 元の枝に道しるべを置く。ほかの台はこれを見て付いてくる。
            // 置かないと、配った人だけが新しい枝へ移ってライブが分裂する
            if (今の枝 !== 団)
              await RTDB.update(RTDB.ref(Firebaseの器.rtdb, 状態の道), {
                移った先: 編集の枝,
                移った先の閲覧枝: 閲覧の枝,
                updated_at: RTDB.serverTimestamp(),
              });
          } catch (誤り) {
            return (console.error('[Store] ライブを配れませんでした', 誤り), null);
          }
          // 自分も新しい枝へ移る。主催者かどうかは変えない
          const 主催だった = 状態().isHost;
          状態().joinLiveSync(名前, false, { 枝: 編集の枝, 閲覧枝: 閲覧の枝 });
          書く({ isHost: 主催だった, よその団体のライブ: false });
          return {
            編集の荷: 共.共有の荷を組む({ 種: 編集の種, 名前, 役: 共.編集, 鍵が要るか: !!鍵, 期限 }),
            閲覧の荷: 共.共有の荷を組む({ 種: 閲覧の種, 名前, 役: 共.閲覧, 鍵が要るか: !!鍵, 期限 }),
            合言葉が要るか: !!鍵,
            期限,
            すでに配られていた: false,
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
          if (!Firebaseの器.rtdb) return '確認できない';
          const 中身 = 共.共有の荷を解く(荷);
          if (!中身) return '確認できない';
          const 枝 = 共.枝を導く(中身.種, String(合言葉 == null ? '' : 合言葉));
          if (!秘.枝として使えるか(枝)) return '確認できない';
          const 見るだけ = 中身.役 === 共.閲覧;
          const 道 = 見るだけ ? 写しの場所(枝, 中身.名前) : `live_sessions/${枝}/${中身.名前}/state`;
          // 記録する側は、写しを流す先も受け取る。受け取らないと、
          // この人が入れた○×だけが見ている人に出ない
          let 写す先 = null;
          try {
            // 合言葉が違えば別の枝になるので、ここで「無い」と分かる
            const 有 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, 道));
            if (!有.exists()) return '見つからない';
            if (!見るだけ) {
              const 中 = 有.val() || {};
              if (秘.枝として使えるか(中.閲覧の枝)) 写す先 = String(中.閲覧の枝);
            }
          } catch (誤り) {
            // 決まりに弾かれたときだけ、期限を見に行く。
            //
            // 先に期限を確かめる作りにしていたが、それだと期限の無いリンクでも
            // 参加のたびに問い合わせが1回増える（実測でおよそ230ミリ秒）。
            // 弾かれるのは稀なので、そのときだけ調べれば足りる。
            //
            // 荷に載っている期限は誰でも書き換えられるので、そちらは見ない。
            // ここで見るのは「期限切れです」と言い切るためだけで、
            // 切れた枝に入れないことは決まりの側が保証している
            if (弾かれたか(誤り))
              try {
                const 限 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, 期限の場所(枝)));
                const 期限の値 = 限.exists() ? 限.val() : null;
                if ('number' == typeof 期限の値 && (await サーバー時刻()) >= 期限の値) return '期限切れ';
              } catch (e2) {
                /* 期限も読めない。理由が分からないので、下の「確認できない」に落とす */
              }
            return (console.error('[Store] 共有リンクの確認に失敗:', 誤り), '確認できない');
          }
          // 自分の団体のライブか、よその団体のライブかを見分ける。
          //
          // 自分の団体の枝に、この枝を指す道しるべがあれば自分たちの練習。
          // 部員が共有リンクを開いただけ、という筋がこれに当たる。
          // 見分けられなかったときは「よそ」として扱う。取り違えて
          // よその練習を自分の団体の記録に残すほうが困る
          let よそ = true;
          const 団 = 団体の枝();
          if (団) {
            try {
              const 印 = await RTDB.get(RTDB.ref(Firebaseの器.rtdb, 道しるべの場所(団, 中身.名前)));
              const 道しるべの値 = 印.exists() ? 印.val() || {} : {};
              if (道しるべの値.共有の枝 === 枝 || 道しるべの値.閲覧の枝 === 枝) よそ = false;
            } catch (誤り) {
              console.warn('[Store] 自分の団体のライブか確かめられませんでした', 誤り);
            }
          }
          // 団体に入っていない人は「来客」。App.js がこれを見て画面を出す
          書く({ 共有の来客: !状態().activeGroupId });
          if (!見るだけ) {
            // 記録する側は、部員が参加するのと同じ道を通す。受け取りの取り込みは
            // 「自分の送信の返りを無視する」「同じ通知に載った相手の印は取り込む」と
            // 込み入っていて、ここに別に書くと必ずずれる。実際、別に書いていたときは
            // 入れた○×が次の受信で消えていた
            載っている印を捨てる();
            写しを見るのをやめる();
            状態().joinLiveSync(中身.名前, false, { 枝, 閲覧枝: 写す先 });
            // joinLiveSync が偽に戻すので、そのあとで据える
            書く({ よその団体のライブ: よそ });
            return '入った';
          }
          // 見るだけの側。写しを読むだけで、何も送り返さない
          載っている印を捨てる();
          写しを見るのをやめる();
          状態().stopLiveSync(true);
          書く({
            いまのライブの枝: null,
            いまのライブの閲覧枝: 枝,
            写しを見ているか: true,
            よその団体のライブ: よそ,
            isLiveActive: true,
            isHost: false,
            ライブは見るだけ: true,
            liveSessionName: 中身.名前,
            isIncomingLiveSync: false,
            lastLocalChange: 0,
            lastPushedTimestamp: 0,
            historySharedLen: 0,
            historySharedMax: 0,
            historyIsFirstSnapshot: true,
            resetIsFirstSnapshot: true,
          });
          写しの片付け = RTDB.onValue(
            RTDB.ref(Firebaseの器.rtdb, 道),
            (返り) => {
              const 届いた = 返り.val();
              if (!届いた) return;
              if ('finished' === 届いた.status)
                return void 書く({
                  isLiveActive: false,
                  ライブの続き: null,
                  isHost: false,
                  liveSessionName: null,
                  いまのライブの期限: null,
                });
              if (期限で閉じるか(届いた, 書く, 状態)) return;
              if (!届いた.archers && !Array.isArray(届いた.archers)) return;
              // 部員が参加するときと同じ突き合わせを通す。
              //
              // ライブの archers に○×は入っていない（○×は marks_by_id で別に送る）。
              // ここで archers をそのまま入れていたころは、○×がいつまでも出なかった。
              // w() で組み直し、mergeLiveArchers で突き合わせる
              const { archers: 受信, shotsPerRound: 本数 } = ライブの盤面を読み取る(届いた);
              const 結果 = mergeLiveArchers(状態().archers, 受信, 状態().shotsPerRound, 本数);
              if (結果.changed)
                書く({
                  archers: 盤面を射数にそろえる(結果.archers, 本数),
                  shotsPerRound: 本数,
                  isIncomingLiveSync: true,
                });
            },
            (誤り) => つなげなくなった(誤り, 書く, 状態)
          );
          if (IS_WEB) console.log('共有リンクで入りました（見るだけ）: ' + 中身.名前);
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
        joinLiveSync: (名前, 見るだけ, 共有) => {
          // ライブを移ったら控えは捨てる。前のライブで載せた○×を覚えたままだと、
          // 次のライブで「前と同じ」と見なして送らず、相手の画面に出ない
          載っている印を捨てる();
          // 共有のライブは団体の枝に盤面を置いていない。道しるべを辿って、
          // そのライブ専用の枝へ入る。辿らないと空の節点を見て何も出ない
          const 道しるべ = (状態().共有のライブたち || {})[名前] || null;
          const 差し込み = 共有 && 秘.枝として使えるか(共有.枝) ? String(共有.枝) : null;
          // 一覧は合言葉が取れてからしか出ないので、ここへ来る時点で普通は在る。
          // 無いまま進むと「参加中」の表示だけ出て何も届かないので、先に止める
          const 枝 = 差し込み || (道しるべ ? 道しるべ.共有の枝 : 団体の枝());
          if (!枝) return;
          if (
            (状態().stopLiveSync(true),
            書く({
              // 共有のライブに入るときは、そのライブ専用の枝を据える
              いまのライブの枝: 差し込み || 道しるべ ? 枝 : null,
              // 参加一覧から入ったのなら自分の団体のライブ。
              // 共有リンクから来たときは、呼ぶ側があとで決め直す
              よその団体のライブ: false,
              いまのライブの閲覧枝: 差し込み
                ? (共有 && 共有.閲覧枝) || null
                : 道しるべ
                  ? 道しるべ.閲覧の枝
                  : null,
              写しを見ているか: false,
              isLiveActive: true,
              isHost: false,
              ライブは見るだけ: !!見るだけ,
              liveSessionName: 名前,
              isIncomingLiveSync: false,
              lastLocalChange: 0,
              // 参加して最初に届く1通は必ず取り込む。
              // 自分の送信の返りを無視する判定（timestamp の一致）は、
              // 最後に書き込んだのが自分自身だと1通目にも当たってしまう。
              // 当たると盤面が空のまま、誰かが次に何かするまで何も出ない
              lastPushedTimestamp: 0,
              // 主催者側と同じ理由。目印は参加したライブのものを受け取り直す
              historySharedLen: 0,
              historySharedMax: 0,
              historyIsFirstSnapshot: true,
              resetIsFirstSnapshot: true,
              // アプリを閉じて戻ったときに、このライブへ戻るための控え（端末に残す）。
              // 主催・よその団体は、呼ぶ側があとで据え直すことがある（ライブに戻る で拾う）
              ライブの続き: {
                名前,
                枝: 差し込み || 道しるべ ? 枝 : null,
                閲覧枝: 差し込み ? (共有 && 共有.閲覧枝) || null : 道しるべ ? 道しるべ.閲覧の枝 : null,
                主催: false,
                見るだけ: !!見るだけ,
                よそ: false,
                団体: 状態().activeGroupId || null,
              },
            }),
            !Firebaseの器.rtdb)
          )
            return;
          const 盤面の場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`);
          RTDB.onValue(
            盤面の場所,
            (返り) => {
              const 届いた = 返り.val();
              if (!届いた) {
                const 今の名前 = 状態().liveSessionName;
                return (
                  今の名前 &&
                    Firebaseの器.rtdb &&
                    RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${今の名前}/state`)),
                  在席を終える(書く),
                  写しを見るのをやめる(),
                  void 書く({ isLiveActive: false, ライブの続き: null, isHost: false, liveSessionName: null })
                );
              }
              // 自分が送ったものの返りでは、一覧を入れ替えない。入れ替えると
              // 手元の矢所が消え、まだ届いていない射手も落ちる（主催者側には
              // 元からある判定で、参加者側だけ抜けていた）。
              // ただし同じ通知に載った相手の印だけは取り込む
              if (届いた.timestamp === 状態().lastPushedTimestamp)
                return void 返りの印を取り込む(届いた, 書く, 状態);
              if ('finished' === 届いた.status) {
                const 今の名前 = 状態().liveSessionName;
                return (
                  今の名前 &&
                    Firebaseの器.rtdb &&
                    RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${今の名前}/state`)),
                  在席を終える(書く),
                  写しを見るのをやめる(),
                  // 送信しない。ここで送ると、主催者が2秒後に消す節点を書き戻してしまい、
                  // 届くのが遅れた場合は「終わったはずのライブ」が一覧に残り続ける
                  状態().resetCurrentSession(false),
                  void 書く({ isLiveActive: false, ライブの続き: null, isHost: false, liveSessionName: null })
                );
              }
              // 誰かが配ったら、その枝へ付いていく
              // 期限より先に見る。切れているのに付いていくと、行った先でも切れている
              if (期限で閉じるか(届いた, 書く, 状態)) return;
              if (移ったら付いていく(届いた, 書く, 状態)) return;
              共有履歴の目印を受け取る(届いた, 書く, 状態);
              // 入って最初の1通かどうかを先に控える（下で旗を倒すため）
              const リセットの初回 = 状態().resetIsFirstSnapshot;
              if (リセットの初回) 書く({ resetIsFirstSnapshot: false });
              if (届いた.reset_at && 届いた.reset_at > (状態().lastResetHandled || 0)) {
                書く({ lastResetHandled: 届いた.reset_at });
                if (リセットの初回) 書く({ lastPushedTimestamp: 届いた.timestamp || 0 });
                状態().resetCurrentSession(false);
              }
              if (届いた.archers || Array.isArray(届いた.archers)) {
                // 主催者側（startLiveSync）と同じ関数を使う
                const { archers: 受信, shotsPerRound: 本数 } = ライブの盤面を読み取る(届いた);
                const 結果 = mergeLiveArchers(状態().archers, 受信, 状態().shotsPerRound, 本数);
                // 主催者側と同じ理由で、いまの射数にそろえる
                if (結果.changed)
                  書く({ archers: 盤面を射数にそろえる(結果.archers, 本数), shotsPerRound: 本数 });
              }
            },
            // 決まりに弾かれたら知らせる。渡さないと、盤面が空のまま
            // 「ライブ中」の表示だけが残る
            (誤り) => つなげなくなった(誤り, 書く, 状態)
          );
          在席を始める(名前, 書く);
          if (IS_WEB) console.log('ライブに参加しました: ' + 名前);
        },
        // 抜けるのは手元だけで、ライブそのものは残す。主催者と参加者で
        // 振る舞いを分けないための作りで、どちらが抜けても残った人は
        // そのまま続けられる。ライブを終わらせるのは「終了・保存」か、
        // 参加一覧から消したときだけ
        /** 共有リンクの来客をやめる。リンクで来た人が閉じるときに使う */
        共有の来客をやめる: () => {
          状態().stopLiveSync(true);
          書く({ 共有の来客: false });
        },
        /**
         * アプリを閉じて戻ったとき、続けていたライブへ戻る。
         *
         * ライブの状態（isLiveActive など）は端末に残さないので、閉じて開き直すと
         * ライブから抜けた形になり、記録表にはライブを始めた時点の○×だけが残っていた。
         * 端末に残した ライブの続き を見て、
         *   ・まだ続いているライブなら、同じ立場（主催／参加・見るだけ）で入り直す
         *   ・終わっている（節点が無い・finished）なら、記録表を片付けて控えを捨てる
         *   ・確かめられない（つながらない）なら、何もしない（次に開いたときにまた見る）
         */
        ライブに戻る: async () => {
          const 続き = 状態().ライブの続き;
          if (!続き || !続き.名前 || 状態().isLiveActive) return '無い';
          if (続き.団体 && 続き.団体 !== 状態().activeGroupId) return void 書く({ ライブの続き: null });
          if (!Firebaseの器.rtdb) return '確認できない';
          let 枝 = 秘.枝として使えるか(続き.枝) ? String(続き.枝) : 団体の枝();
          if (!枝) {
            try {
              枝 = 秘.ライブの枝(await 状態().ライブの合言葉を用意する());
            } catch (誤り) {
              枝 = null;
            }
          }
          if (!秘.枝として使えるか(枝)) return '確認できない';
          let 届いた状態;
          try {
            届いた状態 = (
              await RTDB.get(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${続き.名前}/state`))
            ).val();
          } catch (誤り) {
            return '確認できない';
          }
          if (状態().isLiveActive) return '無い';
          const 切れた =
            届いた状態 &&
            'number' === typeof 届いた状態.期限 &&
            届いた状態.期限 > 0 &&
            いまの見当() >= 届いた状態.期限;
          if (!届いた状態 || 'finished' === 届いた状態.status || 切れた) {
            // 終わっていた。ライブを始めた時点の○×が記録表に残っているので片付ける
            状態().resetCurrentSession(false);
            書く({ ライブの続き: null });
            return '終わっていた';
          }
          状態().joinLiveSync(
            続き.名前,
            !!続き.見るだけ,
            秘.枝として使えるか(続き.枝) ? { 枝: String(続き.枝), 閲覧枝: 続き.閲覧枝 || null } : undefined
          );
          // joinLiveSync は参加者として入る。主催だったなら主催に戻す（移ったら付いていく と同じ）
          if (状態().liveSessionName === 続き.名前)
            書く({ isHost: !!続き.主催, よその団体のライブ: !!続き.よそ });
          return '戻った';
        },
        stopLiveSync: (記録を残す = false) => {
          // ライブを移ったら控えは捨てる。前のライブで載せた○×を覚えたままだと、
          // 次のライブで「前と同じ」と見なして送らず、相手の画面に出ない
          載っている印を捨てる();
          const いま = 状態();
          const 枝 = ライブの枝();
          if (いま.liveSessionName && Firebaseの器.rtdb && 枝)
            RTDB.off(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${いま.liveSessionName}/state`));
          在席を終える(書く);
          写しを見るのをやめる();
          if (!記録を残す) 状態().resetCurrentSession(false);
          書く({ isLiveActive: false, ライブの続き: null, isHost: false, liveSessionName: null });
        },
        // 参加一覧を取り直す。ここでだけ、古いライブの片付けもする。
        // 購読側（listenToLiveSessions）は変化のたびに呼ばれるので、
        // 消す処理は明示的に取りにいくこちらへ寄せてある
        fetchActiveLiveSessions: async () => {
          if (!Firebaseの器.rtdb) return;
          // 一覧を出すのは団体の枝から。共有のライブに入っている最中でも、
          // 一覧に出すのは団体のライブなので、そちらを見る
          const 枝 = 団体の枝() || (await 状態().ライブの合言葉を用意する());
          if (!秘.枝として使えるか(枝)) return;
          const 一覧の場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}`);
          try {
            const 返り = await RTDB.get(一覧の場所);
            const 節点 = 返り.exists() ? 返り.val() : null;
            const { 出す, 古い } = 参加できるライブ(節点, await サーバー時刻());
            書く({ liveSessionsList: 出す, 共有のライブたち: 道しるべたちを拾う(節点) });
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
                const 落とす = (道) => RTDB.remove(RTDB.ref(Firebaseの器.rtdb, 道)).catch(() => {});
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
              消す();
              console.log(`[Store] 使われなくなったライブを片付けました: ${名}`);
            });
          } catch (誤り) {
            console.error('Fetch live sessions error:', 誤り);
          }
        },
        listenToLiveSessions: () => {
          if (!Firebaseの器.rtdb) return () => {};
          // 合言葉は起動の直後にはまだ無いことがある（Firestore が繋がる前）。
          // 無いからと見張らずに帰ると、画面を開き直すまで一覧が空のままになる。
          // 届いてから見張り始め、やめる係は先に返しておく
          let 止める = null;
          let やめた = false;
          Promise.resolve(団体の枝() || 状態().ライブの合言葉を用意する())
            .then((合) => {
              const 枝 = 秘.ライブの枝(合);
              if (やめた || !枝 || !Firebaseの器.rtdb) return;
              const 一覧の場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}`);
              止める = RTDB.onValue(
                一覧の場所,
                (返り) => {
                  // ここは消さないので、時計の補正は控えの値で足りる
                  const 節点 = 返り.exists() ? 返り.val() : null;
                  書く({
                    liveSessionsList: 参加できるライブ(節点, Date.now() + サーバーとの時差).出す,
                    共有のライブたち: 道しるべたちを拾う(節点),
                  });
                },
                (誤り) => {
                  console.error('Listen to live sessions error:', 誤り);
                }
              );
            })
            .catch((誤り) => console.error('Listen to live sessions error:', 誤り));
          return () => {
            やめた = true;
            if (止める) 止める();
          };
        },
        deleteLiveSession: async (名前) => {
          if (Firebaseの器.rtdb)
            try {
              // 一覧から消すのは団体のライブ。共有の枝ではなく団体の枝を見る
              const 枝 = 団体の枝();
              if (!枝) return;
              const 節点 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}`);
              await RTDB.set(節点, null);
              // 共有履歴と在席は別の枝にあるので、そちらも消す
              RTDB.remove(RTDB.ref(Firebaseの器.rtdb, 共有履歴の場所(枝, 名前))).catch(() => {});
              RTDB.remove(RTDB.ref(Firebaseの器.rtdb, 在席の場所(枝, 名前))).catch(() => {});
              書く({ liveSessionsList: 状態().liveSessionsList.filter((名) => 名 !== 名前) });
            } catch (誤り) {
              console.error('Delete live session error:', 誤り);
            }
        },
        listenToSessions: async () => {
          const { activeGroupId: 団体, activeRole: 役割, myMemberId: 自分の部員ID, myMemberName } = 状態();
          if (!団体) return;
          const _sessDb = await waitForDb();
          if (!_sessDb) {
            console.warn('[Store] listenToSessions: db still undefined after await, aborting');
            return;
          }
          状態().stopListeningToSessions();
          console.log('[Store] Starting real-time session listener');
          const 記録の置き場 = Firestore.collection(Firebaseの器.db, `groups/${団体}/sessions`);
          const m_30 = Date.now() - 2592000000;
          const 問い = Firestore.query(
            記録の置き場,
            Firestore.where('date', '>', m_30),
            Firestore.orderBy('date', 'desc'),
            Firestore.limit(100)
          );
          const 止める = Firestore.onSnapshot(
            問い,
            (返り) => {
              const 雲の記録 = [];
              返り.forEach((文書) => {
                const 中身 = 文書.data();
                const cleanedTags =
                  中身.tags && Array.isArray(中身.tags)
                    ? Array.from(new Set(中身.tags.map(normalizeTag).filter(Boolean)))
                    : [];
                const originalTags = 中身.tags || [];
                const isModified =
                  cleanedTags.length !== originalTags.length ||
                  cleanedTags.some((タグ, 番) => タグ !== originalTags[番]);
                if (isModified && Firebaseの器.db && Firebaseの器.db._delegate && 'member' !== 役割) {
                  const 場所 = Firestore.doc(
                    Firebaseの器.db,
                    `groups/${useScoreStore.getState().activeGroupId}/sessions`,
                    文書.id
                  );
                  Firestore.updateDoc(場所, { tags: cleanedTags }).catch((誤り) =>
                    console.error('[Store] Auto cleanup sync failed:', 誤り)
                  );
                }
                雲の記録.push(
                  Object.assign({}, 中身, {
                    id: 文書.id,
                    tags: cleanedTags,
                    // tags と同じように、ここで形を整えてから渡す
                    archers: 記録の射手を整える(中身),
                    syncStatus: 文書.metadata && 文書.metadata.hasPendingWrites ? '未同期' : '同期済み',
                  })
                );
              });
              const 手元の記録 = 状態().sessions;
              const 雲にあるID = new Set(雲の記録.map((記録1件) => 記録1件.id));
              const merged = 雲の記録.map((cloudSession) => {
                const pendingTimer = 状態()._pendingUpdateTimers[cloudSession.id];
                const localSession = 手元の記録.find((記録1件) => 記録1件 && 記録1件.id === cloudSession.id);
                // 送信待ちの編集は、クラウドの古い写しで上書きしない。タイマーが動いて
                // いる 800ms の間だけでなく、送信が済むまで（「未同期」の間）守る。
                if (localSession && (pendingTimer || '未同期' === localSession.syncStatus))
                  return localSession;
                return cloudSession;
              });
              // 見張りが受け取るのは直近30日・最大100件だけ。手元にあってその中に無い
              // 記録のうち、クラウドに在ったもの（serverCreatedTime 持ち）は「消された」
              // とみなして落とす。ただし見張りの窓の外（30日より前、100件に収まらず
              // 切れた分）は届かないだけなので落とさない。ここを一律に落としていた
              // せいで、30日を過ぎた記録が見張りが動くたびに履歴から消えていた
              const 窓の下 =
                雲の記録.length >= 100 ? Math.min(...雲の記録.map((記録1件) => 記録1件.date || 0)) : m_30;
              const 窓の中 = (記録) => (記録.date || 0) > 窓の下;
              const 手元だけの記録 = 手元の記録.filter(
                (記録1件) =>
                  !雲にあるID.has(記録1件.id) &&
                  (!記録1件.hasOwnProperty('serverCreatedTime') || !窓の中(記録1件))
              );
              // 完全に消したものは、クラウドにまだ残っていても画面に出さない
              const 完全削除ずみ = new Set(Object.keys(状態().permanentlyDeleted || {}));
              const 並べた記録 = [...merged, ...手元だけの記録].filter(
                (記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)
              );
              並べた記録.sort((甲, 乙) => (乙.date || 0) - (甲.date || 0));
              書く({ sessions: 並べた記録, syncStatus: '同期済み', lastSyncTime: Date.now() });
              console.log(
                `[Store] Real-time session update received: ${雲の記録.length} items (reflected deletions)`
              );
            },
            (誤り) => {
              console.error('[Store] Real-time session listener error:', 誤り);
              不具合を控える('記録の受信', 誤り);
              書く({ syncStatus: '同期エラー' });
              if (入り直せば直るか(誤り)) 書く({ 再ログインの案内: 入り直しの案内 });
            }
          );
          書く({ sessionUnsubscribe: 止める });
        },
        stopListeningToSessions: () => {
          const { sessionUnsubscribe } = 状態();
          sessionUnsubscribe &&
            (console.log('[Store] Stopping real-time session listener'),
            sessionUnsubscribe(),
            書く({ sessionUnsubscribe: null }));
        },
        listenToTrash: async () => {
          const { activeGroupId: 団体 } = 状態();
          if (!団体) return;
          const _trashDb = await waitForDb();
          if (!_trashDb) {
            console.warn('[Store] listenToTrash: db still undefined after await, aborting');
            return;
          }
          状態().stopListeningToTrash();
          console.log('[Store] Starting real-time trash listener');
          const ごみ箱の置き場 = Firestore.collection(Firebaseの器.db, `groups/${団体}/trash`);
          const 問い = Firestore.query(ごみ箱の置き場, Firestore.limit(200));
          const 止める = Firestore.onSnapshot(
            問い,
            (返り) => {
              const 雲のごみ箱 = [];
              返り.forEach((文書) => {
                const 中身 = 文書.data();
                雲のごみ箱.push(
                  Object.assign({}, 中身, {
                    id: 文書.id,
                    syncStatus: 文書.metadata && 文書.metadata.hasPendingWrites ? '未同期' : '同期済み',
                  })
                );
              });
              // 手元で捨てた印は、送信が終わるまで持ち越す。クラウドの写しには
              // この印が無いので、そのまま置き換えると数百msで消えてしまい、
              // あとで送信が失われても送り直せなくなる。
              // 写しの syncStatus が「同期済み」＝送信が終わった、なので落とす。
              const 手元のゴミ箱 = new Map(
                (状態().trash || [])
                  .filter((記録1件) => 記録1件 && 記録1件.id)
                  .map((記録1件) => [記録1件.id, 記録1件])
              );
              const 写し = 雲のごみ箱.map((記録) => {
                const 手元の = 手元のゴミ箱.get(記録.id);
                return 手元の && 手元の.pendingDelete && '未同期' === 記録.syncStatus
                  ? Object.assign({}, 記録, { pendingDelete: true })
                  : 記録;
              });
              // まだ送れていない削除は、クラウドの写しに無くても残す。ここで
              // 消すと送り直しの対象から外れ、次の全件取得で記録が復活する。
              const クラウドのid = new Set(写し.map((記録1件) => 記録1件.id));
              const 未送信の削除 = (状態().trash || []).filter(
                (記録1件) =>
                  記録1件 &&
                  記録1件.id &&
                  記録1件.pendingDelete &&
                  '未同期' === 記録1件.syncStatus &&
                  !クラウドのid.has(記録1件.id)
              );
              const 新しいゴミ箱 = 未送信の削除.length > 0 ? [...写し, ...未送信の削除] : 写し;
              新しいゴミ箱.sort((甲, 乙) => trashedAtMillis(乙) - trashedAtMillis(甲));
              // 戻したばかりでまだ送れていない記録は、クラウドのゴミ箱に写しが
              // あっても履歴から外さない。外すと復元が取り消されて見える。
              // 完全に消したものは、クラウドにまだ残っていても画面に出さない
              const 完全削除ずみ = new Set(Object.keys(状態().permanentlyDeleted || {}));
              const 出すゴミ箱 = 新しいゴミ箱.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id));
              const 捨てたid = new Set(出すゴミ箱.map((記録1件) => 記録1件.id));
              const 残す = 状態().sessions.filter(
                (記録1件) => 記録1件 && (!捨てたid.has(記録1件.id) || '未同期' === 記録1件.syncStatus)
              );
              書く({
                trash: 出すゴミ箱,
                sessions: 残す.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)),
              });
              console.log(
                `[Store] Real-time trash update received: ${雲のごみ箱.length} items (purged from sessions)`
              );
            },
            (誤り) => {
              console.error('[Store] Real-time trash listener error:', 誤り);
            }
          );
          書く({ trashUnsubscribe: 止める });
        },
        stopListeningToTrash: () => {
          const { trashUnsubscribe } = 状態();
          trashUnsubscribe &&
            (console.log('[Store] Stopping real-time trash listener'),
            trashUnsubscribe(),
            書く({ trashUnsubscribe: null }));
        },
        listenToMembers: async () => {
          const { activeGroupId: 団体 } = 状態();
          if (!団体) return;
          const _membDb = await waitForDb();
          if (!_membDb) {
            console.warn('[Store] listenToMembers: db still undefined after await, aborting');
            return;
          }
          状態().stopListeningToMembers();
          console.log('[Store] Starting real-time member listener');
          const 部員の置き場 = Firestore.collection(Firebaseの器.db, `groups/${団体}/members`);
          const 止める = Firestore.onSnapshot(
            部員の置き場,
            (返り) => {
              const 雲の部員 = [];
              返り.forEach((文書) => {
                const 中身 = 文書.data();
                雲の部員.push(Object.assign({}, 中身, { id: 文書.id, syncStatus: '同期済み' }));
              });
              // 消したのにクラウドへ届いていないメンバーは、受け取っても戻さない
              const 削除ずみ = new Set(Object.keys(状態().deletedMembers || {}));
              const 合流した = mergeById(状態().members, 雲の部員, false, true).filter(
                (部員1人) => 部員1人 && !削除ずみ.has(部員1人.id)
              );
              書く({ members: 合流した, lastSyncTime: Date.now() });
              console.log(`[Store] Real-time member update received: ${雲の部員.length} items`);
            },
            (誤り) => {
              console.error('[Store] Real-time member listener error:', 誤り);
            }
          );
          書く({ memberUnsubscribe: 止める });
        },
        stopListeningToMembers: () => {
          const { memberUnsubscribe } = 状態();
          memberUnsubscribe &&
            (console.log('[Store] Stopping real-time member listener'),
            memberUnsubscribe(),
            書く({ memberUnsubscribe: null }));
        },
        listenToAlumni: async () => {
          const { activeGroupId: 団体 } = 状態();
          if (!団体) return;
          const _alumDb = await waitForDb();
          if (!_alumDb) {
            console.warn('[Store] listenToAlumni: db still undefined after await, aborting');
            return;
          }
          状態().stopListeningToAlumni();
          console.log('[Store] Starting real-time alumni listener');
          const 卒業生の置き場 = Firestore.collection(Firebaseの器.db, `groups/${団体}/alumni`);
          const 止める = Firestore.onSnapshot(
            卒業生の置き場,
            (返り) => {
              const 雲の卒業生 = [];
              返り.forEach((文書) => {
                const 中身 = 文書.data();
                雲の卒業生.push(Object.assign({}, 中身, { id: 文書.id, syncStatus: '同期済み' }));
              });
              const 合流した = mergeById(状態().alumni, 雲の卒業生, false, true);
              書く({ alumni: 合流した, lastSyncTime: Date.now() });
              console.log(`[Store] Real-time alumni update received: ${雲の卒業生.length} items`);
            },
            (誤り) => {
              console.error('[Store] Real-time alumni listener error:', 誤り);
            }
          );
          書く({ alumniUnsubscribe: 止める });
        },
        stopListeningToAlumni: () => {
          const { alumniUnsubscribe } = 状態();
          alumniUnsubscribe &&
            (console.log('[Store] Stopping real-time alumni listener'),
            alumniUnsubscribe(),
            書く({ alumniUnsubscribe: null }));
        },
        startPeriodicSync: () => {
          状態().stopPeriodicSync();
          console.log('[Store] Starting sync (Real-time listeners + 5min config sync)');
          状態().listenToConfig();
          状態().listenToSessions();
          状態().listenToTrash();
          状態().listenToMembers();
          状態().listenToAlumni();
          状態().syncSessions();
          const 時計 = setInterval(() => {
            状態().syncSessions();
          }, 3e5);
          書く({ syncIntervalId: 時計 });
        },
        stopPeriodicSync: () => {
          const 時計 = 状態().syncIntervalId;
          時計 &&
            (console.log('[Store] Stopping periodic sync'),
            clearInterval(時計),
            書く({ syncIntervalId: null }));
          状態().stopListeningToSessions();
          状態().stopListeningToTrash();
          状態().stopListeningToMembers();
          状態().stopListeningToAlumni();
        },
        setupNetworkListener: () => {
          console.log('[Store] Setting up network listener');
          return netinfo.addEventListener((様子) => {
            const 前はつながっていた = 状態().isNetworkOnline;
            const つながっている = !(!様子.isConnected || false === 様子.isInternetReachable);
            つながっている !== 前はつながっていた &&
              (console.log('[Store] Network state changed: ' + (つながっている ? 'Online' : 'Offline')),
              書く({ isNetworkOnline: つながっている }),
              つながっている &&
                !前はつながっていた &&
                (console.log('[Store] Connection restored. Triggering auto-sync...'),
                // 電波が切れている最中にこそ失敗するので、戻ったときに出し直す。
                // 便りの仕組みが転んでも、自動同期まで巻き添えにしない
                溜まりを流し直す(),
                状態()
                  .syncSessions()
                  .catch((誤り) => console.error('[Store] Auto-sync failed:', 誤り))));
          });
        },
        incrementAllGrades: async () => {
          const { activeGroupId: 団体, alumni: 卒業生, currentFreshmanTerm, isNetworkOnline } = 状態();
          if (!団体) return;
          const 今 = Date.now();
          const 今年 = new Date().getFullYear();
          if (!isNetworkOnline)
            return void console.warn('[incrementAllGrades] Offline. Skipping promotion until online.');
          try {
            const 設定の帳面 = await Firestore.getDoc(
              Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings')
            );
            if (設定の帳面.exists()) {
              const 設定 = 設定の帳面.data();
              if (設定.lastPromotionYear && 設定.lastPromotionYear >= 今年)
                return (
                  console.log(
                    `[incrementAllGrades] Skipped: Promotion for year ${今年} already completed according to Firestore.`
                  ),
                  void 書く({ lastPromotionYear: 設定.lastPromotionYear })
                );
            }
          } catch (誤り) {
            return void console.error('[incrementAllGrades] Failed to re-verify settings:', 誤り);
          }
          let 雲の部員;
          try {
            const 返り = await Firestore.getDocs(
              Firestore.collection(Firebaseの器.db, `groups/${団体}/members`)
            );
            雲の部員 = [];
            返り.forEach((文書) => 雲の部員.push(Object.assign({}, 文書.data(), { id: 文書.id })));
          } catch (誤り) {
            return void console.error('[incrementAllGrades] Failed to fetch members:', 誤り);
          }
          console.log(
            `[Store] incrementAllGrades: Starting atomic promotion process... (${雲の部員.length} members from cloud)`
          );
          const dropUndefined = (元) => {
            const 出 = {};
            for (const 鍵 in 元) undefined !== 元[鍵] && (出[鍵] = 元[鍵]);
            return 出;
          };
          const gradeOf = (部員) => {
            const 値 = 部員 ? 部員.grade : null;
            if (null == 値 || '' === 値) return NaN;
            const 数 = Number(値);
            return isNaN(数) ? NaN : 数;
          };
          const skippedGrades = 雲の部員
            .filter((部員1人) => isNaN(gradeOf(部員1人)))
            .map((部員1人) => 部員1人.name || 部員1人.id);
          if (skippedGrades.length)
            console.warn('[incrementAllGrades] 学年が未設定のため据え置いたメンバー:', skippedGrades);
          const 進級後の部員 = [];
          雲の部員.forEach((部員) => {
            const 学年 = gradeOf(部員);
            if (isNaN(学年) || 学年 < 1 || 学年 >= 5)
              進級後の部員.push(Object.assign({}, 部員, { lastModified: 今, syncStatus: '同期済み' }));
            else if (学年 >= 4)
              進級後の部員.push(
                Object.assign({}, 部員, { grade: 5, lastModified: 今, syncStatus: '同期済み' })
              );
            else
              進級後の部員.push(
                Object.assign({}, 部員, { grade: 学年 + 1, lastModified: 今, syncStatus: '同期済み' })
              );
          });
          const 次の期 = (currentFreshmanTerm || 0) + 1;
          if (isNetworkOnline)
            try {
              const 書き込み = [];
              進級後の部員.forEach((部員) => {
                書き込み.push({
                  type: 'set',
                  ref: Firestore.doc(Firebaseの器.db, `groups/${団体}/members`, 部員.id),
                  data: dropUndefined(Object.assign({}, 部員, { lastModified: Firestore.serverTimestamp() })),
                });
              });
              書き込み.push({
                type: 'set',
                ref: Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings'),
                data: {
                  currentFreshmanTerm: 次の期,
                  lastPromotionYear: 今年,
                  lastModified: Firestore.serverTimestamp(),
                },
              });
              for (let 頭 = 0; 頭 < 書き込み.length; 頭 += 400) {
                const 切れ端 = 書き込み.slice(頭, 頭 + 400);
                const 一括 = Firestore.writeBatch(Firebaseの器.db);
                切れ端.forEach((書き込み1件) => {
                  'set' === 書き込み1件.type
                    ? 一括.set(書き込み1件.ref, 書き込み1件.data, { merge: true })
                    : 'delete' === 書き込み1件.type && 一括.delete(書き込み1件.ref);
                });
                await 一括.commit();
              }
              console.log('[Store] incrementAllGrades: Cloud sync successful.');
            } catch (誤り) {
              return (
                console.error('[incrementAllGrades] Cloud sync failed:', 誤り),
                void Alert.alert(
                  '進級処理エラー',
                  'クラウドとの同期に失敗しました。時間をおいて再度お試しください。'
                )
              );
            }
          const 卒業生の写し = 卒業生;
          書く({
            members: 進級後の部員,
            alumni: 卒業生の写し,
            currentFreshmanTerm: 次の期,
            lastPromotionYear: 今年,
            lastLocalChange: 今,
            lastSyncTime: 今,
          });
          console.log('[Store] incrementAllGrades: Promotion process completed.');
        },
        updateCurrentFreshmanTerm: async (期) => {
          const { activeGroupId, autoPromotionEnabled, tagTemplates, lastPromotionYear, isNetworkOnline } =
            状態();
          if (
            (書く({ currentFreshmanTerm: 期, lastLocalChange: Date.now() }), isNetworkOnline && activeGroupId)
          )
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                {
                  currentFreshmanTerm: 期,
                  autoPromotionEnabled,
                  tagTemplates,
                  lastPromotionYear,
                  lastModified: Firestore.serverTimestamp(),
                },
                { merge: true }
              );
              書く({ syncStatus: '同期済み', lastSyncTime: Date.now() });
            } catch (誤り) {
              console.error('Update Term Sync Error:', 誤り);
              不具合を控える('期の更新', 誤り);
              書く({ syncStatus: '同期エラー' });
            }
        },
        resetCurrentSession: (相手にも知らせる = true) => {
          if (状態().書き換えを止めるか()) return;
          const 今 = Date.now();
          // 片付けるとサーバーの marks_by_id も空になるので、控えも捨てる。
          // 残すと「前と同じだから送らなくてよい」と誤って判断する。片付けた
          // あと同じ記録を読み込み直すと、○×が片付ける前と一字一句同じに
          // なり、その送信が丸ごと飛ばされて相手の画面に出ない。
          // 知らせを受け取った側（o が偽）も、サーバーは同じく空なので捨てる
          載っている印を捨てる();
          書く({
            archers: [],
            historyStack: [],
            redoStack: [],
            activeSessionID: null,
            currentSessionTags: [],
            lastLocalChange: 今,
            lastResetHandled: 相手にも知らせる ? 今 : 状態().lastResetHandled,
            // 盤面を捨てたので、遡れる手も捨てる。ライブ中でないときに
            // historyStack を空にするのと同じ扱い。残すと、リセットしたあとの
            // 取り消しで、消したはずの盤面が戻ってくる
            historySharedLen: 0,
            historySharedMax: 0,
          });
          const { isLiveActive, liveSessionName } = 状態();
          const 枝 = ライブの枝();
          if (相手にも知らせる && isLiveActive && liveSessionName && Firebaseの器.rtdb && 枝) {
            const 盤面の場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${liveSessionName}/state`);
            RTDB.update(盤面の場所, {
              archers: [],
              marks_by_id: {},
              archer_timestamps: {},
              reset_at: 今,
              timestamp: 今,
              updated_at: RTDB.serverTimestamp(),
              // 共有履歴の目印も全員ぶん戻す
              history_len: 0,
              history_max: 0,
            }).catch((誤り) => console.error('Reset Live Sync Error:', 誤り));
            書く({ lastPushedTimestamp: 今 });
          }
        },
        recoverPassword: async (メール) => {
          if (!状態().isNetworkOnline) return { success: false, error: 'オフラインのため実行できません' };
          try {
            return (
              await FirebaseAuth.sendPasswordResetEmail(Firebaseの器.auth, メール),
              // 住所そのものは出さない。部活の共用端末では、次に使う人が
              // 開発者ツールで読める（復旧用の住所なので、知られたくない）
              console.log('[Store] パスワード再設定のメールを送りました'),
              { success: true }
            );
          } catch (誤り) {
            return (
              console.error('Password Recovery Error:', 誤り),
              { success: false, error: 誤り.message || 'パスワードリセットメールの送信に失敗しました' }
            );
          }
        },
        listenToConfig: async () => {
          const { activeGroupId: 団体 } = 状態();
          if (!団体) return;
          const _cfgDb = await waitForDb();
          if (!_cfgDb) {
            console.warn('[Store] listenToConfig: db still undefined after await, aborting');
            return;
          }
          try {
            const 設定の帳面 = await Firestore.getDoc(
              Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings')
            );
            if (設定の帳面.exists()) {
              const 設定 = 設定の帳面.data();
              console.log('[Store] Config initial fetch from cloud:', 設定);
              書く({
                autoPromotionEnabled: false !== 設定.autoPromotionEnabled,
                currentFreshmanTerm: 設定.currentFreshmanTerm || 状態().currentFreshmanTerm,
                tagTemplates: 設定.tagTemplates || 状態().tagTemplates,
                lastPromotionYear: 設定.lastPromotionYear || 状態().lastPromotionYear,
              });
            }
            const 団体の帳面 = await Firestore.getDoc(Firestore.doc(Firebaseの器.db, 'groups', 団体));
            if (団体の帳面.exists()) {
              const 団体の中身 = 団体の帳面.data();
              if (団体の中身.groupName) 書く({ activeGroupName: 団体の中身.groupName });
            }
          } catch (誤り) {
            console.warn('[Store] Initial config fetch failed (offline?), falling back to local.', 誤り);
          }
          const _existing = 状態().configUnsubscribe;
          if (_existing) {
            _existing();
            書く({ configUnsubscribe: null });
            console.log('[Store] listenToConfig: stopped existing listener');
          }
          const 設定を止める = Firestore.onSnapshot(
            Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings'),
            (返り) => {
              if (返り.exists()) {
                const 設定 = 返り.data();
                console.log('[Store] Config updated from cloud (snapshot):', 設定);
                書く({
                  autoPromotionEnabled: false !== 設定.autoPromotionEnabled,
                  currentFreshmanTerm: 設定.currentFreshmanTerm || 状態().currentFreshmanTerm,
                  tagTemplates: 設定.tagTemplates || 状態().tagTemplates,
                  lastPromotionYear: 設定.lastPromotionYear || 状態().lastPromotionYear,
                  analysisRankingSettings: 設定.analysisRankingSettings || 状態().analysisRankingSettings,
                });
              }
            },
            // 受け口を付けないと、断られたとき（出たあと・権限が変わったとき）に
            // SDK が「Uncaught Error in snapshot listener」を吐くだけで、何が起きたか残らない
            (誤り) => {
              console.error('[Store] Config listener error:', 誤り);
              不具合を控える('設定の受信', 誤り);
            }
          );
          const 団体名を止める = Firestore.onSnapshot(
            Firestore.doc(Firebaseの器.db, 'groups', 団体),
            (返り) => {
              if (返り.exists()) {
                const 団体の中身 = 返り.data();
                if (団体の中身.groupName) 書く({ activeGroupName: 団体の中身.groupName });
              }
            },
            (誤り) => {
              console.error('[Store] Group name listener error:', 誤り);
              不具合を控える('団体名の受信', 誤り);
            }
          );
          書く({
            configUnsubscribe: () => {
              設定を止める();
              団体名を止める();
            },
          });
        },
      };
    },
    {
      name: 'archery-score-storage',
      // JSON にする前の写しを受け取り、少しまとめてから書く（控えの書き出し）
      storage: 控えの置き場,
      partialize: (状態の中身) => ({
        archers: 状態の中身.archers,
        members: 状態の中身.members,
        // 端末には、予算に収まるぶんだけ残す。雲には全部あるので、
        // 次に開いたときに取り直せる。まだ送れていない記録は必ず残す
        //（落とすとその練習ぶんがどこにも無くなる。src/localTrim.js）
        sessions: 端.端末に残す記録(状態の中身.sessions, { 最後に送った時刻: 状態の中身.lastSyncTime || 0 }),
        history: 状態の中身.history,
        alumni: 状態の中身.alumni,
        trash: 状態の中身.trash,
        permanentlyDeleted: 状態の中身.permanentlyDeleted,
        deletedMembers: 状態の中身.deletedMembers,
        shotsPerRound: 状態の中身.shotsPerRound,
        activeSessionID: 状態の中身.activeSessionID,
        viewScale: 状態の中身.viewScale,
        includeInStats: 状態の中身.includeInStats,
        lastSessionTags: 状態の中身.tagTemplates,
        currentSessionTags: 状態の中身.currentSessionTags,
        activeGroupId: 状態の中身.activeGroupId,
        activeGroupName: 状態の中身.activeGroupName,
        publicGroupId: 状態の中身.publicGroupId,
        activeRole: 状態の中身.activeRole,
        activeUserEmail: 状態の中身.activeUserEmail,
        myMemberId: 状態の中身.myMemberId,
        myMemberName: 状態の中身.myMemberName,
        memberAuthVersion: 状態の中身.memberAuthVersion,
        analysisSelectedTags: 状態の中身.analysisSelectedTags,
        analysisTagLogic: 状態の中身.analysisTagLogic,
        historySelectedTags: 状態の中身.historySelectedTags,
        historyTagLogic: 状態の中身.historyTagLogic,
        tagTemplates: 状態の中身.tagTemplates,
        currentFreshmanTerm: 状態の中身.currentFreshmanTerm,
        lastPromotionYear: 状態の中身.lastPromotionYear,
        lastSyncTime: 状態の中身.lastSyncTime,
        isAdminMode: 状態の中身.isAdminMode,
        autoPromotionEnabled: 状態の中身.autoPromotionEnabled,
        analysisRankingSettings: 状態の中身.analysisRankingSettings,
        enableArrowLocation: 状態の中身.enableArrowLocation,
        自動ロックする: 状態の中身.自動ロックする,
        保存時に出欠を確認する: 状態の中身.保存時に出欠を確認する,
        横に並べる: 状態の中身.横に並べる,
        帯を畳む: 状態の中身.帯を畳む,
        帯の取っ手は左: 状態の中身.帯の取っ手は左,
        arrowTargetType: 状態の中身.arrowTargetType,
        比較のひな型: 状態の中身.比較のひな型,
        ライブの合言葉: 状態の中身.ライブの合言葉,
        ライブの続き: 状態の中身.ライブの続き,
        履歴の編集: 状態の中身.履歴の編集,
      }),
      onRehydrateStorage: () => {
        console.log('[Store] Hydration starting...');
        const 始めた時刻 = Date.now();
        return (戻した状態, 誤り) => {
          const かかった時間 = Date.now() - 始めた時刻;
          if (誤り) console.error(`[Store] Hydration error (after ${かかった時間}ms):`, 誤り);
          else if (戻した状態) {
            console.log(`[Store] Hydration finished successfully (Duration: ${かかった時間}ms)`);
            const updates = { isHydrated: true };
            if (戻した状態.sessions) {
              updates.sessions = cleanUpSessions(戻した状態.sessions);
            }
            if (戻した状態.trash) {
              updates.trash = cleanUpSessions(戻した状態.trash);
            }
            if (戻した状態.historySelectedTags) {
              updates.historySelectedTags = cleanUpTagsArray(戻した状態.historySelectedTags);
            }
            if (戻した状態.analysisSelectedTags) {
              updates.analysisSelectedTags = cleanUpTagsArray(戻した状態.analysisSelectedTags);
            }
            if (戻した状態.currentSessionTags) {
              updates.currentSessionTags = cleanUpTagsArray(戻した状態.currentSessionTags);
            }
            if (戻した状態.tagTemplates) {
              updates.tagTemplates = cleanUpTagsArray(戻した状態.tagTemplates);
            }
            if (!Array.isArray(戻した状態.archers)) {
              console.warn('[Store] archers was not an array, recovering...');
              updates.archers = [];
            }
            if (
              'number' != typeof 戻した状態.viewScale ||
              isNaN(戻した状態.viewScale) ||
              戻した状態.viewScale <= 0
            ) {
              console.warn('[Store] Invalid viewScale detected during hydration, resetting to 1.0');
              updates.viewScale = 1;
            }
            if ('function' == typeof 戻した状態.updateState) {
              戻した状態.updateState(updates);
            }
            if ('function' == typeof 戻した状態.ensurePersonalIds) {
              戻した状態.ensurePersonalIds();
            }
          } else {
            console.warn(`[Store] Hydration yielded empty state (after ${かかった時間}ms)`);
            const いまの状態 = useScoreStore.getState();
            if (
              いまの状態 &&
              false === いまの状態.isHydrated &&
              'function' == typeof いまの状態.updateState
            ) {
              console.log('[Store] Forcing isHydrated: true even for empty state');
              いまの状態.updateState({ isHydrated: true });
            }
          }
        };
      },
    }
  )
);
