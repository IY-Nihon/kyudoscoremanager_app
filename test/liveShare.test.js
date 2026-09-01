/**
 * ライブのURL共有（src/liveShare.js）。
 *
 *   npm test
 *
 * 守りの要は2つ。
 *   ・閲覧リンクから編集用の枝を出せないこと
 *   ・合言葉が違えば、別の枝になって読むものが無いこと
 * ここが崩れると「閲覧用」と「パスワード」が飾りになる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  リンクの版,
  合言葉の最短,
  編集,
  閲覧,
  共有の種を作る,
  枝を導く,
  合言葉の難点,
  共有の荷を組む,
  共有の荷を解く,
  期限の選択肢,
  期限の既定,
  期限の時刻,
  期限切れか,
  期限の文言,
  リンクを作る,
  URLから荷を取る,
} = require('../src/liveShare');
const { 枝として使えるか } = require('../src/liveSecret');

test('種：毎回ちがう', () => {
  const 集 = new Set();
  for (let i = 0; i < 200; i++) 集.add(共有の種を作る());
  assert.strictEqual(集.size, 200, '同じ種が出ている');
});

test('種：crypto が無い環境でも作れる', () => {
  assert.ok(共有の種を作る({}).length >= 20);
});

test('枝：決まりが通す形になる', () => {
  const 枝 = 枝を導く(共有の種を作る(), 'ひみつの合言葉');
  assert.ok(枝として使えるか(枝), '枝として使えない: ' + 枝);
  assert.strictEqual(枝.length, 64);
});

test('枝：同じ種と合言葉なら、いつでも同じ枝になる', () => {
  // ここが揺らぐと、web と iOS で別の枝を見て「入ったのに何も出ない」になる
  const 種 = 共有の種を作る();
  assert.strictEqual(枝を導く(種, 'あいことば'), 枝を導く(種, 'あいことば'));
  assert.strictEqual(枝を導く('たね', ''), 枝を導く('たね', ''));
});

test('枝：合言葉が1文字違えば、別の枝になる', () => {
  // 合言葉は「確かめる」のではなく「道を作る」のに使う。ここが要
  const 種 = 共有の種を作る();
  assert.notStrictEqual(枝を導く(種, 'あいことば'), 枝を導く(種, 'あいことは'));
  assert.notStrictEqual(枝を導く(種, 'abcdef'), 枝を導く(種, 'abcdeg'));
  assert.notStrictEqual(枝を導く(種, 'abcdef'), 枝を導く(種, 'abcdef '));
});

test('枝：種が違えば、合言葉が同じでも別の枝になる', () => {
  // 編集用と閲覧用はここで分かれる
  assert.notStrictEqual(枝を導く('たねA', '同じ'), 枝を導く('たねB', '同じ'));
});

test('枝：合言葉が無い共有もできる', () => {
  // 合言葉なしのときは、種だけで枝が決まる。URLを知る人がそのまま入れる約束
  const 種 = 共有の種を作る();
  const 枝 = 枝を導く(種, '');
  assert.ok(枝として使えるか(枝));
  assert.strictEqual(枝, 枝を導く(種, ''), '同じ種で違う枝が出ている');
  assert.strictEqual(枝, 枝を導く(種, null), '空と null で枝が変わっている');
  assert.notStrictEqual(枝, 枝を導く(種, 'a'), '合言葉の有無で枝が変わっていない');
});

test('閲覧リンクから、編集用の枝は出せない', () => {
  // これが崩れると「閲覧用」が飾りになる。
  // 閲覧の人が持っているのは閲覧の種だけで、編集の種は載っていない
  const 編集の種 = 共有の種を作る();
  const 閲覧の種 = 共有の種を作る();
  const 合言葉 = 'ひみつ123';

  const 閲覧の荷 = 共有の荷を組む({ 種: 閲覧の種, 名前: '朝練', 役: 閲覧, 鍵が要るか: !0 });
  const 解いた = 共有の荷を解く(閲覧の荷);
  assert.strictEqual(解いた.役, 閲覧);
  assert.strictEqual(解いた.種, 閲覧の種);

  // 荷のどこにも編集の種は入っていない
  assert.ok(!閲覧の荷.includes(編集の種), '荷に編集の種が入っている');
  assert.notStrictEqual(枝を導く(解いた.種, 合言葉), 枝を導く(編集の種, 合言葉));
});

test('荷：組んで解くと元に戻る', () => {
  const 元 = { 種: 共有の種を作る(), 名前: '朝練', 役: 編集, 鍵が要るか: !0 };
  assert.deepStrictEqual(共有の荷を解く(共有の荷を組む(元)), Object.assign({ 期限: null }, 元));
});

// ── 期限 ──────────────────────────────────────────────
//
// 期限を本当に止めているのは決まり（database.rules.json）で、ここで見るのは
// 「表示の側が嘘をつかないか」。荷の期限は誰でも書き換えられるので、
// これを通行の可否に使ってはいけない（src/liveShare.js の説明を参照）。

test('期限：荷に載せて往復する', () => {
  const 期限 = 1700000000000;
  const 荷 = 共有の荷を組む({ 種: 'たね', 名前: '朝練', 役: 編集, 鍵が要るか: !1, 期限 });
  assert.strictEqual(共有の荷を解く(荷).期限, 期限);
});

test('期限：付けなければ null。0 と取り違えない', () => {
  // 0 を載せると、古い読み手が「1970年に切れた」と読みうる。鍵ごと置かない
  // わざと型の合わない値を渡す検査。型検査に断りを入れる
  for (const x of /** @type {any[]} */ ([undefined, null, 0, -1, NaN, Infinity, '明日']))
    assert.strictEqual(
      共有の荷を解く(共有の荷を組む({ 種: 'た', 名前: '朝', 役: 編集, 鍵が要るか: !1, 期限: x }))
        .期限,
      null,
      String(x)
    );
});

