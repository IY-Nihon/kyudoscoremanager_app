/**
 * メンバーの招待リンクの決まりを、検証環境で確かめる。書く。検証環境だけ。
 *
 *   node scripts/verify-invite.mjs
 *
 * 招待の合言葉は、個人ID と同じ逆引き表（groups/{団体}/member_lookup/{合言葉}）に置く
 * （src/memberInvite.js）。決まりは変えていないので、今の決まりのまま次が成り立つかを見る。
 *   1. 持ち主は招待の合言葉を置ける
 *   2. 合言葉を知っている人（匿名）は、それで所属の証を作り、団体の記録を読める
 *   3. 違う合言葉・別のメンバーを名乗る証は作れない
 *   4. メンバー（匿名）は逆引き表を一覧できない（他人の合言葉が見えない）
 *   5. 作り直す（前の合言葉を消す）と、前の合言葉では新しく入れない
 *   6. 期限（expiresAt）を過ぎた合言葉・期限の無い招待の文書では入れない。個人ID は期限を見ない
 *
 * 使い捨ての団体（997xxx）と口座を作り、終わったら消す。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { configFor, signIn, signInAnonymously, req, setDoc } from './fb-rest.mjs';

const { apiKey, projectId } = configFor('stg');
if (projectId !== 'kyudoscoremanager-stg') {
  console.error('検証環境の設定を読めませんでした。中止します。');
  process.exit(1);
}
const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const refresh = JSON.parse(fs.readFileSync(設定, 'utf8')).tokens?.refresh_token;
const { access_token: 所有者 } = await (
  await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
).json();

const 印 = Date.now().toString(36);
const 団体 = '997' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
const メール = `invite-${印}@example.com`;
const 合言葉 = `Invite-${印}-x9`;
const 招待 = [...crypto.getRandomValues(new Uint8Array(16))]
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('');
const 新しい招待 = [...crypto.getRandomValues(new Uint8Array(16))]
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('');
const 部員 = 'mem-invite-1';
const 七日後 = () => new Date(Date.now() + 7 * 86400000);
const 切れた招待 = 'e'.repeat(31) + '1';
const 期限の無い招待 = 'e'.repeat(31) + '2';

let だめ = 0;
const 見る = (題, 良いか, 添え) => {
  console.log(`  ${良いか ? 'ok ' : '★  '} ${題}${添え ? '  … ' + 添え : ''}`);
  if (!良いか) だめ++;
};
const 証を書く = (匿名, 鍵, memberId = 部員) =>
  setDoc(
    projectId,
    `/member_claims/${匿名.uid}`,
    { groupId: 団体, memberId, personalId: 鍵, claimedAt: Date.now() },
    匿名.idToken
  );
const 自分を消す = (idToken) =>
  fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

console.log(`${projectId} / 使い捨ての団体 ${団体} で招待リンクの決まりを確かめます\n`);
const 持ち主 = await signIn(apiKey, メール, 合言葉, { create: true });
const 匿名たち = [];
try {
  // 下ごしらえ：団体・メンバー・記録（持ち主の権限で。アプリと同じ道）
  見る(
    '（下ごしらえ）団体の帳面',
    (await setDoc(projectId, `/group_accounts/${団体}`, { id: 団体, email: メール }, 持ち主)).status === 200
  );
  await setDoc(
    projectId,
    `/groups/${団体}/members/${部員}`,
    { id: 部員, name: '招待 太郎', personalId: '4321' },
    持ち主
  );
  await setDoc(projectId, `/groups/${団体}/sessions/ses-1`, { id: 'ses-1', title: '練習' }, 持ち主);

  const 置く = await setDoc(
    projectId,
    `/groups/${団体}/member_lookup/${招待}`,
    { memberId: 部員, 招待: true, expiresAt: 七日後() },
    持ち主
  );
  見る('1. 持ち主は招待の合言葉を置ける', 置く.status === 200, `HTTP ${置く.status}`);

  const 甲 = await signInAnonymously(apiKey);
  匿名たち.push(甲);
  const 引く = await req(projectId, `/groups/${団体}/member_lookup/${招待}`, { token: 甲.idToken });
  見る('2. 合言葉を知っている人は逆引きできる', 引く.status === 200, `HTTP ${引く.status}`);
  const 証 = await 証を書く(甲, 招待);
  見る('   その合言葉で所属の証を作れる', 証.status === 200, `HTTP ${証.status}`);
  const 読む = await req(projectId, `/groups/${団体}/sessions`, { token: 甲.idToken });
  見る('   入ったあと団体の記録を読める', 読む.status === 200, `HTTP ${読む.status}`);

  const 乙 = await signInAnonymously(apiKey);
  匿名たち.push(乙);
  const 違う = await 証を書く(乙, 'f'.repeat(32));
  見る('3. 違う合言葉では所属の証を作れない', 違う.status === 403, `HTTP ${違う.status}`);
  const 別人 = await 証を書く(乙, 招待, 'mem-別人');
  見る('   合言葉は合っていても、別のメンバーを名乗れない', 別人.status === 403, `HTTP ${別人.status}`);
  const 乙が読む = await req(projectId, `/groups/${団体}/sessions`, { token: 乙.idToken });
  見る('   証が無ければ団体の記録を読めない', 乙が読む.status === 403, `HTTP ${乙が読む.status}`);

  const 一覧 = await req(projectId, `/groups/${団体}/member_lookup`, { token: 甲.idToken });
  見る(
    '4. メンバーは逆引き表を一覧できない（他人の合言葉が見えない）',
    一覧.status === 403,
    `HTTP ${一覧.status}`
  );

  // 5. 作り直す（アプリの 招待を作り直す と同じく、前のを消して新しいのを置く）
  await req(projectId, `/groups/${団体}/member_lookup/${招待}`, { token: 持ち主, method: 'DELETE' });
  await setDoc(
    projectId,
    `/groups/${団体}/member_lookup/${新しい招待}`,
    { memberId: 部員, 招待: true, expiresAt: 七日後() },
    持ち主
  );
  const 丙 = await signInAnonymously(apiKey);
  匿名たち.push(丙);
  const 古いので = await 証を書く(丙, 招待);
  見る('5. 作り直したあと、前の合言葉では新しく入れない', 古いので.status === 403, `HTTP ${古いので.status}`);
  const 新しいので = await 証を書く(丙, 新しい招待);
  見る('   新しい合言葉では入れる', 新しいので.status === 200, `HTTP ${新しいので.status}`);

  // 6. 期限
  await setDoc(
    projectId,
    `/groups/${団体}/member_lookup/${切れた招待}`,
    { memberId: 部員, 招待: true, expiresAt: new Date(Date.now() - 60000) },
    持ち主
  );
  await setDoc(projectId, `/groups/${団体}/member_lookup/${期限の無い招待}`, { memberId: 部員, 招待: true }, 持ち主);
  await setDoc(projectId, `/groups/${団体}/member_lookup/4321`, { memberId: 部員 }, 持ち主);
  const 丁 = await signInAnonymously(apiKey);
  匿名たち.push(丁);
  const 切れたので = await 証を書く(丁, 切れた招待);
  見る('6. 期限を過ぎた合言葉では入れない', 切れたので.status === 403, `HTTP ${切れたので.status}`);
  const 期限無しで = await 証を書く(丁, 期限の無い招待);
  見る('   期限の無い招待の文書では入れない', 期限無しで.status === 403, `HTTP ${期限無しで.status}`);
  const 個人IDで = await 証を書く(丁, '4321');
  見る('   個人ID（期限を持たない）では今までどおり入れる', 個人IDで.status === 200, `HTTP ${個人IDで.status}`);
} finally {
  for (const 道 of [
    `/groups/${団体}/member_lookup/${招待}`,
    `/groups/${団体}/member_lookup/${新しい招待}`,
    `/groups/${団体}/member_lookup/${切れた招待}`,
    `/groups/${団体}/member_lookup/${期限の無い招待}`,
    `/groups/${団体}/member_lookup/4321`,
    `/groups/${団体}/members/${部員}`,
    `/groups/${団体}/sessions/ses-1`,
    `/groups/${団体}`,
    `/group_accounts/${団体}`,
    ...匿名たち.map((x) => `/member_claims/${x.uid}`),
  ])
    await req(projectId, 道, { token: 所有者, method: 'DELETE' });
  for (const x of 匿名たち) await 自分を消す(x.idToken);
  await 自分を消す(持ち主);
}
console.log('');
if (だめ) {
  console.log(`${だめ} 件が意図どおりではありません。`);
  process.exit(1);
}
console.log('すべて意図どおりです。使い捨ての団体と口座は消しました。');
