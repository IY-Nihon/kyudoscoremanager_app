/**
 * 確かめ用の答えを、本番の記録から書き出す。
 *
 *   node scripts/ocr-cells/kiroku-tsukuru.mjs
 *
 * 手で写すと一字ずれる（実測で10番の列が丸ごと違っていた）。読むのは
 * 団体910280 の 9/6「男子リーグ戦第一節」ひとつだけ。並びは記録のまま。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const refresh = JSON.parse(fs.readFileSync(設定, 'utf8')).tokens?.refresh_token;
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
const 根 = 'https://firestore.googleapis.com/v1/projects/kyudoscoremanager/databases/(default)/documents';
const j = await (
  await fetch(`${根}/groups/910280/sessions?pageSize=300`, { headers: { Authorization: `Bearer ${access_token}` } })
).json();
const 素 = (v) => {
  if (!v || 'object' != typeof v) return v;
  if ('stringValue' in v) return v.stringValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(素);
  if ('mapValue' in v) {
    const o = {};
    for (const [k, x] of Object.entries(v.mapValue.fields || {})) o[k] = 素(x);
    return o;
  }
  if ('integerValue' in v) return Number(v.integerValue);
  if ('booleanValue' in v) return v.booleanValue;
  return undefined;
};
let 記録 = null;
for (const d of j.documents || []) {
  const o = {};
  for (const [k, v] of Object.entries(d.fields || {})) o[k] = 素(v);
  if (/男子リーグ/.test(o.title || '')) 記録 = o;
}
if (!記録) throw new Error('男子リーグの記録が見つかりません');

const 射手たち = [];
for (const a of 記録.archers || []) {
  if (a.isSeparator || a.isTotalCalculator) continue;
  // 名字は書き出さない（倉庫は公開なので）。記録の順の番号だけを持つ
  射手たち.push({ 名: String(射手たち.length + 1), 印: (a.marks || []).join('') });
}
// 板の上端に書かれた的中数（写真から人が読んだ）。写しではなく、答えの裏づけ
const 板の数字 = [12, 15, 15, 16, 14, 11, 13, 11, 11, 5, 14, 11, 13, 15, 8, 13];
if (射手たち.length !== 板の数字.length) throw new Error('射手の数が合いません: ' + 射手たち.length);
射手たち.forEach((s, i) => {
  const 当 = [...s.印].filter((c) => c === '\u25cb').length;
  if (s.印.length !== 20 || 当 !== 板の数字[i]) {
    throw new Error(`${s.名}: 印${s.印.length}個 的中${当} なのに板の数字は${板の数字[i]}`);
  }
});

const 逃 = (s) => [...s].map((c) => '\\u' + c.codePointAt(0).toString(16).padStart(4, '0')).join('');
const 本文 = `/**
 * 確かめ用の答え。団体910280 の 9/6「男子リーグ戦第一節」の記録そのもの。
 *
 * このファイルは scripts/ocr-cells/kiroku-tsukuru.mjs が書き出す。手で直さないこと。
 * 並びは記録のまま（1〜8が自校の大前→落、9〜16が相手校の大前→落）。
 * 板の上端の的中数と一致することを、書き出すときに確かめている。
 */
export const 射手たち = [
${射手たち.map((s, i) => `  { 名: '${逃(s.名)}', 印: '${逃(s.印)}', 的中: ${板の数字[i]} },`).join(String.fromCharCode(10))}
];
`;
fs.writeFileSync('scripts/ocr-cells/kiroku.mjs', 本文);
console.log('書き出しました: ' + 射手たち.length + '人');
