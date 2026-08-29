/**
 * 起動のたびに同意の記録を確かめる仕組み。
 *
 * ・記録が無い団体（同意の画面を入れる前から使っている）は、運営者が口頭で
 *   同意を得ているので、記録だけを静かに補う
 * ・記録はあるが版が古い（文書を改定した）ときは、取り直しの印を立てる
 * ・部員の端末からは団体の帳面を書き換えない
 */
const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');
const 法 = require('../src/legalDocs');

test('口頭での記録には、取り方が必ず入る', () => {
  const 記録 = 法.口頭での同意の記録();
  assert.strictEqual(記録.同意の版, 法.同意の版);
  assert.ok(記録.同意の取り方, '押したものと取り違えないよう、取り方を残す必要がある');
  assert.ok(記録.同意した日時 > 0);
  // 画面で押したぶんには、取り方を付けない（付けると口頭と見分けが付かない）
  assert.strictEqual(法.同意の記録().同意の取り方, undefined);
});

test('記録の無い団体には、口頭ぶんを書き足す', async () => {
  const { store, 雲 } = ストアを用意する();
  雲.置く('group_accounts', '100001', { id: '100001', name: 'テスト弓道部', email: 'a@example.com' });
  store.setState({ isHydrated: true, activeGroupId: '100001', activeRole: 'group' });

  await store.getState().同意を確かめる();
  await 待つ(10);

  const 後 = 雲.値('group_accounts', '100001');
  assert.ok(後.同意の版, '同意が記録されていない');
  assert.strictEqual(後.同意の版, 法.同意の版);
  assert.ok(後.同意の取り方, '口頭で得たことが残っていない');
  assert.strictEqual(後.name, 'テスト弓道部', 'もとの中身が消えている');
});

test('すでに押してある団体には触れない', async () => {
  const { store, 雲 } = ストアを用意する();
  const 前 = { id: '100001', name: 'テスト弓道部', 同意の版: '2026-08-24', 同意した日時: 1000 };
  雲.置く('group_accounts', '100001', 前);
  store.setState({ isHydrated: true, activeGroupId: '100001', activeRole: 'group' });

  await store.getState().同意を確かめる();
  await 待つ(10);

  const 後 = 雲.値('group_accounts', '100001');
  assert.strictEqual(後.同意した日時, 1000, '押した日時が上書きされている');
  assert.strictEqual(後.同意の取り方, undefined, '押したものが口頭に書き換わっている');
});

test('部員として入っているときは書かない', async () => {
  const { store, 雲 } = ストアを用意する();
  雲.置く('group_accounts', '100001', { id: '100001', name: 'テスト弓道部' });
  store.setState({
    isHydrated: true,
    activeGroupId: '100001',
    activeRole: 'member',
    myMemberId: 'm1',
  });

  await store.getState().同意を確かめる();
  await 待つ(10);

  const 後 = 雲.値('group_accounts', '100001');
  assert.strictEqual(後.同意の版, undefined, '部員の端末から団体の帳面を書き換えている');
});

test('団体の帳面が無いときは、何も作らない', async () => {
  const { store, 雲 } = ストアを用意する();
  store.setState({ isHydrated: true, activeGroupId: '999999', activeRole: 'group' });

  await store.getState().同意を確かめる();
  await 待つ(10);

  assert.strictEqual(雲.値('group_accounts', '999999'), undefined, '空の帳面を作っている');
});

test('版が古い団体には、取り直しの印を立てる（勝手に書き換えない）', async () => {
  const { store, 雲 } = ストアを用意する();
  雲.置く('group_accounts', '100001', {
    id: '100001',
    name: 'テスト弓道部',
    同意の版: '2000-01-01', // 昔の版
    同意した日時: 1000,
  });
  store.setState({ isHydrated: true, activeGroupId: '100001', activeRole: 'group' });

  await store.getState().同意を確かめる();
  await 待つ(10);

  assert.strictEqual(store.getState().同意の確認が要る, true, '取り直しの印が立っていない');
  const 後 = 雲.値('group_accounts', '100001');
  assert.strictEqual(後.同意の版, '2000-01-01', '同意を得る前に記録を書き換えている');
});

test('いまの版に同意済みなら、何も出さない', async () => {
  const { store, 雲 } = ストアを用意する();
  雲.置く('group_accounts', '100001', { id: '100001', 同意の版: 法.同意の版, 同意した日時: 1000 });
  store.setState({ isHydrated: true, activeGroupId: '100001', activeRole: 'group' });

  await store.getState().同意を確かめる();
  await 待つ(10);

  assert.strictEqual(store.getState().同意の確認が要る, false);
});