test('期限：期限なしのリンクは切れない', () => {
  for (const x of [null, undefined, 0, -1, NaN]) assert.strictEqual(期限切れか(x, 9e15), !1, String(x));
});

test('期限：その時刻ちょうどで切れる', () => {
  assert.strictEqual(期限切れか(1000, 999), !1);
  assert.strictEqual(期限切れか(1000, 1000), !0, 'ちょうどは切れている側にする');
  assert.strictEqual(期限切れか(1000, 1001), !0);
});

test('期限：持ちから時刻を出す', () => {
  assert.strictEqual(期限の時刻(3600000, 1000), 1000 + 3600000);
  // 0 は「期限なし」。0+今 を返すと、いまこの瞬間に切れたリンクになる
  // わざと型の合わない値を渡す検査。型検査に断りを入れる
  for (const x of /** @type {any[]} */ ([0, -1, NaN, Infinity, null, undefined, '3時間']))
    assert.strictEqual(期限の時刻(x, 1000), null, String(x));
});

test('期限：文言は残りに応じて変わる', () => {
  const 今 = 1000000000000;
  assert.strictEqual(期限の文言(null, 今), null);
  assert.strictEqual(期限の文言(今 - 1, 今), '期限切れ');
  assert.strictEqual(期限の文言(今, 今), '期限切れ');
  assert.strictEqual(期限の文言(今 + 60000, 今), 'あと1分で期限切れ');
  // 1分に満たなくても「あと0分」とは出さない。切れたと読み違える
  assert.strictEqual(期限の文言(今 + 1000, 今), 'あと1分で期限切れ');
  assert.strictEqual(期限の文言(今 + 3600000, 今), 'あと1時間で期限切れ');
  assert.strictEqual(期限の文言(今 + 25 * 3600000, 今), 'あと1日で期限切れ');
});

test('期限：選択肢には既定がちょうど1つある', () => {
  const 既定 = 期限の選択肢.filter((x) => x.既定);
  assert.strictEqual(既定.length, 1, '既定は1つに定めること');
  assert.strictEqual(期限の既定, 既定[0].値);
  // 既定が「期限なし」だと、ほとんどのリンクが永久に生き続ける
  assert.ok(期限の既定 > 0, '既定を期限なしにしないこと');
});

test('期限：期限なしの選び方も残してある', () => {
  assert.ok(
    期限の選択肢.some((x) => x.値 === 0),
    '長く使いたい人の逃げ道は要る'
  );
});

test('荷：日本語のライブ名も通る', () => {
  for (const 名前 of ['朝練', '二年生の立ち', '10/5 記録会', '🏹の日']) {
    const 荷 = 共有の荷を組む({ 種: 'たね', 名前, 役: 閲覧, 鍵が要るか: !1 });
    assert.strictEqual(共有の荷を解く(荷).名前, 名前, 名前);
  }
});

test('荷：合言葉そのものは載せない', () => {
  // 載せたら、リンク1本で入れてしまう
  const 荷 = 共有の荷を組む({ 種: 'たね', 名前: '朝練', 役: 編集, 鍵が要るか: !0 });
  assert.ok(!荷.includes('ひみつ'), '荷に合言葉が入っている');
  const 解いた = 共有の荷を解く(荷);
  // 名前を問わず、秘密らしきものが1つも載っていないことを見る
  assert.ok(!Object.keys(解いた).includes('合言葉'), '合言葉が荷に入っている');
  assert.strictEqual(解いた.鍵が要るか, true, '合言葉が要ることだけは伝える');
});

