// firestore.rules を模擬環境で確かめる（npm run test:rules）。断るべき手順が断られ、ふだんの手順が通ること。
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  書く,
  作る,
  直す,
  欄を消す,
  読む,
  消す,
  絞って引く,
  片付ける,
  決まりを置く,
  猶予のあとの決まり,
} from './emu.mjs';

const 団体 = '100001';
const 持ち主 = { uid: 'owner-1', email: 'owner@example.jp', verified: true };
const 確認前の持ち主 = { uid: 'owner-1', email: 'owner@example.jp', verified: false };
const 部員 = { uid: 'anon-1' };
const よその人 = { uid: 'anon-9' };

/** 確認の済んだ団体と、部員 1 人（証つき）を用意する */
async function 団体を用意する({ 帳面 = {}, 証の個人ID = 'K7MP3X' } = {}) {
  await 片付ける();
  await 書く('owner', `group_accounts/${団体}`, { id: 団体, email: 持ち主.email, verified: true, ...帳面 });
  await 書く('owner', `group_accounts/${団体}/private/consent`, { name: '弓道部' });
  await 書く('owner', `groups/${団体}`, { groupName: '弓道部', liveSecret: 'a'.repeat(32) });
  await 書く('owner', `groups/${団体}/members/m1`, { id: 'm1', name: '山田 太郎' });
  await 書く('owner', `groups/${団体}/member_lookup/K7MP3X`, { memberId: 'm1', 形: 2 });
  await 書く('owner', `groups/${団体}/config/app_settings`, { groupType: 'daigaku', tagTemplates: ['試合'] });
  await 書く('owner', `groups/${団体}/sessions/s1`, { id: 's1', archers: [{ name: 'a' }, { name: 'b' }] });
  await 書く('owner', `member_claims/${部員.uid}`, { groupId: 団体, memberId: 'm1', personalId: 証の個人ID });
}

test.before(async () => {
  await 決まりを置く();
});

test('ふだんの手順は通る：持ち主の読み書き・部員の読み・記録を作る', async () => {
  await 団体を用意する();
  assert.ok((await 読む(持ち主, `groups/${団体}`)).通った);
  assert.ok((await 書く(持ち主, `groups/${団体}`, { groupName: '弓道部2' }, { merge: true })).通った);
  assert.ok((await 読む(持ち主, `group_accounts/${団体}/private/consent`)).通った);
  assert.ok((await 読む(部員, `groups/${団体}`)).通った, '部員が団体を読めない');
  assert.ok((await 読む(部員, `groups/${団体}/members/m1`)).通った);
  assert.ok((await 作る(部員, `groups/${団体}/sessions/s2`, { id: 's2', archers: [{ name: 'a' }] })).通った);
  assert.ok((await 読む(部員, `member_claims/${部員.uid}`)).通った, '部員が自分の証を読めない');
  assert.equal((await 読む(よその人, `groups/${団体}`)).通った, false);
});

test('B1 乗っ取り：切り替えの途中に、空いたアドレスで作った口座は持ち主になれない', async () => {
  // 確認のリンクを押して、認証のアドレスが新しいほうへ移った（帳面の email の口座が空いた）
  await 団体を用意する({ 帳面: { pendingEmail: 'new@example.jp', pendingUid: 'owner-1' } });
  const 乗っ取り = { uid: 'evil-1', email: 'owner@example.jp', verified: false };
  assert.equal(
    (await 書く(乗っ取り, `group_accounts/${団体}`, { pendingEmail: 'evil@example.jp' }, { merge: true }))
      .通った,
    false,
    '切り替え待ちを書き換えられた'
  );
  assert.equal((await 消す(乗っ取り, `group_accounts/${団体}`)).通った, false, '帳面を消せた');
  assert.equal((await 読む(乗っ取り, `groups/${団体}`)).通った, false, '猶予のあいだに中身を読めた');
  assert.equal((await 読む(乗っ取り, `group_accounts/${団体}/private/consent`)).通った, false);
  // 切り替えを頼んだ本人（確認の済んでいない口座でも）は、猶予のあいだ今までどおり使え、頼み直せる
  assert.ok((await 読む(確認前の持ち主, `groups/${団体}`)).通った, '頼んだ本人が締め出された');
  assert.ok(
    (
      await 書く(
        確認前の持ち主,
        `group_accounts/${団体}`,
        { pendingEmail: 'new2@example.jp' },
        { merge: true }
      )
    ).通った
  );
  // 確認の済んだ口座は通る
  assert.ok((await 読む(持ち主, `groups/${団体}`)).通った);
});

