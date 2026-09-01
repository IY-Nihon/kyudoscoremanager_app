/**
 * 配信の日に一度だけ走らせる。既存のライブの最終更新を「配信日」に揃える。
 *
 *   node scripts/stamp-live-release-day.mjs stg          （下見。何も書かない）
 *   node scripts/stamp-live-release-day.mjs stg 実行
 *   node scripts/stamp-live-release-day.mjs prod 実行
 *
 * なぜ要るか：
 *   参加一覧に「最終更新から14日を過ぎたライブは出さず、消す」を入れた。
 *   そのまま配信すると、配信した瞬間に既に14日を過ぎているライブが
 *   誰にも知らせず消える。本番には100日前・80日前のものがあり、うち1件には
 *   保存されていない射手5人ぶんの盤面が入っていた。
 *   最終更新を配信日に揃えておけば、どのライブにも14日の猶予ができる。
 *
 * 触るのは state.updated_at だけ。参加一覧が最終更新として見るのはこの値で、
 * 無ければ state.timestamp に落ちる。timestamp は「自分の送信の返り」の
 * 見分けに使う値なので触らない。射手・○×・矢所にも触れない。
 *
 * 認証は Firebase CLI の権限を使う。事前に `firebase login` が済んでいること。
 * 団体をまたいで読むため、アプリの匿名利用者の権限では足りない。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2];
const 実行する = process.argv[3] === '実行';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/stamp-live-release-day.mjs <stg|prod> [実行]');
  process.exit(1);
}
const プロジェクト = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';

/**
 * firebase CLI を叩く。
 *
 * ラッパー（firebase.cmd）は Node 20 以降 execFile から起動できず、shell 経由に
 * すると、ライブ名に空白や & が入ったときに壊れる。CLI の実体（JS）を node で
 * 直に呼べば、引数はそのまま渡るので安全。
 */
const CLI本体 = (() => {
  const 候補 = [
    path.join(process.env.APPDATA || '', 'npm/node_modules/firebase-tools/lib/bin/firebase.js'),
    '/usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js',
    '/usr/lib/node_modules/firebase-tools/lib/bin/firebase.js',
  ];
  return 候補.find((p) => p && fs.existsSync(p)) || null;
})();
const cli = (...args) => {
  if (!CLI本体) throw new Error('firebase-tools が見つかりません。npm i -g firebase-tools を確認してください');
  return execFileSync(process.execPath, [CLI本体, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
};

console.log(`接続先: ${プロジェクト}`);
console.log(実行する ? '── 実行します ──' : '── 下見です。何も書きません ──');

const 一時 = path.join(os.tmpdir(), `live-${Date.now()}.json`);
cli('database:get', '/live_sessions', '--project', プロジェクト, '--output', 一時);
const 全部 = JSON.parse(fs.readFileSync(一時, 'utf8')) || {};
fs.unlinkSync(一時);

const 配信日 = Date.now();
const 日 = 86400000;
const 対象一覧 = [];
const そのまま = [];

// 枝の名前は団体IDではなく、団体ごとの合言葉になった（src/liveSecret.js）。
// ここは live_sessions を丸ごと読むので、名前が何であれ当たる
for (const [枝, 中] of Object.entries(全部)) {
  for (const [名, v] of Object.entries(中 || {})) {
    // 名前の直下に state が無いもの（「5/8」のように / で入れ子になった残骸）は触らない
    if (!v || !v.state) {
      そのまま.push({ 枝, ライブ名: 名, 理由: 'state が無い（入れ子の残骸）' });
      continue;
    }
    // 参加一覧が見るのは updated_at（サーバーが打った時刻）。無ければ timestamp
    const t = typeof v.state.updated_at === 'number' ? v.state.updated_at : v.state.timestamp;
    if (typeof t === 'number' && t >= 配信日) {
      そのまま.push({ 枝, ライブ名: 名, 理由: '既に配信日より新しい' });
      continue;
    }
    対象一覧.push({
      枝,
      ライブ名: 名,
      これまでの最終更新: typeof t === 'number' ? new Date(t).toLocaleString('ja-JP') : '(不明)',
      経過日数: typeof t === 'number' ? Math.round(((配信日 - t) / 日) * 10) / 10 : null,
      射手数: Array.isArray(v.state.archers) ? v.state.archers.length : 0,
    });
  }
}

if (対象一覧.length) console.table(対象一覧);
if (そのまま.length) {
  console.log('触らないもの:');
  console.table(そのまま);
}

if (!実行する) {
  console.log(`\n揃える対象: ${対象一覧.length} 件。実行するには末尾に 実行 を付けてください。`);
  process.exit(0);
}

for (const x of 対象一覧) {
  const 一時2 = path.join(os.tmpdir(), `stamp-${Date.now()}.json`);
  // 参加一覧が見るのは updated_at。timestamp は「自分の送信の返り」の
  // 見分けに使う値なので触らない
  fs.writeFileSync(一時2, JSON.stringify(配信日));
  cli(
    'database:set',
    `/live_sessions/${x.枝}/${x.ライブ名}/state/updated_at`,
    一時2,
    '--project',
    プロジェクト,
    '--force'
  );
  fs.unlinkSync(一時2);
  console.log(`揃えました: ${x.団体}/${x.ライブ名}`);
}
console.log(`\n完了。${対象一覧.length} 件を ${new Date(配信日).toLocaleString('ja-JP')} に揃えました。`);
