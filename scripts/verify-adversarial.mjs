/**
 * 悪意ある操作と境界値に対して、ルールが期待どおり振る舞うかを確認する。
 *
 *   node scripts/verify-adversarial.mjs [stg]
 *
 * 「正しく使えること」は verify-app-flows.mjs で見ている。
 * ここでは「正しくない使い方が弾かれること」だけを見る。
 */
import { configFor, signIn, signInAnonymously, req, setDoc, listAll } from './fb-rest.mjs';

const target = process.argv[2] || 'stg';
if (target !== 'stg') { console.error('stg 専用です'); process.exit(1); }

const { apiKey, projectId } = configFor('stg');
const PW = 'StgTest!2026';
const G1 = '100001', G2 = '100002';
const stamp = Date.now();
const rows = [];
const check = (cat, name, expect, actual, note = '') => {
  const ok = (Array.isArray(expect) ? expect : [expect]).includes(actual);
  rows.push({ 区分: cat, 項目: name, 期待: String(expect), 実際: actual, 判定: ok ? 'OK' : 'NG', 備考: note });
};

const tokG1 = await signIn(apiKey, 'nihonu.kouka@gmail.com', PW);
const tokG2 = await signIn(apiKey, 'stg-b@example.com', PW);
const anonA = await signInAnonymously(apiKey);
const anonB = await signInAnonymously(apiKey);

const lk1 = await listAll(projectId, `/groups/${G1}/member_lookup`, tokG1, ['memberId']);
const lk2 = await listAll(projectId, `/groups/${G2}/member_lookup`, tokG2, ['memberId']);
const pid1 = lk1[0].id, mid1 = lk1[0].data.memberId;
const pid2 = lk2[0].id, mid2 = lk2[0].data.memberId;

// ══ 所属クレームの偽造 ═══════════════════════════════════════
check('なりすまし', '他人の uid のクレームを作る', 403,
  (await setDoc(projectId, `/member_claims/${anonB.uid}`,
    { groupId: G1, memberId: mid1, personalId: pid1, claimedAt: stamp }, anonA.idToken)).status);

check('なりすまし', '団体だけ他団体に差し替える', 403,
  (await setDoc(projectId, `/member_claims/${anonA.uid}`,
    { groupId: G2, memberId: mid1, personalId: pid1, claimedAt: stamp }, anonA.idToken)).status,
  '個人IDと memberId は団体1のもの');

check('なりすまし', 'memberId と個人ID の対応が食い違う', 403,
  (await setDoc(projectId, `/member_claims/${anonA.uid}`,
    { groupId: G1, memberId: mid1, personalId: lk1[1].id, claimedAt: stamp }, anonA.idToken)).status);

check('なりすまし', '存在しない個人IDでクレームを作る', 403,
  (await setDoc(projectId, `/member_claims/${anonA.uid}`,
    { groupId: G1, memberId: mid1, personalId: '0001', claimedAt: stamp }, anonA.idToken)).status);

check('なりすまし', '余計なフィールドを含むクレーム', 403,
  (await setDoc(projectId, `/member_claims/${anonA.uid}`,
    { groupId: G1, memberId: mid1, personalId: pid1, claimedAt: stamp, isAdmin: true }, anonA.idToken)).status);

// 正しいクレームは通る（この後の前提）
check('正常系', '正しい値でクレームを作る', 200,
  (await setDoc(projectId, `/member_claims/${anonA.uid}`,
    { groupId: G1, memberId: mid1, personalId: pid1, claimedAt: stamp }, anonA.idToken)).status);

check('なりすまし', '他人のクレームを読む', 403,
  (await req(projectId, `/member_claims/${anonA.uid}`, { token: anonB.idToken })).status);

// ══ 権限昇格の試み ═══════════════════════════════════════════
check('権限昇格', '部員が逆引き表を書き換える', 403,
  (await setDoc(projectId, `/groups/${G1}/member_lookup/${pid1}`,
    { memberId: 'すり替え', updatedAt: stamp }, anonA.idToken)).status,
  '自分を他人に見せかける経路を塞ぐ');

check('権限昇格', '部員が逆引き表に新規追加する', 403,
  (await setDoc(projectId, `/groups/${G1}/member_lookup/7777`,
    { memberId: mid1, updatedAt: stamp }, anonA.idToken)).status);

check('権限昇格', '団体が他団体の逆引き表を書く', 403,
  (await setDoc(projectId, `/groups/${G2}/member_lookup/7777`,
    { memberId: mid2, updatedAt: stamp }, tokG1)).status);

check('権限昇格', '部員が group_accounts を書き換える', 403,
  (await setDoc(projectId, `/group_accounts/${G1}`, { email: 'attacker@example.com' }, anonA.idToken)).status);

// 削除は管理者だけに許している。団体1のメールは isAdmin() の一覧に載っているため
// 通ってしまい実データを壊しかねないので、非管理者の団体2で確かめる。
check('権限昇格', '非管理者の団体が他団体のアカウントを削除', 403,
  (await req(projectId, `/group_accounts/${G1}`, { token: tokG2, method: 'DELETE' })).status);

