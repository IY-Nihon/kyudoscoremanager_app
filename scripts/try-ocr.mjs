/**
 * 画像の読み取りを、実物の写真で試す道具。
 *
 *   node scripts/try-ocr.mjs docs/ocr-samples/板.jpg 右から 20
 *   node scripts/try-ocr.mjs docs/ocr-samples/板.jpg 左右から 20 --正解 910280:男子
 *
 * 引数
 *   1. 画像のみち（複数枚は , で並べる）
 *   2. 向き（右から / 左から / 左右から）。既定は 右から
 *   3. 1人あたりの射数。既定は 20
 *   --正解 <団体>:<題の一部>  … 本番の記録と1マスずつ突き合わせる（読むだけ）
 *
 * ■ なぜこれが要るか
 * 指示文が画面の中に埋まっていたころは、写真で試すたびに画面を動かす必要が
 * あり、正解と突き合わせながら詰められなかった。指示文は src/ocrPrompts.js に
 * 切り出してあり、ここはそれをそのまま使う。画面と同じものを試している。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { 記録の指示文, 名簿の手がかり } = require('../src/ocrPrompts.js');
const { マスを開く, 一射目からの順にする } = require('../src/ocrCells.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const 引数 = process.argv.slice(2);
const 正解の指定 = (() => {
  const i = 引数.indexOf('--正解');
  if (i < 0) return null;
  const v = 引数[i + 1] || '';
  引数.splice(i, 2);
  return v;
})();
const みち = (引数[0] || '').split(',').filter(Boolean);
const 向き = 引数[1] || '右から';
const 射数 = Number(引数[2]) || 20;
const 模型名 = process.env.OCR_MODEL || 'gemini-2.5-flash';
const 起点 = process.env.OCR_START || '上から';

if (!みち.length) {
  console.error('使い方: node scripts/try-ocr.mjs <画像のみち> [向き] [射数] [--正解 団体:題]');
  process.exit(1);
}

// ── 鍵 ──
const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
// アプリは中継（Cloudflare Workers）経由で鍵を持たないが、手元の計測は Gemini を直接呼ぶ。
// EXPO_PUBLIC_ を付けない名前にしておくと、Expo が束に焼き込まない
const 鍵 = (env.match(/^GEMINI_API_KEY=(.+)$/m) || env.match(/EXPO_PUBLIC_GEMINI_API_KEY=(.+)/) || [])[1]?.trim();
if (!鍵) {
  console.error('.env に GEMINI_API_KEY がありません（手元の計測だけが使う。アプリは中継を呼ぶ）');
  process.exit(1);
}

// ── 名簿（本番の団体から借りる。読むだけ） ──
async function 本番から取る(団体, 道) {
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
  const 根 = `https://firestore.googleapis.com/v1/projects/kyudoscoremanager/databases/(default)/documents`;
  const 素 = (v) => {
    if (!v || 'object' !== typeof v) return v;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('nullValue' in v) return null;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(素);
    if ('mapValue' in v) {
      const o = {};
      for (const [k, x] of Object.entries(v.mapValue.fields || {})) o[k] = 素(x);
      return o;
    }
    return undefined;
  };
  const 出 = [];
  let t = '';
  for (;;) {
    const j = await (
      await fetch(`${根}/groups/${団体}/${道}?pageSize=300${t ? `&pageToken=${t}` : ''}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
    ).json();
    if (j.error) break;
    for (const d of j.documents || []) {
      const o = { id: d.name.split('/').pop() };
      for (const [k, v] of Object.entries(d.fields || {})) o[k] = 素(v);
      出.push(o);
    }
    if (!j.nextPageToken) break;
    t = j.nextPageToken;
  }
  return 出;
}

const [団体, 題の一部] = (正解の指定 || '').split(':');
let 名簿 = [];
let 正解 = null;
if (団体) {
  名簿 = (await 本番から取る(団体, 'members')).map((m) => m.name).filter(Boolean);
  const 記録たち = await 本番から取る(団体, 'sessions');
  const 候補 = 記録たち.filter((r) => (r.title || '').includes(題の一部 || ''));
  候補.sort((a, z) => (z.date || 0) - (a.date || 0));
  正解 = 候補[0];
  if (候補.length > 1) console.log('── 題に当たる記録が' + 候補.length + '件。新しいものを使います: ' + 候補.map((x) => x.title).join(' / '));
}

// ── 指示文 ──
const 指示 = 記録の指示文({
  手がかり: 名簿.length ? 名簿の手がかり(名簿, []) : '',
  射数,
  枚数: みち.length,
  向き,
});

console.log('── 模型:', 模型名, '/ 起点:', 起点, '/ 向き:', 向き, '/ 射数:', 射数, '/ 画像:', みち.join(', '));
console.log('── 名簿の手がかり:', 名簿.length ? 名簿.length + '人' : 'なし');

const genAI = new GoogleGenerativeAI(鍵);
const model = genAI.getGenerativeModel({
  model: 模型名,
  generationConfig: { responseMimeType: 'application/json' },
});

const parts = [{ text: 指示 }];
for (const p of みち) {
  parts.push({ inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(p).toString('base64') } });
}

const 始め = Date.now();
const 返り = await model.generateContent(parts);
const 生 = 返り.response.text();
console.log('── かかった時間:', ((Date.now() - 始め) / 1000).toFixed(1) + '秒');

let 読み;
try {
  読み = JSON.parse(生);
} catch (_e) {
  console.log('JSONとして読めませんでした:');
  console.log(生.slice(0, 2000));
  process.exit(1);
}

fs.writeFileSync('ocr-out.json', JSON.stringify(読み, null, 1));
/** cells を1射ずつに開く。marks で返ってきたときはそのまま使う */
const 開く = (t, r) => {
  if (Array.isArray(r.cells) && r.cells.length) return マスを開く(一射目からの順にする(r.cells, 起点), t.cellStyle || '2射');
  return Array.isArray(r.marks) ? r.marks : [];
};

