/**
 * メンバーの招待リンク（src/memberInvite.js・src/groupLogin.js の 部員として入る）の検査。
 *
 *   npm test
 *
 * 決まり（firestore.rules）が通すかどうかは、検証環境で scripts/verify-invite.mjs が見る。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');
const 招 = require('../src/memberInvite');

const 団体 = '100001';
const 逆引きの道 = `groups/${団体}/member_lookup`;

/** 決まった乱数（検査用） */
const 決まった乱数 = (n) => ({
  getRandomValues: (桶) => {
    for (let i = 0; i < 桶.length; i++) 桶[i] = (n + i) & 255;
    return 桶;
  },
});

test('合言葉は 16 進 32 字（128 ビット）。推測できない乱数が無ければ作らない', () => {
  assert.match(招.合言葉を作る(決まった乱数(1)), /^[0-9a-f]{32}$/);
  assert.notStrictEqual(招.合言葉を作る(決まった乱数(1)), 招.合言葉を作る(決まった乱数(2)));
  assert.throws(() => 招.合言葉を作る({}), /作れません/);
});

test('リンクを作って読み戻せる。形の違うものは読まない', () => {
  const 合言葉 = 'a'.repeat(32);
  const リンク = 招.招待リンクを作る('https://kyudoscoremanager.web.app/', 団体, 合言葉);
  assert.strictEqual(リンク, `https://kyudoscoremanager.web.app/#招待=${団体}.${合言葉}`);
  assert.deepStrictEqual(招.URLから招待を取る(リンク), { 団体, 合言葉 });
  // ブラウザが # の後ろを符号にしたもの
  assert.deepStrictEqual(招.URLから招待を取る(`https://x/#${encodeURIComponent('招待')}=${団体}.${合言葉}`), {
    団体,
    合言葉,
  });
  assert.strictEqual(
    招.URLから招待を取る('https://x/#招待=100001.1234'),
    null,
    '個人ID のような短いものは受けない'
  );
  assert.strictEqual(招.URLから招待を取る('https://x/#招待=../x.' + 合言葉), null, '団体に変な字');
  assert.strictEqual(招.URLから招待を取る('https://x/#共有=abc'), null);
  assert.strictEqual(招.URLから招待を取る('https://x/'), null);
});

function 用意() {
  const { store, 雲 } = ストアを用意する();
  store.setState({ activeGroupId: 団体, activeRole: 'group', isHydrated: true, isNetworkOnline: true });
  return { store, 雲, 道具: { Firestore: 雲.api, db: {} } };
}

test('作り直すと、前の合言葉は消えて新しいものだけが残る（個人ID の文書には触らない）', async () => {
  const { store, 雲, 道具 } = 用意();
  // 名簿にもいる人にする（名簿が空だと、名簿の整理が 1234 を正しく消してしまう）
  store.setState({ members: [{ id: 'm1', name: 'いる人', personalId: '1234' }] });
  雲.置く(逆引きの道, '1234', { memberId: 'm1', updatedAt: 1 });
  const 一つ目 = (await 招.招待を作り直す(道具, 団体, 'm1', { 乱数源: 決まった乱数(1) })).合言葉;
  assert.strictEqual((await 招.招待を探す(道具, 団体, 'm1')).合言葉, 一つ目);
  // 画面が知っている前の合言葉を渡す。書く前に雲へ問い合わせない
  let 問い合わせた = 0;
  const 数える道具 = Object.assign({}, 道具, {
    Firestore: Object.assign({}, 道具.Firestore, {
      getDocs: (...引数) => (問い合わせた++, 道具.Firestore.getDocs(...引数)),
    }),
  });
  const 作り直しの約束 = 招.招待を作り直す(数える道具, 団体, 'm1', { 前の合言葉: 一つ目, 乱数源: 決まった乱数(9) });
  assert.strictEqual(問い合わせた, 0, '書く前に雲へ問い合わせた');
  const 二つ目 = (await 作り直しの約束).合言葉;
  assert.strictEqual(雲.値(逆引きの道, 一つ目), undefined, '前の合言葉が消えていない');
  await 待つ(10);
  assert.notStrictEqual(一つ目, 二つ目);
  assert.deepStrictEqual(雲.中身(逆引きの道), ['1234', 二つ目].sort());
  assert.strictEqual(雲.値(逆引きの道, 二つ目).memberId, 'm1');
  assert.strictEqual(雲.値(逆引きの道, 二つ目).招待, true);
  assert.strictEqual(await 招.招待を取り消す(道具, 団体, 'm1'), 1);
  assert.deepStrictEqual(雲.中身(逆引きの道), ['1234']);
  assert.strictEqual(await 招.招待を探す(道具, 団体, 'm1'), null);
});

