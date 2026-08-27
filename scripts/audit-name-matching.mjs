/**
 * 「その射は誰のものか」を氏名で拾う価値があるかを、実データで数える。読むだけ。
 *
 *   node scripts/audit-name-matching.mjs        （検証環境）
 *   node scripts/audit-name-matching.mjs prod   （本番）
 *
 * 分析の集計は、射手に部員IDが付いていればそれで判定できる。付いていない射
 * （ゲスト、名簿に無い名前で入れたもの、この仕組みが入る前の古い記録）だけが
 * 氏名での判定に回る。その量と、氏名で本当に一意に決まるのかを見る。
 *
 * 見るもの
 *   1. ○×が入っている射のうち、部員IDが付いていないものの数と割合
 *   2. IDの無い射の氏名が、名簿の誰と一致するか（1人／複数／該当なし）
 *   3. 途中交代のうち、交代相手に部員IDが付いていないものの数
 *   4. 名簿の中の同姓同名（空白を無視して重なる名前）
 *
 * 認証は Firebase CLI の権限を使う。事前に `firebase login` が済んでいること。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] || 'stg';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/audit-name-matching.mjs <stg|prod>');
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

const 根 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;
async function 取る(道) {
  const 出 = [];
  let token = '';
  for (;;) {
    // showMissing=true が要る。groups/{id} の本体に項目が無く、下に members や
    // sessions だけがぶら下がっている団体は、既定の一覧に返ってこない。
    // これを付けないと、そういう団体を丸ごと見落とす
    const u = `${根}/${道}?pageSize=300&showMissing=true${token ? `&pageToken=${token}` : ''}`;
    const j = await (await fetch(u, { headers: { Authorization: `Bearer ${access_token}` } })).json();
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

/** 空白を落とす。氏名の突き合わせはこの形で行う */
const 詰める = (s) => String(s || '').replace(/[\s\u3000]+/g, '');

const 団体 = new Set();
for (const d of await 取る('group_accounts')) {
  const id = d.fields?.groupId?.stringValue || d.name.split('/').pop();
  if (id) 団体.add(String(id));
}
for (const d of await 取る('groups')) 団体.add(d.name.split('/').pop());
// 中身の無い文書も混じる。id さえ拾えれば下の subcollection は読める

console.log(`接続先: ${企画}（読むだけ）`);
console.log(`団体 ${団体.size} 件\n`);

const 合計 = {
  射: 0,
  IDあり: 0,
  IDなし: 0,
  氏名で1人: 0,
  氏名で複数: 0,
  氏名で該当なし: 0,
  交代: 0,
  交代のIDなし: 0,
  同姓同名の団体: 0,
};
const 気になる = [];
const 氏名で拾える人 = new Map(); // 氏名でしか拾えない射が、誰に何射あるか

for (const g of [...団体].sort()) {
  const [部員, 卒業, 記録] = await Promise.all([
    取る(`groups/${g}/members`),
    取る(`groups/${g}/alumni`),
    取る(`groups/${g}/sessions`),
  ]);
  const 名簿 = [...部員, ...卒業].map((d) => 素にする({ mapValue: { fields: d.fields || {} } }));
  if (!名簿.length && !記録.length) continue;

  // 名簿の中の同姓同名
  const 名前の数 = new Map();
  for (const m of 名簿) {
    const k = 詰める(m.name);
    if (!k) continue;
    名前の数.set(k, (名前の数.get(k) || 0) + 1);
  }
  const 重なり = [...名前の数.entries()].filter(([, n]) => n > 1);
  if (重なり.length) {
    合計.同姓同名の団体++;
    気になる.push(`団体${g}: 同姓同名 ${重なり.map(([n, c]) => `${n}×${c}`).join(', ')}`);
  }

  let この団体のIDなし = 0;
  for (const d of 記録) {
    const s = 素にする({ mapValue: { fields: d.fields || {} } });
    for (const a of Array.isArray(s.archers) ? s.archers : []) {
      if (!a || !Array.isArray(a.marks)) continue;
      const 交代 = a.substitutions || {};
      const 交代のid = a.substitutionIds || {};
      const 位置たち = Object.keys(交代)
        .map(Number)
        .sort((x, y) => x - y);
      for (const 位置 of 位置たち) {
        合計.交代++;
        if (!交代のid[位置]) 合計.交代のIDなし++;
      }
      a.marks.forEach((印, 射目) => {
        if (印 !== '○' && 印 !== '×') return;
        合計.射++;
        let id = a.memberId;
        let 名 = a.name || '';
        for (const 位置 of 位置たち) {
          if (位置 > 射目) break;
          id = 交代のid[位置] || undefined;
          名 = 交代[位置] || '';
        }
        if (id) {
          合計.IDあり++;
          return;
        }
        合計.IDなし++;
        この団体のIDなし++;
        const k = 詰める(名);
        const 当たり = k ? 名前の数.get(k) || 0 : 0;
        if (当たり === 1) {
          合計.氏名で1人++;
          const 鍵 = g + '/' + k;
          氏名で拾える人.set(鍵, (氏名で拾える人.get(鍵) || 0) + 1);
        }
        else if (当たり > 1) 合計.氏名で複数++;
        else 合計.氏名で該当なし++;
      });
    }
  }
  if (この団体のIDなし > 0) {
    気になる.push(`団体${g}: 部員IDの無い射 ${この団体のIDなし} 射（記録 ${記録.length} 件）`);
  }
}

const 割 = (n) => (合計.射 > 0 ? ((n / 合計.射) * 100).toFixed(2) + '%' : '—');

console.log('=== ○× が入っている射 ===');
console.log(`  合計          ${合計.射}`);
console.log(`  部員IDあり    ${合計.IDあり}  (${割(合計.IDあり)})`);
console.log(`  部員IDなし    ${合計.IDなし}  (${割(合計.IDなし)})`);
console.log('');
console.log('=== 部員IDの無い射を、氏名で引いたら ===');
console.log(`  名簿にぴったり1人   ${合計.氏名で1人}   ← 氏名で拾うと成績に入る`);
console.log(`  名簿に複数該当      ${合計.氏名で複数}   ← 取り違えの危険`);
console.log(`  名簿に該当なし      ${合計.氏名で該当なし}   ← ゲスト。どの規則でも入らない`);
console.log('');
console.log('=== 途中交代 ===');
console.log(`  合計 ${合計.交代} / うち相手に部員IDが無い ${合計.交代のIDなし}`);
console.log('');
console.log(`=== 名簿の同姓同名がある団体: ${合計.同姓同名の団体} 件 ===`);
if (氏名で拾える人.size) {
  console.log('');
  console.log('=== 氏名でしか拾えない射の内訳（この人たちの的中率が変わり得る）===');
  for (const [鍵, n] of [...氏名で拾える人.entries()].sort((a, b) => b[1] - a[1])) {
    console.log('  ' + n + ' 射   ' + 鍵);
  }
}
if (気になる.length) {
  console.log('');
  console.log('--- 内訳 ---');
  for (const x of 気になる.slice(0, 40)) console.log('  ' + x);
  if (気になる.length > 40) console.log(`  …ほか ${気になる.length - 40} 件`);
}
