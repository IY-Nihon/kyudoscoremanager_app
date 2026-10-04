'use strict';

/**
 * 店（useScoreStore.js）の外側の部品（2026-10-05 に useScoreStore.js から移した。中身は変えていない）。
 * 書き換える値の入れ物（場）、ライブ・同期・不具合の便り・端末への控えの手助け、使う読み込み。
 * 店を幾つかのファイルに分けたので、分けた先（storeBoard.js など）からも読めるように、一番外の名前をすべて書き出す。
 * 店そのものは、できたあとに useScoreStore.js が 場.店 に入れる（ここから useScoreStore.js を読み込むと輪になるため）
 */
/**
 * 店の外側で、場所をまたいで書き換える値の入れ物（2026-10-05）。
 * 前はファイルの一番外の let だった。店を幾つかのファイルに分けるとき、let は読み込んだ先から
 * 書き換えられないので、1 つの入れ物の項目に寄せた。項目と初めの値は、それぞれ使うところで置いている
 * （書けないと知らせた・合言葉の取り寄せ・部員を送る予約・名前を合わせている・最後に名前を合わせた時刻・載っている印・載っている射手たち・載っている射数・自分の送信中・在席の片付け・写しの片付け・サーバーとの時差・時差が取れた・時差の見張り・期限を知らせた・進級の確認を済ませた・履歴を積まない）
 */
