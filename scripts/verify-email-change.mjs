/**
 * メールアドレスの切り替えの決まり（firestore.rules の group_accounts の update）を、
 * 検証環境で確かめる。書く。検証環境だけ。
 *
 *   node scripts/verify-email-change.mjs
 *
 * 先に決まりを検証環境へ出しておくこと（npm run deploy:rules:stg）。
 *
 * 使い捨ての団体（998xxx）と口座（@example.com）を作り、終わったら消す。
 * 確認のメールは送らない。確認のリンクは所有者の権限（firebase login）で受け取り、
 * その中の番号で切り替えを済ませる（利用者がリンクを開いたのと同じ）。
 *
 * 見ること
 *   1. 持ち主は切り替え待ち（pendingEmail）を書ける
 *   2. 持ち主は email を直接は変えられない（確かめていないアドレスに渡せない）
 *   3. 持ち主は id・email・pendingEmail 以外を書けない（学校名などを戻せない）
 *   4. 切り替え待ちのアドレスで勝手に作った口座（確認していない）は、団体を乗っ取れない
 *   5. 確認のリンクで新しいアドレスになった本人は、email を自分に書き換えて切り替え待ちを消せる
 *   6. 切り替えたあと、古いアドレスでは入れない
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { configFor, signIn, req, setDoc } from './fb-rest.mjs';

const { apiKey, projectId } = configFor('stg');
if (projectId !== 'kyudoscoremanager-stg') {
  console.error('検証環境の設定を読めませんでした。中止します。');
  process.exit(1);
}

// 所有者の権限（確認のリンクを受け取る・後片付け）
const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const refresh = fs.existsSync(設定) ? JSON.parse(fs.readFileSync(設定, 'utf8')).tokens?.refresh_token : null;
if (!refresh) {
  console.error('firebase login が済んでいません');
  process.exit(1);
}
const { access_token: 所有者 } = await (
  await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
).json();

const IDT = 'https://identitytoolkit.googleapis.com/v1';
const 印 = Date.now().toString(36);
const 団体 = '998' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
const 今のメール = `mail-change-a-${印}@example.com`;
const 新しいメール = `mail-change-b-${印}@example.com`;
const 合言葉 = `Mail-${印}-x9`;

let だめ = 0;
const 見る = (題, 良いか, 添え) => {
  console.log(`  ${良いか ? 'ok ' : '★  '} ${題}${添え ? '  … ' + 添え : ''}`);
  if (!良いか) だめ++;
};
/** 項目を書く（mask に載せて中身に無い項目は消える） */
const 直す = (token, 中身, 名たち) =>
  req(projectId, `/group_accounts/${団体}`, {
    token,
    method: 'PATCH',
    query: '?' + 名たち.map((n) => `updateMask.fieldPaths=${n}`).join('&'),
    body: { fields: Object.fromEntries(Object.entries(中身).map(([k, v]) => [k, { stringValue: v }])) },
  });
