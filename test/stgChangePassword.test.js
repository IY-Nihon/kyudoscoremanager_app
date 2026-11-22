/**
 * 検証環境のパスワードを替える台本（scripts/stg-change-password.mjs）の純粋な部分。
 *
 *   npm test
 *
 * 見たいのは、.env.development.local を壊さないこと（壊すと E2E と検証の台本が全部止まる）と、
 * 前のパスワードの口座だけを替えること。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

const 読む = () => import('../scripts/stg-change-password.mjs');

test('新しいパスワード：24 字で、英大・英小・数字・記号を必ず含む。毎回ちがう', async () => {
  const { 新しいパスワードを作る } = await 読む();
  const 見た = new Set();
  for (let i = 0; i < 50; i++) {
    const p = 新しいパスワードを作る();
    assert.strictEqual(p.length, 24, p.length);
    assert.match(p, /[A-Z]/);
    assert.match(p, /[a-z]/);
    assert.match(p, /[0-9]/);
    assert.match(p, /[-_]/);
    assert.match(p, /^[A-Za-z0-9_-]+$/, '.env と GitHub の Secrets にそのまま書ける字だけ');
    見た.add(p);
  }
  assert.strictEqual(見た.size, 50);
});

test('新しいパスワード：条件に合わない乱数は捨てて作り直す', async () => {
  const { 新しいパスワードを作る } = await 読む();
  let 回 = 0;
  const 乱 = (n) => {
    回++;
    // 1 回目は全部 0（AAAA… で数字も記号も無い）。2 回目は条件に合う並び
    if (回 === 1) return Buffer.alloc(n, 0);
    return Buffer.from('Ab3-Cd4_Ef5-Gh6_Ij7-Kl8_'.slice(0, 24), 'base64url').subarray(0, n);
  };
  const p = 新しいパスワードを作る(乱);
  assert.strictEqual(回, 2);
  assert.strictEqual(p.length, 24);
});

test('.env：値を読む（BOM・CRLF・前後の空白）・無ければ空', async () => {
  const { envの値 } = await 読む();
  const 中身 = '\uFEFFEXPO_PUBLIC_FIREBASE_PROJECT_ID=kyudoscoremanager-stg\r\nSTG_TEST_PASSWORD= abc \r\n';
  assert.strictEqual(envの値(中身, 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'), 'kyudoscoremanager-stg');
  assert.strictEqual(envの値(中身, 'STG_TEST_PASSWORD'), 'abc');
  assert.strictEqual(envの値(中身, 'STG_TEST_PASSWORD_OLD'), '', '似た名前の行を取り違えない');
  assert.strictEqual(
    envの値('STG_TEST_PASSWORD_OLD=x\n', 'STG_TEST_PASSWORD'),
    '',
    '_OLD の行を本物と取り違えない'
  );
});

test('.env：行を置く・消す（ほかの行・BOM・CRLF・末尾の改行はそのまま）', async () => {
  const { envの行を置く, envの行を消す, envの値 } = await 読む();
  const 元 = '\uFEFFEXPO_PUBLIC_A=1\r\nSTG_TEST_PASSWORD=old\r\nEXPO_PUBLIC_B=2\r\n';
  const 置いた = envの行を置く(envの行を置く(元, 'STG_TEST_PASSWORD_OLD', 'old'), 'STG_TEST_PASSWORD', 'new');
  assert.strictEqual(
    置いた,
    '\uFEFFEXPO_PUBLIC_A=1\r\nSTG_TEST_PASSWORD=new\r\nEXPO_PUBLIC_B=2\r\nSTG_TEST_PASSWORD_OLD=old\r\n'
  );
  assert.strictEqual(envの値(置いた, 'STG_TEST_PASSWORD'), 'new');
  assert.strictEqual(envの値(置いた, 'STG_TEST_PASSWORD_OLD'), 'old');
  const 消した = envの行を消す(置いた, 'STG_TEST_PASSWORD_OLD');
  assert.strictEqual(消した, '\uFEFFEXPO_PUBLIC_A=1\r\nSTG_TEST_PASSWORD=new\r\nEXPO_PUBLIC_B=2\r\n');
  // LF だけ・末尾の改行が無いファイル
  assert.strictEqual(envの行を置く('A=1', 'B', '2'), 'A=1\nB=2');
  assert.strictEqual(envの行を置く('A=1\n', 'B', '2'), 'A=1\nB=2\n');
});

test('GitHub の Secrets の中身：EXPO_PUBLIC_ の行と STG_TEST_PASSWORD の行だけ（前の値の控えや、ほかの鍵は入れない）', async () => {
  const { STG_ENVの中身 } = await 読む();
  const 中身 =
    '\uFEFFEXPO_PUBLIC_A=1\r\nGEMINI_API_KEY=x\r\nSTG_TEST_PASSWORD=new\r\nSTG_TEST_PASSWORD_OLD=old\r\nEXPO_PUBLIC_B=2\r\n';
  assert.strictEqual(STG_ENVの中身(中身), 'EXPO_PUBLIC_A=1\nSTG_TEST_PASSWORD=new\nEXPO_PUBLIC_B=2\n');
});

test('エミュレーターの控え：前のパスワードの口座だけを替える', async () => {
  const { エミュの口座を替える } = await 読む();
  const 控え = {
    kind: 'identitytoolkit#DownloadAccountResponse',
    users: [
      { localId: 'a', passwordHash: 'fakeHash:salt=s1:password=old' },
      { localId: 'b', passwordHash: 'fakeHash:salt=s2:password=other' },
      { localId: 'c', passwordHash: 'fakeHash:salt=s3:password=old-but-longer' },
      { localId: 'd' },
    ],
  };
  assert.strictEqual(エミュの口座を替える(控え, 'old', 'new'), 1);
  assert.deepStrictEqual(
    控え.users.map((u) => u.passwordHash),
    [
      'fakeHash:salt=s1:password=new',
      'fakeHash:salt=s2:password=other',
      'fakeHash:salt=s3:password=old-but-longer',
      undefined,
    ]
  );
  assert.strictEqual(エミュの口座を替える(null, 'old', 'new'), 0);
});
