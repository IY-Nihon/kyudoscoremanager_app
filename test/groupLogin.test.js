/**
 * 団体のログインと、ログインに使うメールアドレスの切り替えの検査（src/groupLogin.js）。
 *
 *   npm test
 *
 * 前は updateEmail で即座に替えていたが、本番は「メール列挙の保護」が有効で必ず断られていた。
 * いまは新しいアドレスへ確認のメールを送り（verifyBeforeUpdateEmail）、リンクが開かれたら
 * 次のログインで帳面を追いつかせる。その順番をここで押さえる。
 * 決まり（firestore.rules）が通すかどうかは、検証環境で scripts/verify-email-change.mjs が見る。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 団体で入る, 切り替えを頼む } = require('../src/groupLogin');

/** 偽の Firestore と認証。口座は { メール: パスワード } */
function 用意({ 帳面, 口座, 書けない = false, 送れない = null }) {
  const 表 = new Map([['group_accounts/100001', Object.assign({}, 帳面)]]);
  const した = [];
  const 認証 = { 今: null };
  const Firestore = {
    doc: (db, 集まり, id) => ({ 道: `${集まり}/${id}` }),
    getDoc: async (場所) => ({ exists: () => 表.has(場所.道), data: () => 表.get(場所.道) }),
    setDoc: async (場所, 値, 選び) => {
      した.push(['setDoc', 値, 選び || null]);
      if (書けない) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
      表.set(場所.道, 選び && 選び.merge ? Object.assign({}, 表.get(場所.道), 値) : Object.assign({}, 値));
    },
    updateDoc: async (場所, 値) => {
      した.push(['updateDoc', 値]);
      const 次 = Object.assign({}, 表.get(場所.道));
      for (const [k, v] of Object.entries(値)) if (v === '__消す') delete 次[k];
      表.set(場所.道, 次);
    },
    deleteField: () => '__消す',
  };
  const FirebaseAuth = {
    signInWithEmailAndPassword: async (auth, メール, 合言葉) => {
      した.push(['入る', メール]);
      if (口座[メール] !== 合言葉) throw Object.assign(new Error('no'), { code: 'auth/invalid-credential' });
      認証.今 = { email: メール };
      return { user: 認証.今 };
    },
    verifyBeforeUpdateEmail: async (user, 宛先) => {
      した.push(['確認を送る', user.email, 宛先]);
      if (送れない) throw Object.assign(new Error('x'), { code: 送れない });
    },
    signOut: async () => {
      した.push(['出る']);
      認証.今 = null;
    },
  };
  return { 道具: { Firestore, FirebaseAuth, db: {}, auth: 認証 }, 表, した, 認証 };
}
const 帳面の中身 = (表) => 表.get('group_accounts/100001');

// ── 団体で入る ──────────────────────────────────────────

test('ふだんのログイン：帳面の email で入り、帳面は書かない', async () => {
  const { 道具, した } = 用意({
    帳面: { id: '100001', email: 'a@example.com' },
    口座: { 'a@example.com': 'pw' },
  });
  assert.deepStrictEqual(await 団体で入る(道具, '100001', 'pw'), { id: '100001', メール: 'a@example.com' });
  assert.ok(!した.some((x) => x[0] === 'setDoc'));
});

test('切り替えが済んでいれば、新しいアドレスで入り直し、帳面を追いつかせる', async () => {
  // 確認のリンクが開かれて、認証のアドレスは b に替わっている
  const { 道具, 表 } = 用意({
    帳面: { id: '100001', email: 'a@example.com', pendingEmail: 'b@example.com' },
    口座: { 'b@example.com': 'pw' },
  });
  assert.deepStrictEqual(await 団体で入る(道具, '100001', 'pw'), { id: '100001', メール: 'b@example.com' });
  assert.deepStrictEqual(帳面の中身(表), { id: '100001', email: 'b@example.com' }, '切り替え待ちが消える');
});

test('切り替え待ちがあっても、まだリンクが開かれていなければ今のアドレスで入る', async () => {
  const { 道具, 表 } = 用意({
    帳面: { id: '100001', email: 'a@example.com', pendingEmail: 'b@example.com' },
    口座: { 'a@example.com': 'pw' },
  });
  assert.strictEqual((await 団体で入る(道具, '100001', 'pw')).メール, 'a@example.com');
  assert.strictEqual(帳面の中身(表).pendingEmail, 'b@example.com', '切り替え待ちは残す');
});

