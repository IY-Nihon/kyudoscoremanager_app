/**
 * 個人ログインの人が「自分の記録を見られない」状態になっていないかを数える。読むだけ。
 *
 *   node scripts/check-member-visibility.mjs        （検証環境）
 *   node scripts/check-member-visibility.mjs prod   （本番）
 *
 * 2026-08-18 に直した3つの不具合が、実際に誰かに当たっているかを見る。
 *
 *   A 交代でだけ参加している人
 *       履歴の一覧には記録が出るが、開くと射手が0人になっていた
 *       （詳細側の判定が、交代を射手ではなく記録から見ていたため）
 *   B 氏名だけで入れた射手（memberId が無い）
 *       分析のタグ収集が氏名の一致を見ておらず、自分の記録なのに
 *       その記録のタグが絞り込みに出てこなかった
 *   C 名簿に無い memberId を指す射手
 *       部員を消したあとの記録。個人ログインでは誰にも見えない
 *       （こちらは今回直していない。実態を知るために数える）
 *
 * 認証は Firebase CLI の権限を使う。事前に `firebase login` が済んでいること。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] || 'stg';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/check-member-visibility.mjs <stg|prod>');
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

const 根 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;
async function 取る(道) {
  const 出 = [];
  let token = '';
  for (;;) {
    const u = `${根}/${道}?pageSize=300${token ? `&pageToken=${token}` : ''}`;
    const j = await (await fetch(u, { headers: { Authorization: `Bearer ${access_token}` } })).json();
    if (j.error) return 出;
    (j.documents || []).forEach((d) => 出.push(d));
    if (!j.nextPageToken) break;
    token = j.nextPageToken;
  }
  return 出;
}

const 団体 = new Set();
(await 取る('group_accounts')).forEach((d) => {
  const id = d.fields?.groupId?.stringValue || d.name.split('/').pop();
  if (id) 団体.add(String(id));
});
(await 取る('groups')).forEach((d) => 団体.add(d.name.split('/').pop()));

console.log(`接続先: ${企画}（読むだけ）\n`);

const 明細 = [];
const 集計 = [];
for (const g of [...団体].sort()) {
  const [部員, 記録] = await Promise.all([取る(`groups/${g}/members`), 取る(`groups/${g}/sessions`)]);
  const 名簿 = new Map(); // id → 氏名
  部員.forEach((d) => 名簿.set(d.name.split('/').pop(), d.fields?.name?.stringValue || ''));
  const 氏名帳 = new Map(); // 氏名 → id
  名簿.forEach((n, id) => n && 氏名帳.set(n, id));

  let A = 0;
  let B = 0;
  let C = 0;
  const A対象 = new Set();

  記録.forEach((d) => {
    const f = d.fields || {};
    const 題 = (f.title?.stringValue || '(無題)').slice(0, 12);
    const 射手 = f.archers?.arrayValue?.values || [];

    // その記録に、id か氏名で「列として」写っている人
    const 列の人 = new Set();
    const 交代の人 = new Set();
    射手.forEach((a) => {
      const af = a.mapValue?.fields || {};
      if (af.isSeparator?.booleanValue || af.isTotalCalculator?.booleanValue) return;
      const mid = af.memberId?.stringValue;
      const 名 = af.name?.stringValue || '';
      if (mid) {
        列の人.add(mid);
        if (!名簿.has(mid)) {
          C++;
          明細.push({ 団体: g, 種類: 'C 消えた部員を指す', 記録: 題, 相手: `${名 || '(名前なし)'} (${mid})` });
        }
      } else if (名) {
        // 氏名だけの射手。名簿に同じ氏名がいれば、その人の記録として扱われる
        const 当たり = 氏名帳.get(名);
        if (当たり) {
          列の人.add(当たり);
          B++;
          明細.push({ 団体: g, 種類: 'B 氏名だけの射手', 記録: 題, 相手: 名 });
        }
      }
      // 交代で入った人
      const sid = af.substitutionIds?.mapValue?.fields || {};
      Object.values(sid).forEach((v) => v.stringValue && 交代の人.add(v.stringValue));
      const snm = af.substitutions?.mapValue?.fields || {};
      Object.values(snm).forEach((v) => {
        const 当たり = v.stringValue && 氏名帳.get(v.stringValue);
        if (当たり) 交代の人.add(当たり);
      });
    });

    // 交代でだけ参加している人（列を持たない）
    交代の人.forEach((id) => {
      if (!列の人.has(id)) {
        A++;
        A対象.add(id);
        明細.push({ 団体: g, 種類: 'A 交代でだけ参加', 記録: 題, 相手: 名簿.get(id) || id });
      }
    });
  });

  集計.push({ 団体: g, 部員: 部員.length, 記録: 記録.length, 'A 交代のみ': A, 'A の人数': A対象.size, 'B 氏名だけ': B, 'C 迷子': C });
}

console.table(集計);
if (!明細.length) {
  console.log('当たっている人はいません。');
} else {
  console.log(`\n内訳（先頭30件）`);
  console.table(明細.slice(0, 30));
}
