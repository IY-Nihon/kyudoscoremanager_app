/**
 * 公開の帳面（group_accounts/{団体}）へ書く項目が、決まりの hasOnly と
 * 食い違っていないかを見る。
 *
 * ■ なぜこの検査が要るか
 * 同じ食い違いで、本番の新規登録が**2度**止まっている。
 *
 *   2026-08-27  同意の記録を帳面へ足したのに、決まりの hasOnly は4項目のまま
 *               → create が弾かれ、8/29 に決まりを7項目へ広げて復旧
 *   2026-09-02  決まりを id と email の2項目へ絞ったが、アプリは7項目を
 *               書いたまま配信されていなかった → ふたたび新規登録が停止
 *
 * どちらも「走らせれば分かる」ものではなかった。新規登録は検査でも e2e でも
 * 通らない道（本番の団体を作ることになる）なので、誰も踏まずに配信された。
 * だから、走らせずに読み比べる。
 *
 * ■ 何を見るか
 * firestore.rules の hasOnly が許す項目と、src が setDoc へ渡す項目を、
 * どちらもファイルから読み取って突き合わせる。
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 根 = path.resolve(__dirname, '..');
const 読む = (p) => fs.readFileSync(path.join(根, p), 'utf8');

/** firestore.rules の group_accounts の節から hasOnly の中身を拾う */
function 決まりが許す項目(決まり文) {
  const 節の頭 = 決まり文.indexOf('match /group_accounts/{groupId}');
  assert.ok(節の頭 >= 0, 'firestore.rules に group_accounts の節が無い');
  // private の節に入る前まで
  const 節の尻 = 決まり文.indexOf('match /private/', 節の頭);
  const 節 = 決まり文.slice(節の頭, 節の尻 > 0 ? 節の尻 : undefined);

  const 出 = {};
  for (const 種 of ['create', 'update']) {
    const i = 節.indexOf(`allow ${種}:`);
    if (i < 0) continue;
    // 次の allow までを、この許可の範囲とみなす
    const j = 節.indexOf('allow ', i + 6);
    const 範囲 = 節.slice(i, j > 0 ? j : undefined);
    const m = 範囲.match(/hasOnly\(\[([^\]]*)\]\)/);
    出[種] = m ? m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean) : null;
  }
  return 出;
}

/**
 * src が公開の帳面へ書いている項目を拾う。
 *
 * doc(..., 'group_accounts', X) を受けた変数に対する setDoc の第2引数から、
 * 素直な形（{ a: …, b: … }）の鍵を読む。
 * private の子（doc(..., 'group_accounts', X, 'private', …)）は対象外。
 */
function アプリが書く項目() {
  const 出 = [];
  const 対象 = fs
    .readdirSync(path.join(根, 'src'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => 'src/' + f);

  for (const f of 対象) {
    const s = 読む(f);
    // 公開の帳面を指す変数名を集める（private の子は除く）
    const 変数 = new Set();
    for (const m of s.matchAll(
      /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\(0,\s*[\w.]+\.doc\)\([^,]+,\s*'group_accounts',\s*([^,)]+)\)/g
    ))
      変数.add(m[1]);

    for (const 名 of 変数) {
      // setDoc(名, { … }) / setDoc(名, { … }, { merge: true })
      const re = new RegExp(
        `setDoc\\)\\(\\s*${名}\\s*,\\s*\\{([^{}]*)\\}`,
        'g'
      );
      for (const m of s.matchAll(re)) {
        const 鍵 = [...m[1].matchAll(/([A-Za-z_$][\w$]*)\s*:/g)].map((x) => x[1]);
        if (鍵.length) 出.push({ ファイル: f, 鍵, merge: /\{\s*merge/.test(s.slice(m.index, m.index + m[0].length + 40)) });
      }
    }
  }
  return 出;
}

test('公開の帳面へ書く項目が、決まりの hasOnly に収まっている', () => {
  const 許す = 決まりが許す項目(読む('firestore.rules'));
  assert.ok(許す.create, 'create に hasOnly が無い。誰でも読める帳面に何でも書ける');
  assert.ok(許す.update, 'update に hasOnly が無い。作るときだけ絞っても、あとから書き足せる');

  const 書く = アプリが書く項目();
  assert.ok(書く.length > 0, 'アプリが公開の帳面へ書く箇所を1つも読み取れなかった（検査の側が壊れている）');

  for (const x of 書く) {
    const はみ出し = x.鍵.filter((k) => !許す.create.includes(k));
    assert.deepStrictEqual(
      はみ出し,
      [],
      `${x.ファイル} が公開の帳面へ ${x.鍵.join('・')} を書いているが、` +
        `決まりが許すのは ${許す.create.join('・')} だけ。` +
        `本番の新規登録が permission-denied で止まる（2026-08-27 と 2026-09-02 に実際に起きた）`
    );
  }
});

test('create と update で許す項目がそろっている', () => {
  const 許す = 決まりが許す項目(読む('firestore.rules'));
  assert.deepStrictEqual(
    [...許す.update].sort(),
    [...許す.create].sort(),
    'create と update で許す項目が違う。' +
      'update が緩いと、作ったあとに書き足して同じ露出を作れる'
  );
});

test('rollback.rules も同じ項目に絞れている', () => {
  const 本 = 決まりが許す項目(読む('firestore.rules'));
  const 戻し = 決まりが許す項目(読む('rules/rollback.rules'));
  assert.deepStrictEqual(
    戻し.create,
    本.create,
    '緊急の切り戻しで、公開の帳面の制限が緩む。切り戻した瞬間に露出が戻る'
  );
  assert.deepStrictEqual(戻し.update, 本.update, '同上（update 側）');
});