check('権限昇格', '非管理者の団体が自分のアカウントを削除', 403,
  (await req(projectId, `/group_accounts/${G2}`, { token: tokG2, method: 'DELETE' })).status,
  '削除は管理者のみ');

check('権限昇格', '部員が団体アカウントを削除', 403,
  (await req(projectId, `/group_accounts/${G1}`, { token: anonA.idToken, method: 'DELETE' })).status);

check('権限昇格', '部員が団体ドキュメントを削除する', 403,
  (await req(projectId, `/groups/${G1}`, { token: anonA.idToken, method: 'DELETE' })).status);

// ══ 他団体への到達 ═══════════════════════════════════════════
check('越境', 'クレーム済み部員が他団体を読む', 403,
  (await req(projectId, `/groups/${G2}/sessions`, { token: anonA.idToken, query: '?pageSize=1' })).status);

check('越境', 'クレーム済み部員が他団体へ書く', 403,
  (await setDoc(projectId, `/groups/${G2}/sessions/侵入-${stamp}`,
    { id: 'x', title: '侵入', date: stamp }, anonA.idToken)).status);

check('越境', '団体が他団体の設定を書き換える', 403,
  (await setDoc(projectId, `/groups/${G2}/config/app_settings`, { currentFreshmanTerm: 1 }, tokG1)).status);

check('越境', '他団体の逆引き表を list する', 403,
  (await req(projectId, `/groups/${G2}/member_lookup`, { token: anonA.idToken, query: '?pageSize=1' })).status);

check('制約', '他団体の個人IDを知っていれば get できる', 200,
  (await req(projectId, `/groups/${G2}/member_lookup/${pid2}`, { token: anonA.idToken })).status,
  '4桁の総当たりは残る（12章に明記）');

// ══ 入力値の検証 ═════════════════════════════════════════════
const inq = (data, token) => setDoc(projectId, `/inquiries/adv-${stamp}-${Math.random().toString(36).slice(2, 8)}`, data, token);
const baseInq = {
  email: 'x@example.com', content: 'テスト', imagesBase64: [], createdAt: stamp,
  groupId: G1, groupName: 'A', role: 'member', memberId: 'm', memberName: 'n',
};
check('入力検証', 'お問い合わせ：本文が空', 403, (await inq({ ...baseInq, content: '' }, anonA.idToken)).status);
check('入力検証', 'お問い合わせ：本文が5000字超', 403, (await inq({ ...baseInq, content: 'あ'.repeat(5001) }, anonA.idToken)).status);
check('入力検証', 'お問い合わせ：本文が数値', 403, (await inq({ ...baseInq, content: 12345 }, anonA.idToken)).status);
check('入力検証', 'お問い合わせ：想定外フィールド', 403, (await inq({ ...baseInq, evil: true }, anonA.idToken)).status);
check('正常系', 'お問い合わせ：正しい形', 200, (await inq(baseInq, anonA.idToken)).status);
check('入力検証', 'お問い合わせ：未認証で送信', 403, (await inq(baseInq, null)).status);

// ══ 退部後の失効 ═════════════════════════════════════════════
const memDoc = await req(projectId, `/groups/${G1}/members/${mid1}`, { token: tokG1 });
const backup = memDoc.json.fields;
await req(projectId, `/groups/${G1}/members/${mid1}`, { token: tokG1, method: 'DELETE' });
check('失効', '退部した部員のクレームで読む', 403,
  (await req(projectId, `/groups/${G1}/sessions`, { token: anonA.idToken, query: '?pageSize=1' })).status);
check('失効', '退部した部員のクレームで書く', 403,
  (await setDoc(projectId, `/groups/${G1}/sessions/退部後-${stamp}`, { id: 'x', title: 'x' }, anonA.idToken)).status);
await req(projectId, `/groups/${G1}/members/${mid1}`, { token: tokG1, method: 'PATCH', body: { fields: backup } });
check('失効', '在籍を戻すと再び読める', 200,
  (await req(projectId, `/groups/${G1}/sessions`, { token: anonA.idToken, query: '?pageSize=1' })).status);

// ══ 未認証 ═══════════════════════════════════════════════════
check('未認証', '団体データを読む', 403, (await req(projectId, `/groups/${G1}/sessions`, { query: '?pageSize=1' })).status);
check('未認証', '団体データへ書く', 403, (await setDoc(projectId, `/groups/${G1}/sessions/x-${stamp}`, { id: 'x' }, null)).status);
check('未認証', 'クレームを作る', 403,
  (await setDoc(projectId, `/member_claims/未認証-${stamp}`, { groupId: G1, memberId: mid1, personalId: pid1, claimedAt: stamp }, null)).status);
check('未認証', '逆引き表を get する', 403, (await req(projectId, `/groups/${G1}/member_lookup/${pid1}`)).status);
check('未認証', 'group_accounts を get する', 200, (await req(projectId, `/group_accounts/${G1}`)).status, 'ログインに必要');

// 後始末
await req(projectId, `/member_claims/${anonA.uid}`, { token: anonA.idToken, method: 'DELETE' });

console.table(rows);
const fail = rows.filter((r) => r.判定 === 'NG').length;
console.log(`\n合格 ${rows.length - fail} / 不合格 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
