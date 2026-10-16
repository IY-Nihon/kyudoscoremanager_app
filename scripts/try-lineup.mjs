/**
 * 立ち順の写真の読み取りを、実物の写真で試す道具（立の分け方と人数だけを出す。名前は出さない）。
 *
 *   node scripts/try-lineup.mjs 写真1.jpg 写真2.jpg ...
 *
 * 写真は名前入りなので倉庫に置かない（手元の作業用の場所から渡す）。
 * 指示文は src/ocrPrompts.js の 立ち順の指示文 をそのまま使う（画面と同じものを試す）。
 * 鍵は .env の GEMINI_API_KEY（手元の計測だけ。アプリは中継を呼ぶ）。模型は OCR_MODEL（既定は本番と同じ）。
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// PROMPT_FILE で別の指示文（直す前の版など）を試せる
const { 立ち順の指示文 } = require(process.env.PROMPT_FILE || '../src/ocrPrompts.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const env = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8');
const 鍵 = (env.match(/^GEMINI_API_KEY=(.+)$/m) ||
  env.match(/EXPO_PUBLIC_GEMINI_API_KEY=(.+)/) ||
  [])[1]?.trim();
if (!鍵) throw new Error('.env に GEMINI_API_KEY がありません');
// 本番の中継と同じく 3.6 を頼み、混んでいれば 3.8・3.7・3.5 へ切り替える（chukei/wrangler.toml の MODEL_CHAIN。
// 切り替え先は考える量 0）。OCR_MODEL で 1 つに決めることもできる
const 並び = process.env.OCR_MODEL
  ? [process.env.OCR_MODEL]
  : ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'];
const 模型たち = 並び.map((名, 番) => ({
  名,
  模型: new GoogleGenerativeAI(鍵).getGenerativeModel({
    model: 名,
    generationConfig: Object.assign(
      { responseMimeType: 'application/json' },
      番 > 0 ? { thinkingConfig: { thinkingBudget: 0 } } : {}
    ),
  }),
}));
const 使った模型 = {};
const 回数 = Number(process.env.KAISU) || 1;

for (const みち of process.argv.slice(2)) {
  const 分け方 = [];
  for (let 回 = 0; 回 < 回数; 回++) {
    // 混雑（503・429）は次の模型へ。並びを使い切ったら少し待って 3 周まで
    let 返り;
    for (let 試し = 0; ; 試し++) {
      const { 名, 模型 } = 模型たち[試し % 模型たち.length];
      try {
        返り = await 模型.generateContent([
          立ち順の指示文({ 枚数: 1, 向き: '右から' }),
          { inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(みち).toString('base64') } },
        ]);
        使った模型[名] = (使った模型[名] || 0) + 1;
        break;
      } catch (誤り) {
        if (試し >= 模型たち.length * 3 || !/503|429|404/.test(String(誤り && 誤り.message))) throw 誤り;
        if ((試し + 1) % 模型たち.length === 0) await new Promise((済) => setTimeout(済, 20000));
      }
    }
    try {
      const j = JSON.parse(返り.response.text());
      分け方.push((j.tachi || []).map((立) => (立.seats || []).length).join('+'));
    } catch (誤り) {
      分け方.push('読めない');
    }
  }
  console.log(みち.split(/[\\/]/).pop().slice(0, 8), 分け方.join(' | '));
}
console.log('使った模型', JSON.stringify(使った模型));
