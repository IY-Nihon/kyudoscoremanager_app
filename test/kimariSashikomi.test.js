// 決まりの運営のアドレスは、公開の倉庫には例だけを書き、配るときに差し込む
// （scripts/kimari-sashikomi.mjs・scripts/fb-rest.mjs・2026-11-24 本人「例だけにする」）
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const 根 = path.join(__dirname, '..');
const 読む = (f) => fs.readFileSync(path.join(根, f), 'utf8');
const 管理者の一覧 = (決まり) => {
  const i = 決まり.indexOf('function isAdmin()');
  assert.ok(i >= 0, 'isAdmin() が無い');
  return [...決まり.slice(i, 決まり.indexOf(']', i)).matchAll(/'([^']+@[^']+)'/g)].map((m) => m[1]);
};

test('倉庫の決まりの管理者は例のアドレスだけ（本物を書かない）', async () => {
  const { 例の運営のアドレス } = await import('../scripts/fb-rest.mjs');
  for (const f of ['firestore.rules', 'rules/rollback.rules']) {
    assert.deepStrictEqual(管理者の一覧(読む(f)), [例の運営のアドレス], f);
  }
});

test('差し込むと isAdmin() の例だけが替わり、ほかは 1 字も変わらない。例に戻すと元に戻る', async () => {
  const { 差し込む, 例に戻す } = await import('../scripts/kimari-sashikomi.mjs');
  for (const f of ['firestore.rules', 'rules/rollback.rules']) {
    const 元 = 読む(f);
    const 写し = 差し込む(元, 'owner@example.org');
    assert.deepStrictEqual(管理者の一覧(写し), ['owner@example.org'], f);
    assert.strictEqual(写し.replace("'owner@example.org'", "'kanri@example.com'"), 元, f);
    assert.strictEqual(例に戻す(写し), 元, f);
  }
});

test('差し込めないときは止める（例が 1 か所でない・アドレスの形でない・例のまま）', async () => {
  const { 差し込む } = await import('../scripts/kimari-sashikomi.mjs');
  assert.throws(() => 差し込む("function isAdmin() { 'kanri@example.com' 'kanri@example.com' ]", 'a@b.jp'));
  assert.throws(() => 差し込む('function isAdmin() { ]', 'a@b.jp'));
  assert.throws(() => 差し込む("'kanri@example.com'", 'YOUR_ADMIN_EMAIL'));
  assert.throws(() => 差し込む("'kanri@example.com'", 'kanri@example.com'));
  assert.throws(() => 差し込む("'kanri@example.com'", "x'@b.jp"));
});

test('台本と決まりに書いてある gmail のアドレスは、公開の問い合わせ先と検査の見本だけ', () => {
  const 許す = new Set(['kyudoteamscorenote.dev@gmail.com', 'a@gmail.com']);
  const 出 = spawnSync(
    'git',
    ['ls-files', 'scripts', 'rules', 'firestore.rules', 'database.rules.json', 'e2e', 'test'],
    {
      cwd: 根,
      encoding: 'utf8',
    }
  );
  const 道たち =
    出.status === 0 ? 出.stdout.split('\n').filter((f) => /\.(m?js|cjs|rules|json)$/.test(f)) : [];
  assert.ok(道たち.length > 50, 'git ls-files で道を読めなかった');
  const 外れ = [];
  for (const f of 道たち) {
    if (!fs.existsSync(path.join(根, f))) continue;
    for (const m of 読む(f).matchAll(/[A-Za-z0-9._%+-]+@gmail\.com/g))
      if (!許す.has(m[0])) 外れ.push(`${f}: ${m[0].replace(/^(.).*@/, '$1…@')}`);
  }
  assert.deepStrictEqual(外れ, []);
});