const 場 = {};
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
場.書けないと知らせた = false;
function 書けないことを一度だけ知らせる() {
  if (場.書けないと知らせた) return;
  場.書けないと知らせた = true;
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
場.合言葉の取り寄せ = null;
// ライブを置く枝。合言葉が無ければ null を返す。
// 団体IDへ落とすと、合言葉を持つ端末と持たない端末で枝が分かれ、
// 同じ練習に入っているつもりで相手の○×が見えない形になる
//
// 合言葉は端末に残る。どの団体のものかを一緒に見ないと、団体を移った直後に
// 前の団体の枝へ書き込み、向こうの部員に今の練習が見えてしまう
function ライブの枝() {
  const 状 = 場.店.getState();
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
  const { activeGroupId: 団体, ライブの合言葉: 控え } = 場.店.getState();
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
  const { いまのライブの閲覧枝: 閲覧枝, 写しを見ているか } = 場.店.getState();
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
場.部員を送る予約 = {};
// 記録の射手の名前を、メンバーのいまの名前に合わせている最中か。と、最後に合わせた時刻（名前のずれを直す）
場.名前を合わせている = false;
場.最後に名前を合わせた時刻 = 0;
// 同期の判断に使う純粋な関数は syncRules.js へ移した。中身は変えていない。
// 呼び出し側の書き換えを避けるため、従来の1文字の名前に割り当て直す。
const 同期規則 = require('./syncRules');
const 名前の整合 = require('./memberNameSync');
const generateUniquePersonalId = 同期規則.generateUniquePersonalId;
const mergeById = 同期規則.mergeById;
const 一覧の配列 = 同期規則.一覧の配列;
const 射手の一覧を重ねる = 同期規則.射手の一覧を重ねる;
const ライブへ送る形の射手 = 同期規則.ライブへ送る形の射手;
const 射手の見比べ形 = 同期規則.射手の見比べ形;
const 届いた射手に合わせる = 同期規則.届いた射手に合わせる;
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
// 雲の記録の日時（日時型）を、手元の形（ミリ秒）にする。雲から受け取る口ではすべて通す
const 記録の日時を数に = 同期規則.記録の日時を数に;
/**
 * 控えに残す「外した記録の id」。いま外すもの（予算に入りきらないもの）に、前に外して
 * まだ雲から取り直せていないもの（手元に無いもの）を足す。後者を落とすと、取り直す前に
 * 控えが書かれたとき（電波の無い所で開いた・取り直しの前に閉じた・同期が重なって飛ばされた）
 * に一覧が空で上書きされ、外した記録が 7 日ごとの全件まで戻らなかった（2026-09-25 に気づいた）
 */
const 外した記録のid = (記録たち, 残す記録, まだ戻していない) => {
  const 全部 = Array.isArray(記録たち) ? 記録たち : [];
  const 手元にある = new Set(全部.map((記録) => 記録 && 記録.id));
  const 出 = (Array.isArray(まだ戻していない) ? まだ戻していない : []).filter(
    (id) => 'string' == typeof id && id && !手元にある.has(id)
  );
  if (残す記録.length < 全部.length) {
    const 残す = new Set(残す記録.map((記録) => 記録 && 記録.id));
    for (const 記録 of 全部) if (記録 && 記録.id && !残す.has(記録.id)) 出.push(記録.id);
  }
  return [...new Set(出)];
};
/**
 * 雲から直接読んだ答えか。端末の控え（Firestore の IndexedDB）から答えたものは偽。
 * 電波が無いと getDocs はエラーにせず控えから返す。控えには見張りで届いた新しい文書も
 * 入っているので、それで境目を進めると、その間にほかの端末が直した記録を取りこぼす
 */
const 雲から読んだか = (返り) => !(返り && 返り.metadata && 返り.metadata.fromCache);
/**
 * 記録を id で取る。in は 30 件までなので分けて問い合わせる。雲に無い id（ゴミ箱へ移った・
 * 完全に消した）は返らない
 */
const idで記録を取る = async (置き場, ids) => {
  const 一意 = [...new Set((ids || []).filter((id) => 'string' == typeof id && id))];
  if (!一意.length) return { 文書たち: [], 雲から: true };
  const 切れ端 = [];
  for (let 頭 = 0; 頭 < 一意.length; 頭 += 30) 切れ端.push(一意.slice(頭, 頭 + 30));
  // まとめて投げる（読み取りの数は同じ。順に待つと、外した記録が多い団体ほど起動が遅れる）
  const 返りたち = await Promise.all(
    切れ端.map((ids30) =>
      Firestore.getDocs(Firestore.query(置き場, Firestore.where(Firestore.documentId(), 'in', ids30)))
    )
  );
  const 出 = [];
  for (const 返り of 返りたち) 返り.forEach((文書) => 出.push(文書));
  return { 文書たち: 出, 雲から: 返りたち.every(雲から読んだか) };
};
// 雲から読んだままの中身。差分の同期の境目は、数に直す前の形で決める（日時型だけを数える。
// syncRules の 境目を進める）
const 読んだままの中身 = (返り) => {
  const 出 = [];
  返り.forEach((文書) => 出.push(文書.data()));
  return 出;
};
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
/**
 * サーバーに載っていると分かっている○×。射手id ごとに文字列で持つ。
 *
 * 盤面まるごとの送信は marks_by_id を丸ごと書き換えていた。自分の盤面から
 * 作るので、まだ受け取っていない相手の1射ぶんの送信を消してしまう。
 * 鍵をかけただけでも相手の○×が消えるのはこれが理由。
 * 変わった射手のぶんだけを書けば、触っていない射手には手が届かない。
 */
場.載っている印 = {};
const 印を並べる = (印) =>
  (Array.isArray(印) ? 印 : []).map((一つ) => (一つ == null ? '' : 一つ)).join('\u0001');
/** 受け取った内容で、載っていると分かっている○×を控え直す */
const 載っている印を控える = (印の表) => {
  if (!印の表) return;
  Object.keys(印の表).forEach((id) => {
    場.載っている印[id] = 印を並べる(印の表[id]);
  });
};
/**
 * サーバーに載っていると分かっている射手の一覧（送る形）と射数。null は分からない。
 *
 * 盤面をまとめて送る操作（人の選択・人の追加・射数・鍵など）は、前は archers と
 * shotsPerRound を毎回まるごと書いていた。2 台がほぼ同時に送ると、あとから着いたほうが、
 * まだ受け取っていない相手の変更を古い内容で消す（2026-09-26 に 2 台の e2e で再現。
 * 片方が射数を増やす間にもう片方が連打すると、射数が片方だけ戻った）。
 * 一覧はこの控えとの差だけを runTransaction で雲の一覧に重ね（射手の一覧を重ねる）、
 * 射数は変えたときだけ書く。控えは届いた盤面で取り直し、出入りと片付けで捨てる
 */
場.載っている射手たち = null;
場.載っている射数 = null;
/** ライブに出入りしたら控えは捨てる */
const 載っている印を捨てる = () => {
  場.載っている印 = {};
  場.載っている射手たち = null;
  場.載っている射数 = null;
};
/** 届いた盤面で、載っている射手と射数の控えを取り直す */
const 載っている盤面を控える = (届いた状態) => {
  if (!届いた状態) return;
  場.載っている射手たち = ライブへ送る形の射手(
    一覧の配列(届いた状態.archers).map((射手) => 射手の形にそろえる(射手, 0))
  );
  if ('number' == typeof 届いた状態.shotsPerRound) 場.載っている射数 = 届いた状態.shotsPerRound;
};
/**
 * 自分の送信を組み立てているあいだは、届いた通知を見ない。
 *
 * 本物の Realtime Database は、書いた端末の見張りへ、その場で（書き込みの呼び出しの
 * 中で）通知を配る。盤面をまとめて送るときは ○× と射数（update）と射手の一覧
 * （runTransaction）を分けて書くので、1 つ目を書いた直後の通知は「半分だけ新しい」
 * 盤面になる。届いた盤面を正にする作りでは、それで手元の変更を一度巻き戻してしまう。
 * この間に届くのは自分の書き込みだけなので、見なくても相手の手は落ちない
 */
場.自分の送信中 = 0;
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
  // ○×は、雲に載っていると分かっている内容（載っている印）から変わったますだけ書く。
  // marks_by_id を丸ごと差し替えると、まだ受け取っていない相手の1射ぶんの送信を
  // 消してしまう。射手の行まるごとでも同じで、同じ射手の別のますに相手が入れた手を、
  // それを受け取る前の古い行で消していた（2026-09-26。鍵・矢所・取り消しなど、盤面を
  // まとめて送る操作で起きる）。雲に載っているか分からない射手だけは行まるごと書く。
  // ますの数が変わったときも、増えたますを '' で足し、減ったますを null で消すだけにする
  // （行まるごとだと、射数を変えた瞬間に相手が押したますを消す。2026-09-26 に再現）
  const 変わった印 = {}; // 射手id → 行まるごと
  const 変わったます = []; // [射手id, 番, 印]
  const 日時を書く射手 = new Set();
  一覧.forEach((射手) => {
    if (!射手 || !射手.id || 射手.isSeparator) return;
    const 並び = 印を並べる(射手.marks);
    const 前の並び = 場.載っている印[射手.id];
    if (前の並び === 並び) return;
    const 今の印 = (Array.isArray(射手.marks) ? 射手.marks : []).map((一つ) => (一つ == null ? '' : 一つ));
    const 前の印 = 'string' == typeof 前の並び ? 前の並び.split('\u0001') : null;
    if (!前の印 || !今の印.length) 変わった印[射手.id] = 今の印;
    else
      for (let 番 = 0; 番 < Math.max(今の印.length, 前の印.length); 番++) {
        const 印 = 番 < 今の印.length ? 今の印[番] : null; // null は消す
        if (印 !== (番 < 前の印.length ? 前の印[番] : undefined)) 変わったます.push([射手.id, 番, 印]);
      }
    日時を書く射手.add(射手.id);
    場.載っている印[射手.id] = 並び;
  });
  const 中身 = {
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
  // 同じ射手の行とますを同じ書き込みに入れない（親と子の道が重なると断られる）
  Object.keys(変わった印).forEach((id) => {
    中身[`marks_by_id/${id}`] = 変わった印[id];
  });
  変わったます.forEach(([id, 番, 印]) => {
    中身[`marks_by_id/${id}/${番}`] = 印;
  });
  日時を書く射手.forEach((id) => {
    中身[`archer_timestamps/${id}`] = 日時の表[id] || 0;
  });
  // 射数は変えたときだけ書く。毎回書くと、相手が変えたばかりの射数を、それを受け取る前の値で戻す
  if (場.載っている射数 !== 本数) 中身.shotsPerRound = 本数;
  場.載っている射数 = 本数;
  console.log('[Store] pushLiveAll state updated, lastPushedTimestamp:', 今);
  場.店.getState().updateState({ lastPushedTimestamp: 今 });
  場.自分の送信中++;
  try {
    // 射手の一覧を先に書く。○× だけ先に載ると、受け取った側で、まだ一覧に居ない射手の ○× になる
    射手の一覧を送る(名前, `live_sessions/${枝}/${名前}/state/archers`, 送る射手);
    RTDB.update(場所, 中身).catch((誤り) => console.error('[Store] pushLiveAll Error:', 誤り));
  } finally {
    場.自分の送信中--;
  }
  写しへも流す(名前, 中身);
};
/**
 * 射手の一覧を、雲のいまの一覧に重ねて書く（syncRules.js の 射手の一覧を重ねる）。
 * 載っている控えと、中身も並びも同じなら書かない
 */
const 射手の一覧を送る = (名前, 道, 送る射手) => {
  const 基 = 場.載っている射手たち;
  const 変わった =
    !基 ||
    基.length !== 送る射手.length ||
    基.some(
      (形, 番) =>
        !形 ||
        !送る射手[番] ||
        形.id !== 送る射手[番].id ||
        射手の見比べ形(形) !== 射手の見比べ形(送る射手[番])
    );
  if (!変わった) return;
  場.載っている射手たち = 送る射手;
  RTDB.runTransaction(RTDB.ref(Firebaseの器.rtdb, 道), (いま) =>
    射手の一覧を重ねる(基, 送る射手, いま, (形) => 射手の見比べ形(形))
  )
    .then((結果) => {
      if (結果 && 結果.committed) 写しへも流す(名前, { archers: 結果.snapshot.val() || [] });
    })
    .catch((誤り) => console.error('[Store] 射手の一覧を送れませんでした:', 誤り));
};
/**
 * ライブの ○× は、届いた盤面（marks_by_id）をそのまま正とする。
 *
 * 前は射手の行まるごとを、端末の時計で付けた lastModified の新しいほうに決めていた
 * （mergeLiveArchers）。雲には 1 ますずつ書くので、雲の上では 2 台の入力が混ざって
 * いるのに、手元の行のほうが新しい端末は相手のますを捨てていた。2 台が同じ射手の
 * 別のますを続けて押すと、片方にだけ相手の○×が出ないまま残った（2026-09-26 に
 * 2 台の e2e で再現。端末の時計がずれていても同じ形になる）。
 *
 * 本物の Realtime Database が届ける値は、雲の最新に「まだ雲へ届いていない自分の
 * 書き込み」を重ねたもの。○× は押すたびにすぐ書くので、届いた値を正にすれば、
 * 自分の手も相手の手も入り、同じますの取り合いは雲の順番どおりに全員がそろう。
 * ○× 以外（名前・鍵・矢所など）も届いた盤面を正にする（届いた射手に合わせる）。
 *
 * @returns {{archers: Array, changed: boolean}}
 */
const 印を盤面に合わせる = (一覧, 印の表, 日時の表, 本数) => {
  let 変わった = false;
  const 出 = (Array.isArray(一覧) ? 一覧 : []).map((射手) => {
    if (!射手 || !射手.id || 射手.isSeparator || 射手.isTotalCalculator) return 射手;
    const 盤面の印 = 印の表 && 印の表[射手.id];
    if (!盤面の印) return 射手; // 盤面にまだ無い射手（入れる前・立てた直後）は手元のまま
    const 揃えた = 印の列にそろえる(盤面の印, 本数);
    if (印を並べる(揃えた) === 印を並べる(射手.marks)) return 射手;
    変わった = true;
    return Object.assign({}, 射手, {
      marks: 揃えた,
      lastModified: Math.max(射手.lastModified || 0, (日時の表 && 日時の表[射手.id]) || 0),
    });
  });
  return { archers: 出, changed: 変わった };
};
/** 届いた射手に合わせた結果の ○× を、届いた盤面に合わせる */
const 印は盤面を正に = (結果, 届いた, 本数) => {
  const 合わせた = 印を盤面に合わせる(
    結果.archers,
    届いた && 届いた.marks_by_id,
    届いた && 届いた.archer_timestamps,
    本数
  );
  return { archers: 合わせた.archers, changed: 結果.changed || 合わせた.changed };
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
  const その射手 = (場.店.getState().archers || []).find((射手) => 射手 && 射手.id === 射手ID);
  if (その射手) 場.載っている印[射手ID] = 印を並べる(その射手.marks);
  場.店.getState().updateState({ lastPushedTimestamp: 今 });
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
場.在席の片付け = null;
/**
 * 閲覧用の写しを見張るのをやめる係。
 *
 * 写しは live_view にあり、ふつうのライブの道とは別。stopLiveSync の off は
 * live_sessions しか外さないので、ここで別に持たないと、抜けたあとも
 * 写しが届き続けて盤面が勝手に書き換わる
 */
場.写しの片付け = null;
/** 写しを見るのをやめる */
function 写しを見るのをやめる() {
  if (場.写しの片付け) 場.写しの片付け();
  場.写しの片付け = null;
}
/** 在席をやめる。ライブから抜けたときに必ず呼ぶこと */
function 在席を終える(書く) {
  if (場.在席の片付け) 場.在席の片付け();
  場.在席の片付け = null;
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
        ライブの接続台数: 在.在席を数える(
          返り.val(),
          場.時差が取れた ? Date.now() + 場.サーバーとの時差 : null
        ),
      });
    });
    // 電波が一瞬切れても在席が古びないように、ときどき打ち直す
    const 打ち直し = setInterval(置き直す, 在.打ち直す間隔);
    // node（検査）では、走り続ける時計があるとまとめて終われない。
    // ブラウザや端末の setInterval に unref は無いので、あるときだけ呼ぶ
    if (打ち直し && 'function' == typeof 打ち直し.unref) 打ち直し.unref();
    場.在席の片付け = () => {
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
場.サーバーとの時差 = 0;
// サーバーの時計に本当に合わせられたか。
// 合わせられていないまま古いライブを消すと、端末の時計が狂っているだけで
// 全部が「14日超」に見えて、保存前の盤面ごと消えてしまう
場.時差が取れた = false;
場.時差の見張り = null;
const 時差を見張る = () => {
  if (場.時差の見張り || !Firebaseの器.rtdb) return 場.時差の見張り;
  場.時差の見張り = new Promise((解決) => {
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
            場.サーバーとの時差 = 差;
            場.時差が取れた = true;
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
  return 場.時差の見張り;
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
場.期限を知らせた = 0;
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
  if (期限 !== 場.期限を知らせた) {
    場.期限を知らせた = 期限;
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
const いまの見当 = () => Date.now() + (場.時差が取れた ? 場.サーバーとの時差 : 0);
/** サーバーの時計に合わせた「いま」。取れなければ手元の時計のまま */
const サーバー時刻 = async () => {
  if (!Firebaseの器.rtdb) return Date.now();
  await 時差を見張る();
  return Date.now() + 場.サーバーとの時差;
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
      場.店.getState().updateState({ historySharedLen: 次, historySharedMax: 次 }); // 古い手を捨てる（上限を超えた分）
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
場.進級の確認を済ませた = false;
// ライブ中の共有履歴。取り消し・やり直しを全員で1本の履歴として扱う。
// 取り消しの適用中は、その書き換え自体を履歴に積まないための目印。
場.履歴を積まない = false;
/** 共有履歴に残す手数の上限。射手20人でも 1手あたり15KB程度 */
const 共有履歴の上限 = 30;

module.exports = {
  場,
  ひ,
  秘,
  在,
  共,
  端,
  消去,
  書けないことを一度だけ知らせる,
  端末の置き場,
  控えの書き出し,
  控えの置き場,
  行動を控える,
  ライブの枝,
  団体の枝,
  道しるべの場所,
  移ったら付いていく,
  写しの場所,
  写しへも流す,
  道しるべたちを拾う,
  行動の控えを捨てる,
  溜まりを流し直す,
  入り直せば直るか,
  入り直しの案内,
  不具合を控える,
  zustand,
  _t_orig,
  FirebaseAuth,
  Firestore,
  RTDB,
  Alert,
  IS_WEB,
  generateUUID,
  middleware,
  AsyncStorage,
  netinfo,
  Firebaseの器,
  waitForDb,
  同期規則,
  名前の整合,
  generateUniquePersonalId,
  mergeById,
  一覧の配列,
  射手の一覧を重ねる,
  ライブへ送る形の射手,
  射手の見比べ形,
  届いた射手に合わせる,
  印だけの差分,
  差分を当てる,
  射数の差分,
  射数差を当てる,
  盤面を射数にそろえる,
  項目の差分,
  項目差分を当てる,
  restampChangedArchers,
  normalizeArrowLocations,
  dropUndefinedDeep,
  trashedAtMillis,
  normalizeTag,
  cleanUpTagsArray,
  参加できるライブ,
  cleanUpSessions,
  記録の射手を整える,
  記録の日時を数に,
  外した記録のid,
  雲から読んだか,
  idで記録を取る,
  読んだままの中身,
  印の列にそろえる,
  射手の形にそろえる,
  印を並べる,
  載っている印を控える,
  載っている印を捨てる,
  載っている盤面を控える,
  ライブへ盤面を送る,
  射手の一覧を送る,
  印を盤面に合わせる,
  印は盤面を正に,
  ライブへ1射を送る,
  ライブの盤面を読み取る,
  在席の場所,
  この端末,
  写しを見るのをやめる,
  在席を終える,
  在席を始める,
  履歴用に整える,
  共有履歴の場所,
  時差を見張る,
  つなげなくなった,
  弾かれたか,
  期限を控える,
  期限で閉じるか,
  期限の場所,
  いまの見当,
  サーバー時刻,
  共有履歴へ積む,
  共有履歴の目印を受け取る,
  履歴の一手,
  控えの射数,
  共有履歴の上限,
};
