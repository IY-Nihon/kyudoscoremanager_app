/**
 * セキュリティルールの許可/拒否を実トークンで総当たりする。
 *
 *   node scripts/verify-rules.mjs <stage1|stage2> [stg|prod]
 *
 * 期待した HTTP コードと実際が全て一致したときだけ合格。
 * ルールはクライアント経由でしか効かないため、Admin SDK ではなく
 * Identity Toolkit で取得した実トークンで検証する。
 */
import { configFor, signIn, signInAnonymously, req, setDoc, listAll, readEnv, toFields } from './fb-rest.mjs';

const [stage, target = 'stg'] = process.argv.slice(2);
if (!['stage1', 'stage2'].includes(stage)) {
  console.error('使い方: node scripts/verify-rules.mjs <stage1|stage2> [stg|prod]');
  process.exit(1);
}

const { apiKey, projectId } = configFor(target);
const PW = 'StgTest!2026';
const G1 = '100001', G2 = '100002';
const EMAIL1 = 'nihonu.kouka@gmail.com', EMAIL2 = 'stg-b@example.com';

console.log(`対象: ${projectId} / ${stage}\n`);

const tokG1 = await signIn(apiKey, EMAIL1, PW);
const tokG2 = await signIn(apiKey, EMAIL2, PW);
const anon = await signInAnonymously(apiKey);

// 団体1の有効な個人ID と memberId を、団体1のトークンで取得しておく
const members = await listAll(projectId, `/groups/${G1}/members`, tokG1);
const target1 = members.find((m) => /^\d{4}$/.test(m.data.personalId || ''));
const PID = target1.data.personalId;
const MID = target1.id;

const cases = [
  // ── 未認証 ────────────────────────────────────────────
  { name: '未認証：団体データを読む',           token: null,  path: `/groups/${G1}/sessions`, expect: [403] },
  { name: '未認証：group_accounts を list',      token: null,  path: '/group_accounts',        expect: [403] },
  { name: '未認証：group_accounts を get',       token: null,  path: `/group_accounts/${G1}`,  expect: [200] },
  { name: '未認証：inquiries を読む',            token: null,  path: '/inquiries',             expect: [403] },
  // ── 団体アカウント ────────────────────────────────────
  { name: '団体：自団体を読む',                  token: tokG1, path: `/groups/${G1}/sessions`, expect: [200] },
  { name: '団体：自団体のメンバーを読む',        token: tokG1, path: `/groups/${G1}/members`,  expect: [200] },
  { name: '団体：自団体の設定を読む',            token: tokG1, path: `/groups/${G1}/config`,   expect: [200] },
  { name: '団体：自団体の出欠を読む',            token: tokG1, path: `/groups/${G1}/officialPracticeDays`, expect: [200] },
  // ── 匿名（部員） ─────────────────────────────────────
  { name: '匿名：inquiries を読む',              token: anon.idToken, path: '/inquiries',      expect: [403] },
];

if (stage === 'stage1') {
  // 第1段階では所属による絞り込みはまだ無い＝認証済みなら他団体も読める
  cases.push(
    { name: '団体：他団体を読む（第1段階では許可）', token: tokG1, path: `/groups/${G2}/sessions`, expect: [200] },
    { name: '匿名：団体データを読む（同上）',        token: anon.idToken, path: `/groups/${G1}/sessions`, expect: [200] },
  );
} else {
  cases.push(
    { name: '団体：他団体を読む',                  token: tokG1, path: `/groups/${G2}/sessions`, expect: [403] },
    { name: '団体：他団体のメンバーを読む',        token: tokG1, path: `/groups/${G2}/members`,  expect: [403] },
    { name: '団体：groups を list',                token: tokG1, path: '/groups',                expect: [403] },
    { name: '匿名(クレーム無)：団体データを読む',  token: anon.idToken, path: `/groups/${G1}/sessions`, expect: [403] },
    { name: '匿名(クレーム無)：名簿を list',       token: anon.idToken, path: `/groups/${G1}/members`,  expect: [403] },
    { name: '匿名：member_lookup を list',         token: anon.idToken, path: `/groups/${G1}/member_lookup`, expect: [403] },
    { name: '匿名：誤った個人IDで get',            token: anon.idToken, path: `/groups/${G1}/member_lookup/0000`, expect: [403, 404] },
    { name: '匿名：正しい個人IDで get',            token: anon.idToken, path: `/groups/${G1}/member_lookup/${PID}`, expect: [200] },
  );
}

