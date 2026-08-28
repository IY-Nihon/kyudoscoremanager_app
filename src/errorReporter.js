/**
 * Module ID: errorReporter
 *
 * 不具合の便りを実際に送るところ。決まりは errorReport.js にあり、ここは
 * 「Firestore へ入れる」「端末に貯める」という手立てを差し込むだけにしてある。
 *
 * 送り先は Firestore の errorReports。書き込みだけ許し、読み出しは誰にも
 * 許していない（firestore.rules）。
 *
 * 起動時と、回線がつながり直したときに 溜まりを流す を呼ぶ。電波の切れている
 * 最中にこそ失敗するので、送れなかった便りを捨ててしまうと何も残らない。
 */
'use strict';

const 決まり = require('./errorReport');
const 蔵 = require('./useAsyncStorage_202');
const F = require('./module_188');
const fb = require('./db_178');

const 貯めの鍵 = 'kyudo-error-queue';
/** 送りきるのを待つ時間。これを過ぎたら貯めに回し、つながったときに出し直す */
const 送るのを待つ時間 = 10000;

/**
 * 便りを置いておく日数。この先の日付を expireAt に入れて送る。
 *
 * Firestore の自動削除（TTL）は「その項目の日時を過ぎたら消す」仕組みで、
 * 「その日時から◯日後に消す」ではない。createdAt に掛けると、送った端から
 * 消えてしまう。消したい時刻そのものを別の項目に入れる。
 *
 * 実際に消えるのは、Firebase 側で errorReports の expireAt に自動削除を
 * 設定したあと（scripts/set-error-report-ttl.mjs）。設定していなければ
 * この項目はただの日付として残るだけで、害は無い。
 */
const 便りを置く日数 = 90;

// 端末に貯める。AsyncStorage は非同期なので、読み書きは控えを介して行う。
// 起動時に一度読み、以後はこの控えを正とする（不具合の最中に await を挟むと
// そこでまた落ちることがある）
let 貯めの控え = [];
let 読み込んだ = !1;

async function 貯めを読み込む() {
  if (読み込んだ) return;
  読み込んだ = !0;
  try {
    const 文 = await 蔵.default.getItem(貯めの鍵);
    if (文) {
      const x = JSON.parse(文);
      if (Array.isArray(x)) 貯めの控え = x;
    }
  } catch (e) {
    // 壊れていたら捨てる。不具合の控えのために起動を止める意味はない
    貯めの控え = [];
  }
}

function 貯めを書く(x) {
  貯めの控え = x;
  try {
    // setItem は約束を返す。受け取らずに捨てると、保存領域がいっぱいのときに
    // 「投げっぱなしの約束」になり、それをこちらの見張りが不具合として拾って
    // また貯めに書きにいく。控えの保存が不具合を生む形になるので、必ず受ける
    const 約束 = 蔵.default.setItem(貯めの鍵, JSON.stringify(x));
    if (約束 && 約束.catch) 約束.catch(() => {});
  } catch (e) {
    /* 保存できなくても、この起動のあいだは控えに残る */
  }
}

const 係 = 決まり.送り係をつくる({
  送る: async (便) => {
    if (!fb.db) throw new Error('Firestore がまだ用意できていない');
    // createdAt は Firestore 側の時刻。端末の時計が狂っていても並べられる。
    // 電波が無いと Firestore は失敗せずに黙って待ち続けるので、時間で見切る。
    // 見切らないと、アプリを閉じた時点で便りごと消える
    await 決まり.間に合わなければ諦める(
      F.addDoc(
        F.collection(fb.db, 'errorReports'),
        Object.assign(決まり.外向きの形(便), {
          createdAt: new Date(),
          expireAt: new Date(Date.now() + 便りを置く日数 * 86400000),
        })
      ),
      送るのを待つ時間
    );
  },
  読む: () => 貯めの控え,
  書く: 貯めを書く,
});

/** いまの状況を、人を特定しない範囲で集める */
function いまの様子() {
  let 状態 = {};
  try {
    // 循環参照を避けるため、必要になった時点で読む
    const s = require('./JP_useScoreStore_174').useScoreStore.getState();
    状態 = {
      団体id: s.activeGroupId || '',
      役割: s.activeRole || '',
      回線: !1 !== s.isNetworkOnline,
    };
  } catch (e) {
    /* 起動のごく初期は取れない */
  }
  let 端末 = '';
  try {
    端末 =
      'undefined' != typeof navigator && navigator.userAgent
        ? navigator.userAgent
        : 'undefined' != typeof process && process.platform
          ? process.platform
          : '';
  } catch (e) {
    /* 端末が分からなくても送る */
  }
  let 版 = '';
  try {
    版 = require('./JP_WhatsNewModal').NOTICE_VERSION || '';
  } catch (e) {
    /* 版が分からなくても送る */
  }
  return Object.assign({ 版, 端末 }, 状態);
}

/**
 * 不具合を1つ送る。送れなければ端末に貯めて、つながったときに出し直す。
 * 呼ぶ側は待たなくてよい（待つと、失敗の後始末が遅れる）。
 *
 * @param {string} 出どころ 何をしていて起きたか（例: 'クラウドへ同期'）
 * @param {Error|string} 誤り
 */
function 不具合を送る(出どころ, 誤り) {
  try {
    const 便 = 決まり.不具合の便を組む(誤り, Object.assign({ 出どころ }, いまの様子()));
    return 係.出す(便);
  } catch (e) {
    // 送る仕組みが落ちてアプリを巻き込むのは本末転倒
    console.warn('[errorReporter] 便りを組めませんでした', e);
    return Promise.resolve(!1);
  }
}

/** 貯まっているぶんを出し直す。起動時と、つながり直したときに呼ぶ */
async function 溜まりを流す() {
  await 貯めを読み込む();
  return 係.溜まりを流す();
}

/** いま貯まっている件数。設定の画面に出す */
function 貯まっている数() {
  return 貯めの控え.length;
}

/**
 * 画面の外で起きた不具合も拾う。
 * 約束の投げっぱなし（unhandledrejection）は、同期の失敗のように
 * catch を書き忘れた場所で出る。ここで拾わないと誰にも届かない。
 */
function 見張りを始める() {
  if ('undefined' == typeof window || !window.addEventListener) return () => {};
  const 誤り = (e) => 不具合を送る('画面の外', (e && e.error) || (e && e.message) || e);
  const 投げっぱなし = (e) => 不具合を送る('約束の投げっぱなし', (e && e.reason) || e);
  window.addEventListener('error', 誤り);
  window.addEventListener('unhandledrejection', 投げっぱなし);
  return () => {
    window.removeEventListener('error', 誤り);
    window.removeEventListener('unhandledrejection', 投げっぱなし);
  };
}

module.exports = {
  不具合を送る,
  溜まりを流す,
  貯まっている数,
  見張りを始める,
  行動を残す: 決まり.行動を残す,
  行動を捨てる: 決まり.行動を捨てる,
};
