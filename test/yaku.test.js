// 部員の役と操作の一覧（src/yaku.js・2026-11-19 本人）
const test = require('node:test');
const assert = require('node:assert');
const 役 = require('../src/yaku');

const 団体 = (追加 = {}) => ({ activeRole: 'group', isAdminMode: false, ...追加 });
const 個人 = (役の設定, 追加 = {}) => ({
  activeRole: 'member',
  myMemberId: 'm1',
  isAdminMode: false,
  役の設定,
  ...追加,
});

test('役の無い人は 部員（自分）：今の個人ログインと同じ（付けるだけ・自分の分だけ見る）', () => {
  const 状態 = 個人(null);
  assert.strictEqual(役.役を引く(null, 'm1'), 'jibun');
  assert.deepStrictEqual(役.自分の部品(状態), ['付ける']);
  assert.strictEqual(役.自分の分だけか(状態), true);
  assert.strictEqual(役.できるか(状態, '記録を付ける'), true);
  for (const 名 of [
    '記録を直す',
    '記録を消す',
    'メンバーを管理する',
    '出欠',
    '団体の設定',
    '個人IDを見る',
    '招待リンクを作る',
  ])
    assert.strictEqual(役.できるか(状態, 名), false, 名);
  assert.strictEqual(役.管理者モードに入れるか(状態), false);
});

test('団体の口座は役を見ない。合言葉が要る操作だけ管理者モードを見る', () => {
  for (const 名 of Object.keys(役.操作)) {
    assert.strictEqual(役.できるか(団体({ isAdminMode: true }), 名), true, 名);
    assert.strictEqual(役.できるか(団体(), 名), !役.操作[名].合言葉, 名);
  }
  assert.strictEqual(役.自分の分だけか(団体()), false);
});

test('合言葉で守る範囲は前の管理者モードのまま（11/18）：直す・個人ID・招待・アカウントの削除・合言葉を変える・役', () => {
  const 要る = Object.keys(役.操作)
    .filter((名) => 役.操作[名].合言葉)
    .sort();
  assert.deepStrictEqual(
    要る,
    [
      'アカウントを削除する',
      '個人IDを見る',
      '管理者の合言葉を変える',
      '記録を直す',
      '招待リンクを作る',
      '役を決める',
    ].sort()
  );
});

test('最初の 4 つ：部員（全員）は全員を見て付ける、見るだけは見るだけ、運営は 7 つ全部', () => {
  const 設定 = { 割り当て: { m1: 'zenin', m2: 'miru', m3: 'unei' } };
  assert.deepStrictEqual(役.自分の部品(個人(設定)), ['全員を見る', '付ける']);
  assert.strictEqual(役.自分の分だけか(個人(設定)), false);
  const 見る = 個人(設定, { myMemberId: 'm2' });
  assert.strictEqual(役.できるか(見る, 'ほかの人の記録を見る'), true);
  assert.strictEqual(役.できるか(見る, '記録を付ける'), false);
  const 運営 = 個人(設定, { myMemberId: 'm3' });
  assert.deepStrictEqual(役.自分の部品(運営), 役.部品の鍵);
  assert.strictEqual(役.管理者モードに入れるか(運営), true);
});

test('運営でも合言葉の要る操作は管理者モードのときだけ（11/19 本人「求める」）。団体だけの操作はできない', () => {
  const 設定 = { 割り当て: { m1: 'unei' } };
  assert.strictEqual(役.できるか(個人(設定), '記録を消す'), true);
  assert.strictEqual(役.できるか(個人(設定), 'メンバーを管理する'), true);
  assert.strictEqual(役.できるか(個人(設定), '記録を直す'), false);
  assert.strictEqual(役.できるか(個人(設定), '個人IDを見る'), false);
  assert.strictEqual(役.できるか(個人(設定, { isAdminMode: true }), '記録を直す'), true);
  assert.strictEqual(役.できるか(個人(設定, { isAdminMode: true }), '招待リンクを作る'), true);
  for (const 名 of [
    'アカウントを削除する',
    '管理者の合言葉を変える',
    '全員の個人IDを新しくする',
    '紹介の許可',
  ])
    assert.strictEqual(役.できるか(個人(設定, { isAdminMode: true }), 名), false, 名);
});

