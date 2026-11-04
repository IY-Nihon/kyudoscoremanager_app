/**
 * 団体の登録メールアドレスの確認（2026-11-03 本人）。
 *
 * 確認メールのリンクを押すまで、団体は何もできない（今ある団体も。持ち主も部員も）。偽のアドレスでは
 * 確認メールが届かないので、偽のアドレスの団体は使えない。止めるのは決まり（firestore.rules の
 * verifiedEmail・groupVerified）で、アプリは止まっている理由と、確認の仕方を出すだけ。
 *
 * ・持ち主：認証のメールが確認済み（emailVerified）か。済んだら団体の帳面に verified: true を書く
 * ・部員：団体の帳面の verified を見る（部員の口座は匿名でメールを持たない）
 *
 * 画面から切り離してあり、道具を差し替えて検査できる（test/mailKakunin.test.js）。
 */
'use strict';

/**
 * 今ある団体の確認の猶予の終わり（この日の 0 時・日本時間では 9 時。配信から 1 週間。2026-11-03 本人）。
 * firestore.rules の inGracePeriod と同じ日にする（test/mailKakunin.test.js が見張る）。
 * 配信の日に「配信日＋7 日」へ書き直す。新しい団体は猶予なし（確認が済まないと作れない）
 */
const 猶予の終わり = '2026-11-10';
const 猶予の終わりの時刻 = Date.parse(猶予の終わり + 'T00:00:00Z');
/** 今が猶予の中か */
const 猶予中か = (今 = Date.now()) => 今 < 猶予の終わりの時刻;
/** 画面に出す猶予の終わり（「11月10日」。終わりの前の日までが使える日なので、前の日を出す） */
function 猶予の最後の日() {
  const 日 = new Date(猶予の終わりの時刻 - 86400000);
  return `${日.getUTCMonth() + 1}月${日.getUTCDate()}日`;
}

/** 確認のリンクを押したあとに戻ってくる先（アプリの頁）。web でないときは Firebase の既定の頁に任せる */
function 戻り先() {
  try {
    if (typeof window !== 'undefined' && window.location && /^https?:/.test(window.location.origin || ''))
      return { url: window.location.origin + '/' };
  } catch {
    /* 戻り先が無くても確認はできる */
  }
  return undefined;
}

/** 誤りを、見せてよい日本語にする */
function 送れない理由(誤り) {
  const 符号 = String((誤り && 誤り.code) || '');
  if (符号.includes('too-many-requests'))
    return '確認メールを続けて送りすぎました。しばらく待ってから、もう一度お試しください。';
  if (符号.includes('network-request-failed')) return '電波の良い場所でもう一度お試しください。';
  return '確認メールを送れませんでした。時間を置いてもう一度お試しください。';
}

/** 確認メールを送る（いま入っている人のアドレスへ） */
async function 確認メールを送る(FirebaseAuth, auth) {
  const 人 = auth && auth.currentUser;
  if (!人) throw new Error('ログインし直してください');
  try {
    try {
      await FirebaseAuth.sendEmailVerification(人, 戻り先());
    } catch (戻り先の誤り) {
      // 戻り先の頁が Firebase に登録されていない（検証の手元の頁など）ときは、戻り先なしで送り直す
      if (!/continue-uri|unauthorized-domain/.test(String((戻り先の誤り && 戻り先の誤り.code) || ''))) throw 戻り先の誤り;
      await FirebaseAuth.sendEmailVerification(人);
    }
  } catch (誤り) {
    throw new Error(送れない理由(誤り), { cause: 誤り });
  }
}

/**
 * 確認が済んだか。済んでいれば、決まりが見るログインの証（email_verified）も新しくする。
 * 確認のリンクは別の画面（メールのアプリなど）で開くので、端末の利用者の情報を読み直してから見る
 */
async function 確認が済んだか(auth) {
  const 人 = auth && auth.currentUser;
  if (!人) return false;
  if (!人.emailVerified) {
    await 人.reload();
    if (!(auth.currentUser && auth.currentUser.emailVerified)) return false;
  }
  // 証を取り直さないと、確認が済んでも決まりには「まだ」と見える（証は 1 時間ごとにしか新しくならない）
  await auth.currentUser.getIdToken(true);
  return true;
}

