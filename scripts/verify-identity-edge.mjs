/**
 * 認証の同一性まわりと、まだ触れていない経路を検証する。
 *
 *   node scripts/verify-identity-edge.mjs
 *
 * これまでの検証で扱っていなかった観点:
 *  1. 団体の判定はメールアドレスの一致で行っている。その前提が崩れる場面
 *  2. 個人ID をパスとして解釈させる細工
 *  3. RTDB の live_sessions 以外のノード（appData / users）
 *  4. group_accounts が消えた団体はどうなるか
 */
import { configFor, signIn, signInAnonymously, req, setDoc, listAll } from './fb-rest.mjs';

const { apiKey, projectId, databaseURL } = configFor('stg');
const PW = 'StgTest!2026';
const G1 = '100001', G2 = '100002';
const stamp = Date.now();
const rows = [];
const check = (cat, name, expect, actual, note = '') => {
  const list = (Array.isArray(expect) ? expect : [expect]).map(String);
  const ok = list.includes(String(actual));
  rows.push({ 区分: cat, 項目: name, 期待: list.join('/'), 実際: String(actual), 判定: ok ? 'OK' : 'NG', 備考: note });
};

const tokG1 = await signIn(apiKey, 'nihonu.kouka@gmail.com', PW);
const tokG2 = await signIn(apiKey, 'stg-b@example.com', PW);
const anon = await signInAnonymously(apiKey);
const lk1 = await listAll(projectId, `/groups/${G1}/member_lookup`, tokG1, ['memberId']);
const pid1 = lk1[0].id, mid1 = lk1[0].data.memberId;

// ══ 1. メールアドレスの一致で団体を判定していることの確認 ══════
// 団体アカウントは自分のメールを他団体のメールへ書き換えられるか
check('同一性', '自団体のメールを他団体のメールに変える', 200,
  (await setDoc(projectId, `/group_accounts/${G2}`, { email: 'nihonu.kouka@gmail.com' }, tokG2)).status,
  '自分の団体の設定なので許可される');

// その結果どうなるか
check('同一性', '書き換え後、団体1の持ち主が団体2も読める', 200,
  (await req(projectId, `/groups/${G2}/sessions`, { token: tokG1, query: '?pageSize=1' })).status,
  'メール一致＝持ち主なので当然。乗っ取りではなく明け渡し');
check('同一性', '書き換えた本人は自団体を読めなくなる', 403,
  (await req(projectId, `/groups/${G2}/sessions`, { token: tokG2, query: '?pageSize=1' })).status,
  '自分で自分を締め出す形');

// 元に戻す（団体1の持ち主として書き戻す）
check('同一性', '持ち主になった側から元のメールへ戻せる', 200,
  (await setDoc(projectId, `/group_accounts/${G2}`, { email: 'stg-b@example.com' }, tokG1)).status);
check('同一性', '戻した後、本来の持ち主が読める', 200,
  (await req(projectId, `/groups/${G2}/sessions`, { token: tokG2, query: '?pageSize=1' })).status);

// ══ 2. 個人IDをパスとして解釈させる細工 ═══════════════════════
const evil = [
  ['スラッシュを含む', `${pid1}/../../${G2}/member_lookup/9999`],
  ['親をたどる', `..%2F..%2F${G2}%2Fmember_lookup%2F9999`],
  ['空文字', ''],
  ['非常に長い', '9'.repeat(600)],
];
for (const [label, pid] of evil) {
  const { status } = await req(projectId, `/groups/${G1}/member_lookup/${pid}`, { token: anon.idToken });
  check('パス細工', `個人IDに${label}`, [400, 403, 404], status, '他団体へ到達できないこと');
}

// クレームの personalId にパス細工を入れる
check('パス細工', 'クレームの個人IDにスラッシュ', 403,
  (await setDoc(projectId, `/member_claims/${anon.uid}`,
    { groupId: G1, memberId: mid1, personalId: `${pid1}/../../x`, claimedAt: stamp }, anon.idToken)).status);
check('パス細工', 'クレームの団体IDにスラッシュ', [400, 403],
  (await setDoc(projectId, `/member_claims/${anon.uid}`,
    { groupId: `${G1}/../../${G2}`, memberId: mid1, personalId: pid1, claimedAt: stamp }, anon.idToken)).status);

