/**
 * Firestore の読み書きの「内訳」を見る。
 *
 *   node scripts/check-firestore-usage.mjs           （検証環境・直近7日）
 *   node scripts/check-firestore-usage.mjs prod      （本番）
 *   node scripts/check-firestore-usage.mjs prod 時間  （直近24時間を1時間ごと）
 *
 * ■ この台本で分かること・分からないこと
 *
 * 分かる   … QUERY（集まりの読み取り）と LOOKUP（1件の読み取り）の内訳、
 *            時間ごとの山。どの経路が回数を食っているかの手がかり。
 *
 * 分からない … 割り当て（無料枠）に対する残量。
 *
 * ここは Cloud Monitoring の指標を読んでいる。Firebase コンソール自身が
 * 「課金や割り当ての使用量と一致しない場合があります」と注記しており、
 * 実際 2026-09-03 の検証環境で
 *
 *   Monitoring        23,671 回
 *   コンソールの割当    1.1 万回
 *
 * と約2倍ずれていた。だから**割合は出さない**。
 * 残量を知りたいときは、下の URL をブラウザで開くこと。
 *
 * ■ 割り当ての残量を見る場所（公式の表示）
 *
 *   本番     https://console.firebase.google.com/project/kyudoscoremanager/usage
 *   検証環境 https://console.firebase.google.com/project/kyudoscoremanager-stg/usage
 *
 * Spark プランの上限（2026-09-03 時点のコンソール表示）
 *   読み取り 5万/日 ・ 書き込み 2万/日 ・ 削除 2万/日 ・ 保存 1GB
 *
 * ■ 2026-09-03 に見たこと（公式の表示より）
 *
 *   本番     読み取り 8,519（17%）・書き込み 2,711（13.6%）
 *   検証環境 読み取り 1.1万（21.8%）※ e2e を3回回した日
 *
 * 拒否（RESOURCE_EXHAUSTED）は直近7日で0件。
 * 深夜に出る山はバックアップ（控えと照合で2回読むため）。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] === 'prod' ? 'prod' : 'stg';
const 細かく = process.argv.includes('時間');
const 企画 = 対象 === 'prod' ? 'kyudoscoremanager' : 'kyudoscoremanager-stg';

const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
if (!fs.existsSync(設定)) {
  console.error('firebase login が済んでいません');
  process.exit(1);
}
const refresh = JSON.parse(fs.readFileSync(設定, 'utf8')).tokens?.refresh_token;
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

const 幅 = 細かく ? 3600 : 86400;
const 遡り = 細かく ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
const 終 = new Date();
const 始 = new Date(終.getTime() - 遡り);

const 取る = async (指標) => {
  const u =
    `https://monitoring.googleapis.com/v3/projects/${企画}/timeSeries` +
    `?filter=${encodeURIComponent(`metric.type="${指標}"`)}` +
    `&interval.startTime=${始.toISOString()}` +
    `&interval.endTime=${終.toISOString()}` +
    `&aggregation.alignmentPeriod=${幅}s` +
    `&aggregation.perSeriesAligner=ALIGN_SUM`;
  const j = await (await fetch(u, { headers: { Authorization: 'Bearer ' + access_token } })).json();
  if (j.error) return { 誤り: j.error.message };
  const 束 = {};
  for (const s of j.timeSeries || []) {
    const 種 = s.metric?.labels?.type || s.metric?.labels?.response_code || '?';
    for (const p of s.points || []) {
      const t = new Date(p.interval.endTime);
      const k = 細かく
        ? t.toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
          })
        : t.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
      束[k] = 束[k] || {};
      束[k][種] = (束[k][種] || 0) + Number(p.value.int64Value ?? p.value.doubleValue ?? 0);
    }
  }
  return 束;
};

const 見る場所 = `https://console.firebase.google.com/project/${企画}/usage`;

console.log(`接続先: ${企画}（読むだけ）`);
console.log('※ ここに出るのは Monitoring の指標で、割り当ての残量ではありません。');
console.log(`※ 残量は次で見てください: ${見る場所}\n`);

for (const [名, 指標] of [
  ['読み取り', 'firestore.googleapis.com/document/read_count'],
  ['書き込み', 'firestore.googleapis.com/document/write_count'],
  ['要求の結果', 'firestore.googleapis.com/api/request_count'],
]) {
  const r = await 取る(指標);
  if (r.誤り) {
    console.log(`■ ${名}\n  ⚠   取れず: ${String(r.誤り).slice(0, 70)}\n`);
    continue;
  }
  const 並 = Object.entries(r).sort();
  console.log(`■ ${名}`);
  if (!並.length) {
    console.log('   記録なし\n');
    continue;
  }
  for (const [k, v] of 並) {
    const 計 = Object.values(v).reduce((a, b) => a + b, 0);
    const 内訳 = Object.entries(v)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => `${t}:${n.toLocaleString()}`)
      .join(' ');
    console.log(`   ${k.padEnd(12)} ${String(計.toLocaleString()).padStart(9)}   ${内訳.slice(0, 78)}`);
  }
  // 枠を超えて拒否された跡があれば知らせる
  if (名 === '要求の結果') {
    const 枯れ = 並.filter(([, v]) =>
      Object.keys(v).some((k) => /RESOURCE_EXHAUSTED|QUOTA/.test(k))
    );
    console.log(
      枯れ.length
        ? `  ⚠   割り当て切れの跡があります（${枯れ.map(([d]) => d).join(', ')}）`
        : '  ok  割り当て切れ（RESOURCE_EXHAUSTED）の跡は無い'
    );
  }
  console.log('');
}

console.log('※ QUERY は集まりの読み取り、LOOKUP は1件の読み取り。');
console.log('※ PERMISSION_DENIED は決まりによる拒否で、正常な動作も含みます。');
console.log('※ 深夜に出る山はバックアップ（控えと照合で2回読むため）。');
if (!細かく) console.log('※ 時間ごとに見るには、末尾に 時間 を付けてください。');
