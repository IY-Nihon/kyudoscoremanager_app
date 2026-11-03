// 登録メールアドレスの確認（src/mailKakunin.js・firestore.rules）
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const 確 = require('../src/mailKakunin');

test('猶予の終わりは、決まり（inGracePeriod）とアプリで同じ日', () => {
  const 決まり = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const 合う = 決まり.match(/function inGracePeriod\(\) \{\s*return request\.time < timestamp\.date\((\d{4}), (\d{1,2}), (\d{1,2})\)/);
  assert.ok(合う, 'firestore.rules に inGracePeriod の日付が無い');
  const 決まりの日 = `${合う[1]}-${合う[2].padStart(2, '0')}-${合う[3].padStart(2, '0')}`;
  assert.equal(決まりの日, 確.猶予の終わり, '決まりとアプリで猶予の終わりが違う（片方だけ止まる）');
});

test('猶予中か：終わりの時刻より前だけ', () => {
  const 終わり = Date.parse(確.猶予の終わり + 'T00:00:00Z');
  assert.equal(確.猶予中か(終わり - 1), true);
  assert.equal(確.猶予中か(終わり), false);
  assert.match(確.猶予の最後の日(), /^\d{1,2}月\d{1,2}日$/);
});

test('確認が済んだか：済んでいなければ読み直してから見て、済んだら証を取り直す', async () => {
  let 読み直した = 0;
  let 取り直した = 0;
  const 人 = {
    emailVerified: false,
    reload: async () => {
      読み直した++;
      人.emailVerified = true;
    },
    getIdToken: async (強く) => {
      if (強く) 取り直した++;
    },
  };
  assert.equal(await 確.確認が済んだか({ currentUser: 人 }), true);
  assert.equal(読み直した, 1);
  assert.equal(取り直した, 1, '決まりが見る証を取り直していない');
  const まだの人 = { emailVerified: false, reload: async () => {}, getIdToken: async () => {} };
  assert.equal(await 確.確認が済んだか({ currentUser: まだの人 }), false);
  assert.equal(await 確.確認が済んだか({ currentUser: null }), false);
});

test('確認メールを送れないときは、見せてよい日本語にする', async () => {
  const 送る = (符号) =>
    確.確認メールを送る({ sendEmailVerification: async () => Promise.reject(Object.assign(new Error('x'), { code: 符号 })) }, { currentUser: {} });
  await assert.rejects(送る('auth/too-many-requests'), /続けて送りすぎました/);
  await assert.rejects(送る('auth/network-request-failed'), /電波の良い場所/);
  await assert.rejects(確.確認メールを送る({}, { currentUser: null }), /ログインし直して/);
});

test('団体の確認：帳面の verified を見る。読めないときは null（止めない）', async () => {
  const 道具 = (中身, 投げる) => ({
    db: {},
    Firestore: {
      doc: () => ({}),
      getDoc: async () => {
        if (投げる) throw new Error('offline');
        return { exists: () => !!中身, data: () => 中身 };
      },
    },
  });
  assert.equal(await 確.団体の確認は済んだか(道具({ verified: true }), 'g'), true);
  assert.equal(await 確.団体の確認は済んだか(道具({ email: 'a' }), 'g'), false);
  assert.equal(await 確.団体の確認は済んだか(道具(null), 'g'), false);
  assert.equal(await 確.団体の確認は済んだか(道具(null, true), 'g'), null);
});

test('決まり：持ち主は確認済みか猶予中、部員は団体が確認済みか猶予中、作るのは確認済みだけ', () => {
  const 決まり = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(決まり, /function isGroupOwner\(groupId\) \{\n\s+return \(verifiedEmail\(\) \|\| \(callerEmail\(\) != '' && inGracePeriod\(\)\)\)/);
  assert.match(決まり, /&& \(groupVerified\(groupId\) \|\| inGracePeriod\(\)\);/);
  const 作る = 決まり.slice(決まり.indexOf('allow create: if verifiedEmail()'));
  assert.ok(決まり.includes('allow create: if verifiedEmail()'), '団体の帳面を確認済みでなくても作れる');
  assert.ok(作る.length > 0);
});

test('戻り先の頁が登録されていないときは、戻り先なしで送り直す', async () => {
  const 送った = [];
  const FirebaseAuth = {
    sendEmailVerification: async (人, 設定) => {
      if (設定) throw Object.assign(new Error('x'), { code: 'auth/unauthorized-continue-uri' });
      送った.push('戻り先なし');
    },
  };
  globalThis.window = { location: { origin: 'http://127.0.0.1:8091' } };
  try {
    await 確.確認メールを送る(FirebaseAuth, { currentUser: {} });
  } finally {
    delete globalThis.window;
  }
  assert.deepStrictEqual(送った, ['戻り先なし']);
});

test('団体はまだ在るか：雲が「無い」と返したときだけ false。読めないときは null', async () => {
  const 道具 = (返事) => ({
    db: {},
    Firestore: {
      doc: () => ({}),
      getDocFromServer: async () => {
        if (返事 === '誤り') throw new Error('offline');
        return { exists: () => 返事 };
      },
    },
  });
  assert.equal(await 確.団体はまだ在るか(道具(true), '100001'), true);
  assert.equal(await 確.団体はまだ在るか(道具(false), '100001'), false);
  assert.equal(await 確.団体はまだ在るか(道具('誤り'), '100001'), null);
  assert.equal(await 確.団体はまだ在るか(道具(false), ''), null);
});
