/**
 * サインインが外れたときに、入り直しの案内を出せるかの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 *
 * 2026-09-09、本番で端末のサインインが外れた（団体910280）。雲への読み書きが
 * すべて permission-denied で断られ、画面は端末の控えから出るので一見データは
 * あり、練習日だけが消えた。利用者に見えるのは「同期エラー」の一言だけで、
 * 何をすればよいか分からないまま、今朝9時48分から止まったままだった。
 *
 * 便りも「サインインしていること」が要るので送れず、端末に20通溜まっていた。
 * 入り直した瞬間に全部届いて、ようやく原因が分かった。
 *
 * 「断られたと分かったら、入り直すよう画面に出す」を機械で押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 店 = fs.readFileSync(path.join(__dirname, '..', 'src', 'useScoreStore.js'), 'utf8');

/** 店の中の見分けの関数を、そのまま取り出して動かす */
function 見分けを取り出す() {
  const 始め = 店.indexOf('function 入り直せば直るか(');
  assert.ok(始め >= 0, '入り直せば直るか が見つからない');
  let 深さ = 0;
  let 終わり = 始め;
  for (let i = 店.indexOf('{', 始め); i < 店.length; i++) {
    const c = 店[i];
    if (c === '{') 深さ++;
    else if (c === '}') {
      深さ--;
      if (0 === 深さ) {
        終わり = i;
        break;
      }
    }
  }
  return new Function(
    '"use strict";' + 店.slice(始め, 終わり + 1) + ';return 入り直せば直るか;'
  )();
}

test('断られた失敗は、入り直せば直るものと見分ける', () => {
  const 見分ける = 見分けを取り出す();

  // 本番で実際に届いた形
  assert.strictEqual(
    見分ける({ code: 'permission-denied', message: 'Missing or insufficient permissions.' }),
    true,
    '本番で届いた permission-denied を見分けられない'
  );
  assert.strictEqual(見分ける({ code: 'unauthenticated' }), true, 'サインイン切れを見分けられない');
  // 符号が付いていないこともある
  assert.strictEqual(
    見分ける({ message: 'FirebaseError: Missing or insufficient permissions.' }),
    true,
    '符号が無いときに文から見分けられない'
  );
});

test('ふつうの通信の失敗は、入り直しの案内を出さない', () => {
  const 見分ける = 見分けを取り出す();
  assert.strictEqual(見分ける(null), false, '失敗が無いのに案内を出す');
  assert.strictEqual(見分ける({ code: 'unavailable' }), false, '電波が無いだけで入り直させる');
  assert.strictEqual(
    見分ける({ code: 'deadline-exceeded', message: 'timeout' }),
    false,
    '時間切れで入り直させる'
  );
  assert.strictEqual(見分ける({ message: 'client is offline' }), false, 'オフラインで入り直させる');
});

test('断られた3か所すべてで、案内を立てている', () => {
  // syncSessions / fetchAndOverwriteFromCloud / listenToSessions の3か所。
  // 本番の便りは、この3つの出どころから届いた
  const 数 = 店.split('入り直せば直るか(s) && e({ 再ログインの案内: 入り直しの案内 })').length - 1;
  assert.strictEqual(数, 3, '案内を立てている所が3か所ではない（' + 数 + 'か所）');
});

test('同期できたら、案内は自動で下ろす', () => {
  assert.match(
    店,
    /'同期済み' === i\.syncStatus && \(i\.再ログインの案内 = null\)/,
    '同期できても案内が出たままになる'
  );
});

test('画面が、案内を出す作りになっている', () => {
  const 画面 = fs.readFileSync(path.join(__dirname, '..', 'src', 'RecordScreen.js'), 'utf8');
  assert.match(画面, /再ログインの案内 = null,/, '画面が案内を受け取っていない');
  assert.match(画面, /再ログインの案内 \|\| \(オフライン保存の警告/, '画面が案内を帯に出していない');
});
