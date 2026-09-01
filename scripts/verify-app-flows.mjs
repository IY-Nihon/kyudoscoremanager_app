/**
 * アプリが行う操作を、実際と同じ経路（実トークン＋REST）で一通り実行する。
 *
 *   node scripts/verify-app-flows.mjs [stg]
 *
 * 目的は「セキュリティルールを入れたことで既存機能が壊れていないか」の確認。
 * REG-1〜28 のうち、データ操作として再現できるものを全て通す。
 * stg 専用（データを作って消すため）。
 */
import { configFor, signIn, signInAnonymously, req, setDoc, listAll } from './fb-rest.mjs';

const target = process.argv[2] || 'stg';
if (target !== 'stg') { console.error('stg 専用です'); process.exit(1); }

const { apiKey, projectId, databaseURL } = configFor('stg');
const PW = 'StgTest!2026';
const G1 = '100001', G2 = '100002';
// ライブは団体IDではなく、団体ごとの推測できない合言葉の枝に置く（src/liveSecret.js）。
// RTDB の決まりは枝の長さしか見ないので、検査は同じ長さの作り物で足りる
const 検証の枝 = 'verify-live-branch-0000000000';
const rows = [];
const check = (id, name, expect, actual) => {
  const ok = (Array.isArray(expect) ? expect : [expect]).includes(actual);
  rows.push({ REG: id, 項目: name, 期待: String(expect), 実際: actual, 判定: ok ? 'OK' : 'NG' });
};

const tokG1 = await signIn(apiKey, 'nihonu.kouka@gmail.com', PW);
const stamp = Date.now();

// ── REG-11 記録の編集 ────────────────────────────────────────
const sid = `ses-${G1}-1`;
const upd = await req(projectId, `/groups/${G1}/sessions/${sid}`, {
  token: tokG1, method: 'PATCH',
  body: { fields: { title: { stringValue: '編集後タイトル' } } },
  query: '?updateMask.fieldPaths=title',
});
check('REG-11', '記録の編集（updateDoc相当）', 200, upd.status);

// ── REG-13 記録の削除（sessions → trash へ移す） ──────────────
const moved = await setDoc(projectId, `/groups/${G1}/trash/${sid}`,
  { id: sid, title: '編集後タイトル', date: stamp, archers: [] }, tokG1);
check('REG-13', 'ゴミ箱へ移動（trash へ書く）', 200, moved.status);
const delSes = await req(projectId, `/groups/${G1}/sessions/${sid}`, { token: tokG1, method: 'DELETE' });
check('REG-13', '記録の削除（sessions から消す）', 200, delSes.status);

// ── REG-14 ゴミ箱（復元・個別削除） ─────────────────────────
const restored = await setDoc(projectId, `/groups/${G1}/sessions/${sid}`,
  { id: sid, title: '復元', date: stamp, archers: [], shotCount: 8, includeInStats: true, tags: ['#正規練習'] }, tokG1);
check('REG-14', 'ゴミ箱から復元（sessions へ戻す）', 200, restored.status);
const delTrash = await req(projectId, `/groups/${G1}/trash/${sid}`, { token: tokG1, method: 'DELETE' });
check('REG-14', 'ゴミ箱の個別削除', 200, delTrash.status);

// ── REG-15 メンバーの編集 ───────────────────────────────────
const members = await listAll(projectId, `/groups/${G1}/members`, tokG1, ['name', 'personalId']);
const m0 = members[0];
const memUpd = await req(projectId, `/groups/${G1}/members/${m0.id}`, {
  token: tokG1, method: 'PATCH',
  body: { fields: { name: { stringValue: m0.data.name } } },
  query: '?updateMask.fieldPaths=name',
});
check('REG-15', 'メンバーの編集', 200, memUpd.status);