const 自分を消す = (idToken) =>
  fetch(`${IDT}/accounts:delete?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

console.log(`${projectId} / 使い捨ての団体 ${団体} でメールアドレスの切り替えを確かめます\n`);
if ((await req(projectId, `/group_accounts/${団体}`, { token: 所有者 })).status !== 404) {
  console.error(`団体 ${団体} がもう在ります。もう一度流してください。`);
  process.exit(1);
}

const 持ち主 = await signIn(apiKey, 今のメール, 合言葉, { create: true });
let 後片付けの鍵 = 持ち主;
try {
  const 作る = await setDoc(projectId, `/group_accounts/${団体}`, { id: 団体, email: 今のメール }, 持ち主);
  見る('（下ごしらえ）持ち主が団体の帳面を作れる', 作る.status === 200, `HTTP ${作る.status}`);

  // 1〜3
  const 待ち = await 直す(持ち主, { pendingEmail: 新しいメール }, ['pendingEmail']);
  見る('1. 持ち主は切り替え待ちを書ける', 待ち.status === 200, `HTTP ${待ち.status}`);
  const 直接 = await 直す(持ち主, { email: 新しいメール }, ['email']);
  見る('2. 持ち主は email を直接は変えられない', 直接.status === 403, `HTTP ${直接.status}`);
  const 余計 = await 直す(持ち主, { name: '学校名' }, ['name']);
  見る('3. 持ち主は id・email・pendingEmail 以外を書けない', 余計.status === 403, `HTTP ${余計.status}`);

  // 4. 切り替え待ちのアドレスで勝手に口座を作っても（確認していない）乗っ取れない
  const 横取り = await signIn(apiKey, 新しいメール, 'Other-' + 印, { create: true });
  const 乗っ取り = await 直す(横取り, { id: 団体, email: 新しいメール }, ['id', 'email', 'pendingEmail']);
  見る(
    '4. 確認していない口座は、切り替え待ちのアドレスでも乗っ取れない',
    乗っ取り.status === 403,
    `HTTP ${乗っ取り.status}`
  );
  await 自分を消す(横取り);

  // 5. 確認のリンクを開いた（リンクの番号を所有者の権限で受け取り、そのまま使う）
  const 送る = await (
    await fetch(`${IDT}/accounts:sendOobCode`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${所有者}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': projectId,
      },
      body: JSON.stringify({
        requestType: 'VERIFY_AND_CHANGE_EMAIL',
        // 所有者の権限で受け取るときは、今のアドレスで口座を指す（idToken ではなく）
        email: 今のメール,
        newEmail: 新しいメール,
        returnOobLink: true,
        targetProjectId: projectId,
      }),
    })
  ).json();
  const 番号 = 送る.oobLink ? new URL(送る.oobLink).searchParams.get('oobCode') : null;
  見る(
    '（下ごしらえ）確認のリンクを受け取れる',
    !!番号,
    番号 ? '' : JSON.stringify(送る.error || 送る).slice(0, 160)
  );
  if (番号) {
    const 開く = await (
      await fetch(`${IDT}/accounts:update?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode: 番号 }),
      })
    ).json();
    見る(
      '（下ごしらえ）リンクを開くと認証のアドレスが替わる',
      開く.email === 新しいメール,
      開く.email || JSON.stringify(開く.error || 開く).slice(0, 160)
    );

    const 新しい鍵 = await signIn(apiKey, 新しいメール, 合言葉);
    後片付けの鍵 = 新しい鍵;
    const 仕上げ = await 直す(新しい鍵, { id: 団体, email: 新しいメール }, ['id', 'email', 'pendingEmail']);
    const 中 = JSON.parse(Buffer.from(新しい鍵.split('.')[1], 'base64url').toString());
    const 前の帳面 = await req(projectId, `/group_accounts/${団体}`);
    if (仕上げ.status !== 200)
      console.log(
        '    [調べ]',
        JSON.stringify({
          email: 中.email,
          v: 中.email_verified,
          前: Object.keys(前の帳面.json?.fields || {}),
          返り: 仕上げ.json,
        }).slice(0, 400)
      );
    見る(
      '5. 確認済みの本人は email を自分に書き換え、切り替え待ちを消せる',
      仕上げ.status === 200,
      `HTTP ${仕上げ.status}`
    );
    const 後 = await req(projectId, `/group_accounts/${団体}`);
    const 鍵たち = Object.keys(後.json?.fields || {})
      .sort()
      .join('・');
    見る('   帳面は id と email だけになる', 鍵たち === 'email・id', 鍵たち);

    let 古いので入れた = true;
    try {
      await signIn(apiKey, 今のメール, 合言葉);
    } catch {
      古いので入れた = false;
    }
    見る('6. 切り替えたあと、古いアドレスでは入れない', !古いので入れた);
  }
} finally {
  // 後片付け。帳面は所有者の権限で消す（決まりを通さない）
  await req(projectId, `/group_accounts/${団体}`, { token: 所有者, method: 'DELETE' });
  await 自分を消す(後片付けの鍵);
}

console.log('');
if (だめ) {
  console.log(`${だめ} 件が意図どおりではありません。`);
  process.exit(1);
}
console.log('すべて意図どおりです。使い捨ての団体と口座は消しました。');