test('同意すると、いまの版で記録され、印が下りる', async () => {
  const { store, 雲 } = ストアを用意する();
  雲.置く('group_accounts', '100001', { id: '100001', name: 'テスト弓道部', 同意の版: '2000-01-01' });
  store.setState({ isHydrated: true, activeGroupId: '100001', activeRole: 'group' });

  await store.getState().同意を確かめる();
  await 待つ(10);
  assert.strictEqual(store.getState().同意の確認が要る, true);

  await store.getState().同意を記録する();
  await 待つ(10);

  assert.strictEqual(store.getState().同意の確認が要る, false, '印が下りていない');
  const 後 = 雲.値('group_accounts', '100001');
  assert.strictEqual(後.同意の版, 法.同意の版);
  assert.strictEqual(後.同意の取り方, undefined, '画面で押したのに口頭の扱いになっている');
  assert.strictEqual(後.name, 'テスト弓道部', 'もとの中身が消えている');
});

test('あとでを選ぶと、記録は残さず印だけ下りる', async () => {
  const { store, 雲 } = ストアを用意する();
  雲.置く('group_accounts', '100001', { id: '100001', 同意の版: '2000-01-01' });
  store.setState({ isHydrated: true, activeGroupId: '100001', activeRole: 'group' });

  await store.getState().同意を確かめる();
  await 待つ(10);
  store.getState().同意をあとにする();

  assert.strictEqual(store.getState().同意の確認が要る, false);
  assert.strictEqual(雲.値('group_accounts', '100001').同意の版, '2000-01-01', '同意していないのに記録された');
});

test('取り直しの印は端末に残さない（起動のたびに数え直す）', () => {
  const 本体 = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'src', 'JP_useScoreStore_174.js'),
    'utf8'
  );
  const 始 = 本体.indexOf('partialize: (e) => ({');
  const 保存する分 = 本体.slice(始, 本体.indexOf('}),', 始));
  assert.ok(始 > 0, '保存する値の一覧が見つからない');
  assert.ok(
    !保存する分.includes('同意の確認が要る'),
    '端末に残すと、あとでを選んだ印が居座って二度と出なくなる'
  );
});

test('新規登録で書く項目が、決まりの許す項目に収まっている', () => {
  // 2026-08-27 の配信で踏んだ。同意の記録（同意の版・同意した日時）を
  // group_accounts へ一緒に書くようにしたのに、firestore.rules の
  // hasOnly は 4項目のままだった。create が弾かれ、団体アカウントを
  // 新規に作れない状態が本番で続いていた。
  //
  // しかも Firebase Auth の利用者を先に作ってから Firestore に書くので、
  // 失敗するとメールアドレスだけ取られ、同じアドレスで作り直せなくなる。
  const 読む = (道) => fsMod.readFileSync(pathMod.join(__dirname, '..', ...道), 'utf8');
  const fsMod = require('node:fs');
  const pathMod = require('node:path');

  const 決まり = 読む(['firestore.rules']);
  const i = 決まり.indexOf('match /group_accounts');
  assert.ok(i > 0, 'firestore.rules に group_accounts が無い');
  const 作る所 = 決まり.slice(i, 決まり.indexOf('allow update', i));
  const 並び = 作る所.slice(作る所.indexOf('hasOnly(['), 作る所.indexOf('])'));
  const 許す = new Set([...並び.matchAll(/'([^']+)'/g)].map((m) => m[1]));
  assert.ok(許す.size > 0, 'hasOnly の項目を読み取れない');

  // 画面が書いている項目
  const 画面 = 読む(['src', 'JP_LoginScreen_1036.js']);
  const j = 画面.indexOf("'group_accounts'");
  assert.ok(j > 0, 'ログイン画面が group_accounts に書いている所が見つからない');
  const 書く所 = 画面.slice(画面.indexOf('setDoc)(t, Object.assign('), 画面.indexOf('登録完了と運用ガイド'));
  const 直書き = [...書く所.matchAll(/([a-zA-Z]+):/g)].map((m) => m[1]);
  // 同意の記録 が足す項目
  const 法 = require('../src/legalDocs');
  const 同意 = Object.keys(法.同意の記録());

  const 書く = [...new Set([...直書き, ...同意])];
  const 弾かれる = 書く.filter((k) => !許す.has(k));
  assert.deepStrictEqual(
    弾かれる.sort(),
    [],
    '決まりが許していない項目を書いている（新規登録が permission-denied で失敗する）'
  );
});
