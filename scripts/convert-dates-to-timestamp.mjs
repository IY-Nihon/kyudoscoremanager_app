/**
 * 数（ミリ秒）で入っている日時を、Firestore の日時型（Timestamp）に直す。既定は読むだけ。
 *
 *   node scripts/convert-dates-to-timestamp.mjs            （検証環境・数えるだけ）
 *   node scripts/convert-dates-to-timestamp.mjs prod       （本番・数えるだけ）
 *   node scripts/convert-dates-to-timestamp.mjs prod 直す  （本番・直す）
 *
 * ■ なぜ
 * 管理画面（Firebase コンソール）は、数をそのまま 1790000000000 と出す。日時型なら
 * 「2026年9月24日 10:00:00 UTC+9」と出る。管理する人が読めるようにする（2026-09-24）。
 *
 * ■ 直す項目（1 段目。いま出ているアプリのままで直してよいもの）
 *   groups/{団体}/sessions・members・trash・alumni・config   lastModified
 *       アプリは 8/3 から serverTimestamp（日時型）で書いていて、読む側は toMillis で
 *       数と日時型のどちらも読む。残っているのはそれより前に書かれたもの
 *   groups/{団体}/trash                                      deletedAt（数・壊れた入れ物 {seconds,nanoseconds}）
 *   groups/{団体}/member_lookup                              updatedAt
 *   groups/{団体}/officialPracticeDays                       created
 *   member_claims                                            claimedAt
 *   group_accounts/{団体}/private/consent                    createdAt・同意した日時
 *   errorReports                                             at・trail の at
 *   この 5 つは、アプリは書くだけで読まない（書く側は Date にしてある）
 *
 * ■ 2 段目（記録の日付も を付けたときだけ）
 *   groups/{団体}/sessions・trash   date・archers の lastModified
 *   **いま出ているアプリは date を数として読み、数で絞って問い合わせる。** 日時型も読める
 *   アプリが行き渡ってから（配信して 1〜2 週間）でないと、古いアプリの画面から記録が消える。
 *   書く側も日時型に替えたアプリと一緒に使うこと。
 *
 * ■ 安全のために
 *   ・直すのは数（と壊れた入れ物）だけ。日時型・文字・null には触らない
 *   ・書くのは直す項目だけ（updateMask）。読んだあとに誰かが書き換えた文書は
 *     書かずに飛ばす（currentDocument.updateTime を条件にする）。飛ばしたものはもう一度流す
 *   ・直す前に scripts/backup-prod.mjs で控えを取ること
 *
 * 所有者の権限で動くので、決まりを通らずに読み書きできる。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = ['stg', 'prod'].includes(process.argv[2]) ? process.argv[2] : 'stg';
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
const 直す = process.argv.includes('直す');
const 記録の日付も = process.argv.includes('記録の日付も');

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

async function 一覧(道) {
  const 出 = [];
  for (let tok = ''; ;) {
    const j = await (
      await fetch(`${根}/${道}?pageSize=300${tok ? `&pageToken=${tok}` : ''}`, { headers: 頭 })
    ).json();
    if (j.error) throw new Error(`${道} を読めません: ${j.error.message}`);
    (j.documents || []).forEach((d) => 出.push(d));
    if (!j.nextPageToken) break;
    tok = j.nextPageToken;
  }
  return 出;
}

// ── 値の直し方 ─────────────────────────────────────────────
/** 数ならミリ秒を返す。日付として無理のない幅（2001〜2100 年）だけ */
function 数の日時(v) {
  const 数 =
    v && ('integerValue' in v ? Number(v.integerValue) : 'doubleValue' in v ? Number(v.doubleValue) : NaN);
  return Number.isFinite(数) && 数 > 978307200000 && 数 < 4102444800000 ? 数 : null;
}
/** 壊れた入れ物（{seconds, nanoseconds}。Timestamp を JSON に通した跡）ならミリ秒 */
function 入れ物の日時(v) {
  const f = v && v.mapValue && v.mapValue.fields;
  if (!f || !f.seconds) return null;
  const 秒 = Number(f.seconds.integerValue ?? f.seconds.doubleValue);
  const ナノ = Number((f.nanoseconds && (f.nanoseconds.integerValue ?? f.nanoseconds.doubleValue)) || 0);
  return Number.isFinite(秒) ? 秒 * 1000 + Math.floor(ナノ / 1e6) : null;
}
const 日時型 = (ミリ秒) => ({ timestampValue: new Date(ミリ秒).toISOString() });

/** 項目 1 つを直す。直さないなら undefined */
function 日時を直す(v, 入れ物も = false) {
  const 数 = 数の日時(v);
  if (数 != null) return 日時型(数);
  if (入れ物も) {
    const 入 = 入れ物の日時(v);
    if (入 != null) return 日時型(入);
  }
  // 時刻の無い 0 は null にする（1970 年と出さない）
  if (v && (v.integerValue === '0' || v.doubleValue === 0)) return { nullValue: null };
  return undefined;
}

/** 入れ物の並び（trail・archers）の中の 1 項目を直す。直さないなら undefined */
function 並びの中を直す(v, 名) {
  const 並び = v && v.arrayValue && v.arrayValue.values;
  if (!Array.isArray(並び)) return undefined;
  let 変えた = 0;
  const 新 = 並び.map((要素) => {
    const f = 要素 && 要素.mapValue && 要素.mapValue.fields;
    if (!f || !(名 in f)) return 要素;
    const 直 = 日時を直す(f[名]);
    if (!直) return 要素;
    変えた++;
    return { mapValue: { fields: Object.assign({}, f, { [名]: 直 }) } };
  });
  return 変えた ? { 値: { arrayValue: { values: 新 } }, 変えた } : undefined;
}

