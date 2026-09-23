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
 *   5. 確認のリンクで新しいアドレスになった本人は、email を自分に書き換えて切り替え待ちを消せる。
 *      前のアドレスと自分の口座の番号を必ず残す（他人の番号は残せない）
 *   6. 切り替えたあと、古いアドレスでは入れない
 *   7. 持ち主は前のアドレス・口座の番号を書き換えられない（消すことはできる）
 *   8. 前のアドレスで勝手に作った口座は、帳面を戻せない
 *   9. 「元に戻す」のあと、同じ口座の本人は帳面を前のアドレスへ戻せる
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
    const 口座の番号 = JSON.parse(Buffer.from(新しい鍵.split('.')[1], 'base64url').toString()).user_id;
    const 全部 = ['id', 'email', 'pendingEmail', 'previousEmail', 'ownerUid'];
    const 鍵たち = async () =>
      Object.keys((await req(projectId, `/group_accounts/${団体}`)).json?.fields || {})
        .sort()
        .join('・');

    // 5. 仕上げ
    const 足りない = await 直す(新しい鍵, { id: 団体, email: 新しいメール }, 全部);
    見る(
      '5. 仕上げで前のアドレスと口座の番号を残さない書き方は断る',
      足りない.status === 403,
      `HTTP ${足りない.status}`
    );
    const 他人の番号 = await 直す(
      新しい鍵,
      { id: 団体, email: 新しいメール, previousEmail: 今のメール, ownerUid: 'someone-else' },
      全部
    );
    見る('   口座の番号は自分のものしか残せない', 他人の番号.status === 403, `HTTP ${他人の番号.status}`);
    const 仕上げ = await 直す(
      新しい鍵,
      { id: 団体, email: 新しいメール, previousEmail: 今のメール, ownerUid: 口座の番号 },
      全部
    );
    見る(
      '   確認済みの本人は email を自分に書き換え、前のアドレスと口座の番号を残せる',
      仕上げ.status === 200,
      `HTTP ${仕上げ.status}`
    );
    const 仕上げの後 = await 鍵たち();
    見る(
      '   帳面は id・email・previousEmail・ownerUid になる',
      仕上げの後 === 'email・id・ownerUid・previousEmail',
      仕上げの後
    );

    // 6. 古いアドレスでは入れない
    let 古いので入れた = true;
    try {
      await signIn(apiKey, 今のメール, 合言葉);
    } catch {
      古いので入れた = false;
    }
    見る('6. 切り替えたあと、古いアドレスでは入れない', !古いので入れた);

    // 7. 持ち主は前のアドレスと口座の番号を書き換えられない（消すことはできる）
    const 書き換え = await 直す(新しい鍵, { previousEmail: 'someone@example.com' }, ['previousEmail']);
    見る('7. 持ち主は前のアドレスを書き換えられない', 書き換え.status === 403, `HTTP ${書き換え.status}`);
    const 消す = await 直す(新しい鍵, {}, ['previousEmail', 'ownerUid']);
    見る(
      '   持ち主は前のアドレスと口座の番号を消せる（30 日後の片付け）',
      消す.status === 200,
      `HTTP ${消す.status}`
    );
    // 「元に戻す」を試すため、所有者の権限で戻しておく（決まりを通さない）
    await req(projectId, `/group_accounts/${団体}`, {
      token: 所有者,
      method: 'PATCH',
      query: '?updateMask.fieldPaths=previousEmail&updateMask.fieldPaths=ownerUid',
      body: { fields: { previousEmail: { stringValue: 今のメール }, ownerUid: { stringValue: 口座の番号 } } },
    });

    // 8. 前のアドレスは空いたので、誰でもそのアドレスで口座を作れる。作っても戻せない
    const 横取り2 = await signIn(apiKey, 今のメール, 'Other-' + 印, { create: true });
    const 戻し取り = await 直す(横取り2, { id: 団体, email: 今のメール }, 全部);
    見る(
      '8. 前のアドレスで勝手に作った口座は、帳面を戻せない',
      戻し取り.status === 403,
      `HTTP ${戻し取り.status}`
    );
    await 自分を消す(横取り2);

    // 9. 「元に戻す」。古いアドレスに届くリンクと同じく、口座のアドレスを前のものへ戻す
    //（戻すリンクは API で受け取れないので、所有者の権限で口座を直接直す）
    const 戻す = await (
      await fetch(`${IDT}/projects/${projectId}/accounts:update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${所有者}`,
          'Content-Type': 'application/json',
          'x-goog-user-project': projectId,
        },
        body: JSON.stringify({ localId: 口座の番号, email: 今のメール }),
      })
    ).json();
    見る(
      '（下ごしらえ）口座のアドレスが前のものに戻る',
      戻す.email === 今のメール,
      戻す.email || JSON.stringify(戻す.error || 戻す).slice(0, 160)
    );
    const 戻った鍵 = await signIn(apiKey, 今のメール, 合言葉);
    後片付けの鍵 = 戻った鍵;
    const 戻し = await 直す(戻った鍵, { id: 団体, email: 今のメール }, 全部);
    見る(
      '9. 「元に戻す」のあと、同じ口座の本人は帳面を前のアドレスへ戻せる',
      戻し.status === 200,
      `HTTP ${戻し.status}`
    );
    const 戻しの後 = await 鍵たち();
    見る('   帳面は id と email だけになる', 戻しの後 === 'email・id', 戻しの後);
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
