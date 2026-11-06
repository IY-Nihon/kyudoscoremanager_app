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

test('貼り付けで見えない空白や全角が混じったリンクも読む（団体は大文字にしない）', () => {
  const 合言葉 = 'a'.repeat(32);
  // LINE から貼ると末尾に幅の無い空白が付く。ブラウザはそれを %E2%80%8B にする
  assert.deepStrictEqual(招.URLから招待を取る(`https://x/#招待=${団体}.${合言葉}%E2%80%8B`), { 団体, 合言葉 });
  assert.deepStrictEqual(招.URLから招待を取る(`https://x/#招待=${団体}.${合言葉}\u200B`), { 団体, 合言葉 });
  // 全角の番号と合言葉
  assert.deepStrictEqual(招.URLから招待を取る(`https://x/#招待=１００００１.${'Ａ'.repeat(32)}`), { 団体, 合言葉 });
  // 古い団体の鍵の小文字はそのまま
  assert.deepStrictEqual(招.URLから招待を取る(`https://x/#招待=abC1.${合言葉}`), { 団体: 'abC1', 合言葉 });
});

function 用意() {
  const { store, 雲 } = ストアを用意する();
  store.setState({ activeGroupId: 団体, activeRole: 'group', isHydrated: true, isNetworkOnline: true });
  return { store, 雲, 道具: { Firestore: 雲.api, db: {} } };
}

