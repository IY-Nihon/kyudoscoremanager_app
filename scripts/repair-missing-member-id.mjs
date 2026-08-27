/**
 * 氏名だけで入っている射手に、部員IDを付け直す。
 *
 *   node scripts/repair-missing-member-id.mjs stg          （見るだけ）
 *   node scripts/repair-missing-member-id.mjs prod         （見るだけ）
 *   node scripts/repair-missing-member-id.mjs prod --apply （書き込む）
 *
 * 成績の集計は部員IDだけで判定する（src/statsRules.js）。名簿から選ばずに
 * 氏名だけで入れた射手は、どの成績にも入らない。その射手のうち、氏名が
 * 名簿の1人だけとぴったり一致するものに、部員IDを入れておく。
 *
 * 直す条件（すべて満たすものだけ）
 *   ・射手に memberId が無い
 *   ・○ か × が1つ以上入っている（空の行は触らない）
 *   ・氏名（空白を除く）が、その団体の名簿のちょうど1人と一致する
 *   ・その団体の名簿に同姓同名がいない
 *
 * 途中交代の相手（substitutionIds）も同じ条件で埋める。
 *
 * --apply を付けない限り、何も書き込まない。付けたときは archers と
 * lastModified だけを書き換える（他の端末に届くよう時刻を進める）。
 * 走らせる前に必ず見るだけで実行し、変更の一覧を確かめること。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 引数 = process.argv.slice(2);
const 対象 = 引数.find((a) => a === 'stg' || a === 'prod') || 'stg';
const 書く = 引数.includes('--apply');
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

const 根 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;
const 頭 = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };

async function 取る(道) {
  const 出 = [];
  let token = '';
  for (;;) {
    // showMissing=true が要る。groups/{id} の本体に項目が無く、下に members や
    // sessions だけがぶら下がっている団体は、既定の一覧に返ってこない。
    // これを付けないと、そういう団体を丸ごと見落とす
    const u = `${根}/${道}?pageSize=300&showMissing=true${token ? `&pageToken=${token}` : ''}`;
    const j = await (await fetch(u, { headers: 頭 })).json();
    if (j.error) return 出;
    (j.documents || []).forEach((d) => 出.push(d));
    if (!j.nextPageToken) break;
    token = j.nextPageToken;
  }
  return 出;
}

/** Firestore の値の入れ物をほどく */
function 素にする(v) {
  if (!v || typeof v !== 'object') return v;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(素にする);
  if ('mapValue' in v) {
    const 出 = {};
    for (const [k, x] of Object.entries(v.mapValue.fields || {})) 出[k] = 素にする(x);
    return 出;
  }
  return undefined;
}

/** 素の値を Firestore の入れ物に戻す */
function 入れ物にする(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(入れ物にする) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, x] of Object.entries(v)) fields[k] = 入れ物にする(x);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

const 詰める = (s) => String(s || '').replace(/[\s\u3000]+/g, '');
const 引いた射か = (印) => 印 === '○' || 印 === '×';

const 団体 = new Set();
for (const d of await 取る('group_accounts')) {
  const id = d.fields?.groupId?.stringValue || d.name.split('/').pop();
  if (id) 団体.add(String(id));
}
for (const d of await 取る('groups')) 団体.add(d.name.split('/').pop());
// 中身の無い文書も混じる。id さえ拾えれば下の subcollection は読める

console.log(`接続先: ${企画}`);
console.log(書く ? '⚠ --apply あり。書き込みます\n' : '見るだけ（--apply を付けると書き込みます）\n');

let 直す予定 = 0;
let 直した記録 = 0;
const 一覧 = [];

for (const g of [...団体].sort()) {
  const [部員, 卒業, 記録] = await Promise.all([
    取る(`groups/${g}/members`),
    取る(`groups/${g}/alumni`),
    取る(`groups/${g}/sessions`),
  ]);
  const 名簿 = [...部員, ...卒業].map((d) => 素にする({ mapValue: { fields: d.fields || {} } }));

  // 氏名 → 部員。同姓同名がいる名前は引かない（取り違えるより直さない）
  const 引き = new Map();
  const 重なり = new Set();
  for (const m of 名簿) {
    const k = 詰める(m.name);
    if (!k || !m.id) continue;
    if (引き.has(k)) 重なり.add(k);
    引き.set(k, m);
  }
  for (const k of 重なり) 引き.delete(k);

  for (const d of 記録) {
    const s = 素にする({ mapValue: { fields: d.fields || {} } });
    const archers = Array.isArray(s.archers) ? s.archers : [];
    let 変えた = false;
    const 新しい = archers.map((a) => {
      if (!a || !Array.isArray(a.marks)) return a;
      const 引いた = a.marks.filter(引いた射か).length;
      let 次 = a;

      // ① 射手そのもの
      if (!a.memberId && 引いた > 0) {
        const 本人 = 引き.get(詰める(a.name));
        if (本人) {
          次 = Object.assign({}, 次, { memberId: 本人.id, isGuest: false });
          変えた = true;
          直す予定 += 引いた;
          一覧.push(`団体${g} / 記録${s.id || d.name.split('/').pop()} / ${a.name} → ${本人.id}（${引いた}射）`);
        }
      }

      // ② 途中交代の相手
      const 交代 = 次.substitutions || {};
      const 交代のid = Object.assign({}, 次.substitutionIds || {});
      let 交代を変えた = false;
      for (const 位置 of Object.keys(交代)) {
        if (交代のid[位置]) continue;
        const 本人 = 引き.get(詰める(交代[位置]));
        if (!本人) continue;
        交代のid[位置] = 本人.id;
        交代を変えた = true;
        // その交代が効く射数を数える。次の交代の手前まで
        const 位置たち = Object.keys(交代)
          .map(Number)
          .sort((x, y) => x - y);
        const 次の位置 = 位置たち.find((x) => x > Number(位置));
        const 終わり = 次の位置 === undefined ? 次.marks.length : 次の位置;
        let 数 = 0;
        for (let i = Number(位置); i < 終わり; i++) if (引いた射か(次.marks[i])) 数++;
        直す予定 += 数;
        一覧.push(
          `団体${g} / 記録${s.id || d.name.split('/').pop()} / 交代${位置}射目〜: ${交代[位置]} → ${本人.id}（${数}射）`
        );
      }
      if (交代を変えた) {
        次 = Object.assign({}, 次, { substitutionIds: 交代のid });
        変えた = true;
      }
      return 次;
    });

    if (!変えた) continue;
    直した記録++;
    if (!書く) continue;

    const 道 = d.name.split('/documents/')[1];
    const u = `${根}/${道}?updateMask.fieldPaths=archers&updateMask.fieldPaths=lastModified`;
    const 本文 = {
      fields: {
        archers: 入れ物にする(新しい),
        // 他の端末に届くよう時刻を進める。進めないと、古い写しを持つ端末が
        // 次に送ったときに、この直しを上書きしてしまう
        lastModified: { integerValue: String(Date.now()) },
      },
    };
    const r = await fetch(u, { method: 'PATCH', headers: 頭, body: JSON.stringify(本文) });
    if (!r.ok) {
      console.error('  書き込みに失敗: ' + 道 + ' ' + r.status + ' ' + (await r.text()).slice(0, 200));
      process.exitCode = 1;
    }
  }
}

console.log(`直す射手: ${一覧.length} 件 / 直る射: ${直す予定} 射 / 触る記録: ${直した記録} 件\n`);
for (const x of 一覧) console.log('  ' + x);
if (!書く && 一覧.length) {
  console.log('\n書き込むには --apply を付けてください。');
}