let pass = 0, fail = 0;
const rows = [];
for (const c of cases) {
  const q = c.path.split('/').length % 2 === 1 ? '?pageSize=1' : '';
  const { status } = await req(projectId, c.path, { token: c.token, query: q });
  const ok = c.expect.includes(status);
  rows.push({ 項目: c.name, 期待: c.expect.join('/'), 実際: status, 判定: ok ? 'OK' : 'NG' });
  ok ? pass++ : fail++;
}

// ── 書き込み系（第2段階のみ）────────────────────────────
if (stage === 'stage2') {
  const claimPath = `/member_claims/${anon.uid}`;

  // memberId を偽ったクレームは拒否されること
  const bad = await setDoc(projectId, claimPath,
    { groupId: G1, memberId: 'にせもの', personalId: PID, claimedAt: Date.now() }, anon.idToken);
  rows.push({ 項目: '匿名：memberId を偽ってクレーム作成', 期待: '403', 実際: bad.status, 判定: bad.status === 403 ? 'OK' : 'NG' });
  bad.status === 403 ? pass++ : fail++;

  // 正しいクレームは通ること
  const good = await setDoc(projectId, claimPath,
    { groupId: G1, memberId: MID, personalId: PID, claimedAt: Date.now() }, anon.idToken);
  rows.push({ 項目: '匿名：正しい値でクレーム作成', 期待: '200', 実際: good.status, 判定: good.status === 200 ? 'OK' : 'NG' });
  good.status === 200 ? pass++ : fail++;

  // クレーム後は自団体が読め、他団体は読めないこと
  const after = [
    { name: 'クレーム済：自団体を読む',   path: `/groups/${G1}/sessions`, expect: 200 },
    { name: 'クレーム済：名簿を読む',     path: `/groups/${G1}/members`,  expect: 200 },
    { name: 'クレーム済：他団体を読む',   path: `/groups/${G2}/sessions`, expect: 403 },
  ];
  for (const a of after) {
    const { status } = await req(projectId, a.path, { token: anon.idToken, query: '?pageSize=1' });
    rows.push({ 項目: a.name, 期待: String(a.expect), 実際: status, 判定: status === a.expect ? 'OK' : 'NG' });
    status === a.expect ? pass++ : fail++;
  }

  // 記録の書き込みができること（部員も記録を保存するため）
  const w = await setDoc(projectId, `/groups/${G1}/sessions/verify-by-member`,
    { id: 'verify-by-member', title: '検証', date: Date.now(), archers: [] }, anon.idToken);
  rows.push({ 項目: 'クレーム済：記録を書く', 期待: '200', 実際: w.status, 判定: w.status === 200 ? 'OK' : 'NG' });
  w.status === 200 ? pass++ : fail++;
  await req(projectId, `/groups/${G1}/sessions/verify-by-member`, { token: tokG1, method: 'DELETE' });

  // SEC-7：退部した部員はクレームが残っていてもアクセスできないこと。
  // members から消して、同じクレームで読めなくなることを確認する。
  // 控えは REST の生の形（型付き）で取り、そのまま書き戻す。listAll の data（JS の値）で書き戻すと、
  // 日時（timestampValue）が文字（stringValue）に化ける（2026-09-24 に気づいた）
  const 生の控え = await req(projectId, `/groups/${G1}/members/${MID}`, { token: tokG1 });
  if (生の控え.status !== 200 || !生の控え.json?.fields) throw new Error(`控えを取れませんでした (HTTP ${生の控え.status})`);
  await req(projectId, `/groups/${G1}/members/${MID}`, { token: tokG1, method: 'DELETE' });
  const revoked = await req(projectId, `/groups/${G1}/sessions`, { token: anon.idToken, query: '?pageSize=1' });
  rows.push({ 項目: 'SEC-7 退部した部員のクレーム', 期待: '403', 実際: revoked.status, 判定: revoked.status === 403 ? 'OK' : 'NG' });
  revoked.status === 403 ? pass++ : fail++;
  const 戻した = await req(projectId, `/groups/${G1}/members/${MID}`, {
    token: tokG1, method: 'PATCH', body: { fields: 生の控え.json.fields },
  }); // 復元
  if (戻した.status !== 200) console.error(`★ メンバー ${MID} を戻せませんでした (HTTP ${戻した.status})。検証環境の団体 ${G1} を確かめてください`);

  await req(projectId, claimPath, { token: anon.idToken, method: 'DELETE' });
}