// ── REG-16 弓具（members の更新として行われる） ───────────────
const eq = await req(projectId, `/groups/${G1}/members/${m0.id}`, {
  token: tokG1, method: 'PATCH',
  body: { fields: { bowWeight: { integerValue: '15' } } },
  query: '?updateMask.fieldPaths=bowWeight',
});
check('REG-16', '弓具の登録（members を更新）', 200, eq.status);

// ── REG-17 個人IDの自動採番（members/alumni のバッチ更新） ────
const alumni = await listAll(projectId, `/groups/${G1}/alumni`, tokG1, ['personalId']);
const aluUpd = await setDoc(projectId, `/groups/${G1}/alumni/${alumni[0].id}`,
  { personalId: alumni[0].data.personalId }, tokG1);
check('REG-17', '卒業生の個人ID更新', 200, aluUpd.status);

// ── REG-18 進級・卒業（config 読み + members/alumni 書き） ────
const cfgGet = await req(projectId, `/groups/${G1}/config/app_settings`, { token: tokG1 });
check('REG-18', '進級判定の設定読み取り', 200, cfgGet.status);
const promote = await setDoc(projectId, `/groups/${G1}/alumni/promo-test-${stamp}`,
  { id: `promo-test-${stamp}`, name: '進級テスト', grade: 5, personalId: '9998' }, tokG1);
check('REG-18', '卒業生への移動（alumni へ書く）', 200, promote.status);
await req(projectId, `/groups/${G1}/alumni/promo-test-${stamp}`, { token: tokG1, method: 'DELETE' });

// ── REG-21 各種設定の保存 ───────────────────────────────────
const cfgSet = await setDoc(projectId, `/groups/${G1}/config/app_settings`,
  { currentFreshmanTerm: 53, autoPromotionEnabled: true,
    tagTemplates: ['#正規練習', '#自主稽古'], lastPromotionYear: 2026 }, tokG1);
check('REG-21', '設定の保存（config/app_settings）', 200, cfgSet.status);

// ── REG-22 団体名の変更（groups/{id} の更新） ────────────────
const nameUpd = await req(projectId, `/groups/${G1}`, {
  token: tokG1, method: 'PATCH',
  body: { fields: { groupName: { stringValue: 'テスト団体A（管理者メール）' } } },
  query: '?updateMask.fieldPaths=groupName',
});
check('REG-22', '団体名の変更（親docあり）', 200, nameUpd.status);

// 親ドキュメントが無い団体でも作成できること（REG-27 と合わせて）
const tokG2 = await signIn(apiKey, 'stg-b@example.com', PW);
const nameUpd2 = await req(projectId, `/groups/${G2}`, {
  token: tokG2, method: 'PATCH',
  body: { fields: { groupName: { stringValue: 'テスト団体B' } } },
  query: '?updateMask.fieldPaths=groupName',
});
check('REG-27', '団体名の変更（親docなし団体）', 200, nameUpd2.status);

// ── REG-23 管理者モード（group_accounts の get + 再サインイン） ─
const accGet = await req(projectId, `/group_accounts/${G1}`, { token: tokG1 });
check('REG-23', '管理者モードの照合用 get', 200, accGet.status);

// ── REG-9 全体同期（複数コレクションへの一括書き込み） ────────
// members への書き込みは updateMask を付けて特定フィールドだけ触る。
// マスク無しの書き込みはドキュメント全体を置き換えるため、絞って読んだ
// データをそのまま書き戻すと grade や termKi が消えてしまう。
const batch = await Promise.all([
  req(projectId, `/groups/${G1}/members/${m0.id}`, {
    token: tokG1, method: 'PATCH',
    body: { fields: { lastModified: { integerValue: String(stamp) } } },
    query: '?updateMask.fieldPaths=lastModified',
  }),
  setDoc(projectId, `/groups/${G1}/sessions/${sid}`, { id: sid, title: '一括同期', date: stamp, archers: [] }, tokG1),
]);
check('REG-9', '全体同期（members と sessions へ一括）', 200, Math.max(...batch.map((b) => b.status)));

