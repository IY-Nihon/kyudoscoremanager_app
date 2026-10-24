/**
 * 弓具を扱ってよいのは誰か。
 *
 * ■ なぜこの検査が要るか
 *
 * 2026-09-07 に2つ直した。
 *
 *   1. addEquipment がストアに無いのに、画面（MemberScreen）は取り出して
 *      呼んでいた。押しても何も起きず、「弓具の登録ができない」状態だった。
 *      消すほう（deleteEquipment）だけが在った。
 *   2. 弓具は団体アカウントでしか扱えなかった。部員が自分の弓具を
 *      登録できるようにした。ただし**他人のぶんは見ることもできない**。
 *
 * 画面側でも隠しているが、隠すだけでは道が増えたときに漏れる。
 * 根元（ストアの 弓具を触れるか）で止まることを、走らせずに確かめる。
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 根 = path.resolve(__dirname, '..');
const 読む = (p) => fs.readFileSync(path.join(根, p), 'utf8');
// 店は 2026-10-05 に幾つかのファイルに分けた。店ぜんぶの字を読む（test/helpers/storeSource.js）
const { 店の字 } = require('./helpers/storeSource');

test('弓具：足すほうと消すほうが、どちらもストアに在る', () => {
  const 店 = 店の字();
  for (const 名 of ['addEquipment', 'deleteEquipment']) {
    assert.ok(
      new RegExp(名 + '\\s*:').test(店),
      `${名} がストアにありません。画面が取り出して呼ぶので、無いと押しても何も起きません`
    );
  }
});

test('弓具：画面が取り出すものが、すべてストアに在る', () => {
  // MemberScreen が useScoreStore から取り出している名前を拾い、
  // ストア側に定義があるか突き合わせる。1 の再発を防ぐ
  const 画面 = 読む('src/MemberScreen.js');
  const 店 = 店の字();
  // 2026-09-26 から、画面は使う項目だけを購読する（useストアの一部(['名', …])。src/storeSlice.js）。
  // 並べた名前が、画面の取り出すもの。前の useScoreStore() の分解の形も受ける
  const 一部 = [...画面.matchAll(/useストアの一部\(\[([^\]]*)\]\)/g)];
  const m = 画面.match(/const\s*\{([^}]*)\}\s*=\s*(?:\(0,\s*x\.useScoreStore\)|useScoreStore)\(\)/);
  assert.ok(一部.length || m, 'MemberScreen が useScoreStore から取り出している所が見つかりません');
  const 名たち = 一部.length
    ? 一部.flatMap((合う) => [...合う[1].matchAll(/'([^']+)'/g)].map((x) => x[1]))
    : m[1]
        .split(',')
        // 「名: 別名 = 既定」「名 = 既定」のどちらも、名だけを取る
        .map((x) => x.split(/[:=]/)[0].trim())
        .filter(Boolean);
  assert.ok(名たち.length, '取り出している名前が読めません');
  for (const 名 of 名たち) {
    assert.ok(
      new RegExp('\\b' + 名 + '\\s*:').test(店),
      `画面は ${名} を取り出していますが、ストアにありません（呼んでも何も起きません）`
    );
  }
});

test('弓具：足す・消すが、根元の判定を通っている', () => {
  const 店 = 店の字();
  // 判定そのものが在る
  assert.ok(/弓具を触れるか\s*:/.test(店), '弓具を触れるか がありません');
  // 足すほう・消すほうの入口で呼んでいる
  for (const 名 of ['addEquipment', 'deleteEquipment']) {
    const i = 店.indexOf(名 + ':');
    assert.ok(i > 0, `${名} が見つかりません`);
    const 頭 = 店.slice(i, i + 260);
    assert.ok(
      頭.includes('弓具を触れるか'),
      `${名} が 弓具を触れるか を通っていません（画面を直しても根元が開いたままになる）`
    );
  }
});

test('弓具：個人ログインでは、自分のぶんだけ通す', () => {
  const 店 = 店の字();
  const i = 店.indexOf('弓具を触れるか');
  const 節 = 店.slice(i, i + 700);
  // 団体は全員ぶん
  assert.ok(/役\s*===\s*'group'/.test(節), '団体アカウントを通す判定がありません');
  // 個人は自分と一致するときだけ
  assert.ok(
    /役\s*===\s*'member'/.test(節) && /myMemberId|自分/.test(節),
    '個人ログインで「自分かどうか」を見ていません'
  );
});

test('弓具：個人ログインでは、他人の行（弓力・「未登録」）を出さない', () => {
  // 登録の有無そのものが中身。個人ログインでは一覧を出さず、自分の画面だけを返す
  //（2026-10-25 までは一覧の行の中でも他人を弾いていたが、その行は個人ログインでは描かれない）
  const 画面 = 読む('src/MemberScreen.js');
  const 自分の画面 = 画面.indexOf("if (activeRole === 'member') {");
  const 一覧 = 画面.indexOf('testID="メンバーの一覧"');
  assert.ok(自分の画面 > 0 && 一覧 > 0, '個人ログインの画面か、メンバーの一覧が見つかりません');
  assert.ok(自分の画面 < 一覧, '個人ログインで、一覧より先に自分の画面を返していません');
  // 名簿も自分だけに絞ってある（一覧の行を作る元）
  assert.ok(
    /activeRole === 'member'\s*\?\s*\(members \|\| \[\]\)\.filter\(\(部員1人\) => 部員1人 && 部員1人\.id === myMemberId\)/.test(
      画面
    ),
    '個人ログインの名簿を自分だけに絞っていません'
  );
});
