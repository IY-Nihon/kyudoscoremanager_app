/**
 * 手元のエミュレーターで E2E を流すとき（FB_EMULATOR=1。npm run e2e:emu）、検査の側（Node）から雲へ投げる問い合わせを
 * エミュレーターへ向け直す（2026-11-08）。scripts/fb-rest.mjs や検査の中の fetch はそのまま書ける。
 *   ・Identity Toolkit・Secure Token → Auth エミュレーター（9099）
 *   ・Firestore の REST → Firestore エミュレーター（8080）
 *   ・Firebase CLI の合鍵（oauth2 の token）→ 'owner'（エミュレーターは Bearer owner を管理の資格として決まりを通さない）
 * Firebase CLI（database:set など）は、firebase emulators:exec が渡す FIREBASE_DATABASE_EMULATOR_HOST で手元へ向く
 */
const 元 = globalThis.fetch;
if (!globalThis.__エミュレーターへ向けた) {
  globalThis.__エミュレーターへ向けた = true;
  globalThis.fetch = async (宛先, 頼み) => {
    let 道 = typeof 宛先 === 'string' ? 宛先 : 宛先 instanceof URL ? 宛先.href : 宛先.url;
    if (/^https:\/\/(oauth2\.googleapis\.com\/token|www\.googleapis\.com\/oauth2\/)/.test(道))
      return new Response(JSON.stringify({ access_token: 'owner', expires_in: 3600 }), { status: 200 });
    道 = 道
      .replace('https://identitytoolkit.googleapis.com/', 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/')
      .replace('https://securetoken.googleapis.com/', 'http://127.0.0.1:9099/securetoken.googleapis.com/')
      .replace('https://firestore.googleapis.com', 'http://127.0.0.1:8080');
    return 元(typeof 宛先 === 'string' || 宛先 instanceof URL ? 道 : new Request(道, 宛先), 頼み);
  };
}
