/**
 * 本番向けに dist/ を書き出す。
 *
 *   node scripts/build-prod.mjs   （npm run deploy:web から呼ばれる）
 *
 * build-stg.mjs と対になっている。違いは接続先だけ。
 *
 * --clear が要る理由：
 *   expo export は Metro のキャッシュを使い回すため、検証向けに書き出した
 *   あと（npm run build:stg）に --clear なしで流すと、.env を読み直さず
 *   検証環境を向いた束ができる。実際に再現している。
 *
 * 書き出したあと、焼き込まれた接続先を確かめてから終わる。
 * 配る直前にも firebase.json の predeploy が同じ確認をするので、
 * ここを抜けても本番へは出ないが、早く気づけるほうがよい。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const 本番 = 'kyudoscoremanager';

console.log('本番向けに書き出します…');
const 結果 = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--clear'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (結果.status !== 0) process.exit(結果.status ?? 1);

const 置き場 = path.join('dist', '_expo', 'static', 'js', 'web');
const 束 = fs.readdirSync(置き場).find((f) => f.startsWith('AppEntry-') && f.endsWith('.js'));
const 中身 = fs.readFileSync(path.join(置き場, 束), 'utf8');
const m = 中身.match(/projectId:"([a-z0-9-]+)"/);
if (!m || m[1] !== 本番) {
  console.error(`停止：書き出した束の接続先が ${m ? m[1] : '不明'} になっています`);
  process.exit(1);
}
// expo が作る index.html の既定値を直す（lang="en" とタイトル）
const 直し = spawnSync(process.execPath, ['scripts/patch-index-html.mjs'], { stdio: 'inherit' });
if (直し.status !== 0) process.exit(直し.status ?? 1);

console.log(`\n完了。接続先: ${m[1]}`);
