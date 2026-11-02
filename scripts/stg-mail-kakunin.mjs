/**
 * 検証環境の台帳の団体（scripts/stg-fixtures.mjs）を、メールの確認が済んだ形にする（2026-11-03）。
 *
 *   node scripts/stg-mail-kakunin.mjs
 *
 * 決まりは、メールの確認が済んでいない団体を何もできなくする（今ある団体は猶予のあいだだけ使える）。
 * 検証の団体は本物のメールを受け取れないので、持ち主の口座を確認済みにし、帳面に verified を書く。
 * 検証環境にしか触らない。何度流してもよい。
 */
import { configFor, signIn, 検証のパスワード, 検証環境でメールを確認済みにする } from './fb-rest.mjs';
import { 団体たち } from './stg-fixtures.mjs';

const { apiKey, projectId } = configFor('stg');
if (projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：検証環境を指していません');
  process.exit(1);
}
const B = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const 済ませた = await 検証環境でメールを確認済みにする(団体たち.map((x) => x.email));
console.log(`口座を確認済みにした: ${済ませた} 件`);
for (const g of 団体たち) {
  // 確認済みにしたあとで入り直すと、証に email_verified が載る
  const 鍵 = await signIn(apiKey, g.email, 検証のパスワード());
  const r = await fetch(`${B}/group_accounts/${g.id}?updateMask.fieldPaths=verified`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + 鍵, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { verified: { booleanValue: true } } }),
  });
  console.log(`団体 ${g.id}: 帳面に確認済み ${r.status}`);
}
