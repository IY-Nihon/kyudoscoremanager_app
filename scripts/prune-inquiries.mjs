/**
 * 対応を終えたお問い合わせ（Firestore の inquiries）を消す（2026-10-05・S-3）。
 *
 *   node scripts/prune-inquiries.mjs                       （検証環境・数えるだけ）
 *   node scripts/prune-inquiries.mjs prod                  （本番・受け取りから 180 日を過ぎたものを数えるだけ）
 *   node scripts/prune-inquiries.mjs prod 日数 90           （本番・受け取りから 90 日を過ぎたもの）
 *   node scripts/prune-inquiries.mjs prod 前 2026-09-01     （本番・その日より前に受け取ったもの）
 *   node scripts/prune-inquiries.mjs prod id 文書ID 文書ID  （本番・選んだものだけ。ID は inquiries-list.mjs で見る）
 *   …どれも、末尾に 消す を付けたときだけ実際に消す
 *
 * ■ なぜ要るか
 * プライバシーポリシー第18条第4号は「お問い合わせの内容は、対応の完了後、必要な期間の経過をもって削除します」と
 * 約束している。お問い合わせはアプリから書かれるだけで（読む・直す・消すは決まりで禁止）、これまで消す道具が無かった。
 * 写真も文字に直して同じ文書に入っている（imagesBase64）ので、文書を消せば写真も消える。
 *
 * ■ 「対応の完了」は文書に無い
 * お問い合わせには対応済みの印が無い（書くのはアプリだけで、運営者が印を付ける仕組みは無い）。
 * そのため、日数・日付・ID で選ぶ。消す前に、選んだものの対応が済んでいるかを inquiries-list.mjs で確かめる。
 * 既定の 180 日は、返信のあとの行き違い（追加の質問など）に十分な長さとして置いた目安で、決まりではない。
 *
 * ■ 画面には中身を出さない
 * 中身には氏名やメールアドレスが入りうるので、ここでは受け取った日時・団体・文字数・写真の枚数・ID だけを出す。
 *
 * 所有者のトークンは Firebase CLI のログイン（firebase login）を借りる（prune-error-reports.mjs と同じ）。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 引数 = process.argv.slice(2);
const 対象 = ['stg', 'prod'].includes(引数[0]) ? 引数.shift() : 'stg';
const 消す = 引数[引数.length - 1] === '消す';
if (消す) 引数.pop();
const 使い方 = () => {
  console.error('使い方: node scripts/prune-inquiries.mjs <stg|prod> [日数 N | 前 YYYY-MM-DD | id 文書ID…] [消す]');
  process.exit(1);
};

/** 選び方：{ 種: '日数', 日数 } / { 種: '前', 境 } / { 種: 'id', ids } */
let 選び方 = { 種: '日数', 日数: 180 };
if (引数[0] === '日数') {
  const n = Number(引数[1]);
  if (!(n >= 1)) 使い方();
  選び方 = { 種: '日数', 日数: n };
} else if (引数[0] === '前') {
  const 境 = Date.parse(`${引数[1]}T00:00:00+09:00`);
  if (!Number.isFinite(境)) 使い方();
  選び方 = { 種: '前', 境, 日付: 引数[1] };
} else if (引数[0] === 'id') {
  const ids = 引数.slice(1);
  if (ids.length === 0) 使い方();
  選び方 = { 種: 'id', ids };
} else if (引数.length) {
  使い方();
}

const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
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
if (!access_token) {
  console.error('access token を取れませんでした');
  process.exit(1);
}
const 頭 = { Authorization: `Bearer ${access_token}` };
const 根 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;

// 文字数と写真の枚数を出すために content と imagesBase64 も読むが、画面には出さない
const 全部 = [];
let token = '';
for (;;) {
  const u = `${根}/inquiries?pageSize=300${token ? `&pageToken=${token}` : ''}`;
  const j = await (await fetch(u, { headers: 頭 })).json();
  if (j.error) {
    console.error('読めませんでした: ' + (j.error.message || ''));
    process.exit(1);
  }
  for (const d of j.documents || []) 全部.push(d);
  if (!j.nextPageToken) break;
  token = j.nextPageToken;
}

const ID = (d) => d.name.split('/').pop();
/** 受け取った時刻。createdAt が無い古い形は、文書の作られた時刻で見る */
const 受け取り = (d) => {
  const v = d.fields?.createdAt;
  const t = v?.timestampValue ? Date.parse(v.timestampValue) : v?.integerValue ? Number(v.integerValue) : NaN;
  return Number.isFinite(t) ? t : Date.parse(d.createTime);
};
const いま = Date.now();
const 選んだ =
  選び方.種 === 'id'
    ? 全部.filter((d) => 選び方.ids.includes(ID(d)))
    : 選び方.種 === '前'
      ? 全部.filter((d) => 受け取り(d) < 選び方.境)
      : 全部.filter((d) => 受け取り(d) <= いま - 選び方.日数 * 86400000);

console.log(`接続先: ${企画}`);
const 説明 =
  選び方.種 === 'id'
    ? `ID で選んだもの（${選び方.ids.length} 件を指定）`
    : 選び方.種 === '前'
      ? `${選び方.日付} より前に受け取ったもの`
      : `受け取りから ${選び方.日数} 日を過ぎたもの`;
console.log(`お問い合わせ ${全部.length} 件のうち、${説明} ${選んだ.length} 件\n`);
if (選び方.種 === 'id') {
  const 無い = 選び方.ids.filter((id) => !全部.some((d) => ID(d) === id));
  if (無い.length) console.log(`  見つからない ID: ${無い.join(' ')}\n`);
}
if (選んだ.length === 0) {
  console.log('消すものはありません。');
  process.exit(0);
}
const 日時 = (t) => new Date(t).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
for (const d of 選んだ) {
  const f = d.fields || {};
  const 字数 = [...(f.content?.stringValue || '')].length;
  const 写真 = (f.imagesBase64?.arrayValue?.values || []).length;
  console.log(`  ${日時(受け取り(d))}  団体 ${f.groupId?.stringValue || '-'}  ${字数} 字  写真 ${写真} 枚  ID ${ID(d)}`);
}

if (!消す) {
  console.log('\n対応が済んでいるかを inquiries-list.mjs で確かめてから、末尾に 消す を付けてください。');
  console.log(`  node scripts/prune-inquiries.mjs ${[対象, ...引数, '消す'].join(' ')}`);
  process.exit(0);
}

let 済み = 0;
for (const d of 選んだ) {
  const r = await fetch(`https://firestore.googleapis.com/v1/${d.name}`, { method: 'DELETE', headers: 頭 });
  if (r.ok) 済み++;
  else console.error('  消せませんでした: ' + ID(d));
}
console.log(`\n${済み} 件を消しました。`);
