/**
 * 検証用プロジェクトへ合成データを投入する。
 *
 *   node scripts/seed-stg.mjs
 *
 * 本番データは複製しない（Spark プランでは cross-project の export/import が
 * できず、個人情報を検証環境へ持ち込む必要もないため）。
 * 代わりに本番と同じ構造・同じ分岐を踏めるデータを作る。
 *
 * 事前に rules/bootstrap.rules を適用しておくこと（既定は全拒否のため）。
 */
import { configFor, signIn, setDoc, req } from './fb-rest.mjs';

const { apiKey, projectId } = configFor('stg');
if (!apiKey || projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：.env.development.local が stg を指していません');
  process.exit(1);
}

const PW = 'StgTest!2026';

// 団体1は isAdmin() に載っているメール。ルールファイルは本番と共用するため
// 一覧を変えられず、オーナー本人のアドレスを使う。
const GROUPS = [
  { id: '100001', name: 'テスト団体A（管理者メール）', email: 'nihonu.kouka@gmail.com', parentDoc: true,  members: 6 },
  { id: '100002', name: 'テスト団体B',                 email: 'stg-b@example.com',      parentDoc: false, members: 5 },
  { id: '100003', name: 'テスト団体C',                 email: 'stg-c@example.com',      parentDoc: false, members: 4 },
  // 100003 と同じ中身。検査を並列に流したとき、鍵（lock）と途中交代
  // （substitution）が同じ団体を取り合わないよう、交代の側をこちらへ移した
  { id: '100007', name: 'テスト団体F（途中交代用）',   email: 'stg-f@example.com',      parentDoc: false, members: 4 },
];

const uuid = (g, i) => `mem-${g}-${String(i).padStart(3, '0')}`;
const pid = (g, i) => String(1000 + Number(g.slice(-2)) * 10 + i); // 4桁・団体内で一意

// 団体IDを引数で渡すと、その団体だけを作る。
// 全部に書き込むと、検査が積み上げた記録（100003 の3件など）まで
// 作り直してしまう。1つだけ足したいときのために分けてある。
//
//   node scripts/seed-stg.mjs 100007
const 作る団体 = process.argv.slice(2).filter((x) => /^[0-9]+$/.test(x));
const 対象 = 作る団体.length ? GROUPS.filter((g) => 作る団体.includes(g.id)) : GROUPS;
if (作る団体.length && 対象.length !== 作る団体.length) {
  console.error('停止：知らない団体IDが混ざっています: ' + 作る団体.join(', '));
  process.exit(1);
}
if (作る団体.length) console.log('指定された団体だけを作ります: ' + 対象.map((g) => g.id).join(', '));

const summary = [];

for (const g of 対象) {
  const token = await signIn(apiKey, g.email, PW, { create: true });
  console.log(`\n■ 団体 ${g.id}（${g.email}）`);

  await setDoc(projectId, `/group_accounts/${g.id}`,
    { id: g.id, name: g.name, email: g.email, createdAt: Date.now() }, token);
  console.log('  group_accounts を作成');

  // 親ドキュメントは団体1だけ作る。本番も3件中2件が存在しないため、
  // その状態でアプリが動くこと（REG-27）を検証環境で踏めるようにする。
  if (g.parentDoc) {
    await setDoc(projectId, `/groups/${g.id}`, { groupName: g.name }, token);
    console.log('  groups/{id} 親ドキュメントを作成');
  } else {
    console.log('  groups/{id} 親ドキュメントは作らない（REG-27 の再現）');
  }

  for (let i = 1; i <= g.members; i++) {
    await setDoc(projectId, `/groups/${g.id}/members/${uuid(g.id, i)}`, {
      id: uuid(g.id, i), personalId: pid(g.id, i), name: `部員${i}`,
      gender: i % 2 ? '男子' : '女子', grade: (i % 4) + 1, termKi: 53 - (i % 4),
      lastModified: Date.now(),
    }, token);
  }
  console.log(`  members を ${g.members} 件作成（個人ID ${pid(g.id, 1)}〜${pid(g.id, g.members)}）`);

  await setDoc(projectId, `/groups/${g.id}/alumni/alu-${g.id}-001`, {
    id: `alu-${g.id}-001`, personalId: '9999', name: '卒業生1', grade: 5, lastModified: Date.now(),
  }, token);

  for (let s = 1; s <= 3; s++) {
    await setDoc(projectId, `/groups/${g.id}/sessions/ses-${g.id}-${s}`, {
      id: `ses-${g.id}-${s}`, date: Date.now() - s * 86400000, title: `練習${s}`,
      // タグは normalizeTag により # 付きで保存される。本番もこの形。
      // # 無しだと毎回「要整理」と判定され、無関係な自動更新が走ってしまう。
      note: '', shotCount: 8, includeInStats: true, tags: ['#正規練習'],
      archerNames: ['部員1', '部員2'],
      archers: [
        { id: 'a1', name: '部員1', memberId: uuid(g.id, 1), marks: ['○', '×', '○', '○'] },
        { id: 'a2', name: '部員2', memberId: uuid(g.id, 2), marks: ['×', '×', '○', '×'] },
      ],
      lastModified: Date.now(),
    }, token);
  }
  await setDoc(projectId, `/groups/${g.id}/trash/tra-${g.id}-1`, {
    id: `tra-${g.id}-1`, date: Date.now(), title: '削除済み', archers: [], lastModified: Date.now(),
  }, token);
  await setDoc(projectId, `/groups/${g.id}/config/app_settings`, {
    currentFreshmanTerm: 53, autoPromotionEnabled: true,
    tagTemplates: ['#正規練習', '#自主稽古'], lastPromotionYear: 2026,
  }, token);
  await setDoc(projectId, `/groups/${g.id}/officialPracticeDays/2026-08-01`, {
    date: '2026-08-01', created: Date.now(),
  }, token);
  console.log('  alumni / sessions×3 / trash / config / officialPracticeDays を作成');

  summary.push({ 団体: g.id, メール: g.email, members: g.members, 親doc: g.parentDoc, 個人ID例: pid(g.id, 1) });
}

// 投入結果を確認する。
// 第2段階のルール下では他団体を読めないため、必ず各団体自身のトークンで確認する。
for (const g of 対象) {
  const token = await signIn(apiKey, g.email, PW);
  const { status, json } = await req(projectId, `/groups/${g.id}/members`, { token, query: '?pageSize=100' });
  console.log(`\n団体 ${g.id}: members ${(json.documents || []).length} 件 (HTTP ${status})`);
}

console.log('\n=== 投入内容 ===');
console.table(summary);
console.log(`\nログイン用パスワード（検証専用）: ${PW}`);
