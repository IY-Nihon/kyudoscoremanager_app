/**
 * App Check の用意（src/setupAppCheck.js）の検査。
 *
 *   npm test
 *
 * プライバシーポリシーが安全管理措置として挙げている App Check は、2026-09-24 まで
 * ログを出すだけの空の関数だった。ここで「鍵があれば本当に始める」ことを押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { setupAppCheck, 手元か } = require('../src/setupAppCheck');

/** 偽の窓と App Check */
function 用意(hostname) {
  const 付けた = [];
  const 文書 = {
    head: { appendChild: (x) => 付けた.push(x) },
    getElementById: (id) => 付けた.find((x) => x.id === id) || null,
    createElement: () => ({}),
  };
  const 窓 = { location: { hostname }, document: 文書 };
  const 呼ばれた = [];
  const AppCheck = {
    ReCaptchaV3Provider: function (鍵) {
      this.鍵 = 鍵;
    },
    initializeAppCheck: (app, 選び) => {
      呼ばれた.push(選び);
      return { 器: true };
    },
  };
  return { 窓, 付けた, 呼ばれた, AppCheck };
}

test('サイトキーが無ければ始めない（検証環境の束など）', () => {
  const { 窓, 呼ばれた, AppCheck } = 用意('kyudoscoremanager.web.app');
  assert.strictEqual(setupAppCheck({}, { 環境: {}, 窓, AppCheck }), null);
  assert.strictEqual(呼ばれた.length, 0);
});

test('サイトキーがあれば reCAPTCHA v3 で始め、右下の札を隠す', () => {
  const { 窓, 付けた, 呼ばれた, AppCheck } = 用意('kyudoscoremanager.web.app');
  const 器 = setupAppCheck({}, { 環境: { EXPO_PUBLIC_RECAPTCHA_SITE_KEY: 'site-key' }, 窓, AppCheck });
  assert.deepStrictEqual(器, { 器: true });
  assert.strictEqual(呼ばれた[0].provider.鍵, 'site-key');
  assert.strictEqual(呼ばれた[0].isTokenAutoRefreshEnabled, true);
  assert.match(付けた[0].textContent, /grecaptcha-badge/);
  assert.strictEqual(窓.FIREBASE_APPCHECK_DEBUG_TOKEN, undefined, '本番のドメインでは debug の印を使わない');
});

test('手元（localhost・127.0.0.1）では debug の印を使う', () => {
  const 自動 = 用意('127.0.0.1');
  setupAppCheck({}, { 環境: { EXPO_PUBLIC_RECAPTCHA_SITE_KEY: 'k' }, 窓: 自動.窓, AppCheck: 自動.AppCheck });
  assert.strictEqual(自動.窓.FIREBASE_APPCHECK_DEBUG_TOKEN, true);
  const 決めた = 用意('localhost');
  setupAppCheck(
    {},
    {
      環境: { EXPO_PUBLIC_RECAPTCHA_SITE_KEY: 'k', EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN: 'dbg' },
      窓: 決めた.窓,
      AppCheck: 決めた.AppCheck,
    }
  );
  assert.strictEqual(決めた.窓.FIREBASE_APPCHECK_DEBUG_TOKEN, 'dbg');
  assert.ok(手元か({ hostname: 'localhost' }) && !手元か({ hostname: 'kyudoscoremanager.web.app' }));
});

test('始められなくてもアプリは止めない', () => {
  const { 窓 } = 用意('kyudoscoremanager.web.app');
  const 壊れた = {
    ReCaptchaV3Provider: function () {},
    initializeAppCheck: () => {
      throw new Error('だめ');
    },
  };
  assert.strictEqual(
    setupAppCheck({}, { 環境: { EXPO_PUBLIC_RECAPTCHA_SITE_KEY: 'k' }, 窓, AppCheck: 壊れた }),
    null
  );
});

test('サイトキーは process.env.EXPO_PUBLIC_… とそのまま書いて読む（変数経由だと web の束に入らない）', () => {
  const 本体 = fs.readFileSync(path.join(__dirname, '..', 'src', 'setupAppCheck.js'), 'utf8');
  assert.match(本体, /process\.env\.EXPO_PUBLIC_RECAPTCHA_SITE_KEY/);
  assert.doesNotMatch(本体, /=\s*process\.env\s*[;,)]/, 'process.env を丸ごと変数に入れている');
});

test('db.js が Firebase を用意した直後に App Check を始める', () => {
  const db = fs.readFileSync(path.join(__dirname, '..', 'src', 'db.js'), 'utf8');
  assert.match(db, /setupAppCheck\(firebaseApp\)/);
});