test('役を決めるのは、団体の口座と最初からある運営の役の人だけ。どちらも管理者モード（11/25 本人）', () => {
  const 全部 = ['全員を見る', '付ける', '直す', '消す', 'メンバー', '出欠', '設定'];
  const 設定 = {
    // 運営の名前と部品を変えても、運営の役（id）のまま
    役: {
      unei: { 名: '主将', 部品: ['全員を見る', '付ける', 'メンバー'] },
      r_zenbu: { 名: '全部', 部品: 全部 },
    },
    割り当て: { m1: 'unei', m2: 'r_zenbu', m3: 'zenin' },
  };
  const 管 = { isAdminMode: true };
  assert.strictEqual(役.できるか(個人(設定, 管), '役を決める'), true, '運営＋管理者モード');
  assert.strictEqual(役.できるか(個人(設定), '役を決める'), false, '運営で管理者モードでない');
  assert.strictEqual(
    役.できるか(個人(設定, { ...管, myMemberId: 'm2' }), '役を決める'),
    false,
    '作った役（部品は全部）'
  );
  assert.strictEqual(
    役.できるか(個人(設定, { ...管, myMemberId: 'm3' }), '役を決める'),
    false,
    '部員（全員）'
  );
  assert.strictEqual(役.できるか({ activeRole: 'group', isAdminMode: true }, '役を決める'), true);
  assert.strictEqual(役.できるか({ activeRole: 'group', isAdminMode: false }, '役を決める'), false);
  assert.strictEqual(役.自分の役id(個人(設定)), 'unei');
  assert.strictEqual(役.自分の役id({ activeRole: 'group' }), null);
  // 使い方の一覧に使う：役の id で見る。部品だけでは持たない
  assert.strictEqual(役.役で持つか('unei', [], '役を決める'), true);
  assert.strictEqual(役.役で持つか('r_zenbu', 全部, '役を決める'), false);
  assert.strictEqual(役.部品で持つか(全部, '役を決める'), false);
  assert.strictEqual(役.役で持つか('unei', 全部, 'アカウントを削除する'), false);
});

test('作った役・名前を変えた最初の役・消した役', () => {
  const 設定 = {
    役: {
      zenin: { 名: '一般部員', 部品: ['全員を見る', '付ける'] },
      r_kakari: { 名: '出欠の係', 部品: ['付ける', '出欠', 'ないもの'], 作った: 2 },
      r_old: { 名: '', 部品: ['設定'] },
    },
    割り当て: { m1: 'r_kakari', m2: 'r_kesita' },
  };
  const 一覧 = 役.役の一覧(設定);
  assert.deepStrictEqual(
    一覧.map((一つ) => [一つ.id, 一つ.名]),
    [
      ['jibun', '部員（自分）'],
      ['zenin', '一般部員'],
      ['miru', '見るだけ'],
      ['unei', '運営'],
      ['r_kakari', '出欠の係'],
    ]
  );
  // 知らない部品は捨てる。出欠を持つ役は「全員を見る」も持つ（11/19 本人。3 段目で出欠は全員の記録から数えるため）
  assert.deepStrictEqual(役.自分の部品(個人(設定)), ['全員を見る', '付ける', '出欠'], '知らない部品は捨てる');
  assert.strictEqual(役.できるか(個人(設定), '出欠'), true);
  assert.strictEqual(役.役を引く(設定, 'm2'), 'jibun', '消した役の人は 部員（自分）');
});

test('確かめの文と札の文', () => {
  assert.strictEqual(
    役.役の文(['付ける']),
    'この役の人は、自分の記録だけ見る、記録を付けることができます。保存した記録を直す、記録を消す・ゴミ箱から戻す、メンバーを管理する、出欠と練習日を管理する、団体の設定を変えることはできません。'
  );
  assert.match(役.役の文(役.部品の鍵), /保存した記録を直す（管理者の合言葉が要る）/);
  assert.doesNotMatch(役.役の文(役.部品の鍵), /できません/);
  assert.strictEqual(役.役の短い文(['全員を見る']), '全員の記録を見る');
  assert.strictEqual(役.役の短い文(['付ける', '設定']), '自分の記録を見る、記録を付ける、団体の設定を変える');
  assert.strictEqual(
    役.役の短い文(['付ける', '出欠']),
    '全員の記録を見る、記録を付ける、出欠と練習日を管理する'
  );
});

test('役の名前の形', () => {
  assert.strictEqual(役.役の名の形の文('', null), '役の名前を入れてください');
  assert.strictEqual(役.役の名の形の文('あ'.repeat(21), null), '役の名前は 20 字までにしてください');
  assert.strictEqual(役.役の名の形の文('運営', null), '同じ名前の役があります');
  assert.strictEqual(役.役の名の形の文('運営', null, 'unei'), '', '自分の名前はそのままでよい');
  assert.match(
    役.新しい役のid(0, () => 0),
    /^r_[0-9a-z]+$/
  );
});

test('直す・消す・メンバー・出欠を持つ役は「全員を見る」も持つ（11/19 本人）', () => {
  for (const 鍵 of 役.見るのが要る部品)
    assert.ok(役.形の良い部品(['付ける', 鍵]).includes('全員を見る'), `${鍵} だけで全員を見るが付かない`);
  assert.deepStrictEqual(役.形の良い部品(['付ける']), ['付ける']);
  assert.deepStrictEqual(役.形の良い部品(['設定', '付ける']), ['付ける', '設定']);
  // 保存した役の中身が古い形（全員を見るの無い 出欠 の役）でも、読むときにそろえる
  const 設定 = { 役: { r1: { 名: '出欠の係', 部品: ['付ける', '出欠'] } }, 割り当て: { m1: 'r1' } };
  const 人 = { activeRole: 'member', myMemberId: 'm1', 役の設定: 設定 };
  assert.strictEqual(役.自分の分だけか(人), false);
  assert.strictEqual(役.できるか(人, 'ほかの人の記録を見る'), true);
});
