/**
 * 本番反映の手順そのものを検証用プロジェクトで実証する。
 *
 *   node scripts/verify-rollout.mjs
 *
 * 確かめること:
 *  1. 移行を飛ばして第2段階を入れると、部員が本当にログインできなくなるか
 *     （＝手順の順序が守られないと何が起きるか）
 *  2. 復旧用ルールで元の動作へ戻せるか
 *  3. 移行スクリプトを2回流しても壊れないか（冪等性）
 *
 * 実行後は第2段階のルールに戻す。
 */
import { execSync } from 'node:child_process';
import { configFor, signIn, signInAnonymously, req, setDoc, listAll } from './fb-rest.mjs';

const { apiKey, projectId } = configFor('stg');
const PW = 'StgTest!2026';
const G1 = '100001';
const rows = [];
const check = (name, expect, actual, note = '') => {
  const ok = (Array.isArray(expect) ? expect : [expect]).includes(actual);
  rows.push({ 項目: name, 期待: String(expect), 実際: actual, 判定: ok ? 'OK' : 'NG', 備考: note });
};
// ルールの反映は即時ではないため、切り替え後に少し待つ。
// 待たずに続けると、古いルールで評価されて結果がぶれる。
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const apply = async (which) => {
  execSync(`node scripts/apply-rules.mjs ${which} stg`, { stdio: 'pipe' });
  await wait(12000);
  console.log(`  ルールを ${which} に切り替えました（反映待ち込み）`);
};

const tokG1 = await signIn(apiKey, 'nihonu.kouka@gmail.com', PW);
const lk = await listAll(projectId, `/groups/${G1}/member_lookup`, tokG1, ['memberId']);
const pid = lk[0].id, mid = lk[0].data.memberId;

// 部員ログインの手順を、アプリと同じ順序でなぞる
const memberLogin = async () => {
  const anon = await signInAnonymously(apiKey);
  const acc = await req(projectId, `/group_accounts/${G1}`);              // 未認証で get
  if (acc.status !== 200) return { step: 'group_accounts の取得', status: acc.status };
  const look = await req(projectId, `/groups/${G1}/member_lookup/${pid}`, { token: anon.idToken });
  if (look.status !== 200) return { step: '逆引き表の取得', status: look.status };
  const claim = await setDoc(projectId, `/member_claims/${anon.uid}`,
    { groupId: G1, memberId: mid, personalId: pid, claimedAt: Date.now() }, anon.idToken);
  if (claim.status !== 200) return { step: 'クレームの作成', status: claim.status };
  const read = await req(projectId, `/groups/${G1}/sessions`, { token: anon.idToken, query: '?pageSize=1' });
  await req(projectId, `/member_claims/${anon.uid}`, { token: anon.idToken, method: 'DELETE' });
  return { step: '完了', status: read.status };
};

console.log('\n■ 1. 移行を飛ばした場合に何が起きるか');
// 逆引き表を退避してから消す（＝移行していない状態を再現）
const saved = await listAll(projectId, `/groups/${G1}/member_lookup`, tokG1, ['memberId']);
for (const d of saved) {
  await req(projectId, `/groups/${G1}/member_lookup/${d.id}`, { token: tokG1, method: 'DELETE' });
}
console.log(`  逆引き表を ${saved.length} 件削除（移行前の状態を再現）`);
const skipped = await memberLogin();
check('移行を飛ばすと部員ログインが失敗する', '逆引き表の取得', skipped.step,
  `HTTP ${skipped.status}／手順の順序が守られないと部員が締め出される`);

// 逆引き表を戻す
for (const d of saved) {
  await setDoc(projectId, `/groups/${G1}/member_lookup/${d.id}`, { memberId: d.data.memberId, updatedAt: Date.now() }, tokG1);
}
const recovered = await memberLogin();
check('逆引き表を戻すと部員ログインが回復する', '完了', recovered.step, `HTTP ${recovered.status}`);

console.log('\n■ 2. 移行スクリプトの冪等性');
const before = (await listAll(projectId, `/groups/${G1}/member_lookup`, tokG1, ['memberId'])).length;
await apply('stage1');                                    // 移行は第1段階の下で行う
execSync('node scripts/migrate-member-lookup.mjs stg --commit', { stdio: 'pipe' });
execSync('node scripts/migrate-member-lookup.mjs stg --commit', { stdio: 'pipe' });
const after = (await listAll(projectId, `/groups/${G1}/member_lookup`, tokG1, ['memberId'])).length;
check('移行を2回流しても件数が変わらない', String(before), String(after), '冪等性');

console.log('\n■ 3. 復旧用ルールで元の動作へ戻せるか');
await apply('rollback');
const anon = await signInAnonymously(apiKey);
check('復旧後：認証済みなら団体データを読める', 200,
  (await req(projectId, `/groups/${G1}/sessions`, { token: anon.idToken, query: '?pageSize=1' })).status,
  'クレーム無しの匿名でも通る＝アプリ本来の前提に戻る');
check('復旧後：未認証は依然として読めない', 403,
  (await req(projectId, `/groups/${G1}/sessions`, { query: '?pageSize=1' })).status,
  '全開には戻さない');

console.log('\n■ 4. 第2段階へ戻す');
await apply('stage2');
check('第2段階：クレーム無しの匿名は読めない', 403,
  (await req(projectId, `/groups/${G1}/sessions`, { token: anon.idToken, query: '?pageSize=1' })).status);
const final = await memberLogin();
check('第2段階：部員ログインの一連が通る', '完了', final.step, `HTTP ${final.status}`);

console.table(rows);
const fail = rows.filter((r) => r.判定 === 'NG').length;
console.log(`\n合格 ${rows.length - fail} / 不合格 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
