/**
 * 決まり（firestore.rules）を本番へ配る前に、メールの確認の猶予の日付を確かめる。
 *
 *   node scripts/check-grace.mjs        （npm run deploy:rules の頭で走る）
 *
 * 今ある団体は、確認を必須にした配信から 1 週間の猶予がある（2026-11-03 本人）。日付は
 * firestore.rules の inGracePeriod と src/mailKakunin.js の 猶予の終わり に書く。
 * 古い日付のまま初めて配ると、今ある団体が配った瞬間に全部止まる。
 *   ・猶予の終わりが 8 日より先 … 止める（猶予が長すぎる。打ち間違い）
 *   ・猶予の終わりが過ぎている … 止める。猶予が終わったあとの配信なら KAKUNIN_GRACE_OK=1 を付けて流す
 */
import fs from 'node:fs';

const 決まり = fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const 合う = 決まり.match(/function inGracePeriod\(\) \{\s*return request\.time < timestamp\.date\((\d{4}), (\d{1,2}), (\d{1,2})\)/);
if (!合う) {
  console.log('猶予の日付は決まりに無い（確かめることは無い）');
  process.exit(0);
}
const 終わり = Date.UTC(Number(合う[1]), Number(合う[2]) - 1, Number(合う[3]));
const 日 = (ms) => new Date(ms).toISOString().slice(0, 10);
const 残り日数 = (終わり - Date.now()) / 86400000;
console.log(`メールの確認の猶予の終わり: ${日(終わり)}（あと ${残り日数.toFixed(1)} 日）`);
if (残り日数 > 8) {
  console.error('止めた：猶予の終わりが 8 日より先です。配信日＋7 日にしてください（firestore.rules と src/mailKakunin.js）');
  process.exit(1);
}
if (残り日数 <= 0 && process.env.KAKUNIN_GRACE_OK !== '1') {
  console.error(
    '止めた：猶予の終わりが過ぎています。確認を必須にする初めての配信なら、配信日＋7 日に書き直してください' +
      '（firestore.rules と src/mailKakunin.js）。猶予が終わったあとの配信なら KAKUNIN_GRACE_OK=1 を付けて流してください'
  );
  process.exit(1);
}

// 4 桁の個人ID を使える終わり（配信日＋1 か月。src/kojinId.js と同じ日）。遠すぎる日付は打ち間違い
const 個人IDの終わり = 決まり.match(/function legacyIdUsable\(\) \{\s*return request\.time < timestamp\.date\((\d{4}), (\d{1,2}), (\d{1,2})\)/);
if (個人IDの終わり) {
  const 終わり2 = Date.UTC(Number(個人IDの終わり[1]), Number(個人IDの終わり[2]) - 1, Number(個人IDの終わり[3]));
  const 残り2 = (終わり2 - Date.now()) / 86400000;
  console.log(`4 桁の個人ID を使える終わり: ${日(終わり2)}（あと ${残り2.toFixed(1)} 日）`);
  if (残り2 > 35) {
    console.error('止めた：4 桁の個人ID を使える終わりが 35 日より先です。配信日＋1 か月にしてください（firestore.rules と src/kojinId.js）');
    process.exit(1);
  }
}
