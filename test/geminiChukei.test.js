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
const ログイン済み = { uid: 'u1', getIdToken: () => 'ID.TOKEN.x' };

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
  global.fetch = (url, init) => {
    呼ばれた.push({
      url,
      method: init.method,
      auth: init.headers.get('Authorization'),
      type: init.headers.get('Content-Type'),
    });
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
    {
      url: 中継 + '/v1beta/models/gemini-3.6-flash:generateContent',
      method: 'POST',
      auth: 'Bearer ID.TOKEN.x',
      type: 'application/json',
    },
    { url: 中継 + '/v1beta/models', method: 'GET', auth: 'Bearer ID.TOKEN.x', type: null },
  ]);
});

test('中継が 401 を返したら、証を取り直して 1 回だけ送り直す。ほかの断りは送り直さない', async () => {
  const 取った = [];
  const 人 = {
    uid: 'u1',
    getIdToken: (取り直す) => {
      取った.push(!!取り直す);
      return 取り直す ? 'ID.NEW' : 'ID.OLD';
    },
  };
  const c = 読み込む({ 宛先: 中継, 人 });
  const 元 = global.fetch;
  const 送った = [];
  let 返す = [];
  global.fetch = (url, init) => {
    送った.push(init.headers.get('Authorization'));
    return { ok: false, status: 返す.shift() };
  };
  try {
    返す = [401, 200];
    assert.equal((await c.中継へfetch('/hozon', { method: 'POST', body: '{}' })).status, 200);
    assert.deepEqual(送った, ['Bearer ID.OLD', 'Bearer ID.NEW']);
    assert.deepEqual(取った, [false, true]);
    // 取り直しても 401 なら、そのまま返す（何度も送らない）
    送った.length = 0;
    返す = [401, 401];
    assert.equal((await c.中継へfetch('/hozon', { method: 'POST', body: '{}' })).status, 401);
    assert.deepEqual(送った, ['Bearer ID.OLD', 'Bearer ID.NEW']);
    // 502 や 429 は送り直さない
    送った.length = 0;
    返す = [502];
    assert.equal((await c.中継へfetch('/hozon', { method: 'POST', body: '{}' })).status, 502);
    返す = [429];
    assert.equal((await c.中継へfetch('/hozon', { method: 'POST', body: '{}' })).status, 429);
    assert.deepEqual(送った, ['Bearer ID.OLD', 'Bearer ID.OLD']);
  } finally {
    global.fetch = 元;
  }
});

test('取り直しても同じ証しか取れなければ、401 のまま返す', async () => {
  const c = 読み込む({ 宛先: 中継, 人: ログイン済み });
  const 元 = global.fetch;
  let 回 = 0;
  global.fetch = () => {
    回++;
    return { ok: false, status: 401 };
  };
  try {
    assert.equal((await c.中継へfetch('/hozon', { method: 'POST' })).status, 401);
  } finally {
    global.fetch = 元;
  }
  assert.equal(回, 1);
});

test('鍵を束に焼き込む名前（EXPO_PUBLIC_GEMINI_API_KEY）を、アプリの元が読んでいない', () => {
  const 見る = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) =>
        e.isDirectory()
          ? 見る(path.join(dir, e.name))
          : /\.jsx?$/.test(e.name)
            ? [path.join(dir, e.name)]
            : []
      );
  const 読んでいる = [...見る(SRC), path.resolve(__dirname, '../App.js')].filter((f) =>
    /GEMINI_API_KEY/.test(fs.readFileSync(f, 'utf8'))
  );
  assert.deepEqual(読んでいる, []);
});

test('Gemini を直接呼ぶ道（generativelanguage.googleapis.com）が、アプリの元に無い', () => {
  const 見る = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) =>
        e.isDirectory()
          ? 見る(path.join(dir, e.name))
          : /\.jsx?$/.test(e.name)
            ? [path.join(dir, e.name)]
            : []
      );
  const 直接 = 見る(SRC).filter((f) =>
    /generativelanguage\.googleapis\.com/.test(fs.readFileSync(f, 'utf8'))
  );
  assert.deepEqual(直接, []);
});

test('開いてすぐでログインの復元が終わっていなければ、終わるのを待ってから証を取る', async () => {
  // 復元が終わると currentUser が入る偽物の auth
  const auth = {
    currentUser: null,
    authStateReady: () =>
      new Promise((r) =>
        setTimeout(() => {
          auth.currentUser = ログイン済み;
          r();
        }, 20)
      ),
  };
  const 場所 = path.join(SRC, 'db.js');
  const m = new Module(場所, null);
  ((m.filename = 場所), (m.loaded = true), (m.exports = { auth }));
  require.cache[場所] = m;
  delete require.cache[path.join(SRC, 'geminiChukei.js')];
  const c = require('../src/geminiChukei');
  assert.equal(await c.ログインの証(), 'ID.TOKEN.x');
});

test('復元が終わってもログインしていなければ、待ったあとで断る', async () => {
  const auth = { currentUser: null, authStateReady: () => {} };
  const 場所 = path.join(SRC, 'db.js');
  const m = new Module(場所, null);
  ((m.filename = 場所), (m.loaded = true), (m.exports = { auth }));
  require.cache[場所] = m;
  delete require.cache[path.join(SRC, 'geminiChukei.js')];
  const c = require('../src/geminiChukei');
  assert.equal(await c.ログインの証(), null);
});

test('入っている団体（X-Kyudo-Group）と App Check の印（X-Firebase-AppCheck）を添える。無ければ付けない', async () => {
  const 店の道 = path.join(SRC, 'useScoreStore.js');
  const 店 = new Module(店の道, null);
  ((店.filename = 店の道), (店.loaded = true));
  店.exports = { useScoreStore: { getState: () => ({ activeGroupId: '100001' }) } };
  const 元の店 = require.cache[店の道];
  require.cache[店の道] = 店;
  const 印の道 = require.resolve('firebase/app-check');
  const 元の印 = require.cache[印の道];
  const 印 = new Module(印の道, null);
  ((印.filename = 印の道), (印.loaded = true));
  印.exports = { getToken: async () => ({ token: 'APPCHECK.TOKEN' }) };
  require.cache[印の道] = 印;
  try {
    const c = 読み込む({ 宛先: 中継, 人: ログイン済み });
    require.cache[path.join(SRC, 'db.js')].exports.appCheck = {};
    const 設定 = await c.SDKの設定();
    assert.deepEqual(設定.customHeaders, {
      Authorization: 'Bearer ID.TOKEN.x',
      'X-Kyudo-Group': '100001',
      'X-Firebase-AppCheck': 'APPCHECK.TOKEN',
    });
    const 元のfetch = global.fetch;
    let 頭;
    global.fetch = async (_url, init) => ((頭 = init.headers), { ok: true, status: 200 });
    try {
      await c.中継へfetch('/hozon', { method: 'POST' });
    } finally {
      global.fetch = 元のfetch;
    }
    assert.equal(頭.get('X-Kyudo-Group'), '100001');
    assert.equal(頭.get('X-Firebase-AppCheck'), 'APPCHECK.TOKEN');
    // 団体に入っていない・印が取れない
    店.exports = { useScoreStore: { getState: () => ({ activeGroupId: null }) } };
    印.exports = { getToken: async () => { throw new Error('取れない'); } };
    assert.deepEqual((await c.SDKの設定()).customHeaders, { Authorization: 'Bearer ID.TOKEN.x' });
  } finally {
    if (元の店) require.cache[店の道] = 元の店;
    else delete require.cache[店の道];
    if (元の印) require.cache[印の道] = 元の印;
    else delete require.cache[印の道];
  }
});