test('荷：壊れたものを渡しても落ちない', () => {
  for (const x of [null, undefined, '', 'あ', '!!!!', 'YWJj', 'x'.repeat(200)])
    assert.doesNotThrow(() => 共有の荷を解く(x));
  assert.strictEqual(共有の荷を解く('!!!!'), null);
});

// 荷の詰め方は本体と同じ（base64url）。版だけ違うものを作るために持つ
const 字 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const 詰める = (バイト) => {
  let 出 = '';
  for (let i = 0; i < バイト.length; i += 3) {
    const a = バイト[i];
    const b = i + 1 < バイト.length ? バイト[i + 1] : -1;
    const c = i + 2 < バイト.length ? バイト[i + 2] : -1;
    出 += 字[a >> 2];
    出 += 字[((a & 3) << 4) | (b < 0 ? 0 : b >> 4)];
    if (b < 0) break;
    出 += 字[((b & 15) << 2) | (c < 0 ? 0 : c >> 6)];
    if (c < 0) break;
    出 += 字[c & 63];
  }
  return 出;
};

test('荷：知らない版は断る', () => {
  // 形が変わったときに、古いアプリが黙って別物として読まないようにする
  const { バイト列にする } = require('../src/sha256');
  const 作る = (版) =>
    詰める(バイト列にする(JSON.stringify({ v: 版, s: 'たね', n: '朝練', r: 編集, k: 0 })));
  assert.ok(共有の荷を解く(作る(リンクの版)), '前提：今の版は読める');
  assert.strictEqual(共有の荷を解く(作る(リンクの版 + 1)), null, '先の版を読んでしまっている');
  assert.strictEqual(共有の荷を解く(作る(リンクの版 - 1)), null, '古い版を読んでしまっている');
});

test('リンク：作って読み戻せる', () => {
  const 荷 = 共有の荷を組む({ 種: 'たね', 名前: '朝練', 役: 閲覧, 鍵が要るか: !1 });
  const URL = リンクを作る('https://kyudoscoremanager.web.app', 荷);
  assert.ok(URL.includes('#共有='), URL);
  assert.strictEqual(URLから荷を取る(URL), 荷);
  assert.strictEqual(共有の荷を解く(URLから荷を取る(URL)).名前, '朝練');
});

test('リンク：荷は「#」の後ろに置く（配り元の記録に残さない）', () => {
  const 荷 = 共有の荷を組む({ 種: 'たね', 名前: '朝練', 役: 編集, 鍵が要るか: !0 });
  const URL = リンクを作る('https://kyudoscoremanager.web.app/', 荷);
  const 前半 = URL.slice(0, URL.indexOf('#'));
  assert.ok(!前半.includes(荷), '「#」より前に荷が出ている');
  assert.ok(!URL.includes('//record'), '配り元の末尾の / を畳んでいない: ' + URL);
});

test('リンク：共有でないURLからは何も取らない', () => {
  for (const x of [
    'https://kyudoscoremanager.web.app/record',
    'https://kyudoscoremanager.web.app/record#ほか=1',
    '',
    null,
  ])
    assert.strictEqual(URLから荷を取る(x), null, String(x));
});

test('合言葉：短いものは断る', () => {
  assert.ok(合言葉の難点(''));
  assert.ok(合言葉の難点('a'.repeat(合言葉の最短 - 1)));
  assert.strictEqual(合言葉の難点('a'.repeat(合言葉の最短)), null);
});

test('期限：どの選び方も、練習より短くならない', () => {
  // 期限が切れると、配った本人も含めて全員がライブから離れる。
  // 練習より短い期限を選べると、練習の途中で終わる
  const { 練習の長さ } = require('../src/liveShare');
  for (const 選 of 期限の選択肢)
    assert.ok(
      選.値 === 0 || 選.値 >= 練習の長さ,
      `${選.名} は練習より短い（${選.値} < ${練習の長さ}）`
    );
});

// ── 帯に出す短い文言 ──────────────────────────────
// 帯は1行に、ライブ名・接続台数・配るボタンが同居している。
// 「あと30分で期限切れ」まで入れると細い画面でライブ名が潰れるので、
// 数だけにして、意味は色で持たせている。

const { 期限の短い文言, 帯に出す残り } = require('../src/liveShare');