// ── どこの何を直すか ─────────────────────────────────────────
/** @type {Array<{道: (団体: string) => string, 名: string, 項目: Array<{名: string, 入れ物も?: boolean, 並びの中?: string}>, 団体ごと?: boolean}>} */
const 直す所 = [
  { 名: '記録', 団体ごと: true, 道: (g) => `groups/${g}/sessions`, 項目: [{ 名: 'lastModified' }] },
  { 名: '部員', 団体ごと: true, 道: (g) => `groups/${g}/members`, 項目: [{ 名: 'lastModified' }] },
  {
    名: 'ゴミ箱',
    団体ごと: true,
    道: (g) => `groups/${g}/trash`,
    項目: [{ 名: 'lastModified' }, { 名: 'deletedAt', 入れ物も: true }],
  },
  { 名: '卒業生', 団体ごと: true, 道: (g) => `groups/${g}/alumni`, 項目: [{ 名: 'lastModified' }] },
  { 名: '設定', 団体ごと: true, 道: (g) => `groups/${g}/config`, 項目: [{ 名: 'lastModified' }] },
  { 名: '逆引き表', 団体ごと: true, 道: (g) => `groups/${g}/member_lookup`, 項目: [{ 名: 'updatedAt' }] },
  { 名: '練習日', 団体ごと: true, 道: (g) => `groups/${g}/officialPracticeDays`, 項目: [{ 名: 'created' }] },
  {
    名: '団体の非公開情報',
    団体ごと: true,
    道: (g) => `group_accounts/${g}/private`,
    項目: [{ 名: 'createdAt' }, { 名: '同意した日時' }],
  },
  { 名: '所属の証', 道: () => 'member_claims', 項目: [{ 名: 'claimedAt' }] },
  { 名: '不具合の便り', 道: () => 'errorReports', 項目: [{ 名: 'at' }, { 名: 'trail', 並びの中: 'at' }] },
];
if (記録の日付も) {
  for (const 所 of 直す所.filter((x) => x.名 === '記録' || x.名 === 'ゴミ箱')) {
    所.項目.push({ 名: 'date' }, { 名: 'archers', 並びの中: 'lastModified' });
  }
}

/** 項目の道。英数字以外（日本語）はバッククォートで囲む決まり */
const 道の字 = (名) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(名) ? 名 : '`' + 名.replace(/`/g, '\\`') + '`');

// ── 流す ───────────────────────────────────────────────
const 団体たち = new Set([
  ...(await 一覧('group_accounts')).map((d) => d.name.split('/').pop()),
  ...(await 一覧('groups')).map((d) => d.name.split('/').pop()),
]);
console.log(`接続先: ${企画}${直す ? '' : '（数えるだけ）'}${記録の日付も ? '・記録の日付も' : ''}\n`);

const 数え = new Map(); // '記録.lastModified' → 件数
let 直した = 0;
let 飛ばした = 0;
for (const 所 of 直す所) {
  const 道たち = 所.団体ごと ? [...団体たち].map(所.道) : [所.道('')];
  for (const 道 of 道たち) {
    for (const 文書 of await 一覧(道)) {
      const f = 文書.fields || {};
      const 新 = {};
      for (const 項 of 所.項目) {
        if (!(項.名 in f)) continue;
        if (項.並びの中) {
          const 直 = 並びの中を直す(f[項.名], 項.並びの中);
          if (!直) continue;
          新[項.名] = 直.値;
          const 鍵 = `${所.名}.${項.名}[].${項.並びの中}`;
          数え.set(鍵, (数え.get(鍵) || 0) + 直.変えた);
        } else {
          const 直 = 日時を直す(f[項.名], 項.入れ物も);
          if (!直) continue;
          新[項.名] = 直;
          const 鍵 = `${所.名}.${項.名}`;
          数え.set(鍵, (数え.get(鍵) || 0) + 1);
        }
      }
      if (!Object.keys(新).length || !直す) continue;
      const q = Object.keys(新).map((名) => `updateMask.fieldPaths=${encodeURIComponent(道の字(名))}`);
      q.push(`currentDocument.updateTime=${encodeURIComponent(文書.updateTime)}`);
      const r = await fetch(`https://firestore.googleapis.com/v1/${文書.name}?${q.join('&')}`, {
        method: 'PATCH',
        headers: 頭,
        body: JSON.stringify({ fields: 新 }),
      });
      if (r.ok) 直した++;
      else {
        const j = await r.json().catch(() => ({}));
        飛ばした++;
        console.log(`  ⚠ 飛ばした（${j.error?.status || r.status}）: ${道}/…${文書.name.slice(-4)}`);
      }
    }
  }
}

if (!数え.size) {
  console.log('数で入っている日時はありません。');
  process.exit(0);
}
for (const [鍵, 件] of 数え) console.log(`  ${鍵}: ${件}`);
if (!直す) {
  console.log(`\n直すときは: node scripts/convert-dates-to-timestamp.mjs ${対象} 直す`);
  process.exit(0);
}
console.log(
  `\n${直した} 件の文書を直しました。${飛ばした ? `${飛ばした} 件は途中で書き換わったので飛ばしました（もう一度流してください）。` : ''}`
);