test('作り直すと、前の合言葉は消えて新しいものだけが残る（個人ID の文書には触らない）', async () => {
  const { store, 雲, 道具 } = 用意();
  // 名簿にもいる人にする（名簿が空に見えるときは、名簿の整理は行を消さない）
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
  const 作り直しの約束 = 招.招待を作り直す(数える道具, 団体, 'm1', {
    前の合言葉: 一つ目,
    乱数源: 決まった乱数(9),
  });
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
  雲.置く(逆引きの道, 'a'.repeat(32), {
    memberId: 'm1',
    招待: true,
    expiresAt: new Date(Date.now() + 86400000),
  });
  雲.置く(逆引きの道, 'b'.repeat(32), {
    memberId: 'm2',
    招待: true,
    expiresAt: new Date(Date.now() + 86400000),
  });
  const 作った = await 招.招待を作り直す(道具, 団体, 'm1', { 乱数源: 決まった乱数(5) });
  await 待つ(20);
  assert.deepStrictEqual(
    雲.中身(逆引きの道),
    [作った.合言葉, 'b'.repeat(32)].sort(),
    'm1 の古い招待だけ消える'
  );
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

test('名簿の整理（syncMemberLookup）は、招待の合言葉を消さない。メンバーから外れた（消した）人のものだけ消す', async () => {
  const { store, 雲 } = 用意();
  store.setState({
    members: [{ id: 'm1', name: 'いる人' }],
    deletedMembers: { 外れた人: Date.now() },
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
  // 登録メールアドレスの確認が済んだ団体（済んでいない団体には入れない。2026-11-03）
  雲.置く('group_accounts', 団体, { id: 団体, email: 'owner@example.com', verified: true });
  雲.置く(逆引きの道, 合言葉, { memberId: 'm1', 招待: true, expiresAt: new Date(Date.now() + 86400000) });
  雲.置く(`groups/${団体}/members`, 'm1', { id: 'm1', name: '山田 太郎' });
  const 認証 = { currentUser: null };
  const FirebaseAuth = {
    signInAnonymously: (auth) => {
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
  FirebaseAuth.signInAnonymously = (auth) => {
    auth.currentUser = { uid: 'anon-2', isAnonymous: true };
  };
  await assert.rejects(
    部員として入る(
      { Firestore: 雲.api, FirebaseAuth, db: {}, auth: 認証 },
      団体,
      切れた,
      '使えません',
      '期限切れ'
    ),
    /期限切れ/
  );
  assert.strictEqual(雲.値('member_claims', 'anon-2'), undefined, '期限切れなのに所属の証を書いた');
});

test('部員として入る：途中で失敗したら、そのとき作った匿名の利用者を消す。入れたら消さない', async () => {
  const { 雲 } = 用意();
  const 合言葉 = 'f'.repeat(32);
  // 登録メールアドレスの確認が済んだ団体（済んでいない団体には入れない。2026-11-03）
  雲.置く('group_accounts', 団体, { id: 団体, email: 'owner@example.com', verified: true });
  雲.置く(逆引きの道, 合言葉, { memberId: 'm1', 招待: true, expiresAt: new Date(Date.now() + 86400000) });
  雲.置く(`groups/${団体}/members`, 'm1', { id: 'm1', name: '山田 太郎' });
  const 認証 = { currentUser: null };
  const 消した = [];
  let 出た = 0;
  let 番 = 0;
  const FirebaseAuth = {
    signInAnonymously: (auth) => {
      auth.currentUser = { uid: `anon-${++番}`, isAnonymous: true };
    },
    deleteUser: async (人) => {
      消した.push(人.uid);
      認証.currentUser = null;
    },
    signOut: async () => {
      出た++;
      認証.currentUser = null;
    },
  };
  const { 部員として入る } = require('../src/groupLogin');
  const 道具 = { Firestore: 雲.api, FirebaseAuth, db: {}, auth: 認証 };
  await assert.rejects(部員として入る(道具, 団体, 'g'.repeat(32), '使えません'), /使えません/);
  assert.deepStrictEqual(消した, ['anon-1']);
  assert.strictEqual(認証.currentUser, null);
  await 部員として入る(道具, 団体, 合言葉);
  assert.deepStrictEqual(消した, ['anon-1'], '入れた人を消した');
  assert.strictEqual(認証.currentUser.uid, 'anon-2');
  // 消せないとき（入ってから時間が経ったなど）は出るだけ。元の知らせはそのまま返す
  FirebaseAuth.deleteUser = async () => {
    throw new Error('requires-recent-login');
  };
  await assert.rejects(部員として入る(道具, 団体, 'h'.repeat(32), '使えません'), /使えません/);
  assert.strictEqual(出た, 1);
  // メールで入っている人（匿名でない）に変わっていたら触らない
  FirebaseAuth.signInAnonymously = (auth) => {
    auth.currentUser = { uid: 'mail-1', isAnonymous: false };
  };
  FirebaseAuth.deleteUser = async (人) => 消した.push(人.uid);
  await assert.rejects(部員として入る(道具, 団体, 'i'.repeat(32), '使えません'), /使えません/);
  assert.deepStrictEqual(消した, ['anon-1']);
});

test('部員として入る：前から使っていた匿名の口座（入り直しの窓）は、打ち間違えても消さない', async () => {
  const { 雲 } = 用意();
  雲.置く('group_accounts', 団体, { id: 団体, email: 'owner@example.com', verified: true });
  const 前から = { uid: 'anon-old', isAnonymous: true };
  const 認証 = { currentUser: 前から };
  const 消した = [];
  let 出た = 0;
  const FirebaseAuth = {
    // すでに匿名で入っている端末では、Firebase は今の口座をそのまま返す
    signInAnonymously: async () => ({ user: 認証.currentUser }),
    deleteUser: async (人) => void 消した.push(人.uid),
    signOut: async () => void 出た++,
  };
  const { 部員として入る } = require('../src/groupLogin');
  await assert.rejects(
    部員として入る({ Firestore: 雲.api, FirebaseAuth, db: {}, auth: 認証 }, 団体, 'z'.repeat(32), '使えません'),
    /使えません/
  );
  assert.deepStrictEqual(消した, [], 'まだ使えていた部員の口座を消した');
  assert.strictEqual(出た, 0);
  assert.strictEqual(認証.currentUser, 前から);
});

test('団体から出る：部員は証と匿名の口座を消して出る。電波が無くて返らなくても待ちきらずに出る', async () => {
  const { 団体から出る } = require('../src/groupLogin');
  const 起きた = [];
  const 認証 = { currentUser: { uid: 'anon-9', isAnonymous: true } };
  const 道具 = (返らない) => ({
    Firestore: {
      doc: (_db, 集まり, id) => `${集まり}/${id}`,
      // 電波が無いと Firestore の書き込みは届くまで返らない
      deleteDoc: (場所) => (起きた.push(`消す ${場所}`), 返らない ? new Promise(() => {}) : Promise.resolve()),
    },
    FirebaseAuth: {
      deleteUser: async (人) => {
        起きた.push(`口座 ${人.uid}`);
        認証.currentUser = null;
      },
      signOut: async () => {
        起きた.push('出る');
        認証.currentUser = null;
      },
    },
    db: {},
    auth: 認証,
  });
  const 始め = Date.now();
  await 団体から出る(道具(true), 'member', 30);
  assert.ok(Date.now() - 始め < 1000, '証の削除を待ちきった');
  assert.deepStrictEqual(起きた, ['消す member_claims/anon-9', '口座 anon-9']);
  // 団体はログインから出るだけ（証も口座も消さない）
  起きた.length = 0;
  認証.currentUser = { uid: 'owner-1', isAnonymous: false };
  await 団体から出る(道具(false), 'group', 30);
  assert.deepStrictEqual(起きた, ['出る']);
  // 口座を消せない（入ってから日が経った）ときは出るだけ
  起きた.length = 0;
  認証.currentUser = { uid: 'anon-10', isAnonymous: true };
  const 消せない = 道具(false);
  消せない.FirebaseAuth.deleteUser = async () => {
    throw Object.assign(new Error('x'), { code: 'auth/requires-recent-login' });
  };
  await 団体から出る(消せない, 'member', 30);
  assert.deepStrictEqual(起きた, ['消す member_claims/anon-10', '出る']);
});

// ── 何度か送る（2026-10-24：雲の返事が戻らない回への予防）──
const { 何度か送る } = require('../src/memberInvite');

test('何度か送る：返事が戻らないときは上限で切って送り直し、通れば答えを返す', async () => {
  let 回 = 0;
  const 答え = await 何度か送る(
    () => {
      回++;
      return 回 < 3 ? new Promise(() => {}) : Promise.resolve('通った');
    },
    { 上限: 30, 間: 0 }
  );
  assert.equal(答え, '通った');
  assert.equal(回, 3);
});

test('何度か送る：通信の誤りは送り直し、決まりに断られたときは送り直さない', async () => {
  let 回 = 0;
  const 答え = await 何度か送る(
    () => {
      回++;
      return 回 === 1
        ? Promise.reject(Object.assign(new Error('x'), { code: 'unavailable' }))
        : Promise.resolve(1);
    },
    { 上限: 1000, 間: 0 }
  );
  assert.equal(答え, 1);
  assert.equal(回, 2);

  let 断られた回 = 0;
  await assert.rejects(
    何度か送る(
      () => {
        断られた回++;
        return Promise.reject(
          Object.assign(new Error('この招待リンクは使えません'), { code: 'permission-denied' })
        );
      },
      { 上限: 1000, 間: 0 }
    ),
    /使えません/
  );
  assert.equal(断られた回, 1);
});

test('何度か送る：何度送っても戻らなければ「つながらない」として投げる', async () => {
  let 回 = 0;
  await assert.rejects(
    何度か送る(
      () => {
        回++;
        return new Promise(() => {});
      },
      { 回数: 3, 上限: 20, 間: 0 }
    ),
    (誤り) => 誤り.code === 'unavailable'
  );
  assert.equal(回, 3);
});

// ── 逆引き表を読む回数（11/2：同期のたびに表を全部読んでいた）──
/** 逆引き表を読んだ回数を数える */
function 読みを数える(雲) {
  const 元 = 雲.api.getDocs;
  const 数 = { 逆引き: 0 };
  雲.api.getDocs = async (集まり) => {
    if (集まり && String(集まり.道).endsWith('/member_lookup')) 数.逆引き++;
    return 元(集まり);
  };
  return 数;
}

test('逆引き表：名簿と削除の控えが前に合わせたときと同じなら読まない。変わったら読む', async () => {
  const { store, 雲 } = 用意();
  const 数 = 読みを数える(雲);
  雲.置く(逆引きの道, 'K7MP3X', { memberId: 'm1' });
  store.setState({ members: [{ id: 'm1', name: 'いる人' }] });
  await store.getState().syncMemberLookup();
  await store.getState().syncMemberLookup();
  assert.strictEqual(数.逆引き, 1, '変わっていないのに読んだ');
  assert.deepStrictEqual(store.getState().個人IDの表, { m1: 'K7MP3X' }, '読んだ表を店に持っていない');
  // 名前だけ変えても読まない（表に関わらない）
  store.setState({ members: [{ id: 'm1', name: '直した名前' }] });
  await store.getState().syncMemberLookup();
  assert.strictEqual(数.逆引き, 1);
  // 人が増えた・削除の控えが変わった → 読む
  store.setState({ members: [{ id: 'm1', name: '直した名前' }, { id: 'm2', name: '増えた人' }] });
  await store.getState().syncMemberLookup();
  assert.strictEqual(数.逆引き, 2);
  store.setState({ deletedMembers: { m9: Date.now() } });
  await store.getState().syncMemberLookup();
  assert.strictEqual(数.逆引き, 3);
});

test('逆引き表：起動したら（店を作り直したら）最初は必ず読む。控えから答えた表では済みにせず、個人ID も振らない', async () => {
  const 一台目 = 用意();
  一台目.store.setState({ members: [{ id: 'm1', name: 'いる人' }] });
  await 一台目.store.getState().ensurePersonalIds();
  const [振った] = 一台目.雲.中身(逆引きの道);
  assert.match(振った, /^[A-HJKMNP-Z2-9]{6}$/);
  // ほかの端末が表を壊した（行が消えた）
  一台目.雲.消す(逆引きの道, 振った);
  // 同じ雲・同じ名簿で起動し直す
  const { store } = ストアを用意する(一台目.雲);
  const 雲 = 一台目.雲;
  store.setState({ activeGroupId: 団体, activeRole: 'group', isHydrated: true, isNetworkOnline: true });
  const 数 = 読みを数える(雲);
  store.setState({ members: [{ id: 'm1', name: 'いる人' }] });
  雲.状態.控えから答える = true;
  assert.deepStrictEqual(await store.getState().ensurePersonalIds(), [], '控えから答えた表で個人ID を振った（A1）');
  await store.getState().syncMemberLookup();
  assert.deepStrictEqual(雲.中身(逆引きの道), [], '控えから答えた表で書いた');
  雲.状態.控えから答える = false;
  const 振り直した = await store.getState().ensurePersonalIds();
  assert.strictEqual(振り直した.length, 1, '雲から読めたのに振らない');
  assert.ok(数.逆引き >= 3, '控えから答えた表で済みにした');
  assert.deepStrictEqual(雲.中身(逆引きの道), [振り直した[0].個人ID]);
});

test('逆引き表：名簿が空に見えるときは、個人ID の行も消さない', async () => {
  const { store, 雲 } = 用意();
  雲.置く(逆引きの道, '1234', { memberId: 'm1' });
  store.setState({ members: [] });
  await store.getState().syncMemberLookup();
  await 待つ(10);
  assert.deepStrictEqual(雲.中身(逆引きの道), ['1234']);
});

test('逆引き表：手元の名簿に見えないだけの人（ほかの端末で足したばかり）の行は消さない。同じ人の古い ID は消す', async () => {
  const { store, 雲 } = 用意();
  雲.置く(逆引きの道, 'K7MP3X', { memberId: 'm1' });
  雲.置く(逆引きの道, '1234', { memberId: 'm1' });
  雲.置く(逆引きの道, 'AB2CDE', { memberId: 'ほかの端末で足した人' });
  store.setState({ members: [{ id: 'm1', name: 'いる人' }] });
  await store.getState().syncMemberLookup();
  await 待つ(10);
  assert.deepStrictEqual(雲.中身(逆引きの道), ['AB2CDE', 'K7MP3X'].sort());
});

test('逆引き表：同時に 2 本走らせない。走っている間に変わったら、終わってから 1 回だけ見直す', async () => {
  const { store, 雲 } = 用意();
  const 数 = 読みを数える(雲);
  雲.置く(逆引きの道, 'K7MP3X', { memberId: 'm1' });
  雲.置く(逆引きの道, 'AB2CDE', { memberId: 'm2' });
  store.setState({ members: [{ id: 'm1', name: 'いる人' }] });
  const 一本目 = store.getState().syncMemberLookup();
  // 一本目が読んでいる間に、人が増えた
  store.setState({
    members: [
      { id: 'm1', name: 'いる人' },
      { id: 'm2', name: '増えた人' },
    ],
  });
  await Promise.all([一本目, store.getState().syncMemberLookup(), store.getState().syncMemberLookup()]);
  await 待つ(10);
  assert.strictEqual(数.逆引き, 2, '同時に読んだか、見直していない');
  assert.deepStrictEqual(store.getState().個人IDの表, { m1: 'K7MP3X', m2: 'AB2CDE' });
});

test('部員として入る：登録メールアドレスの確認が済んでいない団体には、猶予が過ぎたら匿名の利用者を作らずに断る', async () => {
  const { 雲 } = 用意();
  const 合言葉 = 'd'.repeat(32);
  雲.置く('group_accounts', 団体, { id: 団体, email: 'owner@example.com' });
  雲.置く(逆引きの道, 合言葉, { memberId: 'm1', 招待: true, expiresAt: new Date(Date.now() + 86400000) });
  雲.置く(`groups/${団体}/members`, 'm1', { id: 'm1', name: '山田 太郎' });
  const 認証 = { currentUser: null };
  let 匿名 = 0;
  const FirebaseAuth = { signInAnonymously: () => void 匿名++ };
  const { 部員として入る } = require('../src/groupLogin');
  // 猶予（今ある団体は配信から 1 週間）が過ぎたあと
  const 猶予のあと = Date.parse(require('../src/mailKakunin').猶予の終わり + 'T00:00:00Z') + 1000;
  await assert.rejects(
    部員として入る({ Firestore: 雲.api, FirebaseAuth, db: {}, auth: 認証, 今: 猶予のあと }, 団体, 合言葉),
    /確認が済んでいない/
  );
  assert.equal(匿名, 0, '匿名の利用者を作った');
});

test('部員として入る：中継（/kojin）が確かめて証を書く。端末は逆引き表を読まない。中継が古い（404）ときだけ前の道', async () => {
  const { 雲 } = 用意();
  雲.置く('group_accounts', 団体, { id: 団体, email: 'owner@example.com', verified: true });
  雲.置く(逆引きの道, 'K7MP3X', { memberId: 'm1' });
  雲.置く(`groups/${団体}/members`, 'm1', { id: 'm1', name: '山田 太郎' });
  const 認証 = { currentUser: null };
  let 番 = 0;
  const 消した = [];
  const FirebaseAuth = {
    signInAnonymously: async (auth) => void (auth.currentUser = { uid: `anon-${++番}`, isAnonymous: true }),
    deleteUser: async (人) => void (消した.push(人.uid), (認証.currentUser = null)),
    signOut: async () => void (認証.currentUser = null),
  };
  const 頼んだ = [];
  const 返事 = (状態, 中身) => ({ ok: 状態 >= 200 && 状態 < 300, status: 状態, json: async () => 中身 });
  let 中継の答え = 返事(200, { 結果: '入れた', memberId: 'm1', 名前: '山田 太郎' });
  const 中継 = {
    中継がある: () => true,
    中継へfetch: async (道, init) => (頼んだ.push([道, JSON.parse(init.body)]), 中継の答え),
  };
  const { 部員として入る } = require('../src/groupLogin');
  const 道具 = { Firestore: 雲.api, FirebaseAuth, db: {}, auth: 認証, 中継 };
  const 読んだ前 = 雲.読んだ ? 雲.読んだ.length : 0;
  assert.deepStrictEqual(await 部員として入る(道具, 団体, 'K7MP3X'), { memberId: 'm1', 名前: '山田 太郎' });
  assert.deepStrictEqual(頼んだ[0], ['/kojin', { 団体, 鍵: 'K7MP3X' }]);
  if (雲.読んだ) assert.ok(!雲.読んだ.slice(読んだ前).some((道) => String(道).includes('member_lookup')), '端末が逆引き表を読んだ');
  // 見つからない：知らせて、今作った匿名の口座を消す
  認証.currentUser = null;
  中継の答え = 返事(200, { 結果: '見つからない' });
  await assert.rejects(部員として入る(道具, 団体, 'ZZZZZZ', '使えません'), /使えません/);
  assert.deepStrictEqual(消した, ['anon-2']);
  // 試しすぎ・届かない・App Check
  中継の答え = 返事(429, { error: 'x' });
  await assert.rejects(部員として入る(道具, 団体, 'K7MP3X'), /試した回数が多すぎます/);
  中継の答え = 返事(401, { error: 'x', 印: 'appcheck' });
  await assert.rejects(部員として入る(道具, 団体, 'K7MP3X'), /この端末の確かめに失敗しました/);
  中継の答え = 返事(503, { error: 'x' });
  await assert.rejects(部員として入る(道具, 団体, 'K7MP3X'), /いまは確かめられません/);
  // 古い中継（/kojin が無い）：前の道で入る
  認証.currentUser = null;
  中継の答え = 返事(404, { error: 'この道は中継しません' });
  assert.deepStrictEqual(await 部員として入る(道具, 団体, 'K7MP3X'), { memberId: 'm1', 名前: '山田 太郎' });
  // 古い中継は道を見る前に「通してよい人か」で匿名の口座を断る（403）。これも前の道で入る（検証環境の E2E で落ちた）
  認証.currentUser = null;
  中継の答え = 返事(403, { error: 'この機能は、団体または個人でログインした人だけが使えます' });
  assert.deepStrictEqual(await 部員として入る(道具, 団体, 'K7MP3X'), { memberId: 'm1', 名前: '山田 太郎' });
  // ほかの 403（新しい中継の「匿名でない」など）は前の道にしない
  認証.currentUser = null;
  中継の答え = 返事(403, { error: '部員のログインは匿名の口座で呼んでください' });
  await assert.rejects(部員として入る(道具, 団体, 'K7MP3X'), /いまは確かめられません/);
});

test('部員として入る：12/3 を過ぎた 4 桁は、匿名の口座を作る前に分かる言葉で断る', async () => {
  let 作った = 0;
  const { 部員として入る } = require('../src/groupLogin');
  const 道具 = {
    Firestore: {},
    FirebaseAuth: { signInAnonymously: async () => void 作った++ },
    db: {},
    auth: { currentUser: null },
    今: Date.parse('2026-12-03T00:00:00Z'),
  };
  await assert.rejects(部員として入る(道具, 団体, '1234'), /4桁の個人IDは使えなくなりました/);
  assert.strictEqual(作った, 0);
});
