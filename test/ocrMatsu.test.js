/**
 * 写真の読み取りを待つ間の決まり（src/ocrMatsu.js）。2026-11-20 本人「閉じても読み続ける」
 */
const test = require('node:test');
const assert = require('node:assert');
const 待ち = require('../src/ocrMatsu');

test('失敗の文：長く待ったあとの通信の切れは、電波ではなく AI の遅さの文にする', () => {
  // iPhone の Safari は答えの頭が来ないまま 70〜100 秒たつと切る（本番の 10/26 は 89.5 秒で Load failed）
  const 切れた =
    '[GoogleGenerativeAI Error]: Error fetching from https://example.workers.dev/v1beta/models/gemini-3.6-flash:generateContent: Load failed';
  assert.match(待ち.読み取りの誤りの文(切れた, 89_500), /AIの答えが遅く/);
  assert.match(待ち.読み取りの誤りの文('TypeError: Failed to fetch', 61_000), /AIの答えが遅く/);
  // すぐ切れたのは電波（前のとおり）
  assert.match(待ち.読み取りの誤りの文(切れた, 5_000), /電波の良い場所で/);
  assert.match(待ち.読み取りの誤りの文('Load failed', 59_999), /電波の良い場所で/);
});

test('失敗の文：混雑・上限・ログイン・ほかは前のとおり', () => {
  assert.match(
    待ち.読み取りの誤りの文('[503 Service Unavailable] 中継の締め切りまで待ちましたが', 120_000),
    /混み合っています/
  );
  assert.match(待ち.読み取りの誤りの文('[429 Too Many Requests]', 1_000), /利用制限/);
  assert.match(待ち.読み取りの誤りの文('[401 Unauthorized]', 1_000), /ログインし直して/);
  assert.match(
    待ち.読み取りの誤りの文('ログインしていないため、AI機能を使えません。', 1_000),
    /ログインし直して/
  );
  assert.match(待ち.読み取りの誤りの文('Unexpected token', 70_000), /画像の解析に失敗しました/);
  assert.match(待ち.読み取りの誤りの文(undefined, 0), /画像の解析に失敗しました/);
});

test('帯の文：立ち順・記録表、届いた・できなかった', () => {
  assert.strictEqual(待ち.届いた帯の文({ 成功: true, モード: 'lineup' }), '立ち順の読み取りが届きました');
  assert.strictEqual(待ち.届いた帯の文({ 成功: true, モード: 'record' }), '記録表の読み取りが届きました');
  assert.strictEqual(
    待ち.届いた帯の文({ 成功: false, モード: 'lineup' }),
    '立ち順の読み取りができませんでした'
  );
  assert.strictEqual(
    待ち.届いた帯の文({ 成功: false, モード: 'record' }),
    '記録表の読み取りができませんでした'
  );
});

test('待つ間の説明は 10 秒から・帯は 15 分で消す', () => {
  assert.strictEqual(待ち.説明を出す秒, 10);
  assert.match(待ち.待つ間の説明, /混んでいる日は 1〜3 分かかります。/);
  assert.match(待ち.待つ間の説明, /閉じても読み続け、届いたら\n記録画面でお知らせします。/);
  assert.strictEqual(待ち.帯を出しておく長さ, 15 * 60 * 1000);
});
