/**
 * 本番相当の規模と、認証状態の遷移を検証する。
 *
 *   node scripts/verify-scale-state.mjs
 *
 * 確かめること:
 *  1. 本番と同じ168名規模で移行が通り、どれくらい時間がかかるか
 *  2. 団体 → 部員 → 団体 と切り替えたときにクレームが正しく入れ替わるか
 *  3. 同じ端末（同じ匿名uid）で別団体へログインし直せるか
 *  4. ルール内の get() が応答時間にどれだけ影響するか
 */
import { configFor, signIn, signInAnonymously, req, setDoc, listAll } from './fb-rest.mjs';

const { apiKey, projectId } = configFor('stg');
const PW = 'StgTest!2026';
const G1 = '100001', G2 = '100002';
const BIG = '100009';                      // 規模検証用の団体
const BIG_MAIL = 'stg-big@example.com';
const rows = [];
// 期待値は数値でも文字列でも渡せるようにする（型違いで誤判定しないため）
const check = (name, expect, actual, note = '') => {
  const list = (Array.isArray(expect) ? expect : [expect]).map(String);
  const ok = list.includes(String(actual));
  rows.push({ 項目: name, 期待: list.join('/'), 実際: String(actual), 判定: ok ? 'OK' : 'NG', 備考: note });
};

// ══ 1. 本番相当の規模 ════════════════════════════════════════
console.log('\n■ 1. 本番相当（168名）での移行');
const tokBig = await signIn(apiKey, BIG_MAIL, PW, { create: true });
await setDoc(projectId, `/group_accounts/${BIG}`,
  { id: BIG, name: '規模検証団体', email: BIG_MAIL, createdAt: Date.now() }, tokBig);

const existing = await listAll(projectId, `/groups/${BIG}/members`, tokBig, ['personalId']);
if (existing.length < 168) {
  process.stdout.write(`  メンバーを作成中（${existing.length} → 168）`);
  for (let i = existing.length + 1; i <= 168; i++) {
    await setDoc(projectId, `/groups/${BIG}/members/big-${String(i).padStart(3, '0')}`, {
      id: `big-${String(i).padStart(3, '0')}`,
      personalId: String(1000 + i), name: `部員${i}`,
      gender: i % 2 ? '男子' : '女子', grade: (i % 4) + 1, lastModified: Date.now(),
    }, tokBig);
    if (i % 40 === 0) process.stdout.write('.');
  }
  console.log(' 完了');
}
const members = await listAll(projectId, `/groups/${BIG}/members`, tokBig, ['personalId']);
check('本番相当のメンバー数', '168', members.length);

// 逆引き表を作り直して所要時間を測る
const old = await listAll(projectId, `/groups/${BIG}/member_lookup`, tokBig, ['memberId']);
for (const d of old) await req(projectId, `/groups/${BIG}/member_lookup/${d.id}`, { token: tokBig, method: 'DELETE' });

const t0 = Date.now();
for (const m of members) {
  await setDoc(projectId, `/groups/${BIG}/member_lookup/${m.data.personalId}`,
    { memberId: m.id, updatedAt: Date.now() }, tokBig);
}
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
const lk = await listAll(projectId, `/groups/${BIG}/member_lookup`, tokBig, ['memberId']);
check('168件の逆引き表を作成', '168', lk.length, `所要 ${elapsed} 秒`);
console.log(`  168件の投入に ${elapsed} 秒（本番も同規模）`);

// ══ 2. 状態遷移 ══════════════════════════════════════════════
console.log('\n■ 2. 団体 → 部員 → 別団体 の切り替え');
const lk1 = await listAll(projectId, `/groups/${G1}/member_lookup`, await signIn(apiKey, 'nihonu.kouka@gmail.com', PW), ['memberId']);
const tokG2 = await signIn(apiKey, 'stg-b@example.com', PW);
const lk2 = await listAll(projectId, `/groups/${G2}/member_lookup`, tokG2, ['memberId']);

const anon = await signInAnonymously(apiKey);
// 団体1の部員としてクレーム
await setDoc(projectId, `/member_claims/${anon.uid}`,
  { groupId: G1, memberId: lk1[0].data.memberId, personalId: lk1[0].id, claimedAt: Date.now() }, anon.idToken);
check('団体1の部員として読める', 200,
  (await req(projectId, `/groups/${G1}/sessions`, { token: anon.idToken, query: '?pageSize=1' })).status);
check('団体2は読めない', 403,
  (await req(projectId, `/groups/${G2}/sessions`, { token: anon.idToken, query: '?pageSize=1' })).status);

// 同じ端末で団体2の部員としてログインし直す（クレームを上書き）
check('同じ端末で団体2へクレームし直す', 200,
  (await setDoc(projectId, `/member_claims/${anon.uid}`,
    { groupId: G2, memberId: lk2[0].data.memberId, personalId: lk2[0].id, claimedAt: Date.now() }, anon.idToken)).status);
check('切替後：団体2が読める', 200,
  (await req(projectId, `/groups/${G2}/sessions`, { token: anon.idToken, query: '?pageSize=1' })).status);
check('切替後：団体1は読めなくなる', 403,
  (await req(projectId, `/groups/${G1}/sessions`, { token: anon.idToken, query: '?pageSize=1' })).status,
  '前の所属が残らない');

// ログアウト相当（クレーム削除）
check('ログアウト：クレームを削除できる', 200,
  (await req(projectId, `/member_claims/${anon.uid}`, { token: anon.idToken, method: 'DELETE' })).status);
check('ログアウト後：どの団体も読めない', 403,
  (await req(projectId, `/groups/${G2}/sessions`, { token: anon.idToken, query: '?pageSize=1' })).status);

// ══ 3. 応答時間（ルール内 get() の影響）════════════════════════
console.log('\n■ 3. 応答時間');
const measure = async (label, fn, n = 10) => {
  const ts = [];
  for (let i = 0; i < n; i++) { const s = Date.now(); await fn(); ts.push(Date.now() - s); }
  ts.sort((a, b) => a - b);
  return { label, 中央値: ts[Math.floor(n / 2)] + 'ms', 最小: ts[0] + 'ms', 最大: ts[n - 1] + 'ms' };
};
const tokG1b = await signIn(apiKey, 'nihonu.kouka@gmail.com', PW);
const anon2 = await signInAnonymously(apiKey);
await setDoc(projectId, `/member_claims/${anon2.uid}`,
  { groupId: G1, memberId: lk1[0].data.memberId, personalId: lk1[0].id, claimedAt: Date.now() }, anon2.idToken);

const timings = [
  await measure('団体アカウント（get 1件）', () =>
    req(projectId, `/groups/${G1}/sessions`, { token: tokG1b, query: '?pageSize=1' })),
  await measure('クレーム済み部員（get 最大3件）', () =>
    req(projectId, `/groups/${G1}/sessions`, { token: anon2.idToken, query: '?pageSize=1' })),
];
console.table(timings);
await req(projectId, `/member_claims/${anon2.uid}`, { token: anon2.idToken, method: 'DELETE' });

console.table(rows);
const fail = rows.filter((r) => r.判定 === 'NG').length;
console.log(`\n合格 ${rows.length - fail} / 不合格 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
