/**
 * 「アカウントを削除する」の決まり（firestore.rules）が、本物の Firestore で
 * 意図どおりに効くかを確かめる。検証環境に使い捨ての団体を作り、
 * src/accountDeletion.js と同じ順で写して消し、最後に口座も消す。
 *
 *   node scripts/check-account-deletion.mjs          （検証環境。本番では動かさない）
 *
 * 見たいのは5つ。
 *   1. 持ち主は deleted_accounts/{自分の団体} とその下位に書ける
 *   2. 持ち主は書いたあとも deleted_accounts を読めない（運営者だけ）
 *   3. 持ち主は groups の下位・groups・private・group_accounts を消せる（この順で）
 *   4. 持ち主は**他の団体**の deleted_accounts には書けない
 *   5. 口座（Firebase Auth）を自分で消せる
 *
 * 決まりを検証環境に配ってから動かす：
 *   npx firebase deploy --only firestore:rules --project kyudoscoremanager-stg
 */
import { configFor, signIn, req, setDoc } from './fb-rest.mjs';

const 対象 = 'stg';
const { apiKey, projectId } = configFor(対象);
if (projectId !== 'kyudoscoremanager-stg') {
  console.error('検証環境の設定（.env.development.local）が見つかりません');
  process.exit(1);
}

const 団体 = 'DEL' + String(Date.now()).slice(-6);
const 宛先 = `del-check-${Date.now()}@example.com`;
const 合言葉 = 'DelCheck!2026';

let だめ = 0;
const 見る = (題, 良いか, 添え) => {
  console.log(`  ${良いか ? 'ok ' : '★  '} ${題}${添え ? '  … ' + 添え : ''}`);
  if (!良いか) だめ++;
};
const 消す = (道, token) => req(projectId, `/${道}`, { token, method: 'DELETE' });
const 読む = (道, token) => req(projectId, `/${道}`, { token });

console.log(`${projectId} に使い捨ての団体 ${団体} を作って確かめます\n`);
const token = await signIn(apiKey, 宛先, 合言葉, { create: true });

// ── 種をまく（持ち主として） ──
let r = await setDoc(projectId, `/group_accounts/${団体}`, { id: 団体, email: 宛先 }, token);
見る('group_accounts を作れる', r.status === 200, `HTTP ${r.status}`);
r = await setDoc(projectId, `/group_accounts/${団体}/private/consent`, { 版: '2026-08-31' }, token);
見る('private/consent を作れる', r.status === 200, `HTTP ${r.status}`);
r = await setDoc(projectId, `/groups/${団体}`, { groupName: '削除の検査' }, token);
見る('groups を作れる', r.status === 200, `HTTP ${r.status}`);
r = await setDoc(projectId, `/groups/${団体}/sessions/s1`, { id: 's1', title: '練習', date: Date.now() }, token);
見る('sessions を作れる', r.status === 200, `HTTP ${r.status}`);
r = await setDoc(projectId, `/groups/${団体}/members/m1`, { id: 'm1', name: '部員1' }, token);
見る('members を作れる', r.status === 200, `HTTP ${r.status}`);

// ── 1. 写す ──
r = await setDoc(projectId, `/deleted_accounts/${団体}/sessions/s1`, { id: 's1', title: '練習' }, token);
見る('1. 持ち主は deleted_accounts の下位に書ける', r.status === 200, `HTTP ${r.status}`);
r = await setDoc(projectId, `/deleted_accounts/${団体}`, { id: 団体, email: 宛先, deletedAt: Date.now(), expireAt: Date.now() + 30 * 86400000 }, token);
見る('1. 持ち主は deleted_accounts の文書を書ける', r.status === 200, `HTTP ${r.status}`);

// ── 2. 読めない ──
r = await 読む(`deleted_accounts/${団体}`, token);
見る('2. 持ち主でも deleted_accounts は読めない', r.status === 403, `HTTP ${r.status}`);
r = await 読む(`deleted_accounts/${団体}/sessions/s1`, token);
見る('2. 持ち主でも deleted_accounts の下位は読めない', r.status === 403, `HTTP ${r.status}`);

// ── 4. 他の団体には書けない ──
r = await setDoc(projectId, `/deleted_accounts/100001/sessions/x`, { id: 'x' }, token);
見る('4. 他の団体の deleted_accounts には書けない', r.status === 403, `HTTP ${r.status}`);

// ── 3. 消す（順番どおり） ──
r = await 消す(`groups/${団体}/sessions/s1`, token);
見る('3. sessions を消せる', r.status === 200, `HTTP ${r.status}`);
r = await 消す(`groups/${団体}/members/m1`, token);
見る('3. members を消せる', r.status === 200, `HTTP ${r.status}`);
r = await 消す(`groups/${団体}`, token);
見る('3. groups の文書を消せる', r.status === 200, `HTTP ${r.status}`);
r = await 消す(`group_accounts/${団体}/private/consent`, token);
見る('3. private/consent を消せる', r.status === 200, `HTTP ${r.status}`);
r = await 消す(`group_accounts/${団体}`, token);
見る('3. group_accounts を消せる（最後）', r.status === 200, `HTTP ${r.status}`);
r = await 読む(`group_accounts/${団体}`, null);
見る('3. 消したあと、団体IDの帳面は無い', r.status === 404, `HTTP ${r.status}`);
// group_accounts が無くなったあとは、写しにも書けない（持ち主を確かめられない）
r = await setDoc(projectId, `/deleted_accounts/${団体}/sessions/s2`, { id: 's2' }, token);
見る('3. group_accounts を消したあとは写しに書けない', r.status === 403, `HTTP ${r.status}`);

// ── 5. 口座を消す ──
const del = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken: token }),
});
見る('5. 口座を自分で消せる', del.ok, `HTTP ${del.status}`);

console.log(
  `\n写しは deleted_accounts/${団体} に残っています（運営者だけが読める）。` +
    '\n  node scripts/prune-deleted-accounts.mjs stg  で見え、期限前なので消えません。要らなければ Firebase コンソールで消してください。'
);
console.log(だめ ? `\n★ ${だめ} 件が意図と違います` : '\nぜんぶ意図どおりです');
process.exit(だめ ? 1 : 0);
