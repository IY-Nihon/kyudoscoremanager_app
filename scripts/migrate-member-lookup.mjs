/**
 * 個人ID → memberId の逆引き表（member_lookup）を作る一度きりの移行。
 *
 *   node scripts/migrate-member-lookup.mjs <stg|prod> [--commit]
 *
 * --commit を付けるまでは書き込まず、内容の確認だけ行う。
 *
 * 第2段階のルールを入れる前に必ず流すこと。逆引き表が無いと部員は
 * ログインできなくなる。件数一致を合格条件とする。
 *
 * 前提: 第1段階のルール下では認証済みなら全団体に書けるため、
 * 管理者アカウント1つで全団体分を投入できる。
 */
import { configFor, signIn, listAll, setDoc, req } from './fb-rest.mjs';

const [target, ...flags] = process.argv.slice(2);
const COMMIT = flags.includes('--commit');
if (!['stg', 'prod'].includes(target)) {
  console.error('使い方: node scripts/migrate-member-lookup.mjs <stg|prod> [--commit]');
  process.exit(1);
}

const { apiKey, projectId } = configFor(target);
const ADMIN_EMAIL = process.env.MIGRATE_EMAIL || 'nihonu.kouka@gmail.com';
const ADMIN_PW = process.env.MIGRATE_PW || (target === 'stg' ? 'StgTest!2026' : '');
if (!ADMIN_PW) {
  console.error('本番では MIGRATE_PW 環境変数にパスワードを指定してください');
  process.exit(1);
}

console.log(`対象: ${projectId}（${COMMIT ? '書き込みあり' : '確認のみ'}）\n`);
const token = await signIn(apiKey, ADMIN_EMAIL, ADMIN_PW);

let accounts;
try {
  accounts = await listAll(projectId, '/group_accounts', token, ['id']);
} catch (e) {
  console.error('団体一覧を取得できませんでした。');
  console.error('第2段階のルールが既に適用されていませんか？');
  console.error('この移行は「第1段階のルール下で、管理者アカウントから全団体へ書き込む」前提です。');
  console.error('順序は 第1段階ルール → 本スクリプト → アプリ配信 → 第2段階ルール です。\n');
  throw e;
}
console.log(`団体: ${accounts.length} 件\n`);

let totalWrite = 0;
let blocked = false;
const summary = [];

for (const acc of accounts) {
  const gid = acc.id;
  const members = await listAll(projectId, `/groups/${gid}/members`, token, ['personalId']);

  const valid = [];
  const invalid = [];
  const seen = new Map();
  const dup = [];
  for (const m of members) {
    const pid = m.data.personalId;
    if (!/^\d{4}$/.test(pid || '')) { invalid.push(m.id); continue; }
    if (seen.has(pid)) { dup.push({ personalId: pid, ids: [seen.get(pid), m.id] }); continue; }
    seen.set(pid, m.id);
    valid.push({ personalId: pid, memberId: m.id });
  }

  // 重複があると逆引きが壊れる（後勝ちで片方がログインできなくなる）ため止める
  if (dup.length) {
    console.error(`✗ 団体 ${gid}: 個人IDの重複 ${dup.length} 件`);
    dup.forEach((d) => console.error(`    ${d.personalId} → ${d.ids.join(' / ')}`));
    blocked = true;
  }
  if (invalid.length) {
    console.warn(`△ 団体 ${gid}: 4桁でない個人ID ${invalid.length} 件（スキップ）`);
  }

  if (COMMIT && !dup.length) {
    for (const v of valid) {
      const r = await setDoc(projectId, `/groups/${gid}/member_lookup/${v.personalId}`,
        { memberId: v.memberId, updatedAt: Date.now() }, token);
      if (r.status !== 200) {
        console.error(`✗ 団体 ${gid} / 個人ID ${v.personalId} の書き込みに失敗 (HTTP ${r.status})`);
        blocked = true;
      } else totalWrite++;
    }
  }

  // 件数照合。1件でも欠けるとその部員はログインできなくなる
  let lookupCount = null;
  if (COMMIT) {
    const lk = await listAll(projectId, `/groups/${gid}/member_lookup`, token, ['memberId']);
    lookupCount = lk.length;
    if (lookupCount !== valid.length) {
      console.error(`✗ 団体 ${gid}: 件数不一致 members(有効)=${valid.length} / member_lookup=${lookupCount}`);
      blocked = true;
    }
  }

  summary.push({
    団体: gid, メンバー: members.length, 有効な4桁ID: valid.length,
    不正: invalid.length, 重複: dup.length,
    逆引き表: lookupCount === null ? '-' : lookupCount,
  });
}

console.table(summary);
if (!COMMIT) {
  console.log('\n確認のみで終了しました。実行するには --commit を付けてください。');
} else if (blocked) {
  console.error('\n不合格：上記を解消してから再実行してください。');
  process.exit(1);
} else {
  console.log(`\n合格：${totalWrite} 件を書き込み、全団体で件数が一致しました。`);
}
