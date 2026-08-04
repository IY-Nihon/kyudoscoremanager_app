/**
 * group_accounts に対する書き込み経路の検証。
 *
 *   node scripts/verify-account-flows.mjs [stg|prod]
 *
 * ここはルール適用で壊れやすい:
 *  - REG-1 新規団体登録：作成直後の「管理者一覧に載っていない」ユーザーが書く
 *  - REG-4 メール変更：本人だけが変更でき、他団体を乗っ取れないこと
 */
import { configFor, signIn, signInAnonymously, req, setDoc } from './fb-rest.mjs';

const target = process.argv[2] || 'stg';
const { apiKey, projectId } = configFor(target);
if (target === 'prod') {
  console.error('このスクリプトはデータを作るため stg 専用です');
  process.exit(1);
}

const stamp = Date.now();
const NEWID = String(200000 + (stamp % 90000));
const NEWMAIL = `stg-new-${stamp}@example.com`;
const PW = 'StgTest!2026';
const rows = [];
const check = (name, expect, actual) => {
  const ok = (Array.isArray(expect) ? expect : [expect]).includes(actual);
  rows.push({ 項目: name, 期待: String(expect), 実際: actual, 判定: ok ? 'OK' : 'NG' });
  return ok;
};

// ── REG-1 新規団体登録 ───────────────────────────────────
// 一般ユーザーを作り、そのユーザー自身が group_accounts を書けること
const newTok = await signIn(apiKey, NEWMAIL, PW, { create: true });
const created = await setDoc(projectId, `/group_accounts/${NEWID}`,
  { id: NEWID, name: '新規テスト団体', email: NEWMAIL, createdAt: stamp }, newTok);
check('REG-1 新規登録：自分のメールで自団体を作る', 200, created.status);

// 他人のメールを名乗って作れないこと
const spoof = await setDoc(projectId, `/group_accounts/${NEWID}9`,
  { id: `${NEWID}9`, name: 'なりすまし', email: 'nihonu.kouka@gmail.com', createdAt: stamp }, newTok);
check('なりすまし：他人のメールで団体を作る', 403, spoof.status);

// id とドキュメントIDの不一致を弾くこと
const mismatch = await setDoc(projectId, `/group_accounts/${NEWID}8`,
  { id: '999999', name: '不一致', email: NEWMAIL, createdAt: stamp }, newTok);
check('id とドキュメントIDの不一致', 403, mismatch.status);

// 余計なフィールドを弾くこと
const extra = await setDoc(projectId, `/group_accounts/${NEWID}7`,
  { id: `${NEWID}7`, name: 'x', email: NEWMAIL, createdAt: stamp, isAdmin: true }, newTok);
check('余計なフィールド（isAdmin）を含む', 403, extra.status);

// ── REG-4 メールアドレス変更 ─────────────────────────────
// 本人が自分の団体のメールを変更できること
const CHANGED = `stg-changed-${stamp}@example.com`;
const own = await setDoc(projectId, `/group_accounts/${NEWID}`, { email: CHANGED }, newTok);
check('REG-4 本人が自団体のメールを変更', 200, own.status);

// 別団体でログイン中の者が、他団体のメールを自分のものへ書き換えられないこと（乗っ取り防止）
const otherTok = await signIn(apiKey, 'stg-c@example.com', PW);
const hijack = await setDoc(projectId, `/group_accounts/${NEWID}`,
  { email: 'stg-c@example.com' }, otherTok);
check('乗っ取り：他団体のメールを自分のものへ変更', 403, hijack.status);

// ── REG-24 お問い合わせ ─────────────────────────────────
const anon = await signInAnonymously(apiKey);
const inq = await setDoc(projectId, `/inquiries/stg-${stamp}`, {
  email: 'x@example.com', content: 'テスト送信', imagesBase64: [],
  createdAt: stamp, groupId: '100001', groupName: 'A', role: 'member',
  memberId: 'm1', memberName: '部員1',
}, anon.idToken);
check('REG-24 お問い合わせ送信（匿名でも可）', 200, inq.status);

const inqBad = await setDoc(projectId, `/inquiries/stg-bad-${stamp}`,
  { email: 'x@example.com', content: 'x', 余計: true }, anon.idToken);
check('お問い合わせ：想定外フィールドを弾く', 403, inqBad.status);

const inqRead = await req(projectId, `/inquiries/stg-${stamp}`, { token: anon.idToken });
check('お問い合わせ：本人でも読み出せない', 403, inqRead.status);

console.table(rows);
const fail = rows.filter((r) => r.判定 === 'NG').length;
console.log(`\n合格 ${rows.length - fail} / 不合格 ${fail}`);
console.log(`\n※ 検証で作った団体 ${NEWID} と inquiries は stg 上に残ります`);
process.exit(fail === 0 ? 0 : 1);
