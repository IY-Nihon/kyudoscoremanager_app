/**
 * 認証から届くメール（パスワードの再設定・メールアドレスの確認・変更のお知らせ）を
 * 日本語にし、差出人名を「弓道部的中ノート」、返信先を運営者の問い合わせ先にする。既定は読むだけ。
 *
 *   node scripts/set-auth-email-templates.mjs            （検証環境・読むだけ）
 *   node scripts/set-auth-email-templates.mjs prod       （本番・読むだけ）
 *   node scripts/set-auth-email-templates.mjs prod 当てる （本番・当てる）
 *
 * ■ 変えられるもの・変えられないもの（2026-09-24 に検証環境で確かめた）
 *   ・雛形の言語（notification.defaultLocale）… 変えられる。ja にすると Firebase の
 *     日本語の標準の文面になる。雛形は言語ごとに持っていて、ja にすると読み出しも日本語になる
 *   ・差出人名（senderDisplayName）… 変えられる。雛形ごとに 1 つで、言語には依らない
 *   ・返信先（replyTo）… 変えられる。受け取った人が「返信」を押すと問い合わせ先へ届く
 *   ・送信元のアドレス … noreply@（企画）.firebaseapp.com のまま。@gmail.com は自分のドメインに
 *     できないので送信元にはできない（見せかけると、なりすましとして迷惑メールに入りやすい）
 *   ・件名（subject）… 変えられない（EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED で断られる）
 *   ・本文（body）… 変えられない。200 が返るが、読み直すと元のまま（黙って捨てられる）
 *   管理画面（Authentication → テンプレート）でも同じ。本文の欄は「スパム防止のため編集できません」、
 *   件名は入力できるが、保存すると「現在、このプロジェクトではメール テンプレートの更新はできません」
 *   と断られる（2026-09-24、検証環境で確かめた。本番も API で件名を 3 通とも断られた）。
 *   だから文面は Firebase の標準のまま。文中の %APP_NAME% にはプロジェクトの「公開名」が入る
 *  （管理画面のプロジェクトの設定 → 全般 → 公開名）。
 *
 * ■ どのメールがいつ届くか
 *   resetPasswordTemplate … ログイン画面の「パスワードを忘れた」
 *   verifyEmailTemplate   … メールアドレスの切り替えで、新しいアドレスへ（src/groupLogin.js）
 *   changeEmailTemplate   … 切り替わったあと、古いアドレスへ（取り消しのリンク付き）
 *   登録のときには何も送らない。パスワードを変えたあとのお知らせも Firebase には無い。
 *   アプリも auth.languageCode='ja' を送る（src/db.js）。
 *
 * 当てる前の設定は backup-output/auth-templates-*.json に控える（戻すときに使う）。
 * 所有者の権限（firebase login）で動く。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = ['stg', 'prod'].includes(process.argv[2]) ? process.argv[2] : 'stg';
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
const 当てる = process.argv.includes('当てる');

const 言語 = 'ja';
const 差出人名 = '弓道部的中ノート';
// 返信先は運営者の問い合わせ先（アプリのログイン画面・設定の案内と同じ）
const 返信先 = 'kyudoteamscorenote.dev@gmail.com';
const 雛形たち = ['resetPasswordTemplate', 'verifyEmailTemplate', 'changeEmailTemplate'];

const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const refresh = fs.existsSync(設定) ? JSON.parse(fs.readFileSync(設定, 'utf8')).tokens?.refresh_token : null;
if (!refresh) {
  console.error('firebase login が済んでいません');
  process.exit(1);
}
const { access_token } = await (
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
const 頭 = {
  Authorization: `Bearer ${access_token}`,
  'Content-Type': 'application/json',
  'x-goog-user-project': 企画,
};
const 設定の場所 = `https://identitytoolkit.googleapis.com/admin/v2/projects/${企画}/config`;
const 読む = async () => {
  const j = await (await fetch(設定の場所, { headers: 頭 })).json();
  if (j.error) throw new Error('設定を読めません: ' + j.error.message);
  return j.notification || {};
};
const 書く = async (印, notification) => {
  const r = await fetch(`${設定の場所}?updateMask=${encodeURIComponent(印)}`, {
    method: 'PATCH',
    headers: 頭,
    body: JSON.stringify({ notification }),
  });
  if (!r.ok) throw new Error('当てられませんでした: ' + JSON.stringify((await r.json()).error).slice(0, 300));
};
const 文にする = (html) =>
  String(html || '')
    .replace(/<a href='%LINK%'>%LINK%<\/a>/g, '（リンク）')
    .replace(/<\/p>\s*/g, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
const 見せる = (n) => {
  console.log(`雛形の言語: ${n.defaultLocale || '(未設定)'}`);
  for (const 名 of 雛形たち) {
    const t = (n.sendEmail || {})[名] || {};
    console.log(`\n■ ${名}`);
    console.log(
      `  差出人: ${t.senderDisplayName || '(名前なし)'} <${t.senderLocalPart || 'noreply'}@${企画}.firebaseapp.com>`
    );
    console.log(`  返信先: ${t.replyTo || '(なし)'}`);
    console.log(`  件名: ${t.subject}`);
    console.log(文にする(t.body).replace(/^/gm, '    '));
  }
};

const 今 = await 読む();
console.log(`接続先: ${企画}${当てる ? '' : '（読むだけ）'}\n`);
見せる(今);
const 済み =
  今.defaultLocale === 言語 &&
  雛形たち.every(
    (名) =>
      (今.sendEmail || {})[名]?.senderDisplayName === 差出人名 && (今.sendEmail || {})[名]?.replyTo === 返信先
  );
if (済み) {
  console.log('\nもう日本語・差出人名ありになっています。');
  process.exit(0);
}
if (!当てる) {
  console.log(`\n言語を ${言語}、差出人名を「${差出人名}」にするときは:`);
  console.log(`  node scripts/set-auth-email-templates.mjs ${対象} 当てる`);
  process.exit(0);
}

fs.mkdirSync('backup-output', { recursive: true });
const 控え = path.join('backup-output', `auth-templates-${対象}-${Date.now()}.json`);
fs.writeFileSync(控え, JSON.stringify({ notification: 今 }, null, 2));
console.log(`\n当てる前の設定を控えました: ${控え}`);

// 言語を先に。雛形は言語ごとなので、差出人名はそのあと（どの言語でも同じ値になる）
await 書く('notification.defaultLocale', { defaultLocale: 言語 });
await 書く(
  雛形たち
    .flatMap((名) => [
      `notification.sendEmail.${名}.senderDisplayName`,
      `notification.sendEmail.${名}.replyTo`,
    ])
    .join(','),
  {
    sendEmail: Object.fromEntries(
      雛形たち.map((名) => [名, { senderDisplayName: 差出人名, replyTo: 返信先 }])
    ),
  }
);

const 後 = await 読む();
console.log('\n── 当てたあと（これが届く）──\n');
見せる(後);
const 良い =
  後.defaultLocale === 言語 &&
  雛形たち.every(
    (名) =>
      (後.sendEmail || {})[名]?.senderDisplayName === 差出人名 && (後.sendEmail || {})[名]?.replyTo === 返信先
  );
if (!良い) {
  console.error('\n★ 読み直すと当たっていません');
  process.exit(1);
}
console.log('\n当てました。');
