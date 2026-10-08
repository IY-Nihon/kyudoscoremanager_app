/**
 * 「紹介に載せてよいか」の許可の決まりの検査。
 *
 *   npm test
 *
 * 使い始めの団体には聞かない（断られる）。答えた団体・3 回聞いた団体にも聞かない。
 * 載せる先は最初どちらもチェック。載せるのは団体名か地域だけ。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const 決まり = require('../src/listingConsent');

const 日 = 24 * 60 * 60 * 1000;
const いま = Date.parse('2026-10-20T12:00:00+09:00');
const 記録を作る = (数, 最初の日前) =>
  Array.from({ length: 数 }, (_, i) => ({ id: 'r' + i, date: いま - 最初の日前 * 日 + i * 1000 }));

test('使い慣れた団体（記録10回・14日以上）の団体ログインにだけ札を出す', () => {
  assert.equal(決まり.札を出すか({ 役割: 'group', 記録たち: 記録を作る(10, 14), 許可: null, いま }), true);
  assert.equal(決まり.札を出すか({ 役割: 'group', 記録たち: 記録を作る(9, 30), 許可: null, いま }), false);
  assert.equal(決まり.札を出すか({ 役割: 'group', 記録たち: 記録を作る(20, 13), 許可: null, いま }), false);
  assert.equal(決まり.札を出すか({ 役割: 'member', 記録たち: 記録を作る(20, 30), 許可: null, いま }), false);
  assert.equal(決まり.札を出すか({ 役割: 'group', 記録たち: 記録を作る(20, 30), 許可: null, いま, 止める: true }), false);
});

test('ゴミ箱の記録は数えない。日付は日時型でも文字でも読める', () => {
  const 記録 = 記録を作る(10, 30);
  記録[0] = Object.assign({}, 記録[0], { deletedAt: いま });
  assert.equal(決まり.札を出すか({ 役割: 'group', 記録たち: 記録, 許可: null, いま }), false);
  const 型 = 記録を作る(10, 30).map((r) => ({ ...r, date: { seconds: Math.floor(r.date / 1000), nanoseconds: 0 } }));
  assert.equal(決まり.札を出すか({ 役割: 'group', 記録たち: 型, 許可: null, いま }), true);
  const 字 = 記録を作る(10, 30).map((r) => ({ ...r, date: new Date(r.date).toISOString() }));
  assert.equal(決まり.札を出すか({ 役割: 'group', 記録たち: 字, 許可: null, いま }), true);
});

test('「あとで」はその起動のあいだだけ出さない。次に開いたらまた聞く。回数の上限は無い。答えたら聞かない', () => {
  const 記録 = 記録を作る(12, 40);
  const 一回目 = 決まり.聞いた記録(null, いま);
  assert.equal(一回目.聞いた回数, 1);
  assert.equal(一回目.初めて聞いた日時, いま);
  assert.equal(
    決まり.札を出すか({ 役割: 'group', 記録たち: 記録, 許可: 一回目, いま, この起動で聞いた: true }),
    false,
    '同じ起動のうちにまた出た'
  );
  assert.equal(決まり.札を出すか({ 役割: 'group', 記録たち: 記録, 許可: 一回目, いま: いま + 1000 }), true, '次に開いたのに出ない');
  let 許可 = 一回目;
  for (let i = 0; i < 10; i++) 許可 = 決まり.聞いた記録(許可, いま + i);
  assert.equal(許可.聞いた回数, 11);
  assert.equal(許可.初めて聞いた日時, いま, '初めて聞いた日時は変えない');
  assert.equal(決まり.札を出すか({ 役割: 'group', 記録たち: 記録, 許可, いま }), true, '何回聞いても上限で止めない');
  const 答え = 決まり.答えを整える({ 載せ方: '載せない' }, いま).中身;
  assert.equal(決まり.札を出すか({ 役割: 'group', 記録たち: 記録, 許可: 答え, いま: いま + 60 * 日 }), false);
});

test('設定の項目は、一度でも札で聞いた団体の団体ログインにだけ出す', () => {
  assert.equal(決まり.設定に出すか('group', null), false);
  assert.equal(決まり.設定に出すか('group', { 聞いた回数: 0 }), false);
  assert.equal(決まり.設定に出すか('group', 決まり.聞いた記録(null, いま)), true);
  assert.equal(決まり.設定に出すか('member', 決まり.聞いた記録(null, いま)), false);
});

test('最初の選び：載せる先はどちらもチェック、名前は団体名。答えたあとは答えのまま', () => {
  assert.deepEqual(決まり.最初の選び(null, '〇〇大学弓道部'), {
    載せ方: null,
    載せる名前: '〇〇大学弓道部',
    地域: '',
    ホームページ: true,
    他校への案内: true,
  });
  const 答え = 決まり.答えを整える(
    { 載せ方: '地域', 地域: '関東の大学', ホームページ: false, 他校への案内: true },
    いま
  ).中身;
  assert.deepEqual(決まり.最初の選び(答え, '〇〇大学弓道部'), {
    載せ方: '地域',
    載せる名前: '〇〇大学弓道部',
    地域: '関東の大学',
    ホームページ: false,
    他校への案内: true,
  });
});

test('答えを整える：足りないときは画面に出す文を返す。載せないなら載せる先は外す', () => {
  assert.match(決まり.答えを整える({}).誤り, /何を載せるか/);
  assert.match(決まり.答えを整える({ 載せ方: '団体名', 載せる名前: ' ', ホームページ: true }).誤り, /名前/);
  assert.match(決まり.答えを整える({ 載せ方: '地域', 地域: '', ホームページ: true }).誤り, /地域/);
  assert.match(
    決まり.答えを整える({ 載せ方: '団体名', 載せる名前: 'A大学', ホームページ: false, 他校への案内: false }).誤り,
    /載せる先/
  );
  const 載せない = 決まり.答えを整える({ 載せ方: '載せない', ホームページ: true, 他校への案内: true }, いま).中身;
  assert.equal(載せない.ホームページ, false);
  assert.equal(載せない.他校への案内, false);
  assert.equal(載せない.聞いた文の版, 決まり.聞いた文の版);
  assert.equal(載せない.答えた日時, いま);
  const 団体名 = 決まり.答えを整える(
    { 載せ方: '団体名', 載せる名前: ' A大学弓道部 ', 地域: '関東', ホームページ: true, 他校への案内: false },
    いま
  ).中身;
  assert.equal(団体名.載せる名前, 'A大学弓道部');
  assert.equal(団体名.地域, '', '団体名を選んだら地域は残さない');
});

test('一覧に出す形：載せる先ごとに、団体名か地域だけ', () => {
  const 整 = (選) => 決まり.答えを整える(選, いま).中身;
  assert.deepEqual(
    決まり.載せる表示(整({ 載せ方: '団体名', 載せる名前: 'A大学弓道部', ホームページ: false, 他校への案内: true })),
    { 表示: 'A大学弓道部', ホームページ: false, 他校への案内: true }
  );
  assert.deepEqual(
    決まり.載せる表示(整({ 載せ方: '地域', 地域: '関東の大学', ホームページ: true, 他校への案内: true })),
    { 表示: '関東の大学', ホームページ: true, 他校への案内: true }
  );
  assert.equal(決まり.載せる表示(整({ 載せ方: '載せない' })), null);
  assert.equal(決まり.載せる表示(決まり.聞いた記録(null, いま)), null, '聞いただけ（答えていない）は載せない');
  assert.equal(決まり.載せる表示(null), null);
});

test('決まり：config/listing は団体の持ち主だけが書ける（部員の端末から答えを変えられない）', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const 決まりの字 = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  assert.match(決まりの字, /match \/config\/\{docId\} \{\s*allow read: if canAccess\(groupId\);\s*allow write: if canAccess\(groupId\) && docId != 'listing';/);
  assert.match(決まりの字, /match \/config\/listing \{\s*allow read: if canAccess\(groupId\);\s*allow write: if isGroupOwner\(groupId\);/);
});
