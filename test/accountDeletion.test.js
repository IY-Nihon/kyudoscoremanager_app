/**
 * 団体アカウントの削除（src/accountDeletion.js、ストアの deleteGroupAccount）。
 *
 * 守りたいこと：
 *   ・団体に属するものが全部 deleted_accounts/{団体ID} の下へ写ってから、元が消える
 *   ・group_accounts はいちばん最後に消える（決まりが持ち主を email で確かめるため）
 *   ・団体アカウント・管理者モード・ライブ中でない、の3つがそろわないと消せない
 *   ・パスワードが違えば何も消えない
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する } = require('./helpers/storeHarness');
const { 写す下位, 保管日数 } = require('../src/accountDeletion');

const 団体 = '100001';

function 用意() {
  const { store, 雲, 知らせ } = ストアを用意する();
  雲.置く('group_accounts', 団体, { id: 団体, email: 'g@example.com' });
  雲.置く(`group_accounts/${団体}/private`, 'consent', { 版: '2026-08-31' });
  雲.置く('groups', 団体, { groupName: '検査高校' });
  雲.置く(`groups/${団体}/sessions`, 'ses-1', { id: 'ses-1', title: '練習1', date: 1 });
  雲.置く(`groups/${団体}/sessions`, 'ses-2', { id: 'ses-2', title: '練習2', date: 2 });
  雲.置く(`groups/${団体}/members`, 'm1', { id: 'm1', name: '部員1' });
  雲.置く(`groups/${団体}/alumni`, 'a1', { id: 'a1', name: '卒業生1' });
  雲.置く(`groups/${団体}/trash`, 't1', { id: 't1' });
  雲.置く(`groups/${団体}/config`, 'app_settings', { tagTemplates: ['立'] });
  雲.置く(`groups/${団体}/member_lookup`, '1234', { memberId: 'm1' });
  雲.状態.合言葉 = 'seikai';
  store.setState({
    activeGroupId: 団体,
    activeRole: 'group',
    isAdminMode: true,
    isLiveActive: false,
    activeUserEmail: 'g@example.com',
    isHydrated: true,
    isNetworkOnline: true,
    // 手元の名簿もクラウドと同じにしておく（名簿に無い人の逆引きは、ストアが自分で片付けるため）
    members: [{ id: 'm1', name: '部員1', personalId: '1234' }],
  });
  return { store, 雲, 知らせ };
}

const 数える = (雲, 道) => 雲.中身(道).length;

test('消すと、団体の中身がぜんぶ deleted_accounts へ写ってから元が消え、口座も消える', async () => {
  const { store, 雲 } = 用意();
  const 進み = [];
  const 結果 = await store.getState().deleteGroupAccount('seikai', (文) => 進み.push(文));
  assert.ok(結果.ok, 結果.訳);

  // 写し
  const 写し = 雲.値('deleted_accounts', 団体);
  assert.ok(写し, '写しの文書が無い');
  assert.equal(写し.email, 'g@example.com');
  assert.equal(写し.団体名, '検査高校');
  assert.deepEqual(写し.group, { groupName: '検査高校' });
  assert.deepEqual(写し.account, { id: 団体, email: 'g@example.com' });
  assert.deepEqual(写し.private, { consent: { 版: '2026-08-31' } });
  assert.ok(写し.expireAt - 写し.deletedAt === 保管日数 * 86400000, '保管の期限が30日でない');
  assert.equal(写し.件数.sessions, 2);
  assert.equal(雲.値(`deleted_accounts/${団体}/sessions`, 'ses-2').title, '練習2');
  assert.equal(雲.値(`deleted_accounts/${団体}/members`, 'm1').name, '部員1');
  assert.equal(雲.値(`deleted_accounts/${団体}/member_lookup`, '1234').memberId, 'm1');
  assert.deepEqual(写し.件数, { sessions: 2, members: 1, alumni: 1, trash: 1, config: 1, officialPracticeDays: 0, member_lookup: 1 });
  for (const 名 of 写す下位) assert.equal(数える(雲, `deleted_accounts/${団体}/${名}`), 写し.件数[名], `${名} の写しの数`);

  // 元は消えている
  for (const 名 of 写す下位) assert.equal(数える(雲, `groups/${団体}/${名}`), 0, `${名} が残っている`);
  assert.equal(雲.値('groups', 団体), undefined, '団体の文書が残っている');
  assert.equal(雲.値(`group_accounts/${団体}/private`, 'consent'), undefined, '同意の記録が残っている');
  assert.equal(雲.値('group_accounts', 団体), undefined, 'アカウントの文書が残っている');
  assert.ok(雲.状態.消した口座, 'ログインの口座が消えていない');

  // 進みの順（本人確認 → 写し → 削除 → 口座）
  assert.deepEqual(進み, ['本人確認', '写しを作成', '元の場所から削除', 'ログイン口座を削除']);
});

test('group_accounts は、ほかの削除より後に消える', async () => {
  const { store, 雲 } = 用意();
  await store.getState().deleteGroupAccount('seikai');
  const 履歴 = 雲.記録.filter((h) => Array.isArray(h.操作));
  const 順 = (道, id) => 履歴.findIndex((h) => h.操作.some((x) => x.種類 === 'delete' && x.道 === 道 && x.id === id));
  const 口座 = 順('group_accounts', 団体);
  assert.ok(口座 >= 0, 'group_accounts を消していない');
  assert.ok(順(`groups/${団体}/sessions`, 'ses-1') < 口座, '記録より先に group_accounts を消している');
  assert.ok(順('groups', 団体) < 口座, '団体の文書より先に group_accounts を消している');
  // 写しは削除より先
  const 写し = 履歴.findIndex((h) => h.操作.some((x) => x.種類 === 'set' && x.道 === 'deleted_accounts' && x.id === 団体));
  assert.ok(写し >= 0 && 写し < 順(`groups/${団体}/sessions`, 'ses-1'), '写す前に消している');
});

test('パスワードが違えば、何も消えない', async () => {
  const { store, 雲 } = 用意();
  const 結果 = await store.getState().deleteGroupAccount('machigai');
  assert.equal(結果.ok, false);
  assert.match(結果.訳, /パスワード/);
  assert.equal(数える(雲, `groups/${団体}/sessions`), 2);
  assert.ok(雲.値('group_accounts', 団体));
  assert.equal(雲.値('deleted_accounts', 団体), undefined);
});

test('管理者モードでない・部員で入っている・ライブ中、は消せない', async () => {
  const { store, 雲 } = 用意();
  store.setState({ isAdminMode: false });
  assert.match((await store.getState().deleteGroupAccount('seikai')).訳, /管理者モード/);
  store.setState({ isAdminMode: true, activeRole: 'member' });
  assert.match((await store.getState().deleteGroupAccount('seikai')).訳, /団体アカウント/);
  store.setState({ activeRole: 'group', isLiveActive: true });
  assert.match((await store.getState().deleteGroupAccount('seikai')).訳, /ライブ/);
  assert.equal(数える(雲, `groups/${団体}/sessions`), 2, '何かが消えた');
});
