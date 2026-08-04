/**
 * 「新規アカウントが作成できない」問題の再現と、修正の確認。
 *
 *   node scripts/verify-registration-fix.mjs
 *
 * 本番のルールが「復元作業のため、一時的に全てのアクセスを許可します」に
 * なっていたのは、新規団体の作成ができなくなったためと分かった。
 * その原因が本当に group_accounts の write 条件なのかを、当時のルールを
 * 検証環境に流して再現し、修正版で解消することを確かめる。
 *
 * 実行後は第2段階のルールに戻す。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { configFor, signIn, req, setDoc } from './fb-rest.mjs';

const { apiKey, projectId } = configFor('stg');
const PW = 'StgTest!2026';
const rows = [];
const check = (name, expect, actual, note = '') => {
  const list = (Array.isArray(expect) ? expect : [expect]).map(String);
  const ok = list.includes(String(actual));
  rows.push({ 項目: name, 期待: list.join('/'), 実際: String(actual), 判定: ok ? 'OK' : 'NG', 備考: note });
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 任意のルールファイルを検証環境へ流す
const deploy = async (path, label) => {
  fs.copyFileSync(path, 'firestore.rules');
  execSync('npx firebase deploy --only firestore:rules --project kyudoscoremanager-stg', { stdio: 'pipe' });
  await wait(12000);
  console.log(`  ${label} を適用しました`);
};

// アプリの新規登録と同じ手順をなぞる
const register = async () => {
  const stamp = Date.now();
  const gid = String(300000 + (stamp % 90000));
  const mail = `stg-reg-${stamp}@example.com`;
  // 1) 空き団体IDの確認（未認証で get）
  const probe = await req(projectId, `/group_accounts/${gid}`);
  if (![200, 404].includes(probe.status)) return { step: '空きIDの確認', status: probe.status };
  // 2) アカウント作成（ここで一般ユーザーとしてサインインした状態になる）
  const token = await signIn(apiKey, mail, PW, { create: true });
  // 3) group_accounts の作成
  const created = await setDoc(projectId, `/group_accounts/${gid}`,
    { id: gid, name: '新規登録テスト', email: mail, createdAt: stamp }, token);
  if (created.status !== 200) return { step: 'group_accounts の作成', status: created.status, gid, token };
  return { step: '完了', status: 200, gid, token };
};

console.log('\n■ 1. 当時のルール（リポジトリ版）で再現する');
await deploy('_archive/firestore.rules.before-enforcement', 'リポジトリ版の firestore.rules');
const old = await register();
check('当時のルールでの新規登録', 'group_accounts の作成', old.step,
  `HTTP ${old.status}／これが全開にせざるを得なかった原因`);

console.log('\n■ 2. 修正版（第1段階）で解消するか');
await deploy('rules/stage1.rules', '第1段階のルール');
const fixed = await register();
check('第1段階での新規登録', '完了', fixed.step, `HTTP ${fixed.status}`);

// 登録した団体で通常の操作ができるところまで確認する
if (fixed.token) {
  check('登録直後にデータを書ける', 200,
    (await setDoc(projectId, `/groups/${fixed.gid}/config/app_settings`,
      { currentFreshmanTerm: 53, autoPromotionEnabled: true }, fixed.token)).status);
  check('登録直後にメンバーを追加できる', 200,
    (await setDoc(projectId, `/groups/${fixed.gid}/members/reg-001`,
      { id: 'reg-001', personalId: '4321', name: '登録直後の部員', lastModified: Date.now() }, fixed.token)).status);
  check('自分の団体を読める', 200,
    (await req(projectId, `/groups/${fixed.gid}/members`, { token: fixed.token, query: '?pageSize=1' })).status);
}

console.log('\n■ 3. 第2段階でも新規登録が通るか');
await deploy('rules/stage2.rules', '第2段階のルール');
const s2 = await register();
check('第2段階での新規登録', '完了', s2.step, `HTTP ${s2.status}`);
if (s2.token) {
  check('第2段階：登録直後にメンバーを追加できる', 200,
    (await setDoc(projectId, `/groups/${s2.gid}/members/reg-001`,
      { id: 'reg-001', personalId: '4321', name: '登録直後の部員', lastModified: Date.now() }, s2.token)).status);
  check('第2段階：自分の団体を読める', 200,
    (await req(projectId, `/groups/${s2.gid}/members`, { token: s2.token, query: '?pageSize=1' })).status);
}

console.table(rows);
const fail = rows.filter((r) => r.判定 === 'NG').length;
console.log(`\n合格 ${rows.length - fail} / 不合格 ${fail}`);
console.log('\n※ 検証で作った団体は stg 上に残ります');
process.exit(fail === 0 ? 0 : 1);
