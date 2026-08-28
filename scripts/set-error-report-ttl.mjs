/**
 * 不具合の便り（errorReports）を、置いた期間が過ぎたら自動で消す設定にする。
 *
 *   node scripts/set-error-report-ttl.mjs             （検証環境・いまの設定を見るだけ）
 *   node scripts/set-error-report-ttl.mjs prod        （本番・見るだけ）
 *   node scripts/set-error-report-ttl.mjs prod 変える （本番・実際に設定する）
 *
 * ■ なぜ expireAt なのか
 * Firestore の自動削除は「その項目の日時を過ぎたら消す」仕組みで、
 * 「その日時から◯日後に消す」ではない。createdAt に掛けると、送った端から
 * 消えてしまう。アプリは消したい時刻そのものを expireAt に入れて送っている
 * （src/errorReporter.js の 便りを置く日数、いまは90日）。
 *
 * ■ 従量課金プランが要る
 * Firestore の自動削除は無料枠では使えない。2026-08-29 の時点で、本番も
 * 検証環境も無料枠なので、この道具は「使えません」と答えて終わる。
 * それまでは scripts/prune-error-reports.mjs で消す。
 *
 * ■ Firebase コンソールを使わずに済ませるため
 * firebase-tools には自動削除を設定する命令が無く、gcloud も入っていない。
 * ここでは Firestore の管理APIを直に叩く。認証は Firebase CLI の権限を使う
 * （事前に `firebase login` が済んでいること）。
 *
 * 引数に「変える」を付けない限り、いまの設定を見るだけで何も書き換えない。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] || 'stg';
const 変える = process.argv[3] === '変える';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/set-error-report-ttl.mjs <stg|prod> [変える]');
  process.exit(1);
}
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
const 束 = 'errorReports';
const 項目 = 'expireAt';

const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const refresh = fs.existsSync(設定) ? JSON.parse(fs.readFileSync(設定, 'utf8')).tokens?.refresh_token : null;
if (!refresh) {
  console.error('firebase login が済んでいません');
  process.exit(1);
}
const { access_token } = await (
  await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
).json();
if (!access_token) {
  console.error('access token を取れませんでした');
  process.exit(1);
}

const 道 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/collectionGroups/${束}/fields/${項目}`;
const 頭 = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };

console.log(`接続先: ${企画}`);
console.log(`対象: ${束}.${項目}\n`);

const いま = await (await fetch(道, { headers: 頭 })).json();
if (いま.error) {
  console.error('いまの設定を読めませんでした: ' + (いま.error.message || ''));
  process.exit(1);
}
const 入っている = !!いま.ttlConfig;
console.log('いまの自動削除: ' + (入っている ? `入っている（${いま.ttlConfig.state || '状態不明'}）` : '入っていない'));

if (!変える) {
  console.log('');
  console.log(入っている ? '設定済みです。' : '設定するには、末尾に 変える を付けてください。');
  console.log('  node scripts/set-error-report-ttl.mjs ' + 対象 + ' 変える');
  process.exit(0);
}
if (入っている) {
  console.log('\nすでに入っているので、何もしません。');
  process.exit(0);
}

const 返り = await fetch(道 + '?updateMask=ttlConfig', {
  method: 'PATCH',
  headers: 頭,
  body: JSON.stringify({ ttlConfig: {} }),
});
const 結果 = await 返り.json();
if (結果.error) {
  const 文 = 結果.error.message || JSON.stringify(結果.error);
  console.error('\n設定できませんでした: ' + 文);
  if (/billing/i.test(文)) {
    console.error('');
    console.error('自動削除は従量課金プランでないと使えません。無料枠のあいだは、');
    console.error('期限の過ぎた便りを次の道具で消してください（月に一度くらい）。');
    console.error('  node scripts/prune-error-reports.mjs ' + 対象 + ' 消す');
  }
  process.exit(1);
}
console.log('\n自動削除を設定しました。');
console.log('反映（state が ACTIVE になるまで）に数分〜十数分かかります。');
console.log('もう一度この道具を引数なしで動かすと、いまの状態を見られます。');
