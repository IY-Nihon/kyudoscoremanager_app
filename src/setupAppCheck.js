/**
 * App Check の用意（web）。
 *
 * Firestore・Realtime Database・認証へのアクセスが、このアプリから来たものかを
 * reCAPTCHA v3 で確かめる。プライバシーポリシー第16条第3項が安全管理措置として
 * 挙げている「Firebase App Check による不正なアクセスの防止」の中身
 * （2026-09-24 まではログを出すだけの空の関数で、記載と実態が食い違っていた）。
 *
 * ■ 鍵
 * reCAPTCHA v3 のサイトキーを EXPO_PUBLIC_RECAPTCHA_SITE_KEY（.env）に置く。公開の鍵なので
 * 束に入ってよい。秘密の鍵は Firebase コンソールの App Check に登録するだけで、アプリには置かない。
 * サイトキーが無い版（検証環境の束など）では何もしない。
 *
 * ■ 手元（localhost・127.0.0.1）
 * reCAPTCHA は登録したドメインでしか通らないので、手元では debug の印を使う。
 * EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN があればそれを、無ければ SDK が作って console に出す
 * （出た印を Firebase コンソールの App Check →「デバッグ トークンを管理」に登録する）。
 *
 * ■ 強制（enforce）
 * 強制はコンソールで、アプリが行き渡ってから入れる。強制する前は、印が無い・取れない
 * アクセスもそのまま通る（古い版の端末、reCAPTCHA が読めない端末）。
 *
 * （ソースマップからの復元時は module_195.js という名前だった）
 */
'use strict';

/**
 * 書き出しの時に焼き込まれる値。Expo は process.env.EXPO_PUBLIC_… と**そのまま書いた所だけ**を
 * 値に置き換える（process.env を変数に入れて読むと、web では空になる）
 */
const 焼き込み = () => ({
  EXPO_PUBLIC_RECAPTCHA_SITE_KEY: process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY,
  EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN: process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN,
});

/** 手元の開発かテストの端末か（reCAPTCHA が通らない） */
const 手元か = (場所) => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(String((場所 && 場所.hostname) || ''));

/**
 * reCAPTCHA の小さな札（右下に出る）を隠す。記録画面の「終了・保存」に重なるため。
 * 隠すときは、Google の決まりにしたがって「reCAPTCHA で守られている」旨を画面に書く
 * （ログイン画面の下。src/LoginScreen.js の reCAPTCHA の断り）
 */
function 札を隠す(文書) {
  if (!文書 || !文書.head || 文書.getElementById('recaptcha-badge-hidden')) return;
  const 型 = 文書.createElement('style');
  型.id = 'recaptcha-badge-hidden';
  型.textContent = '.grecaptcha-badge{visibility:hidden !important;}';
  文書.head.appendChild(型);
}

/**
 * @param {object} firebaseApp
 * @param {{環境?: object, 窓?: any, AppCheck?: any}} [差し替え] 検査用
 * @returns {object|null} App Check の器（使わないときは null）
 */
const setupAppCheck = (firebaseApp, 差し替え = {}) => {
  const 環境 = 差し替え.環境 || 焼き込み();
  const 窓 = 'undefined' !== typeof 差し替え.窓 ? 差し替え.窓 : 'undefined' !== typeof window ? window : null;
  try {
    const サイトキー = 環境.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!窓 || !サイトキー) {
      console.log('[AppCheck] サイトキーが無いので使いません');
      return null;
    }
    if (手元か(窓.location)) {
      // true を渡すと SDK が印を作って console に出す
      窓.FIREBASE_APPCHECK_DEBUG_TOKEN = 環境.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN || true;
    }
    札を隠す(窓.document);
    const AppCheck = 差し替え.AppCheck || require('firebase/app-check');
    const 器 = AppCheck.initializeAppCheck(firebaseApp, {
      provider: new AppCheck.ReCaptchaV3Provider(サイトキー),
      // 印は 1 時間ほどで切れる。切れる前に取り直させる
      isTokenAutoRefreshEnabled: true,
    });
    console.log('[AppCheck] reCAPTCHA v3 で始めました');
    return 器;
  } catch (誤り) {
    // 用意できなくてもアプリは止めない（強制する前は、印が無くても通る）
    console.warn('[AppCheck] 用意できませんでした:', 誤り);
    return null;
  }
};

/** App Check を使っているか（ログイン画面の reCAPTCHA の断りを出すか） */
const AppCheckを使うか = (環境 = 焼き込み()) => !!環境.EXPO_PUBLIC_RECAPTCHA_SITE_KEY;

Object.defineProperty(exports, '__esModule', { value: true });
exports.setupAppCheck = setupAppCheck;
exports.AppCheckを使うか = AppCheckを使うか;
exports.手元か = 手元か;