test('期限は作ってから 7 日。雲にも期限を置き、探すと期限も返る。過ぎたら切れている扱い', async () => {
  const { 雲, 道具 } = 用意();
  const 今 = Date.UTC(2026, 8, 24, 12, 0, 0);
  const 作った = await 招.招待を作り直す(道具, 団体, 'm1', { 乱数源: 決まった乱数(3), 今 });
  assert.strictEqual(招.招待の期限の日数, 7);
  assert.strictEqual(作った.期限, 今 + 7 * 86400000);
  const 置いた = 雲.値(逆引きの道, 作った.合言葉);
  assert.strictEqual(招.招待の期限(置いた), 今 + 7 * 86400000, '雲に期限（expiresAt）を置いていない');
  assert.deepStrictEqual(await 招.招待を探す(道具, 団体, 'm1'), 作った);
  assert.strictEqual(招.招待の期限切れか(置いた, 今 + 7 * 86400000 - 1), false);
  assert.strictEqual(招.招待の期限切れか(置いた, 今 + 7 * 86400000), true);
  // 期限の無い招待の文書は切れている扱い（決まりと同じ）。個人ID の文書は期限を見ない
  assert.strictEqual(招.招待の期限切れか({ memberId: 'm1', 招待: true }, 今), true);
  assert.strictEqual(招.招待の期限切れか({ memberId: 'm1' }, 今), false);
});

test('前の合言葉を知らないまま作っても、ほかに残っていた招待はあとで片付く', async () => {
  const { 雲, 道具 } = 用意();
  雲.置く(逆引きの道, 'a'.repeat(32), { memberId: 'm1', 招待: true, expiresAt: new Date(Date.now() + 86400000) });
  雲.置く(逆引きの道, 'b'.repeat(32), { memberId: 'm2', 招待: true, expiresAt: new Date(Date.now() + 86400000) });
  const 作った = await 招.招待を作り直す(道具, 団体, 'm1', { 乱数源: 決まった乱数(5) });
  await 待つ(20);
  assert.deepStrictEqual(雲.中身(逆引きの道), [作った.合言葉, 'b'.repeat(32)].sort(), 'm1 の古い招待だけ消える');
});

test('返りの遅い片付けが、あとから作り直した新しい招待を消さない', async () => {
  const { 雲, 道具 } = 用意();
  // 片付けの問い合わせだけを止めておき、作り直しのあとで返す（WebKit で遅れて返った形）
  const 止めた = [];
  const 遅い道具 = Object.assign({}, 道具, {
    Firestore: Object.assign({}, 道具.Firestore, {
      getDocs: (...引数) => new Promise((解く) => 止めた.push(() => 解く(道具.Firestore.getDocs(...引数)))),
    }),
  });
  const 今 = Date.now();
  const 一つ目 = await 招.招待を作り直す(遅い道具, 団体, 'm1', { 乱数源: 決まった乱数(1), 今 });
  const 二つ目 = await 招.招待を作り直す(遅い道具, 団体, 'm1', {
    前の合言葉: 一つ目.合言葉,
    乱数源: 決まった乱数(2),
    今: 今 + 1000,
  });
  // ここで 1 つ目の片付けが返る（このとき雲には 二つ目 だけがある）
  for (const 返す of 止めた.splice(0)) 返す();
  await 待つ(20);
  assert.deepStrictEqual(雲.中身(逆引きの道), [二つ目.合言葉], '作り直した新しい招待が消えた');
});

