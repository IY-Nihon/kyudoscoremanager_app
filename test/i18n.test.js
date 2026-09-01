/**
 * 言葉の差し替え（src/i18n.js / src/messages.js）。
 *
 *   npm test
 *
 * 見たいのは3つ。
 *   ・既定は日本語のままで、いまの画面が何も変わらないこと
 *   ・訳が抜けても、空にならずに何か出ること
 *   ・弓道の言葉を訳し飛ばしていないこと
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const i = require('../src/i18n');
const { 言葉たち, 束, まとめる } = require('../src/messages/index');

// どの検査も、終わったら日本語へ戻す。戻さないと、
// あとから走る検査が英語のまま動いて落ちる
const 言葉を戻して = (f) => {
  try {
    f();
  } finally {
    i.言葉を選ぶ('ja');
  }
};

test('既定は日本語', () => {
  assert.strictEqual(i.既定の言葉, 'ja');
  assert.strictEqual(i.選ばれている言葉(), 'ja');
});

test('見立て：端末の符号から選ぶ', () => {
  assert.strictEqual(i.端末の言葉を見立てる({ language: 'en-US' }), 'en');
  assert.strictEqual(i.端末の言葉を見立てる({ language: 'ja-JP' }), 'ja');
});

test('見立て：知らない言葉は日本語に落とす', () => {
  // 訳の無い言葉で開くと、鍵がそのまま並んだ画面になる
  for (const x of ['fr', 'zh-TW', '', null, undefined, 123])
    assert.strictEqual(i.端末の言葉を見立てる(/** @type {any} */ ({ language: x })), 'ja', String(x));
});

test('見立て：languages しか無くても読む', () => {
  assert.strictEqual(i.端末の言葉を見立てる({ languages: ['en-GB', 'ja'] }), 'en');
});

test('選ぶ：知らない符号を渡しても日本語のまま', () => {
  言葉を戻して(() => {
    assert.strictEqual(i.言葉を選ぶ('fr'), 'ja');
    assert.strictEqual(i.言葉を選ぶ('EN-us'), 'en', '大文字と地域名も受ける');
  });
});

test('差し込み：日本語の名前も入る', () => {
  // \w だけで拾うと {立ち} が置き換わらない。実際にそれで抜けた
  言葉を戻して(() => {
    assert.strictEqual(
      i.訳('ます.読み', { 立ち: 2, 射位: '大前', 名前: '山田', 射: 3, 印: '的中' }),
      '2立目 大前 山田 3射目 的中'
    );
  });
});

test('差し込み：渡されなかった名前はそのまま残す', () => {
  // 空にすると、言葉が抜けたのか訳が抜けたのか見分けられない
  assert.ok(i.訳('ます.読み', {}).includes('{立ち}'));
});

test('訳が無い鍵は、鍵そのものを返す（空にしない）', () => {
  assert.strictEqual(i.訳('どこにも.無い鍵'), 'どこにも.無い鍵');
  assert.notStrictEqual(i.訳('どこにも.無い鍵'), '');
});

test('訳が抜けている言葉は、日本語へ落ちる', () => {
  言葉を戻して(() => {
    i.言葉を選ぶ('en');
    // en に無い鍵。ja にあれば、そちらが出る
    assert.strictEqual(i.訳('印.的中'), 'hit');
    assert.strictEqual(i.訳('どこにも.無い鍵'), 'どこにも.無い鍵');
  });
});

test('数：英語は単数と複数で形が変わる', () => {
  言葉を戻して(() => {
    i.言葉を選ぶ('en');
    assert.strictEqual(i.訳('在席.台数', { n: 1 }), '1 device connected');
    assert.strictEqual(i.訳('在席.台数', { n: 3 }), '3 devices connected');
    // 0 は複数側。英語は 0 devices
    assert.strictEqual(i.訳('在席.台数', { n: 0 }), '0 devices connected');
  });
});

test('数：日本語は形が変わらない', () => {
  assert.strictEqual(i.訳('在席.台数', { n: 1 }), '1台接続中');
  assert.strictEqual(i.訳('在席.台数', { n: 3 }), '3台接続中');
});

