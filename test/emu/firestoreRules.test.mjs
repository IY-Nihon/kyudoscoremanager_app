// firestore.rules を模擬環境で確かめる（npm run test:rules）。断るべき手順が断られ、ふだんの手順が通ること。
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  書く,
  作る,
  直す,
  欄を消す,
  読む,
  消す,
  絞って引く,
  片付ける,
  一括で書く,
  時刻を書く,
  決まりを置く,
  猶予のあとの決まり,
} from './emu.mjs';

const 団体 = '100001';
// ログインした時刻（証の auth_time）。管理者の印はこの時刻で端末ごとに照らし合わせる（11/19）。印を置くときに同じ値を書く
const ログインの時刻 = Math.floor(Date.now() / 1000) - 30;
const 持ち主 = { uid: 'owner-1', email: 'owner@example.jp', verified: true, auth_time: ログインの時刻 };
const 確認前の持ち主 = { uid: 'owner-1', email: 'owner@example.jp', verified: false };
const 部員 = { uid: 'anon-1', auth_time: ログインの時刻 };
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
  // 記録：作った人の印の無い前の記録は、射手を減らさない直しでも断る（4 段目・11/20 本人）。減らす・消すも断る
  assert.equal(
    (
      await 書く(部員, `groups/${団体}/sessions/s1`, {
        id: 's1',
        archers: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      })
    ).通った,
    false,
    '作った人の印の無い前の記録を部員が書き換えた'
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

test('管理者の印（11/18）：招待リンクは印のある持ち主だけ。記録を消す・ゴミ箱・メンバー・設定は今までどおり。印は端末から書けない', async () => {
  await 団体を用意する();
  const 印の道 = `admin_sessions/${団体}_${持ち主.uid}`;
  const 招待の道 = `groups/${団体}/member_lookup/INV${'x'.repeat(29)}`;
  // 印が無い持ち主：招待は断る。記録を作る・消す・ゴミ箱・メンバー・設定・個人IDの行は通る（前から管理者モードなしでできる）
  assert.equal(
    (await 書く(持ち主, 招待の道, { memberId: 'm1', 形: 2, 招待: true })).通った,
    false,
    '印なしで招待の行を作れた'
  );
  assert.ok((await 書く(持ち主, `groups/${団体}/member_lookup/ABCDEF`, { memberId: 'm1', 形: 2 })).通った);
  assert.ok((await 書く(持ち主, `groups/${団体}/members/m2`, { id: 'm2', name: '佐藤 花' })).通った);
  assert.ok(
    (await 書く(持ち主, `groups/${団体}/config/app_settings`, { groupType: 'koukou' }, { merge: true }))
      .通った
  );
  assert.ok((await 書く(持ち主, `groups/${団体}/trash/s1`, { id: 's1' })).通った);
  assert.ok((await 消す(持ち主, `groups/${団体}/sessions/s1`)).通った);
  // 端末は印を書けない・読めない
  assert.equal(
    (await 書く(持ち主, 印の道, { expiresAt: new Date(Date.now() + 3600000) })).通った,
    false,
    '端末が印を書けた'
  );
  assert.equal((await 読む(持ち主, 印の道)).通った, false);
  // 期限の切れた印は効かない。期限内なら通る
  await 書く('owner', 印の道, {
    groupId: 団体,
    uid: 持ち主.uid,
    expiresAt: new Date(Date.now() - 1000),
    authTime: ログインの時刻,
  });
  assert.equal(
    (await 書く(持ち主, 招待の道, { memberId: 'm1', 形: 2, 招待: true })).通った,
    false,
    '切れた印で招待を作れた'
  );
  await 書く('owner', 印の道, {
    groupId: 団体,
    uid: 持ち主.uid,
    expiresAt: new Date(Date.now() + 3600000),
    authTime: ログインの時刻,
  });
  assert.ok(
    (await 書く(持ち主, 招待の道, { memberId: 'm1', 形: 2, 招待: true })).通った,
    '印で招待を作れない'
  );
});

test('部員の役（11/19）：役の無い部員は付けるだけ。見るだけは作れない。運営は消す・名簿・練習日・設定。直す・個人IDは合言葉も要る', async () => {
  await 団体を用意する();
  const 役の道 = `groups/${団体}/config/roles`;
  const 部員の印 = `admin_sessions/${団体}_${部員.uid}`;
  // 役の無い部員（部員（自分））：作る・射手を減らさない送り直しは通る。消す・ゴミ箱・名簿・練習日・設定は断る
  assert.ok((await 作る(部員, `groups/${団体}/sessions/s2`, { id: 's2', archers: [{ name: 'a' }] })).通った);
  assert.equal((await 消す(部員, `groups/${団体}/sessions/s1`)).通った, false, '部員（自分）が記録を消せた');
  assert.equal((await 書く(部員, `groups/${団体}/trash/s1`, { id: 's1' })).通った, false);
  assert.equal((await 書く(部員, `groups/${団体}/members/m2`, { id: 'm2', name: '佐藤 花' })).通った, false);
  assert.equal(
    (await 書く(部員, `groups/${団体}/officialPracticeDays/2026-11-19`, { date: '2026-11-19' })).通った,
    false
  );
  assert.equal(
    (await 書く(部員, `groups/${団体}/config/app_settings`, { groupType: 'koukou' }, { merge: true })).通った,
    false
  );
  // 部員は役の文書を読めるが書けない。持ち主も合言葉の印が無ければ書けない（読むのは文書があるときに確かめる。無いと 404）
  await 書く('owner', 役の道, { 役: {}, 割り当て: {} });
  assert.ok((await 読む(部員, 役の道)).通った, '部員が役を読めない');
  assert.equal(
    (await 書く(部員, 役の道, { 割り当て: { m1: 'unei' } })).通った,
    false,
    '部員が自分を運営にできた'
  );
  assert.equal(
    (await 書く(持ち主, 役の道, { 割り当て: { m1: 'unei' } })).通った,
    false,
    '印なしで役を割り当てられた'
  );
  await 書く('owner', `admin_sessions/${団体}_${持ち主.uid}`, {
    expiresAt: new Date(Date.now() + 3600000),
    authTime: ログインの時刻,
  });
  assert.ok(
    (await 書く(持ち主, 役の道, { 割り当て: { m1: 'miru' } })).通った,
    '管理者が役を割り当てられない'
  );

  // 見るだけ：読めるが、記録を作れない
  assert.ok((await 読む(部員, `groups/${団体}/sessions/s1`)).通った);
  assert.equal(
    (await 作る(部員, `groups/${団体}/sessions/s3`, { id: 's3', archers: [] })).通った,
    false,
    '見るだけが作れた'
  );

  // 運営：消す・ゴミ箱・名簿・練習日・設定・団体名は通る。射手を減らす直し・個人IDの表は合言葉の印が要る
  await 書く('owner', 役の道, { 割り当て: { m1: 'unei' } });
  assert.ok(
    (await 書く(部員, `groups/${団体}/members/m2`, { id: 'm2', name: '佐藤 花' })).通った,
    '運営が名簿を足せない'
  );
  assert.ok(
    (await 書く(部員, `groups/${団体}/officialPracticeDays/2026-11-19`, { date: '2026-11-19' })).通った
  );
  assert.ok(
    (await 書く(部員, `groups/${団体}/config/app_settings`, { groupType: 'koukou' }, { merge: true })).通った
  );
  assert.ok(
    (await 書く(部員, `groups/${団体}`, { groupName: '弓道部3' }, { merge: true })).通った,
    '運営が団体名を変えられない'
  );
  assert.equal(
    (await 書く(部員, `groups/${団体}`, { liveSecret: 'b'.repeat(32) }, { merge: true })).通った,
    false
  );
  assert.ok((await 書く(部員, `groups/${団体}/trash/s1`, { id: 's1' })).通った);
  assert.equal(
    (await 書く(部員, `groups/${団体}/sessions/s1`, { archers: [] }, { merge: true })).通った,
    false,
    '印なしで射手を消せた'
  );
  assert.equal(
    (await 読む(部員, `groups/${団体}/member_lookup/K7MP3X`)).通った,
    false,
    '印なしで個人IDを読めた'
  );
  assert.equal((await 書く(部員, 役の道, { 割り当て: { m1: 'unei' } })).通った, false, '運営が役を書けた');
  await 書く('owner', 部員の印, { expiresAt: new Date(Date.now() + 3600000), authTime: ログインの時刻 });
  assert.ok(
    (await 書く(部員, `groups/${団体}/sessions/s1`, { archers: [] }, { merge: true })).通った,
    '運営＋印で直せない'
  );
  assert.ok((await 読む(部員, `groups/${団体}/member_lookup/K7MP3X`)).通った, '運営＋印で個人IDを読めない');
  assert.equal(
    (await 書く(部員, 役の道, { 割り当て: { m1: 'unei' } })).通った,
    false,
    '運営＋印で役を書けた'
  );
  assert.ok((await 消す(部員, `groups/${団体}/sessions/s1`)).通った, '運営が記録を消せない');

  // 作った役：部品を団体が決める。消した役の人は部員（自分）
  await 書く('owner', 役の道, {
    役: { r_kakari: { 名: '出欠の係', 部品: ['付ける', '出欠'] } },
    割り当て: { m1: 'r_kakari' },
  });
  assert.ok(
    (await 書く(部員, `groups/${団体}/officialPracticeDays/2026-11-20`, { date: '2026-11-20' })).通った
  );
  assert.equal((await 書く(部員, `groups/${団体}/members/m3`, { id: 'm3', name: '鈴木 一' })).通った, false);
  await 書く('owner', 役の道, { 役: {}, 割り当て: { m1: 'r_kakari' } });
  assert.equal(
    (await 書く(部員, `groups/${団体}/officialPracticeDays/2026-11-21`, { date: '2026-11-21' })).通った,
    false
  );
  assert.ok(
    (await 作る(部員, `groups/${団体}/sessions/s4`, { id: 's4', archers: [] })).通った,
    '消した役の人が付けられない'
  );
});

test('一括（11/19）：部員が送れていない記録を 20 件まとめて送っても、決まりの中で読む回数の上限に当たらない', async () => {
  await 団体を用意する();
  const 記録 = (番) => ({
    道: `groups/${団体}/sessions/b${番}`,
    中身: { id: `b${番}`, archers: [{ name: 'a' }] },
  });
  // 役の無い部員（部員（自分））：記録を作るだけの一括
  const 部員の一括 = await 一括で書く(
    部員,
    Array.from({ length: 20 }, (_, 番) => 記録(番))
  );
  assert.ok(部員の一括.通った, '部員の一括が断られた：' + JSON.stringify(部員の一括.中身).slice(0, 300));
  // 運営＋管理者の印：射手を減らす直し・ゴミ箱・消すをまとめた一括（印の文書も読む）
  await 書く('owner', `groups/${団体}/config/roles`, { 割り当て: { m1: 'unei' } });
  await 書く('owner', `admin_sessions/${団体}_${部員.uid}`, {
    expiresAt: new Date(Date.now() + 3600000),
    authTime: ログインの時刻,
  });
  const 運営の一括 = await 一括で書く(部員, [
    ...Array.from({ length: 10 }, (_, 番) => ({
      道: `groups/${団体}/sessions/b${番}`,
      中身: { id: `b${番}`, archers: [] },
    })),
    ...Array.from({ length: 5 }, (_, 番) => ({
      道: `groups/${団体}/trash/b${10 + 番}`,
      中身: { id: `b${10 + 番}` },
    })),
    ...Array.from({ length: 5 }, (_, 番) => ({ 道: `groups/${団体}/sessions/b${10 + 番}`, 消す: true })),
  ]);
  assert.ok(運営の一括.通った, '運営の一括が断られた：' + JSON.stringify(運営の一括.中身).slice(0, 300));
});

test('管理者の印は端末ごと（11/19 本人）：同じ団体のアカウントでも、ログインした時刻の違う端末には効かない', async () => {
  await 団体を用意する();
  const 招待の道 = `groups/${団体}/member_lookup/INV${'y'.repeat(29)}`;
  await 書く('owner', `admin_sessions/${団体}_${持ち主.uid}`, {
    expiresAt: new Date(Date.now() + 3600000),
    authTime: ログインの時刻,
  });
  // 合言葉を入れた端末（ログインの時刻が印と同じ）は通る
  assert.ok(
    (await 書く(持ち主, 招待の道, { memberId: 'm1', 形: 2, 招待: true })).通った,
    '入れた端末で招待を作れない'
  );
  // 同じアカウントで別に入った端末（ログインの時刻が違う）は断る。役を決めるのも同じ
  const 別の端末 = { ...持ち主, auth_time: ログインの時刻 - 600 };
  assert.equal(
    (await 書く(別の端末, 招待の道, { memberId: 'm1', 形: 2, 招待: true })).通った,
    false,
    '別の端末で招待を作れた'
  );
  assert.equal(
    (await 書く(別の端末, `groups/${団体}/config/roles`, { 割り当て: { m1: 'unei' } })).通った,
    false,
    '別の端末で役を決められた'
  );
  // ログインの時刻の無い（前の形の）印は効かない
  await 書く('owner', `admin_sessions/${団体}_${持ち主.uid}`, { expiresAt: new Date(Date.now() + 3600000) });
  assert.equal(
    (await 書く(持ち主, `groups/${団体}/config/roles`, { 割り当て: { m1: 'unei' } })).通った,
    false,
    '時刻の無い印で役を決められた'
  );
});

test('運営が足した人の個人ID（11/19 本人）：合言葉が無くても、同じ一括で名簿に今作る人の行だけ作れる', async () => {
  await 団体を用意する();
  await 書く('owner', `groups/${団体}/config/roles`, { 割り当て: { m1: 'unei' } });
  const 名簿 = (id) => ({ 道: `groups/${団体}/members/${id}`, 中身: { id, name: '佐藤 花' } });
  const 行 = (個人ID, memberId, 足す = {}) => ({
    道: `groups/${団体}/member_lookup/${個人ID}`,
    中身: { memberId, 形: 2, updatedAt: new Date(), ...足す },
  });
  // アプリと同じ形（名簿と個人ID の行を 1 つの一括で）は通る。行を読む（ほかの人の個人ID を見る）のは合言葉が要る
  const 足した = await 一括で書く(部員, [名簿('m2'), 行('Q8RT2W', 'm2')]);
  assert.ok(
    足した.通った,
    '運営が足した人に個人ID を付けられない：' + JSON.stringify(足した.中身).slice(0, 300)
  );
  assert.equal(
    (await 読む(部員, `groups/${団体}/member_lookup/Q8RT2W`)).通った,
    false,
    '合言葉なしで行を読めた'
  );
  // 名簿に今いる人の行は作れない：行だけ・名簿を書き直しながら・行を足しただけの人（m2）にもう 1 つ
  assert.equal(
    (await 作る(部員, `groups/${団体}/member_lookup/Z3NB7K`, { memberId: 'm1', 形: 2 })).通った,
    false,
    '今いる人の個人ID を作れた'
  );
  assert.equal(
    (await 一括で書く(部員, [名簿('m1'), 行('Z3NB7K', 'm1')])).通った,
    false,
    '名簿を書き直しながら今いる人の個人ID を作れた'
  );
  assert.equal((await 一括で書く(部員, [行('Z3NB7K', 'm2')])).通った, false, '足した人にもう 1 つ作れた');
  // 名簿を作らずに、名簿に無い人の行だけ：断る
  assert.equal((await 一括で書く(部員, [行('Z3NB7K', 'm9')])).通った, false, '名簿に無い人の行を作れた');
  // 今ある行（m1 の K7MP3X）を、今作る人の行に書き換える：断る
  assert.equal(
    (await 一括で書く(部員, [名簿('m3'), 行('K7MP3X', 'm3')])).通った,
    false,
    '今ある個人ID の行を書き換えた'
  );
  // 招待の行・ほかの欄・前の形：断る
  assert.equal(
    (await 一括で書く(部員, [名簿('m3'), 行(`INV${'z'.repeat(29)}`, 'm3', { 招待: true })])).通った,
    false,
    '合言葉なしで招待の行を作れた'
  );
  assert.equal(
    (
      await 一括で書く(部員, [
        名簿('m3'),
        { 道: `groups/${団体}/member_lookup/Z3NB7K`, 中身: { memberId: 'm3' } },
      ])
    ).通った,
    false,
    '前の形の行を作れた'
  );
  // 役の無い部員（部員（自分））・見るだけは、名簿も行も作れない
  for (const 役 of [null, 'miru']) {
    await 書く('owner', `groups/${団体}/config/roles`, { 割り当て: 役 ? { m1: 役 } : {} });
    assert.equal(
      (await 一括で書く(部員, [名簿('m4'), 行('W5HC9P', 'm4')])).通った,
      false,
      `${役 || '部員（自分）'}が名簿と個人ID を作れた`
    );
  }
});

test('3 段目（11/19 本人）：全員を見るの無い役は記録とゴミ箱を直接読めない。見る役・直す等を持つ役・持ち主は読める。変わった印は時刻だけ', async () => {
  await 団体を用意する();
  await 書く('owner', `groups/${団体}/trash/t1`, { id: 't1', archers: [] });
  // 役の無い部員（部員（自分））：記録 1 件も一覧もゴミ箱も読めない。付ける（作る）はできる
  assert.equal((await 読む(部員, `groups/${団体}/sessions/s1`)).通った, false, '部員（自分）が記録を読めた');
  assert.equal(
    (await 絞って引く(部員, `groups/${団体}`, 'sessions', 'id', 's1')).通った,
    false,
    '部員（自分）が記録を引けた'
  );
  assert.equal((await 読む(部員, `groups/${団体}/trash/t1`)).通った, false, '部員（自分）がゴミ箱を読めた');
  assert.ok((await 作る(部員, `groups/${団体}/sessions/s5`, { id: 's5', archers: [{ name: 'a' }] })).通った);
  // 部員（全員）・見るだけ・出欠だけを持つ古い形の役（全員を見るが無くても、見るのが要る部品で読める）・運営は読める
  for (const 役 of [
    { 割り当て: { m1: 'zenin' } },
    { 割り当て: { m1: 'miru' } },
    { 割り当て: { m1: 'unei' } },
    { 役: { r1: { 名: '出欠の係', 部品: ['付ける', '出欠'] } }, 割り当て: { m1: 'r1' } },
  ]) {
    await 書く('owner', `groups/${団体}/config/roles`, 役);
    assert.ok((await 読む(部員, `groups/${団体}/sessions/s1`)).通った, '読めない：' + JSON.stringify(役));
    assert.ok(
      (await 読む(部員, `groups/${団体}/trash/t1`)).通った,
      'ゴミ箱を読めない：' + JSON.stringify(役)
    );
  }
  // 付けるだけ・設定だけを足した役（見るのが要る部品が無い）は読めない
  await 書く('owner', `groups/${団体}/config/roles`, {
    役: { r2: { 名: '設定の係', 部品: ['付ける', '設定'] } },
    割り当て: { m1: 'r2' },
  });
  assert.equal((await 読む(部員, `groups/${団体}/sessions/s1`)).通った, false);
  assert.ok((await 読む(持ち主, `groups/${団体}/sessions/s1`)).通った, '持ち主が読めない');
  assert.ok((await 読む(持ち主, `groups/${団体}/trash/t1`)).通った);

  // 変わった印：団体の中の人は、サーバーの時刻だけを書ける。ほかの欄・好きな時刻・ほかの名前の文書は断る
  const 印 = `groups/${団体}/changes/sessions`;
  assert.ok((await 時刻を書く(部員, 印, 'at')).通った, '部員が印を書けない');
  assert.ok((await 時刻を書く(持ち主, 印, 'at')).通った, '持ち主が印を書けない');
  assert.ok((await 読む(部員, 印)).通った, '部員が印を読めない');
  assert.equal((await 時刻を書く(部員, 印, 'at', { x: 1 })).通った, false, 'ほかの欄を書けた');
  assert.equal(
    (await 書く(部員, 印, { at: new Date(Date.now() + 3600000) })).通った,
    false,
    '好きな時刻を書けた'
  );
  assert.equal((await 時刻を書く(部員, `groups/${団体}/changes/other`, 'at')).通った, false);
  assert.equal((await 時刻を書く(よその人, 印, 'at')).通った, false, 'よその人が印を書けた');
  assert.equal((await 読む(よその人, 印)).通った, false, 'よその人が印を読めた');
});

test('4 段目（11/20 本人）：「直す」の無い部員は、自分が作った記録の送り直しだけ書き換えられる。作った人は変えられない', async () => {
  await 団体を用意する();
  const 道 = (id) => `groups/${団体}/sessions/${id}`;
  // 作る：作った人が自分か空（前の版で作ってまだ送れていない記録）は通る。ほかの人・団体は断る
  assert.ok((await 作る(部員, 道('s10'), { id: 's10', createdBy: 'm1', archers: [{ name: 'a' }] })).通った);
  assert.ok(
    (await 作る(部員, 道('s11'), { id: 's11', archers: [{ name: 'a' }] })).通った,
    '前の版の記録を作れない'
  );
  assert.equal(
    (await 作る(部員, 道('s12'), { id: 's12', createdBy: 'm2', archers: [] })).通った,
    false,
    'ほかの人が作ったことにして作れた'
  );
  assert.equal((await 作る(部員, 道('s13'), { id: 's13', createdBy: 'group', archers: [] })).通った, false);
  // 自分が作った記録の送り直し（丸ごと書く）は通る。射手を減らす・作った人を変えるは断る
  assert.ok(
    (await 書く(部員, 道('s10'), { id: 's10', createdBy: 'm1', archers: [{ name: 'a' }, { name: 'b' }] }))
      .通った,
    '自分が作った記録を送り直せない'
  );
  assert.equal(
    (await 書く(部員, 道('s10'), { id: 's10', createdBy: 'm1', archers: [] })).通った,
    false,
    '自分の記録でも射手を減らせた'
  );
  assert.equal(
    (await 書く(部員, 道('s10'), { id: 's10', createdBy: 'm2', archers: [{ name: 'a' }, { name: 'b' }] }))
      .通った,
    false,
    '作った人を書き換えた'
  );
  // 作った人の印の無い記録（自分が作った前の版の記録でも）・団体やほかの人が作った記録は書き換えられない
  await 書く('owner', 道('s14'), { id: 's14', createdBy: 'group', archers: [{ name: 'a' }] });
  await 書く('owner', 道('s15'), { id: 's15', createdBy: 'm2', archers: [{ name: 'a' }] });
  for (const id of ['s11', 's14', 's15'])
    assert.equal(
      (await 書く(部員, 道(id), { id, createdBy: 'm1', archers: [{ name: 'a' }, { name: 'b' }] })).通った,
      false,
      `${id} を部員が書き換えた`
    );
  // 直す＋管理者の合言葉の運営は、どの記録も直せる。持ち主もどれでも
  await 書く('owner', `groups/${団体}/config/roles`, { 割り当て: { m1: 'unei' } });
  await 書く('owner', `admin_sessions/${団体}_${部員.uid}`, {
    expiresAt: new Date(Date.now() + 3600000),
    authTime: ログインの時刻,
  });
  assert.ok(
    (await 書く(部員, 道('s14'), { id: 's14', createdBy: 'group', archers: [] })).通った,
    '運営＋印で直せない'
  );
  assert.ok((await 書く(持ち主, 道('s15'), { id: 's15', archers: [] })).通った);
});

test('不具合の便り（11/21・S9）：アプリのいちばん長い便りは通る。型・長さの外れ・前の形の控え・遠い先の消す日時・10 秒以内の 2 通目は断る', async () => {
  await 片付ける();
  // アプリと同じ組み方（src/errorReport.js・src/errorReporter.js）で、切られる長さいっぱいの便りを作る
  const 便りの道具 = createRequire(import.meta.url)('../../src/errorReport.js');
  便りの道具.行動を捨てる();
  for (let i = 0; i < 40; i++) 便りの道具.行動を残す('名'.repeat(80), '中'.repeat(200));
  const 長い = (n, 字 = 'あ') => 字.repeat(n);
  const アプリの便り = Object.assign(
    便りの道具.送る形(
      便りの道具.不具合の便を組む(
        { message: 長い(2000), code: 長い(200), stack: 長い(5000, 'a') },
        {
          出どころ: 長い(200),
          団体id: 長い(100),
          役割: 長い(100),
          版: 長い(100),
          端末: 長い(500, 'x'),
          時刻: Date.now(),
        }
      )
    ),
    { createdAt: new Date(), expireAt: new Date(Date.now() + 90 * 86400000) }
  );
  便りの道具.行動を捨てる();
  assert.equal(アプリの便り.trail.length, 30);

  let 番 = 0;
  const 送る = (中身, uid = `anon-r${++番}`) =>
    一括で書く({ uid }, [
      { 道: `errorReports/r${++番}`, 中身 },
      { 道: `rate_limits/${uid}`, 中身: {}, 時刻の欄: 'reportAt' },
    ]);
  const 返り = await 送る(アプリの便り);
  assert.ok(返り.通った, `アプリの便りが断られた：${JSON.stringify(返り.中身).slice(0, 300)}`);

  const 今 = Date.now();
  for (const [名, 上書き] of [
    ['控えが前の形（地図）', { trail: [{ at: new Date(今), name: '保存', detail: '' }] }],
    ['控えが 31 件', { trail: Array.from({ length: 31 }, () => '00:00:00 保存') }],
    ['控えをつなぐと長すぎる', { trail: [長い(20001, 'a')] }],
    ['where が長すぎる', { where: 長い(401, 'a') }],
    ['code が文字列でない', { code: 403 }],
    ['stack が並び', { stack: ['a'] }],
    ['online が文字列', { online: 'yes' }],
    ['count が文字列', { count: '1' }],
    ['at が文字列', { at: '2026-11-21' }],
    ['消す日時が無い', { expireAt: null }],
    ['消す日時が 200 日先', { expireAt: new Date(今 + 200 * 86400000) }],
  ]) {
    assert.equal((await 送る({ ...アプリの便り, ...上書き })).通った, false, `${名} の便りが通った`);
  }

  // 同じ人が 10 秒以内に 2 通目
  assert.ok((await 送る(アプリの便り, 'anon-twice')).通った);
  assert.equal((await 送る(アプリの便り, 'anon-twice')).通った, false, '10 秒以内の 2 通目が通った');
});