// ══ 3. RTDB の live_sessions 以外のノード ═════════════════════
const rt = async (path, token, method = 'GET', body) => {
  const url = `${databaseURL}${path}.json` + (token ? `?auth=${token}` : '');
  const r = await fetch(url, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.status;
};
// appData と users はアプリがどこでも使っていないので、ルールから外した。
// 外す前は「認証さえ通れば丸ごと読み書きできる」状態で、匿名でも通った。
// 中身は常に空だったが、書き込み放題は容量を食わせる余地になっていた。
const anon2 = await signInAnonymously(apiKey);
check('RTDB', 'appData を未認証で読む', 401, await rt('/appData', null));
check('RTDB', 'appData を認証ありで読む', 401, await rt('/appData', tokG1), 'ルールから外した');
check('RTDB', 'appData を匿名で書く', 401, await rt('/appData/x', anon2.idToken, 'PUT', { a: 1 }));
check('RTDB', 'users を未認証で読む', 401, await rt('/users', null));
check('RTDB', 'users を認証ありで読む', 401, await rt('/users', tokG1), 'ルールから外した');
check('RTDB', 'users を匿名で書く', 401, await rt('/users/x', anon2.idToken, 'PUT', { a: 1 }));
check('RTDB', 'ルート直下を未認証で読む', 401, await rt('/', null));
check('RTDB', 'ルート直下を認証ありで読む', 401, await rt('/', tokG1), '全体の列挙は不可');
// 消したあとも、使っている経路は今までどおり通ること
// ライブは団体IDではなく、団体ごとの推測できない合言葉の枝に置く（src/liveSecret.js）。
// RTDB の決まりは枝の長さしか見ないので、検査は同じ長さの作り物で足りる
const 検証の枝 = 'verify-live-branch-0000000000';
check('RTDB', 'ライブの枝を認証ありで読む', 200, await rt(`/live_sessions/${検証の枝}`, tokG1), '巻き添えが無いこと');
check('RTDB', '団体IDそのままの枝は読めない', 401, await rt(`/live_sessions/${G1}`, tokG1), '総当たりを塞いでいること');
check('RTDB', '未定義のノードを認証ありで書く', 401, await rt('/unknownNode/x', tokG1, 'PUT', { a: 1 }),
  'ルールに無いパスは既定で拒否');

// ══ 4. group_accounts が消えた団体 ═══════════════════════════
// 削除すると逆引き表も読めなくなるため、必要な情報は先に取っておく。
const lk2 = await listAll(projectId, `/groups/${G2}/member_lookup`, tokG2, ['memberId']);
const memberOfG2 = await signInAnonymously(apiKey);
await setDoc(projectId, `/member_claims/${memberOfG2.uid}`,
  { groupId: G2, memberId: lk2[0].data.memberId, personalId: lk2[0].id, claimedAt: stamp }, memberOfG2.idToken);

// 一時的に消して、持ち主と部員それぞれがどうなるかを見る
await req(projectId, `/group_accounts/${G2}`, { token: tokG1, method: 'DELETE' });   // 管理者権限で削除
check('欠落', 'group_accounts が無い団体を持ち主が読む', 403,
  (await req(projectId, `/groups/${G2}/sessions`, { token: tokG2, query: '?pageSize=1' })).status,
  '持ち主の判定ができなくなり締め出される');
check('欠落', '同じ団体の部員（クレーム済み）は読める', 200,
  (await req(projectId, `/groups/${G2}/sessions`, { token: memberOfG2.idToken, query: '?pageSize=1' })).status,
  '部員はクレームで判定するので影響を受けない');

// 復旧。create は「自分のメールと一致」が条件なので本人アカウントで行う
await setDoc(projectId, `/group_accounts/${G2}`,
  { id: G2, name: 'テスト団体B', email: 'stg-b@example.com', createdAt: Date.now() }, tokG2);
check('欠落', '復旧後、持ち主が再び読める', 200,
  (await req(projectId, `/groups/${G2}/sessions`, { token: tokG2, query: '?pageSize=1' })).status);
await req(projectId, `/member_claims/${memberOfG2.uid}`, { token: memberOfG2.idToken, method: 'DELETE' });

await req(projectId, `/member_claims/${anon.uid}`, { token: anon.idToken, method: 'DELETE' });

console.table(rows);
const fail = rows.filter((r) => r.判定 === 'NG').length;
console.log(`\n合格 ${rows.length - fail} / 不合格 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
