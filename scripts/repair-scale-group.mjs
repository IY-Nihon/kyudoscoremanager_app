/**
 * 規模検証用の団体100009の見出しを元に戻す。
 *
 *   node scripts/repair-scale-group.mjs
 *
 * seed-empty-group.mjs が最初に団体IDを 100009 にしてしまい、
 * verify-scale-state.mjs が使っている group_accounts/100009 と
 * groups/100009 を上書きした。部員168人はそのまま残っているので、
 * 見出し（名前・メール）だけ元の値へ戻す。
 *
 * 検証環境専用。
 */
import { configFor, signIn, setDoc, req } from './fb-rest.mjs';

const { apiKey, projectId } = configFor('stg');
if (!apiKey || projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：.env.development.local が検証環境を指していません');
  process.exit(1);
}

const PW = 'StgTest!2026';
// verify-scale-state.mjs と同じ値
const BIG = '100009';
const BIG_MAIL = 'stg-big@example.com';

const token = await signIn(apiKey, BIG_MAIL, PW, { create: true });

await setDoc(
  projectId,
  `/group_accounts/${BIG}`,
  { id: BIG, name: '規模検証団体', email: BIG_MAIL, createdAt: Date.now() },
  token
);
console.log('group_accounts/100009 を「規模検証団体 / stg-big@example.com」に戻した');

await setDoc(projectId, `/groups/${BIG}`, { groupName: '規模検証団体' }, token);
console.log('groups/100009 の団体名を戻した');

const r = await req(projectId, `/groups/${BIG}/members`, { token, query: '?pageSize=1' });
console.log(`部員: ${r.json && r.json.documents ? '残っている' : '確認できず'}（消していない）`);