test('B1 乗っ取り：切り替えたあと（前のアドレスが残る 30 日）も、空いたアドレスの口座は通らない', async () => {
  await 団体を用意する({
    帳面: { email: 'new@example.jp', previousEmail: 'owner@example.jp', ownerUid: 'owner-1' },
  });
  const 乗っ取り = { uid: 'evil-2', email: 'new@example.jp', verified: false };
  assert.equal(
    (await 書く(乗っ取り, `group_accounts/${団体}`, { pendingEmail: 'evil@example.jp' }, { merge: true }))
      .通った,
    false
  );
  assert.equal((await 読む(乗っ取り, `groups/${団体}`)).通った, false);
  // 本人（確認済み）は通る
  assert.ok(
    (await 読む({ uid: 'owner-1', email: 'new@example.jp', verified: true }, `groups/${団体}`)).通った
  );
});

test('B1 切り替え：頼む・仕上げ・ほかの口座の番号は書けない・使い捨てのアドレスへは仕上げられない', async () => {
  await 団体を用意する();
  // 頼む（自分の口座の番号を添える）
  assert.ok(
    (
      await 書く(
        持ち主,
        `group_accounts/${団体}`,
        { pendingEmail: 'new@example.jp', pendingUid: 'owner-1' },
        { merge: true }
      )
    ).通った
  );
  assert.equal(
    (await 書く(持ち主, `group_accounts/${団体}`, { pendingUid: 'someone-else' }, { merge: true })).通った,
    false,
    'ほかの口座の番号を書けた'
  );
  // 仕上げ（確認のリンクを押して新しいアドレスになった本人）
  const 新しい本人 = { uid: 'owner-1', email: 'new@example.jp', verified: true };
  assert.ok(
    (
      await 書く(新しい本人, `group_accounts/${団体}`, {
        id: 団体,
        email: 'new@example.jp',
        previousEmail: 'owner@example.jp',
        ownerUid: 'owner-1',
        verified: true,
      })
    ).通った,
    '切り替えを仕上げられない'
  );
  // 使い捨てのドメインへの切り替えは仕上げられない
  await 団体を用意する({ 帳面: { pendingEmail: 'x@sub.trash-example.com', pendingUid: 'owner-1' } });
  await 書く('owner', 'disposable_domains/trash-example.com', { at: new Date() });
  assert.equal(
    (
      await 書く(
        { uid: 'owner-1', email: 'x@sub.trash-example.com', verified: true },
        `group_accounts/${団体}`,
        {
          id: 団体,
          email: 'x@sub.trash-example.com',
          previousEmail: 'owner@example.jp',
          ownerUid: 'owner-1',
          verified: true,
        }
      )
    ).通った,
    false
  );
});