test('名簿の整理（syncMemberLookup）は、招待の合言葉を消さない。メンバーから外れた人のものだけ消す', async () => {
  const { store, 雲 } = 用意();
  store.setState({
    members: [{ id: 'm1', name: 'いる人', personalId: '1234' }],
  });
  雲.置く(逆引きの道, '1234', { memberId: 'm1' });
  雲.置く(逆引きの道, 'a'.repeat(32), { memberId: 'm1', 招待: true });
  雲.置く(逆引きの道, 'b'.repeat(32), { memberId: '外れた人', 招待: true });
  await store.getState().syncMemberLookup();
  await 待つ(10);
  assert.deepStrictEqual(雲.中身(逆引きの道), ['1234', 'a'.repeat(32)].sort());
});

test('名簿が空のとき（まだ読めていない）は、招待の合言葉を消さない', async () => {
  const { store, 雲 } = 用意();
  store.setState({ members: [] });
  雲.置く(逆引きの道, 'a'.repeat(32), { memberId: 'm1', 招待: true });
  await store.getState().syncMemberLookup();
  await 待つ(10);
  assert.deepStrictEqual(雲.中身(逆引きの道), ['a'.repeat(32)]);
});

test('最後の 1 人を消すと、その人の招待の合言葉も消える', async () => {
  const { store, 雲 } = 用意();
  store.setState({ members: [{ id: 'm1', name: 'いる人', personalId: '1234' }] });
  雲.置く(`groups/${団体}/members`, 'm1', { id: 'm1', name: 'いる人', personalId: '1234' });
  雲.置く(逆引きの道, '1234', { memberId: 'm1' });
  雲.置く(逆引きの道, 'a'.repeat(32), { memberId: 'm1', 招待: true });
  store.getState().deleteMember('m1');
  await 待つ(50);
  assert.deepStrictEqual(雲.中身(逆引きの道), []);
});

test('部員として入る：合言葉で逆引きして所属の証を書き、名前を返す。引けなければ知らせる', async () => {
  const { 雲 } = 用意();
  const 合言葉 = 'c'.repeat(32);
  雲.置く(逆引きの道, 合言葉, { memberId: 'm1', 招待: true, expiresAt: new Date(Date.now() + 86400000) });
  雲.置く(`groups/${団体}/members`, 'm1', { id: 'm1', name: '山田 太郎' });
  const 認証 = { currentUser: null };
  const FirebaseAuth = {
    signInAnonymously: async (auth) => {
      auth.currentUser = { uid: 'anon-1', isAnonymous: true };
    },
  };
  const { 部員として入る } = require('../src/groupLogin');
  const 結果 = await 部員として入る({ Firestore: 雲.api, FirebaseAuth, db: {}, auth: 認証 }, 団体, 合言葉);
  assert.deepStrictEqual(結果, { memberId: 'm1', 名前: '山田 太郎' });
  const 証 = 雲.値('member_claims', 'anon-1');
  assert.strictEqual(証.groupId, 団体);
  assert.strictEqual(証.memberId, 'm1');
  assert.strictEqual(証.personalId, 合言葉);
  await assert.rejects(
    部員として入る(
      { Firestore: 雲.api, FirebaseAuth, db: {}, auth: 認証 },
      団体,
      'd'.repeat(32),
      '使えません'
    ),
    /使えません/
  );
  // 期限の切れた招待では入らず、期限切れと知らせる（所属の証も書かない）
  const 切れた = 'e'.repeat(32);
  雲.置く(逆引きの道, 切れた, { memberId: 'm1', 招待: true, expiresAt: new Date(Date.now() - 1000) });
  認証.currentUser = null;
  FirebaseAuth.signInAnonymously = async (auth) => {
    auth.currentUser = { uid: 'anon-2', isAnonymous: true };
  };
  await assert.rejects(
    部員として入る({ Firestore: 雲.api, FirebaseAuth, db: {}, auth: 認証 }, 団体, 切れた, '使えません', '期限切れ'),
    /期限切れ/
  );
  assert.strictEqual(雲.値('member_claims', 'anon-2'), undefined, '期限切れなのに所属の証を書いた');
});
