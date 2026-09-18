// 縮小されたままの名前を、意味のある名前に付け替える道具（B の作業用）
//   node scripts/namae-tsukeru.mjs src/useScoreStore.js 255:fb=firebaseの器 313:p=… …
// 「行:旧=新」で束（binding）を指す。行はその束が宣言された行。
// 参照の位置だけを文字列で差し替えるので、他の行は動かない。最後に prettier で整える
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseMod from '@babel/traverse';
import * as prettier from 'prettier';
import * as t from '@babel/types';
const traverse = traverseMod.default || traverseMod;

const [file, ...指定] = process.argv.slice(2);
let src = fs.readFileSync(file, 'utf8');
const ast = parse(src, { sourceType: 'unambiguous', plugins: ['jsx'], attachComment: false, ranges: true });

const 束たち = new Map(); // "行:名" → binding
traverse(ast, {
  Scope(p) {
    for (const [name, b] of Object.entries(p.scope.bindings)) {
      const 鍵 = `${b.identifier.loc.start.line}:${name}`;
      if (!束たち.has(鍵)) 束たち.set(鍵, b);
    }
  },
});

const 差し替え = []; // { start, end, text }
const 困った = []; // まとめて報告する（1つずつ止まると往復が増える）
const 使った名 = new Set();
for (const s of 指定) {
  const m = s.match(/^(\d+):([^=]+)=(.+)$/);
  if (!m) { console.error('形が違う:', s); process.exit(1); }
  const [, 行, 旧, 新] = m;
  if (!t.isValidIdentifier(新)) { console.error(`名前に使えない字がある: ${新}`); process.exit(1); }
  const b = 束たち.get(`${行}:${旧}`);
  if (!b) { 困った.push(`見つからない: ${行}:${旧}`); continue; }
  // 新しい名前が、その束の見える範囲で既に使われていないか
  if (b.scope.hasBinding(新) || b.scope.hasGlobal(新)) { 困った.push(`${行}:${旧} → ${新} は既に使われている`); continue; }
  let 隠れる = false;
  for (const p of b.referencePaths) {
    if (p.scope.getBinding(新) && p.scope.getBinding(新) !== b.scope.getBinding(新)) { 困った.push(`${行}:${旧} → ${新} は ${p.node.loc.start.line} 行で内側の ${新} に隠れる`); 隠れる = true; break; }
  }
  if (隠れる) continue;
  const 節 = [b.identifier, ...b.referencePaths.map((p) => p.node)];
  for (const v of b.constantViolations) {
    const n = v.node;
    if (v.isAssignmentExpression() && n.left.type === 'Identifier') 節.push(n.left);
    else if (v.isUpdateExpression() && n.argument.type === 'Identifier') 節.push(n.argument);
    else if (v.isVariableDeclarator() && n.id.type === 'Identifier') 節.push(n.id);
    else if (v.isForXStatement() || v.isForOfStatement() || v.isForInStatement()) { const l = n.left; if (l.type === 'Identifier') 節.push(l); }
    else { console.error(`${行}:${旧}: ${n.type}（${n.loc.start.line} 行）の書き換えは扱えない`); process.exit(1); }
  }
  for (const n of 節) {
    if (n.type !== 'Identifier' && n.type !== 'JSXIdentifier') continue;
    差し替え.push({ start: n.start, end: n.end, text: 新, node: n });
  }
  使った名.add(`${旧}→${新}（${節.length} 箇所）`);
}
if (困った.length) { for (const x of 困った) console.error(x); process.exit(1); }
// 省略形の { a } は { a: 新 } に、{ a } の分解は { a: 新 } に
const 省略 = new Set();
traverse(ast, {
  ObjectProperty(p) {
    if (p.node.shorthand) 省略.add(p.node.value.type === 'AssignmentPattern' ? p.node.value.left : p.node.value);
  },
});
// d-- は参照と書き換えの両方に数えられるので、同じ位置は1度だけ
const 見た = new Set();
const 一意 = 差し替え.filter((d) => !見た.has(d.start) && 見た.add(d.start));
差し替え.length = 0;
差し替え.push(...一意);
差し替え.sort((a, b) => b.start - a.start);
for (const d of 差し替え) {
  const 元 = src.slice(d.start, d.end);
  const 文 = 省略.has(d.node) ? `${元}: ${d.text}` : d.text;
  src = src.slice(0, d.start) + 文 + src.slice(d.end);
}
const 設定 = await prettier.resolveConfig(path.resolve('.prettierrc.json'));
src = await prettier.format(src, Object.assign({}, 設定, { parser: 'babel', filepath: file, objectWrap: 'collapse' }));
// { activeGroupId: activeGroupId } のようになった所は省略形に戻す
src = src.replace(/([{,]\s*)([A-Za-z_$぀-鿿][\w$぀-鿿]*): \2(?=\s*[,}])/g, '$1$2');
src = await prettier.format(src, Object.assign({}, 設定, { parser: 'babel', filepath: file, objectWrap: 'collapse' }));
fs.writeFileSync(file, src);
for (const x of 使った名) console.log(x);