test('B2・B3 作る：消した団体の控えや中身が残る番号・使い捨てのドメインでは作れない', async () => {
  await 片付ける();
  const 新しい人 = { uid: 'new-1', email: 'club@example.jp', verified: true };
  const 帳面 = (id) => ({ id, email: 'club@example.jp', verified: true });
  await 書く('owner', 'deleted_accounts/200001', { at: new Date() });
  assert.equal(
    (await 作る(新しい人, 'group_accounts/200001', 帳面('200001'))).通った,
    false,
    '消した団体の番号で作れた'
  );
  await 書く('owner', 'groups/200002/sessions/x', { id: 'x' });
  await 書く('owner', 'groups/200002', { groupName: '前の団体' });
  assert.equal(
    (await 作る(新しい人, 'group_accounts/200002', 帳面('200002'))).通った,
    false,
    '中身が残る番号で作れた'
  );
  assert.ok((await 作る(新しい人, 'group_accounts/200003', 帳面('200003'))).通った, 'ふつうに作れない');
  // 確認が済んでいない・使い捨てのドメイン（一覧の 2 段上まで見る）
  assert.equal(
    (
      await 作る({ uid: 'new-2', email: 'a@example.jp', verified: false }, 'group_accounts/200004', {
        id: '200004',
        email: 'a@example.jp',
        verified: true,
      })
    ).通った,
    false
  );
  await 書く('owner', 'disposable_domains/trash-example.com', { at: new Date() });
  const 捨て = { uid: 'new-3', email: 'a@b.trash-example.com', verified: true };
  assert.equal(
    (
      await 作る(捨て, 'group_accounts/200005', {
        id: '200005',
        email: 'a@b.trash-example.com',
        verified: true,
      })
    ).通った,
    false,
    '使い捨てのドメインで作れた'
  );
  // 一覧は誰でも 1 件ずつ引ける（アプリが口座を作る前に引く）。並べて引く・書くはできない
  assert.ok((await 読む(null, 'disposable_domains/trash-example.com')).通った);
  assert.equal((await 書く(捨て, 'disposable_domains/x.com', { at: new Date() })).通った, false);
  // 自分のメールの団体を引く（Google で作るとき）
  assert.ok((await 絞って引く(新しい人, null, 'group_accounts', 'email', 'club@example.jp')).通った);
});

test('H1 所属の証：端末は作れない・書き換えられない。自分の証を読む・消すはできる', async () => {
  await 団体を用意する();
  const 新しい部員 = { uid: 'anon-2' };
  assert.equal(
    (
      await 作る(新しい部員, `member_claims/${新しい部員.uid}`, {
        groupId: 団体,
        memberId: 'm1',
        personalId: 'K7MP3X',
        claimedAt: new Date(),
      })
    ).通った,
    false,
    '正しい個人ID を知っていれば端末から証を作れた（中継だけが書く）'
  );
  assert.equal(
    (await 書く(部員, `member_claims/${部員.uid}`, { groupId: '999999' }, { merge: true })).通った,
    false,
    '証を書き換えられた'
  );
  assert.equal((await 読む(新しい部員, `member_claims/${部員.uid}`)).通った, false, 'ほかの人の証を読めた');
  assert.ok((await 消す(部員, `member_claims/${部員.uid}`)).通った, 'ログアウトで証を消せない');
});

test('H1 逆引き表：部員・匿名の口座は 1 件も引けない。持ち主は引ける', async () => {
  await 団体を用意する();
  assert.equal(
    (await 読む({ uid: 'anon-3' }, `groups/${団体}/member_lookup/K7MP3X`)).通った,
    false,
    '匿名で個人ID を試せた'
  );
  assert.equal((await 読む(部員, `groups/${団体}/member_lookup/K7MP3X`)).通った, false);
  assert.ok((await 読む(持ち主, `groups/${団体}/member_lookup/K7MP3X`)).通った);
  assert.ok((await 書く(持ち主, `groups/${団体}/member_lookup/ABCDEF`, { memberId: 'm1', 形: 2 })).通った);
});

test('逆引き表：前の版の書き込み（形の無いもの）と端末からの削除は断る。消した印への書き換えは通す', async () => {
  await 団体を用意する();
  // 前の版の端末（開いたままのタブ）は、名簿に個人ID が無いと行を全部消して作り直した（2026-11-07 のレビュー）
  assert.equal(
    (await 書く(持ち主, `groups/${団体}/member_lookup/ZZZZZZ`, { memberId: 'm1' })).通った,
    false,
    '形の無い書き込みが通った（前の版が作り直せる）'
  );
  assert.equal(
    (await 消す(持ち主, `groups/${団体}/member_lookup/K7MP3X`)).通った,
    false,
    '端末から行を消せた'
  );
  assert.ok(
    (await 書く(持ち主, `groups/${団体}/member_lookup/K7MP3X`, { memberId: '', 消した: true, 形: 2 })).通った,
    '消した印に書き換えられない'
  );
  // 団体を消す途中（写しを先に書く）だけは消せる
  await 書く('owner', `deleted_accounts/${団体}`, { id: 団体 });
  assert.ok(
    (await 消す(持ち主, `groups/${団体}/member_lookup/K7MP3X`)).通った,
    '団体を消す途中なのに消せない'
  );
});

