/**
 * 使い捨てメールのドメインの一覧を、雲（disposable_domains/{ドメイン}）へ入れる（2026-11-04 本人：使い捨てメールの対策を強く）。
 *
 *   npm run ops:disposable       … 本番・数えるだけ（何も書かない）
 *   npm run ops:disposable:run   … 本番・入れる
 *   node scripts/sync-disposable-domains.mjs stg [入れる]   … 検証環境
 *
 * 一覧の出どころ
 *   ・disposable-email-domains（https://github.com/disposable-email-domains/disposable-email-domains。CC0）の
 *     disposable_email_blocklist.conf（約 1 万件。誤って載せないよう、使われている普通のドメインは向こうで外してある）
 *   ・手元の一覧（src/suteMail.js の 使い捨てのドメイン。日本の捨てアドなど）
 *
 * 決まり（firestore.rules の disposableDomain）は、団体を作るときと登録メールアドレスの切り替えの仕上げで、
 * アドレスのドメインとその上の 2 段・3 段がこの一覧にあるかを見る。アプリも口座を作る前に同じ一覧を引いて断る。
 *
 * ■ 無料枠（Firestore の書き込みは 1 日 2 万回）
 * 1 回に書くのは 8,000 件まで。続きは次の日に同じ命令で入れる（どこまで入れたかを disposable_domains_meta/進み に残す。
 * 一覧が変わったら初めから）。一覧を読み直さない（1 万回の読みを使わない）。一覧から外れたドメインは消さない
 * （外れるのはまれ。消すときは手で）。
 *
 * 認証は Firebase CLI の権限を使う。事前に `firebase login` が済んでいること。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const 対象 = process.argv[2] || 'stg';
const 入れる = process.argv[3] === '入れる';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/sync-disposable-domains.mjs <stg|prod> [入れる]');
  process.exit(1);
}
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
const 一回の上限 = 8000;
const 出どころ =
  'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf';

// ── 一覧を作る ──
const 返り = await fetch(出どころ);
if (!返り.ok) {
  console.error(`一覧を取れませんでした（${返り.status}）: ${出どころ}`);
  process.exit(1);
}
const ドメインの形 = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const 外の一覧 = (await 返り.text())
  .split(/\r?\n/)
  .map((行) => 行.trim().toLowerCase())
  .filter((行) => 行 && !行.startsWith('#'));
const 手元 = require('../src/suteMail.js').使い捨てのドメイン.map((d) => d.toLowerCase());
const 一覧 = [...new Set([...外の一覧, ...手元])].filter((d) => ドメインの形.test(d)).sort();
const 落とした = 外の一覧.length + 手元.length - 一覧.length;
const 版 = crypto.createHash('sha256').update(一覧.join('\n')).digest('hex').slice(0, 16);
console.log(`接続先: ${企画}（${入れる ? '入れる' : '数えるだけ'}）`);
console.log(`一覧: ${一覧.length} 件（外の一覧 ${外の一覧.length}・手元 ${手元.length}。重なり・形の合わないもの ${落とした} 件を除いた）版 ${版}`);

// ── 権限 ──
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
const 頭 = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };
const 文書の根 = `projects/${企画}/databases/(default)/documents`;
const 根 = `https://firestore.googleapis.com/v1/${文書の根}`;

// ── どこまで入れたか（読みは 1 回） ──
const 進みの道 = `${根}/disposable_domains_meta/進み`;
const 進みの返り = await (await fetch(進みの道, { headers: 頭 })).json();
const 前の版 = 進みの返り?.fields?.版?.stringValue || '';
const 前の済み = Number(進みの返り?.fields?.済み?.integerValue || 0);
const 始め = 前の版 === 版 ? 前の済み : 0;
if (前の版 && 前の版 !== 版) console.log(`一覧が変わったので初めから入れます（前の版 ${前の版}）`);
if (始め >= 一覧.length) {
  console.log('この版はもう全部入っています。');
  process.exit(0);
}
const 今回 = 一覧.slice(始め, 始め + 一回の上限);
console.log(`今回入れる: ${始め + 1}〜${始め + 今回.length} 件目（${今回.length} 件）。残り ${一覧.length - 始め - 今回.length} 件`);
if (!入れる) {
  console.log('数えるだけです。入れるときは「入れる」を付けてください（npm run ops:disposable:run）。');
  process.exit(0);
}

// ── 入れる（500 件ずつ。1 件 1 回の書き込み） ──
const 今 = new Date().toISOString();
let 入れた = 0;
for (let 番 = 0; 番 < 今回.length; 番 += 500) {
  const 束 = 今回.slice(番, 番 + 500);
  const 送り = await fetch(`https://firestore.googleapis.com/v1/${文書の根}:commit`, {
    method: 'POST',
    headers: 頭,
    body: JSON.stringify({
      writes: 束.map((ドメイン) => ({
        update: {
          name: `${文書の根}/disposable_domains/${ドメイン}`,
          fields: {
            出どころ: { stringValue: 手元.includes(ドメイン) ? '手元' : 'disposable-email-domains' },
            入れた日: { timestampValue: 今 },
          },
        },
      })),
    }),
  });
  if (!送り.ok) {
    console.error(`書けませんでした（${送り.status}）: ${(await 送り.text()).slice(0, 300)}`);
    break;
  }
  入れた += 束.length;
  process.stdout.write(`\r入れた: ${入れた} / ${今回.length}`);
}
console.log('');
await fetch(`${進みの道}`, {
  method: 'PATCH',
  headers: 頭,
  body: JSON.stringify({
    fields: { 版: { stringValue: 版 }, 済み: { integerValue: String(始め + 入れた) }, 入れた日: { timestampValue: 今 } },
  }),
});
console.log(
  始め + 入れた >= 一覧.length
    ? '全部入りました。'
    : `続きは明日、同じ命令で入れてください（無料枠の書き込みを使い切らないよう、1 回 ${一回の上限} 件まで）。`
);
