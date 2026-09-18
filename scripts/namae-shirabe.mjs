// 短い（縮小されたままの）名前の束を数える道具。B（手で名前を付ける）の下調べ用
//   node scripts/namae-shirabe.mjs src/useScoreStore.js [--top]
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseMod from '@babel/traverse';
const traverse = traverseMod.default || traverseMod;
const [file, ...opt] = process.argv.slice(2);
const topOnly = opt.includes('--top');
const src = fs.readFileSync(file, 'utf8');
const ast = parse(src, { sourceType: 'unambiguous', plugins: ['jsx'], attachComment: false });
const 短いか = (n) => /^[A-Za-z_$][A-Za-z0-9_$]?$/.test(n) || /^[A-Za-z]{1,2}[0-9]$/.test(n);
const 行 = (node) => node.loc ? node.loc.start.line : 0;
function 囲む関数名(path) {
  const f = path.getFunctionParent();
  if (!f) return '(top)';
  const n = f.node;
  if (n.id) return n.id.name;
  const p = f.parentPath;
  if (p.isVariableDeclarator()) return p.node.id.name || '?';
  if (p.isObjectProperty()) return (p.node.key.name || p.node.key.value) + ':';
  if (p.isCallExpression()) return '→' + (p.node.callee.name || (p.node.callee.property && p.node.callee.property.name) || 'call');
  return '(anon)';
}
const 出 = [];
traverse(ast, {
  Scope(path) {
    for (const [name, b] of Object.entries(path.scope.bindings)) {
      if (!短いか(name)) continue;
      if (topOnly && b.scope.block.type !== 'Program') continue;
      出.push({ name, kind: b.kind, line: 行(b.identifier), refs: b.references, fn: 囲む関数名(b.path), scopeLine: 行(b.scope.block) });
    }
  },
});
出.sort((a, b) => a.line - b.line);
for (const x of 出) console.log(`${String(x.line).padStart(5)}  ${x.name.padEnd(3)} ${x.kind.padEnd(6)} refs=${String(x.refs).padEnd(3)} in ${x.fn}`);
console.error(`${出.length} 件`);
