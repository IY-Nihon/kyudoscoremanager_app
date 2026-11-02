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

test('記録：部員も作る・直すはできるが、消すのは団体だけ', () => {
  const 節 = 中身('match /sessions/{docId}');
  assert.match(節, /allow read, create, update: if canAccess\(groupId\);/);
  assert.match(節, /allow delete: if isGroupOwner\(groupId\);/);
});

test('名簿：作る・消すは団体だけ。部員は自分の弓具だけ直せる', () => {
  const 節 = 中身('match /members/{docId}');
  assert.match(節, /allow create, delete: if isGroupOwner\(groupId\);/);
  assert.match(節, /docId == claim\(\)\.data\.memberId/);
  assert.match(節, /affectedKeys\(\)\.hasOnly\(\['equipments', 'lastModified'\]\)/);
});

test('卒業生・ゴミ箱・練習日は、書くのは団体だけ（読むのは部員も）', () => {
  for (const 印 of ['match /alumni/{docId}', 'match /trash/{docId}', 'match /officialPracticeDays/{docId}']) {
    const 節 = 中身(印);
    assert.match(節, /allow read: if canAccess\(groupId\);/, 印);
    assert.match(節, /allow write: if isGroupOwner\(groupId\);/, 印);
  }
});

test('団体の帳面の一覧：管理者か、自分のメールの団体だけ', () => {
  assert.match(決まり, /allow list: if isAdmin\(\)\n\s+\|\| \(callerEmail\(\) != '' && resource\.data\.email == callerEmail\(\)\);/);
});