/**
 * ログインそのものが外れた誤りか（ほかの端末でパスワードを直して証が取り消された・口座が止められた・消された）。
 * このときは「確認がまだ」ではなく、入り直しの窓を出す（App.js）。電波が無いなどは当たらない
 */
const ログインが外れた符号 = [
  'auth/user-token-expired',
  'auth/user-disabled',
  'auth/user-not-found',
  'auth/invalid-user-token',
];
const ログインが外れた誤りか = (誤り) => ログインが外れた符号.includes(String((誤り && 誤り.code) || ''));

/**
 * 団体の持ち主の確認の様子（App.js が開いたとき・入り直したとき・猶予が終わったときに見る）。
 *   '済み'・'猶予中'・'持ち主がまだ' … 画面をこれに替える
 *   '入り直し' … ログインが外れている。確認の画面ではなく入り直しの窓を出す
 *     （前は確かめの失敗を「確認がまだ」と取り違え、宛先の空いた確認の画面に閉じ込めていた）
 * 確かめた（雲に問い合わせて読み直せた）ときは 確かめた: true。電波が無いときは端末が知っている前の値
 */
async function 持ち主の確認の様子(auth, 今 = Date.now()) {
  if (!auth || !auth.currentUser) return { 様子: '入り直し', 確かめた: false };
  let 済み;
  let 確かめた = true;
  try {
    済み = await 確認が済んだか(auth);
  } catch (誤り) {
    // 証が取り消されると、Firebase は端末のログインも外す（currentUser が空になる）
    if (ログインが外れた誤りか(誤り) || !auth.currentUser) return { 様子: '入り直し', 確かめた: false };
    済み = !!(auth.currentUser && auth.currentUser.emailVerified);
    確かめた = false;
  }
  if (済み) return { 様子: '済み', 確かめた };
  return { 様子: 猶予中か(今) ? '猶予中' : '持ち主がまだ', 確かめた };
}

/** 団体の帳面に「確認済み」を書く（部員が入れるようになる）。もう書いてあれば何もしない */
async function 帳面に確認済みを書く(道具, 団体ID) {
  const { Firestore, db } = 道具;
  const 場所 = Firestore.doc(db, 'group_accounts', 団体ID);
  const 帳面 = await Firestore.getDoc(場所);
  if (!帳面.exists() || (帳面.data() || {}).verified === true) return;
  await Firestore.updateDoc(場所, { verified: true });
}

/**
 * 団体の確認が済んでいるか（部員の側で見る。帳面は誰でも読める）。
 * 読めないとき（電波が無いなど）は null（止めない。決まりが雲の側で止める）
 */
async function 団体の確認は済んだか(道具, 団体ID) {
  const { Firestore, db } = 道具;
  try {
    const 帳面 = await Firestore.getDoc(Firestore.doc(db, 'group_accounts', 団体ID));
    if (!帳面.exists()) return false;
    return (帳面.data() || {}).verified === true;
  } catch {
    return null;
  }
}

/** 部員がまだ入れない団体のときの文 */
const 団体がまだの文 =
  'この団体は、登録メールアドレスの確認が済んでいないため、まだ使えません。団体の担当者に、確認メールのリンクを押してもらってください。';

module.exports = {
  猶予の終わり,
  猶予の終わりの時刻,
  猶予中か,
  ログインが外れた誤りか,
  持ち主の確認の様子,
  猶予の最後の日,
  確認メールを送る,
  確認が済んだか,
  帳面に確認済みを書く,
  団体の確認は済んだか,
  団体がまだの文,
  送れない理由,
};

/**
 * 団体の帳面（group_accounts）がまだ在るか（2026-11-03 本人：団体が消えていたらログイン画面に戻す）。
 * 雲に問い合わせて「無い」と返ったときだけ false。電波が無い・断られたなど分からないときは null（何もしない）。
 * 端末の控えから答えない（控えに無いだけで消えたと見なさない）
 */
async function 団体はまだ在るか(道具, 団体ID) {
  const { Firestore, db } = 道具;
  if (!団体ID || typeof Firestore.getDocFromServer !== 'function') return null;
  try {
    const 帳面 = await Firestore.getDocFromServer(Firestore.doc(db, 'group_accounts', 団体ID));
    return 帳面.exists();
  } catch {
    return null;
  }
}

module.exports.団体はまだ在るか = 団体はまだ在るか;
