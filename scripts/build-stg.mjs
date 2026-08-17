/**
 * 検証環境向けに dist/ を書き出す。
 *
 *   npm run build:stg
 *
 * expo export は既定で .env（＝本番）を読む。そのままだと検証のつもりで
 * 本番につながった dist/ ができあがるので、.env.development.local の値を
 * 環境変数として先に入れてから呼ぶ。
 *
 * 書き出したあと、焼き込まれた接続先を確かめてから終わる。
 * ここを飛ばすと、本番に向いた dist/ で検査を流すことになる。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const 設定ファイル = '.env.development.local';
if (!fs.existsSync(設定ファイル)) {
  console.error(`停止：${設定ファイル} がありません`);
  process.exit(1);
}

const 環境 = { ...process.env };
for (const 行 of fs.readFileSync(設定ファイル, 'utf8').split(/\r?\n/)) {
  const m = 行.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) 環境[m[1]] = m[2].trim();
}

if (環境.EXPO_PUBLIC_FIREBASE_PROJECT_ID !== 'kyudoscoremanager-stg') {
  console.error('停止：.env.development.local が検証環境を指していません');
  process.exit(1);
}

console.log('検証環境向けに書き出します…');
const 結果 = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--clear'], {
  stdio: 'inherit',
  env: 環境,
  shell: process.platform === 'win32',
});
if (結果.status !== 0) process.exit(結果.status ?? 1);

// 焼き込まれた接続先を確かめる
const 置き場 = path.join('dist', '_expo', 'static', 'js', 'web');
const 束 = fs.readdirSync(置き場).find((f) => f.startsWith('AppEntry-') && f.endsWith('.js'));
const 中身 = fs.readFileSync(path.join(置き場, 束), 'utf8');
const m = 中身.match(/projectId:"([a-z-]+)"/);
if (!m || m[1] !== 'kyudoscoremanager-stg') {
  console.error(`停止：書き出した束の接続先が ${m ? m[1] : '不明'} になっています`);
  process.exit(1);
}
// expo が作る index.html の既定値を直す（lang="en" とタイトル）
const 直し = spawnSync(process.execPath, ['scripts/patch-index-html.mjs'], { stdio: 'inherit' });
if (直し.status !== 0) process.exit(直し.status ?? 1);

console.log(`\n完了。接続先: ${m[1]}`);