test('パスワード違いは、切り替え待ちがあってもパスワード違いのまま', async () => {
  const { 道具, した } = 用意({
    帳面: { id: '100001', email: 'a@example.com', pendingEmail: 'b@example.com' },
    口座: { 'b@example.com': 'pw' },
  });
  await assert.rejects(団体で入る(道具, '100001', 'ちがう'), { code: 'auth/invalid-credential' });
  assert.ok(!した.some((x) => x[0] === 'setDoc'), '帳面は書かない');
});

test('帳面を追いつかせられなければ、出てから知らせる（入ったままにしない）', async () => {
  const { 道具, 認証 } = 用意({
    帳面: { id: '100001', email: 'a@example.com', pendingEmail: 'b@example.com' },
    口座: { 'b@example.com': 'pw' },
    書けない: true,
  });
  await assert.rejects(団体で入る(道具, '100001', 'pw'), /切り替えを仕上げられませんでした/);
  assert.strictEqual(認証.今, null);
});

test('無い団体IDは入れない', async () => {
  const { 道具 } = 用意({ 帳面: { id: '100001', email: 'a@example.com' }, 口座: {} });
  await assert.rejects(団体で入る(道具, '999999', 'pw'), /団体IDまたはパスワード/);
});

// ── 切り替えを頼む ──────────────────────────────────────

test('切り替えを頼む：今のアドレスで入り、切り替え待ちを書いてから確認を送り、出る', async () => {
  const { 道具, 表, した, 認証 } = 用意({
    帳面: { id: '100001', email: 'a@example.com' },
    口座: { 'a@example.com': 'pw' },
  });
  assert.deepStrictEqual(await 切り替えを頼む(道具, '100001', 'pw', ' b@example.com '), {
    宛先: 'b@example.com',
  });
  assert.deepStrictEqual(
    した.map((x) => x[0]),
    ['入る', 'setDoc', '確認を送る', '出る'],
    '書いてから送る（先に送ると、リンクを開いたあと入り直せない）'
  );
  assert.deepStrictEqual(した[1][2], { merge: true });
  assert.deepStrictEqual(帳面の中身(表), {
    id: '100001',
    email: 'a@example.com',
    pendingEmail: 'b@example.com',
  });
  assert.deepStrictEqual(した[2], ['確認を送る', 'a@example.com', 'b@example.com']);
  assert.strictEqual(認証.今, null);
});

test('切り替えを頼む：送れなければ切り替え待ちを消して知らせる', async () => {
  const { 道具, 表, 認証 } = 用意({
    帳面: { id: '100001', email: 'a@example.com' },
    口座: { 'a@example.com': 'pw' },
    送れない: 'auth/email-already-in-use',
  });
  await assert.rejects(切り替えを頼む(道具, '100001', 'pw', 'b@example.com'), {
    code: 'auth/email-already-in-use',
  });
  assert.deepStrictEqual(帳面の中身(表), { id: '100001', email: 'a@example.com' });
  assert.strictEqual(認証.今, null);
});

test('切り替えを頼む：パスワード違いなら何も書かない', async () => {
  const { 道具, した } = 用意({
    帳面: { id: '100001', email: 'a@example.com' },
    口座: { 'a@example.com': 'pw' },
  });
  await assert.rejects(切り替えを頼む(道具, '100001', 'ちがう', 'b@example.com'), {
    code: 'auth/invalid-credential',
  });
  assert.ok(!した.some((x) => x[0] === 'setDoc' || x[0] === '確認を送る'));
});

test('切り替えを頼む：今と同じアドレスは断る', async () => {
  const { 道具 } = 用意({ 帳面: { id: '100001', email: 'a@example.com' }, 口座: { 'a@example.com': 'pw' } });
  await assert.rejects(切り替えを頼む(道具, '100001', 'pw', 'A@example.com'), /今のメールアドレスと同じ/);
});

test('認証から届くメールは日本語にする（言語を指定しないと英語の雛形で届く）', () => {
  const 本体 = require('node:fs').readFileSync(
    require('node:path').join(__dirname, '..', 'src', 'db.js'),
    'utf8'
  );
  assert.match(本体, /auth.languageCode = 'ja'/);
});
