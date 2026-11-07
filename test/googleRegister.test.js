/**
 * Google で団体を作る道（src/LoginScreen.js の Googleを選ぶ・Googleで作る）。
 *
 * 新規登録は検査でも e2e でも通らない道（本番の団体を作ることになる）なので、
 * 走らせずに読み比べる（groupNameOnRegister.test.js と同じ理由）。
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 文 = fs.readFileSync(path.resolve(__dirname, '..', 'src/LoginScreen.js'), 'utf8');

/** 名 の本体（次の「\n  const 」の手前まで） */
function 本体(名) {
  const 頭 = 文.indexOf(`const ${名} = `);
  assert.ok(頭 >= 0, `LoginScreen.js に ${名} が無い`);
  const 尻 = 文.indexOf('\n  const ', 頭 + 1);
  return 文.slice(頭, 尻 > 0 ? 尻 : undefined);
}

test('Google で作る：6 文字未満は押したところで止め、パスワードを持たせてから団体を作る', () => {
  const 中 = 本体('Googleで作る');
  const 短い = 中.indexOf('パスワードが短いか(合言葉の入力)');
  const 持たせる = 中.indexOf('updatePassword');
  const 作る = 中.indexOf('await 団体を作る(');
  assert.ok(短い >= 0 && 短い < 持たせる, '6 文字未満を先に止めていない');
  assert.ok(持たせる >= 0 && 持たせる < 作る, 'パスワードを持たせる前に団体を作っている');
});

test('Google で作る：パスワードを登録できなければ団体を作らず、決めた文を出す', () => {
  const 中 = 本体('Googleで作る');
  const 持たせる = 中.slice(中.indexOf('updatePassword'), 中.indexOf('await 団体を作る('));
  // 失敗を握りつぶして先へ進まない（前は .catch(() => {}) で、パスワードの無い団体ができた）
  assert.doesNotMatch(持たせる, /updatePassword\([^)]*\)\.catch/);
  assert.match(持たせる, /return;/);
  assert.match(
    持たせる,
    /パスワードを登録できませんでした。別のパスワードを入れて、もう一度『作成』を押してください。/
  );
  assert.match(持たせる, /電波の良い場所でもう一度『作成』を押してください。/);
});

test('Google を選ぶ：このメールの団体がもうあれば、作らずにそのまま団体に入る（パスワードが無ければ決めてもらう）。口座は消さない', () => {
  // 2026-11-04 本人：「Google で作る」で団体がもうあれば、そのまま入れる（A27）
  const 中 = 本体('Googleを選ぶ');
  assert.match(中, /providerId === 'password'/);
  const 既に = 中.slice(中.indexOf('if (既に && !既に.empty)'), 中.indexOf('Googleのメールを置く(メール)'));
  assert.ok(既に.length > 0, '団体があるときの分かれ道が無い');
  assert.match(既に, /setAuth\(入る\.id, 'group'/, 'そのまま団体に入っていない');
  assert.match(既に, /パスワードを決め直すを置く\(入る\)/, 'パスワードが無いときに決めてもらっていない');
  assert.doesNotMatch(既に, /deleteUser/);
  assert.match(既に, /return;/);
});
