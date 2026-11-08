/**
 * E2E を手元のエミュレーターで流す（2026-11-08）。検証環境の 1 日の読みの枠（429）を使わない。
 *
 *   npm run e2e:emu -- [playwright の引数]      例：npm run e2e:emu -- e2e/memberInvite.spec.mjs --project=iPhone
 *
 * 前に要るもの：Java 21・束（npm run build:emu → dist-emu）・中身の控え（npm run emu:seed → e2e/.emu-data）・
 * 中継の倉庫（../chukei。部員のログインの /kojin を本物の手で受ける。scripts/emu-chukei.mjs）。
 * エミュレーターは毎回控えから立て直すので、検査が書いた中身は次の回に残らない。
 *
 * 試せないもの（配信の前の最後の 1 回は、今までどおり検証環境で流す）：AI（中継の Gemini）・App Check・
 * 確認メールの文と届き方・本物の雲の遅さと枠。AI の検査は落ちる（中継の代わりが 503 を返す）
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const 要るもの = [
  ['dist-emu/index.html', 'npm run build:emu'],
  ['e2e/.emu-data/firebase-export-metadata.json', 'npm run emu:seed'],
];
for (const [道, 作り方] of 要るもの)
  if (!fs.existsSync(道)) {
    console.error(`停止：${道} がありません。先に ${作り方} を流してください`);
    process.exit(1);
  }

// winget で入れた Java（Eclipse Temurin）は、入れた直後の窓では PATH に無いことがある
const 環境 = { ...process.env, FB_EMULATOR: '1', PW_DIST: 'dist-emu' };
const 置き場 = 'C:/Program Files/Eclipse Adoptium';
if (process.platform === 'win32' && spawnSync('java', ['-version'], { shell: true }).status !== 0 && fs.existsSync(置き場)) {
  const 版 = fs.readdirSync(置き場).filter((d) => d.startsWith('jdk-')).sort().pop();
  if (版) 環境.PATH = `${path.join(置き場, 版, 'bin')};${環境.PATH || 環境.Path || ''}`;
}

const 引数 = process.argv.slice(2).map((a) => JSON.stringify(a)).join(' ');
const 中で = `node scripts/emu-run.mjs ${引数}`;
const 結果 = spawnSync(
  'npx',
  ['firebase', 'emulators:exec', '--project', 'kyudoscoremanager-stg', '--only', 'auth,firestore,database', '--import', 'e2e/.emu-data', JSON.stringify(中で)],
  { stdio: 'inherit', env: 環境, shell: true }
);
process.exit(結果.status ?? 1);