// ── 異常系：断られるべき書き込み（どちらの段階でも流す。通ってしまえば NG）──────────
// 診断（2026-10-02 の別 AI のレビュー）が「異常系の自動検査が無い」と指摘したぶん。
// どれも 403 が正しい。ルールが緩んでいると検証環境に紛れ込みが残るので、NG が出たら団体の
// 外の入れ物（inquiries / errorReports / storage の inquiries）を見て消す。
{
  const 断られる = async (項目, 結果) => {
    const ok = 結果.status === 403;
    rows.push({ 項目, 期待: '403', 実際: 結果.status, 判定: ok ? 'OK' : 'NG' });
    ok ? pass++ : fail++;
  };
  const 作る = (入れ物, 値, token) => req(projectId, `/${入れ物}`, { token, method: 'POST', body: { fields: toFields(値) } });
  const 長い = 'あ'.repeat(5000);

  await 断られる('匿名：inquiries へ 5000 字以上の本文', await 作る('inquiries', { content: 長い, createdAt: Date.now() }, anon.idToken));
  await 断られる('匿名：inquiries へ空の本文', await 作る('inquiries', { content: '', createdAt: Date.now() }, anon.idToken));
  await 断られる('匿名：inquiries へ決まりに無い項目', await 作る('inquiries', { content: 'テスト', isAdmin: true }, anon.idToken));
  await 断られる('未認証：inquiries へ書く', await 作る('inquiries', { content: 'テスト', createdAt: Date.now() }, null));
  await 断られる('匿名：errorReports へ決まりに無い項目', await 作る('errorReports', { message: 'x', stack: '', trail: [], device: '', extra: 'y' }, anon.idToken));
  await 断られる('未認証：errorReports へ書く', await 作る('errorReports', { message: 'x', stack: '', trail: [], device: '' }, null));
  await 断られる('匿名：member_lookup へ書く（逆引き表を偽る）', await setDoc(projectId, `/groups/${G1}/member_lookup/9999`, { memberId: MID }, anon.idToken));
  await 断られる('匿名：他団体の group_accounts を書き換える', await setDoc(projectId, `/group_accounts/${G1}`, { id: G1, email: 'evil@example.com' }, anon.idToken));

  // Storage の inquiries/ は誰でも書けるが、画像・10MB 未満だけ。画像でないものと大きすぎるものは断られる
  const バケット = readEnv(target === 'stg' ? '.env.development.local' : '.env').EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  // 検証環境には Storage の入れ物が無い（一覧を引くと 404）。無ければ飛ばす（本番では 403 が返り、流れる）
  const 在る = バケット
    ? (await fetch(`https://firebasestorage.googleapis.com/v0/b/${バケット}/o?maxResults=1`)).status !== 404
    : false;
  if (!在る) rows.push({ 項目: 'storage の異常系（画像でない・11MB・別の道）', 期待: '403', 実際: '入れ物が無い', 判定: '飛ばした' });
  if (在る) {
    const 上げる = async (名, 型, 中身) => {
      const r = await fetch(`https://firebasestorage.googleapis.com/v0/b/${バケット}/o?name=${encodeURIComponent('inquiries/verify-' + 名)}`, {
        method: 'POST', headers: { 'Content-Type': 型 }, body: 中身,
      });
      return { status: r.status };
    };
    await 断られる('未認証：storage inquiries へ画像でないもの', await 上げる('text', 'text/plain', 'hello'));
    await 断られる('未認証：storage inquiries へ 11MB の画像', await 上げる('big', 'image/png', new Uint8Array(11 * 1024 * 1024)));
    await 断られる('未認証：storage の inquiries 以外へ書く', await (async () => {
      const r = await fetch(`https://firebasestorage.googleapis.com/v0/b/${バケット}/o?name=other%2Fverify`, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: new Uint8Array(10) });
      return { status: r.status };
    })());
  }
}

console.table(rows);
console.log(`\n合格 ${pass} / 不合格 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
