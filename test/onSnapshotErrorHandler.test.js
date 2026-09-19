/**
 * Firestore の見張り（onSnapshot）に、誤りの受け口が付いているかの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 * 受け口を渡さないと、見張りが断られたとき（団体を出たあと・権限が変わったとき・
 * 期限切れ）に SDK が console に「Uncaught Error in snapshot listener」を吐くだけで、
 * 不具合の便りには何も残らない。画面が落ちるわけではないが、何が起きたかを
 * 追えなくなる。2026-09-19 の見直しで 3 か所に受け口が無いのが分かった。
 * 全部の呼び出しに受け口があることを、木を読んで押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

test('onSnapshot の呼び出しは、すべて誤りの受け口（3つ目の引数）を持つ', () => {
  const src = path.join(__dirname, '..', 'src');
  const 無い = [];
  for (const f of fs.readdirSync(src).filter((x) => x.endsWith('.js'))) {
    const 木 = parse(fs.readFileSync(path.join(src, f), 'utf8'), { sourceType: 'unambiguous', plugins: ['jsx'] });
    traverse(木, {
      CallExpression(p) {
        const c = p.node.callee;
        const 名 = c.type === 'MemberExpression' ? c.property.name : c.name;
        if (名 !== 'onSnapshot') return;
        // onSnapshot(対象, 受け取る, 誤りの受け口) の形。第2引数が options のときは第4引数
        const 引 = p.node.arguments;
        const 受け口 = 引.length >= 3 && ['ArrowFunctionExpression', 'FunctionExpression', 'Identifier'].includes(引[引.length - 1].type);
        if (!受け口) 無い.push(`${f}:${p.node.loc.start.line}`);
      },
    });
  }
  assert.deepStrictEqual(無い, [], '誤りの受け口が無い onSnapshot がある');
});
