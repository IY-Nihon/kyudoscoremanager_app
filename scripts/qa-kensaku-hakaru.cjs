'use strict';
/**
 * AI の相談役の Q&A 探し（selectQAs）が、使う人の言い回しで正しい Q&A を拾えるかを数える。
 *   node scripts/qa-kensaku-hakaru.cjs        … 外れだけ出す
 *   node scripts/qa-kensaku-hakaru.cjs 全部   … 全部の順位を出す
 * 質問は test/helpers/qaKensakuMondai.cjs。基本の 3 件（Q0・Q1・Q52）は必ず渡るので、それ以外の順位で見る
 */
const { selectQAs } = require('../src/chatKnowledge.js');
const 問題 = require(process.argv[3] === '2' ? '../test/helpers/qaKensakuMondai2.cjs' : '../test/helpers/qaKensakuMondai.cjs');
const 全部 = process.argv[2] === '全部'; // 2 組目は  node scripts/qa-kensaku-hakaru.cjs - 2

let 当たり = 0;
let 上位3 = 0;
for (const { 問, 正 } of 問題) {
  // 渡す順は「近いものほど後ろ」。頭の番号だけ拾って、近い順に並べ直す
  const 番号たち = selectQAs(問, false)
    .split('\n')
    .map((行) => (行.match(/^(Q\d+):/) || [])[1])
    .filter(Boolean)
    .reverse();
  const 順位 = 正.map((q) => 番号たち.indexOf(q)).filter((i) => i >= 0);
  const 最良 = 順位.length ? Math.min(...順位) + 1 : null;
  if (最良) 当たり++;
  if (最良 && 最良 <= 3) 上位3++;
  if (全部 || !最良) console.log(`${最良 ? 最良 + '位' : '外れ'}\t${問}\t正:${正.join('/')}\t渡した:${番号たち.slice(0, 5).join(',')}`);
}
console.log(`当たり ${当たり}/${問題.length}（3 位以内 ${上位3}）`);