test('帯の文言：近いときだけ出す', () => {
  const 今 = 1_700_000_000_000;
  const 後で = (分) => 今 + 分 * 60000;
  assert.strictEqual(期限の短い文言(後で(30), 今), 'あと30分');
  assert.strictEqual(期限の短い文言(後で(1), 今), 'あと1分');
  assert.strictEqual(期限の短い文言(後で(60), 今), 'あと60分', 'ちょうど1時間は出す');
  assert.strictEqual(期限の短い文言(後で(61), 今), null, '遠いときは出さない');
  assert.strictEqual(期限の短い文言(後で(180), 今), null);
});

test('帯の文言：期限が無い・すでに切れているときは出さない', () => {
  const 今 = 1_700_000_000_000;
  assert.strictEqual(期限の短い文言(null, 今), null, '期限なし');
  assert.strictEqual(期限の短い文言(undefined, 今), null);
  assert.strictEqual(期限の短い文言(0, 今), null);
  assert.strictEqual(期限の短い文言(今, 今), null, 'ちょうど切れた瞬間');
  assert.strictEqual(期限の短い文言(今 - 60000, 今), null, '切れたあと');
});

test('帯の文言：切り上げる（あと0分と出さない）', () => {
  const 今 = 1_700_000_000_000;
  assert.strictEqual(期限の短い文言(今 + 1000, 今), 'あと1分', '30秒でも「あと1分」');
  assert.strictEqual(期限の短い文言(今 + 90000, 今), 'あと2分');
});

test('帯の文言：字数は帯に収まる短さ', () => {
  const 今 = 1_700_000_000_000;
  // 最長は「あと60分」の5文字。これを超えると細い画面でライブ名を押し出す
  for (let 分 = 1; 分 <= 60; 分++) {
    const 文 = 期限の短い文言(今 + 分 * 60000, 今);
    assert.ok(文.length <= 5, `${分}分のとき「${文}」が長すぎる`);
  }
});

test('帯に出す残りは1時間', () => {
  assert.strictEqual(帯に出す残り, 60 * 60 * 1000);
});

// ── いつ数え直すか ────────────────────────────────
// 数え直すたびに記録画面ぜんぶが描き直る。ライブ中は○×のたびに保存も
// 走るので、ずっと30秒ごとに起こすと足を引っ張る。
// 帯に出るころまでは眠っていてよい。

const { 次に数え直すまで } = require('../src/liveShare');

test('数え直し：帯に出るころまでは眠る', () => {
  const 今 = 1_700_000_000_000;
  const 後で = (分) => 今 + 分 * 60000;
  // 24時間もたせたリンクなら、23時間ぶんは起きなくてよい
  const 一日 = 次に数え直すまで(後で(1440), 今);
  assert.ok(一日 > 22 * 3600_000, `24時間先なのに ${Math.round(一日 / 60000)}分後に起きる`);
  assert.ok(一日 < 24 * 3600_000);
  // 起きたときには、もう帯に出る見当になっていること
  assert.ok(
    期限の短い文言(後で(1440), 今 + 一日) !== null,
    '起きたのに、まだ帯に出ない見当になっている'
  );
});

test('数え直し：帯に出ているあいだは30秒ごと', () => {
  const 今 = 1_700_000_000_000;
  const 後で = (分) => 今 + 分 * 60000;
  for (const 分 of [60, 30, 5, 1]) {
    assert.strictEqual(次に数え直すまで(後で(分), 今), 30000, `残り${分}分`);
  }
});

test('数え直し：期限が無い・切れたときは起きない', () => {
  const 今 = 1_700_000_000_000;
  assert.strictEqual(次に数え直すまで(null, 今), null);
  assert.strictEqual(次に数え直すまで(undefined, 今), null);
  assert.strictEqual(次に数え直すまで(0, 今), null);
  assert.strictEqual(次に数え直すまで(今, 今), null, 'ちょうど切れた瞬間');
  assert.strictEqual(次に数え直すまで(今 - 60000, 今), null, '切れたあと');
});

test('数え直し：24時間で起きる回数が、刻みっぱなしよりずっと少ない', () => {
  // 30秒ごとに起こし続けると 24時間で2880回。
  // 帯に出る1時間ぶんだけ刻めば、その20分の1以下で済む
  let 今 = 1_700_000_000_000;
  const 期限 = 今 + 24 * 3600_000;
  let 回数 = 0;
  for (;;) {
    const 次 = 次に数え直すまで(期限, 今);
    if (次 === null) break;
    今 += 次;
    回数++;
    if (回数 > 5000) break; // 止まらなくなったら気づけるように
  }
  assert.ok(回数 < 150, `24時間で${回数}回も起きている`);
  assert.ok(回数 > 100, `${回数}回では、最後の1時間を刻めていない`);
});