// ── REG-12 ライブ記録（RTDB） ───────────────────────────────
const rt = async (method, path, body) => {
  const r = await fetch(`${databaseURL}${path}.json?auth=${tokG1}`, {
    method, body: body === undefined ? undefined : JSON.stringify(body),
  });
  return r.status;
};
check('REG-12', 'ライブ記録の開始（合言葉の枝へ書く）', 200, await rt('PUT', `/live_sessions/${検証の枝}/検証`, { state: { status: 'active' } }));
check('REG-12', 'ライブ記録の更新（1射ごとの送信）', 200, await rt('PATCH', `/live_sessions/${検証の枝}/検証/state`, { timestamp: stamp }));
check('REG-12', 'ライブ記録の一覧（合言葉の枝）', 200, await rt('GET', `/live_sessions/${検証の枝}`));
check('REG-12', 'ライブ記録の終了（削除）', 200, await rt('DELETE', `/live_sessions/${検証の枝}/検証`));

// RTDB の遮断も確認する
const rtNoAuth = await fetch(`${databaseURL}/live_sessions/${検証の枝}.json`);
check('SEC', 'RTDB 未認証での読み取り', 401, rtNoAuth.status);
// 団体IDそのままの枝は、決まりが長さで弾く（database.rules.json）。
// これが 200 に戻ったら、総当たりで他団体のライブを覗ける状態に逆戻りしている
check('SEC', 'RTDB 団体IDそのままの枝を読む', 401,
  (await fetch(`${databaseURL}/live_sessions/${G1}.json?auth=${tokG1}`)).status);
const rtRoot = await fetch(`${databaseURL}/live_sessions.json?auth=${tokG1}`);
check('SEC', 'RTDB 全団体の列挙', 401, rtRoot.status);

// ── 部員（クレーム済み）から見た書き込み ───────────────────
const anon = await signInAnonymously(apiKey);
const lk = await listAll(projectId, `/groups/${G1}/member_lookup`, tokG1, ['memberId']);
await setDoc(projectId, `/member_claims/${anon.uid}`,
  { groupId: G1, memberId: lk[0].data.memberId, personalId: lk[0].id, claimedAt: stamp }, anon.idToken);
check('REG-10', '部員による記録の保存', 200,
  (await setDoc(projectId, `/groups/${G1}/sessions/by-member-${stamp}`,
    { id: `by-member-${stamp}`, title: '部員の記録', date: stamp, archers: [] }, anon.idToken)).status);
check('REG-12', '部員によるライブ参加（RTDB 読み）', 200,
  (await fetch(`${databaseURL}/live_sessions/${検証の枝}.json?auth=${anon.idToken}`)).status);
// RTDB のルールは Firestore を参照できず、所属団体を判定できない。そのため
// 決まりは「ログインしている誰か」までしか絞れない。枝の名前を団体ごとの
// 推測できない合言葉にして、他団体の枝を当てられないようにしてある。
// 団体IDを順に試す手はここで塞がる（src/liveSecret.js）。
//
// 残る制約：合言葉を一度知った人は、退部したあとも覚えていれば入れる。
// 塞ぐにはカスタムクレーム（Cloud Functions と Blaze プラン）が要る。
check('SEC', '団体IDを当てて他団体のライブへ書けない', 401,
  (await fetch(`${databaseURL}/live_sessions/${G2}/制約確認.json?auth=${anon.idToken}`,
    { method: 'PUT', body: JSON.stringify({ x: 1 }) })).status);

// 後始末
await fetch(`${databaseURL}/live_sessions/${検証の枝}.json?auth=${tokG1}`, { method: 'DELETE' });
await req(projectId, `/groups/${G1}/sessions/by-member-${stamp}`, { token: tokG1, method: 'DELETE' });
await req(projectId, `/member_claims/${anon.uid}`, { token: anon.idToken, method: 'DELETE' });

console.table(rows);
const fail = rows.filter((r) => r.判定 === 'NG').length;
console.log(`\n合格 ${rows.length - fail} / 不合格 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
