/**
 * 卒業・退部のメンバーが、いま個人ログインしているかを数える（2026-11-26 本人「配る前に数え直す」）。読むだけ。
 *
 *   node scripts/check-taibu-login.mjs              （検証環境）
 *   node scripts/check-taibu-login.mjs prod         （本番）
 *   node scripts/check-taibu-login.mjs prod --名前  （当たった人の名前も画面に出す。倉庫・メモには写さない）
 *
 * 次の版から、卒業・退部の人はログインできない（決まりと中継の /kojin が在籍を見る。決めたこと.md の 2026-11-26）。
 * 配った時点で個人ログインしている卒業・退部の人がいれば、その人の端末は団体を読めなくなる（入り直しの窓 → 断りの文）。
 * そういう人がいる団体だけに帯を出すかは、配る前の日にこれで数えて決める（11/26 本人：今は作らない）。
 *
 * 「いま個人ログインしている」は、所属の証（member_claims/{uid}）があること。ログアウトすると証も匿名の口座も消える
 * （src/groupLogin.js の 団体から出る。11/04 の版から）ので、前に入ってログアウトした人は分からない（数えない）。
 * 端末の中身を消したなどでログアウトせずに使わなくなった人の証は残るので、口座の最後の更新（lastRefreshAt）も出す。
 * 卒業・退部の見分けは中継の src/zaiseki.mjs（決まりの enrolled）と同じ。
 *
 * 出すのは団体ID と数（--名前 のときだけ名前）。公開の倉庫に本番の団体ID・名前を書かないので、出力は写さない。
 * 認証は Firebase CLI の権限を使う。事前に `firebase login` が済んでいること
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 引数 = process.argv.slice(2);
const 対象 = 引数.find((a) => !a.startsWith('--')) || 'stg';
const 名前も = 引数.includes('--名前');
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/check-taibu-login.mjs <stg|prod> [--名前]');
  process.exit(1);
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
const 頭 = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };
const 根 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;

/** 集まりの文書を全部（ページをたどる） */
async function 取る(道) {
  const 出 = [];
  let token = '';
  for (;;) {
    const u = `${根}/${道}?pageSize=300${token ? `&pageToken=${token}` : ''}`;
    const j = await (await fetch(u, { headers: 頭 })).json();
    if (j.error) throw new Error(`${道} を読めない: ${j.error.message}`);
    出.push(...(j.documents || []));
    if (!j.nextPageToken) return 出;
    token = j.nextPageToken;
  }
}
const 名 = (文書) => decodeURIComponent(文書.name.split('/').pop());

/** 中継の src/zaiseki.mjs と同じ。REST の欄の値（字・数・真偽）。無い・空は null、ほかの形は '他'（空でない） */
function 欄の値(欄) {
  if (!欄 || typeof 欄 !== 'object' || 'nullValue' in 欄) return null;
  if (typeof 欄.stringValue === 'string') return 欄.stringValue;
  if (欄.integerValue !== undefined) return Number(欄.integerValue);
  if (typeof 欄.doubleValue === 'number') return 欄.doubleValue;
  if (typeof 欄.booleanValue === 'boolean') return 欄.booleanValue;
  return '他';
}
const 真 = (値) => 値 !== null && 値 !== false && 値 !== 0 && 値 !== '';
function 在籍の状態(欄たち) {
  const 欄 = 欄たち || {};
  const 項目 = 欄の値(欄.enrollment);
  if (項目 === '在籍' || 項目 === '卒業' || 項目 === '退部') return 項目;
  return 真(欄の値(欄.isAlumni)) || 真(欄の値(欄.graduationYear)) ? '卒業' : '在籍';
}
const 時 = (値) =>
  値 ? new Date(Number(値) || 値).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : 'なし';

const 証たち = (await 取る('member_claims')).map((文書) => ({
  uid: 名(文書),
  団体: 欄の値(文書.fields?.groupId),
  人: 欄の値(文書.fields?.memberId),
}));
// 親の文書が無い団体もあるので、帳面と証の団体も合わせる
const 団体たち = [
  ...new Set([
    ...(await 取る('groups')).map(名),
    ...(await 取る('group_accounts')).map(名),
    ...証たち.map((証) => 証.団体).filter(Boolean),
  ]),
].sort();

const 合計 = { 団体: 0, 卒業: 0, 退部: 0, 入っている人: 0, 証: 0 };
for (const 団体 of 団体たち) {
  const 抜けた = (await 取る(`groups/${団体}/members`))
    .map((文書) => ({ id: 名(文書), 名前: 欄の値(文書.fields?.name), 状態: 在籍の状態(文書.fields) }))
    .filter((人) => 人.状態 !== '在籍');
  if (!抜けた.length) continue;
  const 入っている = 抜けた
    .map((人) => ({ ...人, 証: 証たち.filter((証) => 証.団体 === 団体 && 証.人 === 人.id) }))
    .filter((人) => 人.証.length);
  const uids = 入っている.flatMap((人) => 人.証.map((証) => 証.uid));
  const 口座たち = uids.length
    ? (
        await (
          await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${企画}/accounts:lookup`, {
            method: 'POST',
            headers: 頭,
            body: JSON.stringify({ localId: uids }),
          })
        ).json()
      ).users || []
    : [];
  const 数 = (状態) => 抜けた.filter((人) => 人.状態 === 状態).length;
  合計.団体++;
  合計.卒業 += 数('卒業');
  合計.退部 += 数('退部');
  合計.入っている人 += 入っている.length;
  合計.証 += uids.length;
  console.log(
    `団体 ${団体}：卒業 ${数('卒業')} 人・退部 ${数('退部')} 人。いま個人ログインの証がある人 ${入っている.length} 人`
  );
  入っている.forEach((人, 番) => {
    for (const 証 of 人.証) {
      const 口座 = 口座たち.find((一つ) => 一つ.localId === 証.uid);
      console.log(
        `  - ${名前も ? 人.名前 : `${番 + 1} 人目`}（${人.状態}）：口座の最後の更新 ${時(口座?.lastRefreshAt)}${口座 ? '' : '（口座が無い）'}`
      );
    }
  });
}
console.log(
  `合計：卒業・退部の人がいる団体 ${合計.団体}・卒業 ${合計.卒業} 人・退部 ${合計.退部} 人・` +
    `いま個人ログインの証がある人 ${合計.入っている人} 人（その証 ${合計.証} 件。証は全部で ${証たち.length} 件）`
);