test('B5 部員の書き込み：団体名・合言葉・設定は書けない。合言葉が無いときに足す・タグの候補・記録を直すはできる', async () => {
  await 団体を用意する();
  assert.equal(
    (await 書く(部員, `groups/${団体}`, { groupName: '乗っ取り' }, { merge: true })).通った,
    false,
    '団体名を書き換えられた'
  );
  assert.equal(
    (await 書く(部員, `groups/${団体}`, { liveSecret: 'b'.repeat(32) }, { merge: true })).通った,
    false,
    '合言葉を書き換えられた（ライブが割れる）'
  );
  // 合言葉がまだ無い団体では足せる（アプリの ライブの合言葉を用意する）
  await 欄を消す('owner', `groups/${団体}`, ['liveSecret']);
  assert.ok(
    (await 書く(部員, `groups/${団体}`, { liveSecret: 'c'.repeat(32) }, { merge: true })).通った,
    '合言葉を足せない'
  );
  // 設定：タグの候補だけ
  assert.ok(
    (
      await 書く(
        部員,
        `groups/${団体}/config/app_settings`,
        { tagTemplates: ['試合', '練習'], lastModified: new Date() },
        { merge: true }
      )
    ).通った,
    'タグの候補を足せない'
  );
  assert.equal(
    (
      await 書く(
        部員,
        `groups/${団体}/config/app_settings`,
        { tagTemplates: ['x'], currentFreshmanTerm: 1 },
        { merge: true }
      )
    ).通った,
    false,
    '1 年生の期を書けた'
  );
  assert.equal(
    (await 書く(部員, `groups/${団体}/config/app_settings`, { groupType: 'koukou' }, { merge: true })).通った,
    false
  );
  assert.equal((await 書く(部員, `groups/${団体}/config/listing`, { ok: true })).通った, false);
  // 記録：射手を減らさない直しは通る。減らす・消すは断る
  assert.ok(
    (
      await 書く(部員, `groups/${団体}/sessions/s1`, {
        id: 's1',
        archers: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      })
    ).通った
  );
  assert.equal(
    (await 書く(部員, `groups/${団体}/sessions/s1`, { id: 's1', archers: [] })).通った,
    false,
    '射手を消せた'
  );
  assert.equal((await 消す(部員, `groups/${団体}/sessions/s1`)).通った, false);
  // 持ち主はどれもできる
  assert.ok((await 書く(持ち主, `groups/${団体}/sessions/s1`, { id: 's1', archers: [] })).通った);
  assert.ok(
    (await 書く(持ち主, `groups/${団体}/config/app_settings`, { currentFreshmanTerm: 3 }, { merge: true }))
      .通った
  );
});

