/**
 * npm audit の結果を「利用者へ届くか」で仕分ける。
 *
 *   node scripts/audit-triage.mjs          （数えるだけ）
 *   node scripts/audit-triage.mjs 厳しく    （届くものがあれば失敗させる）
 *
 * ■ なぜ要るか
 * npm audit は組み立ての道具（metro・sharp・expo-cli など）の指摘も同じ重さで
 * 並べる。2026-09-03 の時点で38件出ていたが、Web の配信物に実体が載っている
 * ものは1件も無かった。critical と表示されていた protobufjs は
 * @firebase/firestore の platform/node/ からしか読まれず、ブラウザにも
 * iOS（native の Firebase SDK を使う）にも届かない。
 *
 * 毎回この見極めを手でやると、数字に慣れて本物を見落とす。だから機械に任せる。
 *
 * ■ 何を見るか
 *   ① package.json の dependencies から辿れるか（devDependencies なら届かない）
 *   ② 実際に書き出した束（dist/）に、その名前の実体が載っているか
 *
 * ②は「載っていないから安全」と断じるものではなく、①と合わせて人が判断する
 * ための材料。束が無ければ①だけで仕分ける。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const 根 = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const 厳しく = process.argv.includes('厳しく');

let 生;
try {
  生 = execSync('npm audit --json', { cwd: 根, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  // 危険が1件でもあると npm audit は 1 を返す。出力は使えるので拾う
  生 = e.stdout || '';
}
if (!生.trim()) {
  console.error('npm audit の出力を取れませんでした。');
  process.exit(1);
}
const j = JSON.parse(生);
const pkg = JSON.parse(fs.readFileSync(path.join(根, 'package.json'), 'utf8'));
const 本番の依存 = new Set(Object.keys(pkg.dependencies || {}));
const 開発の依存 = new Set(Object.keys(pkg.devDependencies || {}));

// 書き出した束（あれば）
let 束 = '';
const d = path.join(根, 'dist', '_expo', 'static', 'js', 'web');
try {
  const f = fs.readdirSync(d).find((x) => x.startsWith('AppEntry-'));
  if (f) 束 = fs.readFileSync(path.join(d, f), 'utf8');
} catch (e) {
  /* 束が無ければ依存の区分だけで見る */
}

const v = j.vulnerabilities || {};
const 順 = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
const 届く = [];
const 開発だけ = [];

for (const [名, x] of Object.entries(v)) {
  // どの直接依存から来ているかを辿る
  const 元 = [];
  const 見た = new Set();
  const 辿る = (n) => {
    if (見た.has(n)) return;
    見た.add(n);
    if (本番の依存.has(n) || 開発の依存.has(n)) return void 元.push(n);
    for (const e of (v[n] || {}).effects || []) 辿る(e);
  };
  辿る(名);

  const 本番から = 元.some((n) => 本番の依存.has(n));
  // 束に「その名前で読み込まれている形」があるかを見る。
  // 単なる文字列の一致では駄目で、sharp は 'pin-sharp' などのアイコン名に
  // 443回当たって「届く」と誤判定した（2026-09-03）。
  // node_modules の道か、取り込みの書き方に現れる形だけを数える。
  const 逃 = 名.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const 束にある = 束
    ? new RegExp(`node_modules[/\\\\]${逃}[/\\\\]|require\\(["']${逃}["']\\)|from["' ]+${逃}["']`).test(束)
    : null;

  const 行 = {
    名,
    危険: x.severity,
    元: 元.join(', ') || '(直接依存に辿れない)',
    束: 束 ? (束にある ? 'あり' : 'なし') : '（束が無い）',
    説明: (x.via || []).map((y) => (typeof y === 'object' ? y.title : y)).filter(Boolean)[0] || '',
  };
  (本番から || 束にある ? 届く : 開発だけ).push(行);
}

const 並べる = (a) => a.sort((x, y) => 順[x.危険] - 順[y.危険]);
const 重い = 届く.filter((r) => ['critical', 'high'].includes(r.危険));

console.log(`npm audit: ${Object.keys(v).length} 件\n`);
console.log(`■ 利用者へ届きうるもの（${届く.length}件 / うち重いもの ${重い.length}件）\n`);
for (const r of 並べる(届く))
  console.log(
    `  ${r.危険.padEnd(9)} ${r.名.padEnd(30)} 束:${String(r.束).padEnd(6)} ← ${r.元}\n      ${String(r.説明).slice(0, 76)}`
  );
if (!届く.length) console.log('  無し');

console.log(`\n■ 組み立ての道具（利用者には届かない・${開発だけ.length}件）\n`);
const 束ね = {};
for (const r of 開発だけ) (束ね[r.元] = 束ね[r.元] || []).push(`${r.名}(${r.危険})`);
for (const [元, 名たち] of Object.entries(束ね))
  console.log(`  ${元}\n      ${名たち.join(' / ').slice(0, 110)}`);

console.log('');
if (!束) console.log('※ dist/ が無いので、束に載っているかは見ていません。');
console.log('※ iOS を出すときは、native の依存が別なので改めて見てください。');

if (厳しく && 重い.length) {
  console.log(`\n★ 利用者へ届きうる重い指摘が ${重い.length} 件あります。`);
  process.exit(1);
}
