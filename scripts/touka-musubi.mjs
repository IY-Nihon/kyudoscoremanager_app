/**
 * touka-kurabe の正規形（.moto.js / .ima.js）から、参照が指す宣言が変わっていないかを見る。
 *
 *   node scripts/touka-musubi.mjs <touka-kurabe の出力フォルダー>
 *
 * 参照している行（名前をぜんぶ v に潰す）ごとに、その行の参照が指している宣言の行
 * （名前は出た順に付け直す）の集まりを両側で比べる。名前を付け替えただけなら同じ。
 * 内側の同名に隠されて別の変数を指すようになった参照は、宣言の行が変わるので出る。
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseMod from '@babel/traverse';
const traverse = traverseMod.default || traverseMod;

const 出 = path.resolve(process.argv[2]);
const 名の形 = /\bv[0-9a-z]+_\d+\b/g;
const 潰す = (l) => l.trim().replace(名の形, 'v');
const 順に = (l) => {
  const 表 = new Map();
  return (
    l
      .trim()
      // 書き方だけの違いは見ない：var/const/let、行末の , と ;、Fragment の出どころ、{...x} と x
      .replace(/^(var|const|let)\s+/, '')
      .replace(/[,;]\s*$/, '')
      .replace(/__I_theme_jsx_jsx_runtime__\.Fragment/g, '__I_react__.Fragment')
      .replace(名の形, (m) => {
        if (!表.has(m)) 表.set(m, `v${表.size + 1}`);
        return 表.get(m);
      })
  );
};

function 集める(code) {
  const ast = parse(code, { sourceType: 'unambiguous' });
  const 行 = code.split(/\r?\n/);
  const 表 = new Map(); // 潰した参照行 → Map(宣言の行 → 数)
  traverse(ast, {
    Identifier(p) {
      if (!p.isReferencedIdentifier()) return;
      const b = p.scope.getBinding(p.node.name);
      if (!b) return;
      const k = 潰す(行[p.node.loc.start.line - 1]);
      const d = 順に(行[b.identifier.loc.start.line - 1]);
      if (!表.has(k)) 表.set(k, new Map());
      表.get(k).set(d, (表.get(k).get(d) || 0) + 1);
    },
  });
  return 表;
}

let 合計 = 0;
for (const f of fs.readdirSync(出).filter((x) => x.endsWith('.moto.js'))) {
  const 名 = f.replace('.moto.js', '');
  const A = 集める(fs.readFileSync(path.join(出, f), 'utf8'));
  const B = 集める(fs.readFileSync(path.join(出, 名 + '.ima.js'), 'utf8'));
  const 差 = [];
  for (const [k, da] of A) {
    const db = B.get(k);
    if (!db) continue; // その行そのものが無くなった（別の差として見る）
    const 文字 = (m) =>
      [...m]
        .map(([d, n]) => `${n}× ${d}`)
        .sort()
        .join(' ｜ ');
    const sa = 文字(da);
    const sb = 文字(db);
    if (sa !== sb)
      差.push(`  ${k.slice(0, 120)}\n     元: ${sa.slice(0, 200)}\n     今: ${sb.slice(0, 200)}`);
  }
  合計 += 差.length;
  if (差.length) console.log(`== ${名}: ${差.length}\n${差.join('\n')}`);
}
console.log(`合計 ${合計}`);
