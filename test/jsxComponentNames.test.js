/**
 * JSX の部品の名前が、画面の中の変数に隠されていないかの検査（2026-10-05）。
 *
 *   npm test
 *
 * 設定画面から書き出しの窓を切り出したとき、部品に「書き出しの窓」と名付けたが、設定画面の中には
 * 窓を開いているかを持つ同じ名前の変数（useState の true/false）があった。<書き出しの窓 /> は
 * 部品ではなく true/false を描こうとして、設定画面ぜんぶが「予期せぬエラー」で落ちた（React の #130）。
 * 未定義の名前の検査（eslint.undef.mjs）は、名前があるので拾えない。
 *
 * ここでは src の全ファイルの <部品 /> について、その名前がどこで宣言されたかを辿り、
 * 部品の外側の関数の中の分割代入（useState の [値, 置く] など）や、数・文字・真偽の値だった
 * ときに落とす。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const 根 = path.join(__dirname, '..', 'src');

/** JSX の名前のうち、HTML の要素（小文字の英字で始まる）でないもの＝部品 */
const 部品か = (名) => !/^[a-z]/.test(名);

test('JSX の部品の名前が、画面の中の値（useState の値など）に隠されていない', () => {
  const まずい = [];
  for (const 名前 of fs.readdirSync(根).filter((f) => f.endsWith('.js'))) {
    const 中身 = fs.readFileSync(path.join(根, 名前), 'utf8');
    if (!中身.includes('<')) continue;
    let 木;
    try {
      木 = parser.parse(中身, { sourceType: 'unambiguous', plugins: ['jsx'] });
    } catch {
      continue;
    }
    traverse(木, {
      JSXOpeningElement(p) {
        const n = p.node.name;
        if (n.type !== 'JSXIdentifier' || !部品か(n.name)) return;
        const b = p.scope.getBinding(n.name);
        if (!b) return; // 未定義は eslint.undef.mjs が拾う
        const 宣言 = b.path;
        // 分割代入の一つ（const [窓, 窓を出す] = useState(...) など）
        if (宣言.isVariableDeclarator() && 宣言.node.id.type === 'ArrayPattern') {
          まずい.push(`${名前}:${n.loc.start.line} <${n.name}> が分割代入の値（${宣言.node.loc.start.line} 行）を指している`);
          return;
        }
        // 数・文字・真偽の値
        if (宣言.isVariableDeclarator() && 宣言.node.init) {
          const t = 宣言.node.init.type;
          if (t === 'BooleanLiteral' || t === 'NumericLiteral' || t === 'StringLiteral') {
            まずい.push(`${名前}:${n.loc.start.line} <${n.name}> が ${t} を指している`);
          }
        }
        // 関数の引数で、部品として受け取る名前（Icon など）は許す。ここでは見ない
      },
    });
  }
  assert.deepStrictEqual(まずい, [], まずい.join('\n'));
});