test('辞書：英語に訳が抜けている鍵はいくつか（増やさないための目安）', () => {
  const 抜け = Object.keys(言葉たち.ja).filter((k) => !(k in 言葉たち.en));
  assert.deepStrictEqual(抜け, [], '英語の訳が抜けている: ' + 抜け.join(', '));
});

test('辞書：英語にだけある鍵は無い（消し忘れ）', () => {
  const 余り = Object.keys(言葉たち.en).filter((k) => !(k in 言葉たち.ja));
  assert.deepStrictEqual(余り, [], '日本語に無い鍵が英語にある: ' + 余り.join(', '));
});

test('辞書：弓道の言葉は訳し飛ばしていない', () => {
  // 大前を archer 1、落を last archer と置くと意味が変わる。
  // 大前は「1番目の人」ではなく、その立ちを起こす役
  assert.ok(言葉たち.en['射位.大前'].includes('omae'), '大前がローマ字で残っていない');
  assert.ok(言葉たち.en['射位.落'].includes('ochi'), '落がローマ字で残っていない');
  assert.ok(言葉たち.en['ます.読み'].includes('tachi'), '立ちがローマ字で残っていない');
});

test('辞書：鍵を日本語そのものにしていない', () => {
  // 日本語の字面を鍵にすると、言い回しを直したとき全言語の訳が外れる
  for (const k of Object.keys(言葉たち.ja))
    assert.ok(/^[\w.]+$|\./.test(k) && k.includes('.'), '鍵の付け方が違う: ' + k);
});

// ── 画面ごとに分けた辞書の作り ────────────────────────
//
// 2,389か所を1つの辞書に流し込むと差分が見きれないので、画面ごとに
// 分けて1画面ずつ移す（src/messages/index.js の手順）。
// その分け方そのものが崩れないように、ここで押さえる。

test('辞書：鍵がファイルをまたいで重なっていない', () => {
  // 重なると、どちらの言葉が出るかがファイルの並び順で決まり、追えなくなる
  assert.doesNotThrow(() => まとめる(束));
});

test('辞書：鍵が重なったら、黙って上書きせずに止まる', () => {
  // 黙って上書きすると、移し替えの途中で言葉が入れ替わっても気づけない
  assert.throws(
    () =>
      まとめる({
        あ: { ja: { 'x.y': '1' }, en: { 'x.y': '1' } },
        い: { ja: { 'x.y': '2' }, en: { 'x.y': '2' } },
      }),
    /鍵が重なって/
  );
});

test('辞書：ファイルごとに ja と en が揃っている', () => {
  // ぜんたいで揃っていても、ファイル単位で欠けていると移し忘れに気づけない
  for (const 名 of Object.keys(束)) {
    const 一組 = 束[名];
    const 抜け = Object.keys(一組.ja || {}).filter((k) => !(k in (一組.en || {})));
    const 余り = Object.keys(一組.en || {}).filter((k) => !(k in (一組.ja || {})));
    assert.deepStrictEqual(抜け, [], `${名}.js の英語が抜けている: ${抜け.join(', ')}`);
    assert.deepStrictEqual(余り, [], `${名}.js の日本語が抜けている: ${余り.join(', ')}`);
  }
});

test('辞書：src/messages にあるファイルは、全部まとめに登録されている', () => {
  // 作っただけで登録し忘れると、その画面だけ日本語のまま出る。
  // 画面は日本語で正しく見えるので、英語で開くまで誰も気づかない
  const fs = require('node:fs');
  const path = require('node:path');
  const 置き場 = path.join('src', 'messages');
  const ファイルたち = fs
    .readdirSync(置き場)
    .filter((f) => f.endsWith('.js') && f !== 'index.js')
    .map((f) => f.replace(/\.js$/, ''));
  const 登録 = Object.keys(束);
  for (const f of ファイルたち)
    assert.ok(登録.includes(f), `src/messages/${f}.js が index.js の 束 に無い`);
  assert.strictEqual(登録.length, ファイルたち.length, '束 に、実体の無い名前がある');
});
