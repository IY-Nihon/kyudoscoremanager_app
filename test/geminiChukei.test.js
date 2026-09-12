/**
 * Gemini の中継への出入口（src/geminiChukei.js）。
 *
 * 守りたいこと：
 *   ・鍵はアプリの側に無い（束に焼き込む EXPO_PUBLIC_GEMINI_API_KEY を誰も読まない）
 *   ・SDK へ渡す設定は、中継の宛先と、ログインの証だけ
 *   ・ログインしていなければ中継を呼ばない（証の無い呼び出しは中継が 401 で返すが、
 *     そもそも出さない）
 *   ・fetch は Authorization を足したうえで、道をそのまま中継へ向ける
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');

const SRC = path.resolve(__dirname, '../src');

function 読み込む({ 宛先, 人 }) {
  const 場所 = path.join(SRC, 'db.js');
  const m = new Module(場所, null);
  ((m.filename = 場所), (m.loaded = true), (m.exports = { auth: { currentUser: 人 } }));
  require.cache[場所] = m;
  delete require.cache[path.join(SRC, 'geminiChukei.js')];
  const 元 = process.env.EXPO_PUBLIC_GEMINI_CHUKEI_URL;
  if (宛先 === undefined) delete process.env.EXPO_PUBLIC_GEMINI_CHUKEI_URL;
  else process.env.EXPO_PUBLIC_GEMINI_CHUKEI_URL = 宛先;
  try {
    // 宛先は読み込んだときに決まる。証は呼ぶたびに ./db を見るので、偽物は残しておく
    return require('../src/geminiChukei');
  } finally {
    if (元 === undefined) delete process.env.EXPO_PUBLIC_GEMINI_CHUKEI_URL;
    else process.env.EXPO_PUBLIC_GEMINI_CHUKEI_URL = 元;
  }
}

const 中継 = 'https://chukei.example.workers.dev';
const ログイン済み = { uid: 'u1', getIdToken: async () => 'ID.TOKEN.x' };

test('SDK の設定は、中継の宛先とログインの証だけ（末尾の / は落とす）', async () => {
  const c = 読み込む({ 宛先: 中継 + '/', 人: ログイン済み });
  assert.equal(c.中継がある(), true);
  const 設定 = await c.SDKの設定();
  assert.deepEqual(設定, { baseUrl: 中継, customHeaders: { Authorization: 'Bearer ID.TOKEN.x' } });
});

test('ログインしていなければ、中継を呼ばずに断る', async () => {
  const c = 読み込む({ 宛先: 中継, 人: null });
  await assert.rejects(c.SDKの設定(), /ログインしていない/);
  await assert.rejects(c.中継へfetch('/v1beta/models'), /ログインしていない/);
  assert.equal(await c.ログインの証(), null);
});

test('宛先が無ければ AI 機能は使えない（鍵を探しに行かない）', async () => {
  const c = 読み込む({ 宛先: undefined, 人: ログイン済み });
  assert.equal(c.中継がある(), false);
  await assert.rejects(c.SDKの設定(), /中継の宛先/);
});

test('fetch は Authorization を足して、道をそのまま中継へ向ける', async () => {
  const c = 読み込む({ 宛先: 中継, 人: ログイン済み });
  const 元 = global.fetch;
  const 呼ばれた = [];
  global.fetch = async (url, init) => {
    呼ばれた.push({ url, method: init.method, auth: init.headers.get('Authorization'), type: init.headers.get('Content-Type') });
    return { ok: true, status: 200 };
  };
  try {
    await c.中継へfetch('/v1beta/models/gemini-3.6-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    await c.中継へfetch('v1beta/models', { method: 'GET' });
  } finally {
    global.fetch = 元;
  }
  assert.deepEqual(呼ばれた, [
    { url: 中継 + '/v1beta/models/gemini-3.6-flash:generateContent', method: 'POST', auth: 'Bearer ID.TOKEN.x', type: 'application/json' },
    { url: 中継 + '/v1beta/models', method: 'GET', auth: 'Bearer ID.TOKEN.x', type: null },
  ]);
});

test('鍵を束に焼き込む名前（EXPO_PUBLIC_GEMINI_API_KEY）を、アプリの元が読んでいない', () => {
  const 見る = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? 見る(path.join(dir, e.name)) : /\.jsx?$/.test(e.name) ? [path.join(dir, e.name)] : []
    );
  const 読んでいる = [...見る(SRC), path.resolve(__dirname, '../App.js')].filter((f) =>
    /GEMINI_API_KEY/.test(fs.readFileSync(f, 'utf8'))
  );
  assert.deepEqual(読んでいる, []);
});

test('Gemini を直接呼ぶ道（generativelanguage.googleapis.com）が、アプリの元に無い', () => {
  const 見る = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? 見る(path.join(dir, e.name)) : /\.jsx?$/.test(e.name) ? [path.join(dir, e.name)] : []
    );
  const 直接 = 見る(SRC).filter((f) => /generativelanguage\.googleapis\.com/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(直接, []);
});
