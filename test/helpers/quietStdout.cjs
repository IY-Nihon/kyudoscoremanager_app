/**
 * テストの子プロセスの標準出力を、node:test の結果の枠だけにする。
 *
 *   node --test --require ./test/helpers/quietStdout.cjs test/*.test.js   （npm test は、これで流す）
 *   test/helpers/storeHarness.js も、読み込まれたときにこれを読む（1 ファイルだけ流したときも守るため）
 *
 * ■ 何が起きていたか（2026-10-01、npm test で liveShareStore.test.js だけが毎回落ちた）
 *   node:test は、テストファイルを子プロセスで動かし、結果を標準出力へ「枠」にして流す。枠は
 *   V8 で直列化したバイト列で、FF 0F（ヘッダー）＋長さ 4 バイト＋本体の形をしている。
 *   親は、この標準出力から、枠と、テストが出した文字（console.log など）を見分けて読む。
 *   ところが Node v24.15.0 の親は、1 回の読み取りの中で枠の直後に文字が続くと、その文字の頭を
 *   次の枠の頭と決めつけて、3〜6 バイト目を長さとして読む（枠のあとで FF 0F を確かめない）。
 *   日本語（UTF-8）で始まる行は、この位置が 0x80 以上なので長さが負になり、「足りるまで待つ」の
 *   判定をすり抜けて文字を解読しようとして、
 *     Unable to deserialize cloned data due to invalid or unsupported version
 *   で、そのテストファイルごと落ちる（以降の検査は数えられない）。英字で始まる行（[Store] …）は
 *   長さが巨大な正の数になるだけで、落ちない。
 *   落ちるのは、機械が忙しく、親が「枠」と「文字」を 1 回でまとめて受けたときだけ。
 *   liveShareStore.test.js と liveSync.test.js が、「ライブに参加しました: …」のような
 *   日本語で始まる行を console.log で出していて、0 時台は通り、2 時台から毎回落ちた。
 *   直列（--test-concurrency=1）や単独で通るのは、読み取りが枠と文字で分かれるため。
 *
 *   Node 側では直っている（nodejs/node の #64706、#65934。v26.7.0 に入った）が、いま使っている
 *   v24.15.0 には入っていない。Node を替えなくても避けられるよう、ここで手当てする。
 *
 * ■ 何をするか
 *   枠（FF 0F で始まるバイト列）以外の標準出力への書き込みを、標準エラーへ回す。標準エラーは
 *   別の管で、親は文字として読むだけなので、枠の読み取りに混ざらない。見える場所は変わらない
 *   （親の出力に、そのまま出る）。console.log でも process.stdout.write でも効く。
 *   node:test の子（NODE_TEST_CONTEXT=child-v8）のときだけ働く。ふつうに node で動かしたときは何もしない。
 */
'use strict';

// write は引数の形が何通りもあるので、型は any で扱う（型検査 tsc がこのファイルも見る）
/** @type {any} */
const 標準出力 = process.stdout;
/** @type {any} */
const 標準エラー = process.stderr;

if (process.env.NODE_TEST_CONTEXT === 'child-v8' && !標準出力.write.__枠以外は標準エラーへ) {
  const 元の書き込み = 標準出力.write;
  /** node:test の結果の枠か（FF 0F で始まるバイト列） */
  const 枠か = (/** @type {any} */ 塊) =>
    塊 instanceof Uint8Array && 塊.length >= 2 && 塊[0] === 0xff && 塊[1] === 0x0f;
  /** @type {any} */
  const 振り分ける = function (/** @type {any} */ 塊, /** @type {any[]} */ ...残り) {
    if (枠か(塊)) return 元の書き込み.call(標準出力, 塊, ...残り);
    return 標準エラー.write(塊, ...残り);
  };
  振り分ける.__枠以外は標準エラーへ = true;
  標準出力.write = 振り分ける;
}