console.log('── 読み取り（ocr-out.json に書きました）');
for (const t of 読み.teams || []) {
  console.log(`  【${t.name || '(名なし)'}】1立=${t.tachiSize || '?'}射`);
  for (const r of t.rows || []) {
    const 印 = 開く(t, r);
    const m = 印.map((x) => (x === '' ? '・' : x)).join('');
    const 中 = 印.filter((x) => x === '○').length;
    console.log(`    ${String(r.name || '(名なし)').padEnd(10)} ${m}  (${中}中/${印.length}射)  マス${(r.cells || []).length}個`);
  }
}

// ── 正解と突き合わせる ──
if (正解) {
  console.log('\n── 正解（' + 正解.title + '）と突き合わせ');
  const 正解の射手 = (正解.archers || []).filter((a) => a && !a.isSeparator && !a.isTotalCalculator);
  const 読んだ射手 = (読み.teams || []).flatMap((t) => (t.rows || []).map((r) => ({ name: r.name, marks: 開く(t, r) })));
  console.log(`  人数: 読み ${読んだ射手.length}人 / 正解 ${正解の射手.length}人`);
  const 名だけ = (s) => String(s || '').replace(new RegExp('[\\s\\u3000]', 'g'), '');
  let 合った射 = 0;
  let 全射 = 0;
  for (let i = 0; i < Math.max(読んだ射手.length, 正解の射手.length); i++) {
    const 読 = 読んだ射手[i];
    const 正 = 正解の射手[i];
    if (!正) {
      console.log(`  ${i + 1}. 余分: ${読 && 読.name}`);
      continue;
    }
    if (!読) {
      console.log(`  ${i + 1}. 足りない: ${正.name}`);
      continue;
    }
    const 名が合う = 名だけ(読.name) === 名だけ(正.name) || 名だけ(正.name).includes(名だけ(読.name));
    const 読印 = (読.marks || []).map((x) => (x === '' ? '・' : x));
    const 正印 = (正.marks || []).map((x) => (x === '' ? '・' : x));
    let 一致 = 0;
    for (let j = 0; j < 正印.length; j++) {
      全射++;
      if (読印[j] === 正印[j]) {
        一致++;
        合った射++;
      }
    }
    console.log(
      `  ${i + 1}. ${名が合う ? '○' : '×'} 名: 読=${読.name} 正=${正.name}` +
        `  ／ ○×: ${一致}/${正印.length} 一致`
    );
    if (一致 !== 正印.length) {
      console.log(`       読み: ${読印.join('')}`);
      console.log(`       正解: ${正印.join('')}`);
    }
  }
  console.log(`\n  ○×の一致: ${合った射}/${全射} (${全射 ? ((100 * 合った射) / 全射).toFixed(1) : 0}%)`);
}
