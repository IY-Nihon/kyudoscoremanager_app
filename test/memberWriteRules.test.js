// 部員（個人ログイン）の書き込みを絞る決まり（firestore.rules・2026-11-02 決めた）。
// 本当に断られるかは検証環境に当てて確かめる（node scripts/verify-prod-acceptance.mjs stg の「部員」「一覧」）。
// ここは、決まりの字が崩れていないか（canAccess で書けるように戻っていないか）だけを見る
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 決まり = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8').replace(/\r\n/g, '\n');
/** match の中身（次の match か閉じ括弧まで） */
const 中身 = (印) => {
  const 始め = 決まり.indexOf(印);
  assert.ok(始め >= 0, `${印} が無い`);
  return 決まり.slice(始め, 決まり.indexOf('\n      }', 始め));
};

test('記録：役に「付ける」があれば作る・送り直す（射手は減らさない）、「直す」＋合言葉で直す、「消す」で消す（2026-11-19）', () => {
  const 節 = 中身('match /sessions/{docId}');
  // 読めるのは持ち主と全員を見る役だけ（3 段目・11/19 本人。部員（自分）は中継の /jibun から自分の行だけ）
  assert.match(節, /allow read: if isGroupOwner\(groupId\) \|\| memberSeesAll\(groupId\);/);
  assert.match(節, /allow create: if isGroupOwner\(groupId\) \|\| memberCan\(groupId, '付ける'\);/);
  assert.match(節, /allow update: if isGroupOwner\(groupId\)\s*\|\| \(memberCan\(groupId, '付ける'\)/);
  assert.match(節, /size\(\) >= resource\.data\.get\('archers', \[\]\)\.size\(\)/, '部員が射手を減らせる');
  assert.match(節, /\|\| memberAdmin\(groupId, '直す'\);/);
  assert.match(節, /allow delete: if isGroupOwner\(groupId\) \|\| memberCan\(groupId, '消す'\);/);
  assert.doesNotMatch(節, /isClaimedMember/, '役を見ずに部員を通している');
});

test('名簿：作る・消すは団体と役に「メンバー」のある部員（個人ID は置かせない）。ほかの部員は自分の弓具だけ', () => {
  const 節 = 中身('match /members/{docId}');
  assert.match(
    節,
    /allow create: if \(isGroupOwner\(groupId\) \|\| memberCan\(groupId, 'メンバー'\)\) && keepsPersonalIdOut\(\);/
  );
  assert.match(節, /allow delete: if isGroupOwner\(groupId\) \|\| memberCan\(groupId, 'メンバー'\);/);
  assert.match(節, /docId == claim\(\)\.data\.memberId/);
  assert.match(節, /affectedKeys\(\)\.hasOnly\(\['equipments', 'lastModified'\]\)/);
});

test('卒業生・ゴミ箱・練習日：書くのは団体と、役にその部品のある部員（読むのは部員も。ゴミ箱は全員を見る役だけ）', () => {
  for (const [印, 部品, 読み] of [
    ['match /trash/{docId}', '消す', /allow read: if isGroupOwner\(groupId\) \|\| memberSeesAll\(groupId\);/],
    ['match /officialPracticeDays/{docId}', '出欠', /allow read: if canAccess\(groupId\);/],
  ]) {
    const 節 = 中身(印);
    assert.match(節, 読み, 印);
    assert.ok(節.includes(`allow write: if isGroupOwner(groupId) || memberCan(groupId, '${部品}');`), 印);
  }
  const 卒業生 = 中身('match /alumni/{docId}');
  assert.match(卒業生, /allow read: if canAccess\(groupId\);/);
  assert.match(
    卒業生,
    /allow create, update: if \(isGroupOwner\(groupId\) \|\| memberCan\(groupId, 'メンバー'\)\) && keepsPersonalIdOut\(\);/
  );
  assert.match(卒業生, /allow delete: if isGroupOwner\(groupId\) \|\| memberCan\(groupId, 'メンバー'\);/);
});

test('役の文書（config/roles）は、団体の口座で管理者の合言葉を入れているときだけ書ける。ほかの config からは書かせない', () => {
  assert.match(中身('match /config/roles {'), /allow write: if isGroupAdmin\(groupId\);/);
  assert.match(中身('match /config/{docId}'), /docId != 'listing' && docId != 'roles'/);
});

test('決まりの最初の 4 つの役（presetParts）が src/yaku.js と同じ', () => {
  const 役 = require('../src/yaku');
  const 節 = 決まり.slice(決まり.indexOf('function presetParts'), 決まり.indexOf('function memberParts'));
  const 部品を読む = (id) => {
    const 印 = `rid == '${id}' ? [`;
    const 始め = 節.indexOf(印);
    if (始め < 0) return null;
    const 中 = 節.slice(始め + 印.length, 節.indexOf(']', 始め));
    return 中.split(',').map((字) => 字.trim().replace(/'/g, ''));
  };
  for (const 一つ of 役.最初の役.filter((一つ) => 一つ.id !== 役.既定の役))
    assert.deepStrictEqual(部品を読む(一つ.id), 一つ.部品, 一つ.id);
  const 既定 = 節.match(/: \[([^\]]*)\];\s*\}/);
  assert.deepStrictEqual(
    既定[1].split(',').map((字) => 字.trim().replace(/'/g, '')),
    役.最初の役.find((一つ) => 一つ.id === 役.既定の役).部品
  );
});

test('団体の帳面の一覧：管理者か、自分のメールの団体だけ', () => {
  assert.match(
    決まり,
    /allow list: if isAdmin\(\)\n\s+\|\| \(callerEmail\(\) != '' && resource\.data\.email == callerEmail\(\)\);/
  );
});

test('全員の記録を読める役（memberSeesAll）は、全員を見るか、見るのが要る部品（src/yaku.js）を持つ役', () => {
  const { 見るのが要る部品 } = require('../src/yaku');
  const 始め = 決まり.indexOf('function memberSeesAll(groupId)');
  assert.ok(始め >= 0, 'memberSeesAll が無い');
  const 節 = 決まり.slice(始め, 決まり.indexOf('}', 始め));
  for (const 部品 of ['全員を見る', ...見るのが要る部品])
    assert.ok(節.includes(`'${部品}'`), `${部品} が無い`);
});