test('C 個人ID：名簿・卒業生の文書に足す・変えるは断る。消す・そのまま残すは通す', async () => {
  await 団体を用意する();
  assert.equal(
    (await 書く(持ち主, `groups/${団体}/members/m2`, { id: 'm2', name: '鈴木', personalId: 'K7MP3Y' }))
      .通った,
    false,
    '名簿に個人ID を足せた'
  );
  assert.ok((await 書く(持ち主, `groups/${団体}/members/m2`, { id: 'm2', name: '鈴木' })).通った);
  // 前から残っている個人ID：そのままなら直せる。変えるのは断る。消すのは通す
  await 書く('owner', `groups/${団体}/members/m3`, { id: 'm3', name: '佐藤', personalId: '1234' });
  assert.ok(
    (await 書く(持ち主, `groups/${団体}/members/m3`, { id: 'm3', name: '佐藤 花子', personalId: '1234' }))
      .通った
  );
  assert.equal(
    (await 書く(持ち主, `groups/${団体}/members/m3`, { id: 'm3', name: '佐藤', personalId: '9999' })).通った,
    false
  );
  assert.ok(
    (await 書く(持ち主, `groups/${団体}/members/m3`, { id: 'm3', name: '佐藤' })).通った,
    '残っている個人ID を消せない'
  );
  assert.equal(
    (await 書く(持ち主, `groups/${団体}/alumni/a1`, { id: 'a1', name: '卒業', personalId: 'K7MP3Z' })).通った,
    false
  );
  // 部員は自分の弓具だけ
  assert.ok(
    (await 書く(部員, `groups/${団体}/members/m1`, { equipments: [{ x: 1 }] }, { merge: true })).通った
  );
  assert.equal(
    (await 書く(部員, `groups/${団体}/members/m1`, { name: '別名' }, { merge: true })).通った,
    false
  );
});

test('B4・猶予のあと：4 桁の証は止まる。確認の済んでいない持ち主は使えない', async () => {
  await 決まりを置く(猶予のあとの決まり());
  try {
    await 団体を用意する({ 証の個人ID: '1234' });
    assert.equal((await 読む(部員, `groups/${団体}`)).通った, false, '12/3 を過ぎても 4 桁の証で読めた');
    await 書く('owner', `member_claims/anon-5`, { groupId: 団体, memberId: 'm1', personalId: 'K7MP3X' });
    assert.ok((await 読む({ uid: 'anon-5' }, `groups/${団体}`)).通った, '6 字の証で読めない');
    await 書く('owner', `member_claims/anon-6`, {
      groupId: 団体,
      memberId: 'm1',
      personalId: 'z'.repeat(32),
    });
    assert.ok((await 読む({ uid: 'anon-6' }, `groups/${団体}`)).通った, '招待の証で読めない');
    assert.equal(
      (await 読む(確認前の持ち主, `groups/${団体}`)).通った,
      false,
      '猶予のあとに確認前の持ち主が読めた'
    );
    // 確認前の持ち主でも、切り替え（メールアドレスを直す）は頼める（確認の画面の案内）
    assert.ok(
      (
        await 書く(
          確認前の持ち主,
          `group_accounts/${団体}`,
          { pendingEmail: 'new@example.jp', pendingUid: 'owner-1' },
          { merge: true }
        )
      ).通った
    );
    assert.ok((await 読む(持ち主, `groups/${団体}`)).通った);
  } finally {
    await 決まりを置く();
  }
});

test('消すときの順：持ち主は控えを書いてから中身・帳面を消せる。控えは持ち主も読めない', async () => {
  await 団体を用意する();
  assert.ok((await 書く(持ち主, `deleted_accounts/${団体}`, { at: new Date() })).通った);
  assert.ok((await 書く(持ち主, `deleted_accounts/${団体}/sessions/s1`, { id: 's1' })).通った);
  assert.equal((await 読む(持ち主, `deleted_accounts/${団体}`)).通った, false);
  assert.ok((await 消す(持ち主, `groups/${団体}/sessions/s1`)).通った);
  assert.ok((await 消す(持ち主, `group_accounts/${団体}/private/consent`)).通った);
  assert.ok((await 消す(持ち主, `group_accounts/${団体}`)).通った);
  // 消えた団体の番号では、控えが残るあいだ作れない（B2）
  assert.equal(
    (
      await 作る({ uid: 'x', email: 'other@example.jp', verified: true }, `group_accounts/${団体}`, {
        id: 団体,
        email: 'other@example.jp',
        verified: true,
      })
    ).通った,
    false
  );
  // 直す（updateDoc）の形も確かめる
  assert.equal((await 直す(部員, `groups/${団体}/config/app_settings`, { groupType: 'x' })).通った, false);
});
