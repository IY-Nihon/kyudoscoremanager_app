/**
 * 登録した団体名が、アプリの読む場所（groups/{団体}.groupName）に置かれるか。
 *
 * アプリは団体名を groups/{団体} の groupName からしか読まない（設定の「団体名」と
 * 部員の画面。useScoreStore の listenToConfig）。登録の画面は private/consent にだけ
 * 書いていたので、名前を付け直すまで持ち主にも部員にも「未設定」と出ていた
 * （2026-09-24 に本番の 4 団体。scripts/tidy-group-docs.mjs で埋めた）。
 *
 * 新規登録は検査でも e2e でも通らない道（本番の団体を作ることになる）なので、
 * 走らせずに読み比べる（publicGroupDocFields.test.js と同じ理由）。
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 根 = path.resolve(__dirname, '..');
const 読む = (p) => fs.readFileSync(path.join(根, p), 'utf8');

/** 団体を作る の本体（次の const 〜 = async の手前まで） */
function 団体を作るの本体() {
  const 文 = 読む('src/LoginScreen.js');
  const 頭 = 文.indexOf('const 団体を作る = async');
  assert.ok(頭 >= 0, 'LoginScreen.js に 団体を作る が無い');
  const 尻 = 文.indexOf('const ', 文.indexOf('\n  };', 頭));
  return 文.slice(頭, 尻 > 0 ? 尻 : undefined);
}

test('登録で groups/{団体} に groupName を置く', () => {
  const 本体 = 団体を作るの本体();
  assert.match(
    本体,
    /Firestore\.doc\(db, 'groups', 団体ID\),\s*\{\s*groupName: 団体名の入力\s*\}/,
    '団体を作る が groups/{団体ID} に groupName を書いていない'
  );
});

test('アプリは団体名を groups/{団体}.groupName から読む（置き場所が変わったらこの検査も直す）', () => {
  const 店 = 読む('src/useScoreStore.js');
  assert.match(店, /Firestore\.doc\(Firebaseの器\.db, 'groups', 団体\)[\s\S]{0,400}groupName/);
});
