/**
 * 取り戻したコードに残る、読みにくい「形」だけを書き換える道具（2026-10-24）。意味は変えない。
 *
 *   node scripts/seiri-katachi.mjs src/*.js src/ocr/*.js App.js   … 書き換える
 *   node scripts/seiri-katachi.mjs --見るだけ src/*.js             … 数えるだけ
 *
 * 書き換えるもの（元の束を縮めたときの書き方。scripts/yomiyasuku.mjs の残り）
 *   1. 逆さの比べ        'group' === 役割            → 役割 === 'group'
 *      typeof を比べる == は === にする（typeof はいつも文字列なので同じ）
 *   2. 文としての &&・||  a && b();                    → if (a) b();     a || b(); → if (!a) b();
 *   3. 文としての ? :     c ? x() : y();               → if (c) x(); else y();
 *   4. 文としてのカンマ   (a(), b());                   → a(); b();
 *   5. return のカンマ    return (a(), b);              → a(); return b;
 *   6. => のカンマ        () => (a(), b)                → () => { a(); return b; }
 *
 * 書き換えは、その箇所の元の文字列を組み替えるだけにして、ほかは触らない（コメントや並びを崩さない）。
 * 重なる箇所は外側から 1 つずつ。変わらなくなるまで繰り返し、最後に prettier で整える。
 * 書き換えたあとは npm test・lint・e2e で確かめる。
 */
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as prettier from 'prettier';

const traverse = traverseModule.default || traverseModule;
const 引数 = process.argv.slice(2);
const 見るだけ = 引数.includes('--見るだけ');
const ファイルたち = 引数.filter((a) => !a.startsWith('--'));

const 決まった値か = (n) =>
  ['StringLiteral', 'NumericLiteral', 'NullLiteral', 'BooleanLiteral', 'BigIntLiteral'].includes(n.type) ||
  (n.type === 'Identifier' && n.name === 'undefined') ||
  (n.type === 'TemplateLiteral' && n.expressions.length === 0) ||
  (n.type === 'UnaryExpression' && n.operator === '-' && n.argument.type === 'NumericLiteral');
const typeofか = (n) => n.type === 'UnaryExpression' && n.operator === 'typeof';

/** その節の元の文字列。括弧で囲まれていた節は括弧ごと返す */
const 字 = (code, n) => {
  const s = code.slice(n.start, n.end);
  return n.extra && n.extra.parenthesized ? '(' + s + ')' : s;
};

/** 2 つの節の間にあるコメント（カンマや空白は捨てる） */
function 間のコメント(code, 前の終わり, 次の始め, comments) {
  return comments
    .filter((c) => c.start >= 前の終わり && c.end <= 次の始め)
    .map((c) => code.slice(c.start, c.end))
    .join('\n');
}

/** 式を「文の並び」にする（カンマは文に分け、&&・||・? : は if にする） */
function 文にする(code, e, comments) {
  if (e.type === 'SequenceExpression') {
    return e.expressions
      .map((x, i) => {
        const 前 = i > 0 ? 間のコメント(code, e.expressions[i - 1].end, x.start, comments) : '';
        return (前 ? 前 + '\n' : '') + 文にする(code, x, comments);
      })
      .join('\n');
  }
  const 前置き = (c) => (c ? c + '\n' : '');
  if (e.type === 'LogicalExpression' && (e.operator === '&&' || e.operator === '||')) {
    const 条件 = e.operator === '&&' ? 字(code, e.left) : '!(' + 字(code, e.left) + ')';
    return (
      'if (' +
      条件 +
      ') {\n' +
      前置き(間のコメント(code, e.left.end, e.right.start, comments)) +
      文にする(code, e.right, comments) +
      '\n}'
    );
  }
  if (e.type === 'ConditionalExpression') {
    return (
      'if (' +
      字(code, e.test) +
      ') {\n' +
      前置き(間のコメント(code, e.test.end, e.consequent.start, comments)) +
      文にする(code, e.consequent, comments) +
      '\n} else {\n' +
      前置き(間のコメント(code, e.consequent.end, e.alternate.start, comments)) +
      文にする(code, e.alternate, comments) +
      '\n}'
    );
  }
  return 字(code, e) + ';';
}

/** カンマの式を「前の文 + 最後の値」に分ける */
function 最後の値と前の文(code, e, comments) {
  const 前 = e.expressions.slice(0, -1);
  const 最後 = e.expressions[e.expressions.length - 1];
  const 前の文 = 前
    .map((x, i) => {
      const c = i > 0 ? 間のコメント(code, 前[i - 1].end, x.start, comments) : '';
      return (c ? c + '\n' : '') + 文にする(code, x, comments);
    })
    .join('\n');
  const 最後の前 = 間のコメント(code, 前[前.length - 1].end, 最後.start, comments);
  return { 前の文: 前の文 + (最後の前 ? '\n' + 最後の前 : ''), 最後: 字(code, 最後) };
}

/** 1 回なめて、重ならない書き換えを集める */
function 書き換えを集める(code, ast) {
  const 書き換え = [];
  const comments = ast.comments || [];
  // 書き換える範囲にあったコメントは、新しい文にも必ず残す（組み替えの途中で落ちたものは頭に付け直す）
  const 足す = (start, end, 新, 種) => {
    const 落ちた = comments
      .filter((c) => c.start >= start && c.end <= end)
      .map((c) => code.slice(c.start, c.end))
      .filter((字) => !新.includes(字));
    書き換え.push({ start, end, 新: (落ちた.length ? 落ちた.join('\n') + '\n' : '') + 新, 種 });
  };
  traverse(ast, {
    ExpressionStatement(p) {
      const e = p.node.expression;
      const 文の中 = ['BlockStatement', 'Program', 'SwitchCase'].includes(p.parent.type);
      const 包む = (s) => (文の中 ? s : '{\n' + s + '\n}');
      if (e.type === 'SequenceExpression') 足す(p.node.start, p.node.end, 包む(文にする(code, e, comments)), 'カンマの文');
      else if (e.type === 'LogicalExpression' && (e.operator === '&&' || e.operator === '||'))
        足す(p.node.start, p.node.end, 包む(文にする(code, e, comments)), '&&・|| の文');
      else if (e.type === 'ConditionalExpression') 足す(p.node.start, p.node.end, 包む(文にする(code, e, comments)), '? : の文');
    },
    VariableDeclaration(p) {
      // const // 説明 \n 名前 = … → // 説明 \n const 名前 = …（コメントを const の前へ）
      const 最初 = p.node.declarations[0];
      const 間 = comments.filter((c) => c.start > p.node.start && c.end <= 最初.start);
      if (!間.length) return;
      const 説明 = 間.map((c) => code.slice(c.start, c.end)).join('\n');
      足す(p.node.start, 最初.start, 説明 + '\n' + p.node.kind + ' ', 'const の中のコメント');
    },
    IfStatement(p) {
      // if ((a(), b)) … → a(); if (b) …
      const t = p.node.test;
      if (t.type !== 'SequenceExpression') return;
      const 文の中 = ['BlockStatement', 'Program', 'SwitchCase'].includes(p.parent.type);
      const { 前の文, 最後 } = 最後の値と前の文(code, t, comments);
      const 残り = code.slice(t.end + (t.extra && t.extra.parenthesized ? 1 : 0), p.node.end);
      // 残り は「) 本体…」。if の括弧を閉じ直す
      const s = 前の文 + '\nif (' + 最後 + 残り;
      足す(p.node.start, p.node.end, 文の中 ? s : '{\n' + s + '\n}', 'if のカンマ');
    },
    ReturnStatement(p) {
      const a = p.node.argument;
      // return void (a(), b()); → a(); b(); return;
      // return void a(); → a(); return;
      if (a && a.type === 'UnaryExpression' && a.operator === 'void') {
        const 文の中 = ['BlockStatement', 'Program', 'SwitchCase'].includes(p.parent.type);
        const 値だけ = ['NumericLiteral', 'StringLiteral', 'Identifier'].includes(a.argument.type);
        const s = (値だけ ? '' : 文にする(code, a.argument, comments) + '\n') + 'return;';
        足す(p.node.start, p.node.end, 文の中 || 値だけ ? s : '{\n' + s + '\n}', 'return void');
        return;
      }
      if (!a || a.type !== 'SequenceExpression') return;
      const 文の中 = ['BlockStatement', 'Program', 'SwitchCase'].includes(p.parent.type);
      const { 前の文, 最後 } = 最後の値と前の文(code, a, comments);
      const s = 前の文 + '\nreturn ' + 最後 + ';';
      足す(p.node.start, p.node.end, 文の中 ? s : '{\n' + s + '\n}', 'return のカンマ');
    },
    ArrowFunctionExpression(p) {
      const b = p.node.body;
      if (b.type !== 'SequenceExpression') return;
      const { 前の文, 最後 } = 最後の値と前の文(code, b, comments);
      // 括弧の外側まで置き換える（=> ( … ) の括弧ごと）
      let 始め = b.start;
      let 終わり = b.end;
      if (b.extra && b.extra.parenthesized) {
        始め = code.lastIndexOf('(', b.start - 1);
        終わり = code.indexOf(')', b.end) + 1;
      }
      足す(始め, 終わり, '{\n' + 前の文 + '\nreturn ' + 最後 + ';\n}', '=> のカンマ');
    },
    BinaryExpression(p) {
      const { left, right, operator } = p.node;
      if (!['===', '!==', '==', '!='].includes(operator)) return;
      const 逆さ = 決まった値か(left) && !決まった値か(right);
      const typeofの緩い比べ = (operator === '==' || operator === '!=') && (typeofか(left) || typeofか(right));
      if (!逆さ && !typeofの緩い比べ) return;
      const 新しい比べ = typeofの緩い比べ ? (operator === '==' ? '===' : '!==') : operator;
      const [甲, 乙] = 逆さ ? [right, left] : [left, right];
      足す(left.start - (left.extra && left.extra.parenthesized ? 1 : 0), right.end + (right.extra && right.extra.parenthesized ? 1 : 0),
        字(code, 甲) + ' ' + 新しい比べ + ' ' + 字(code, 乙), '逆さの比べ');
    },
  });
  // 外側（始めが早く、長い）から取り、重なるものは次の回へ回す
  書き換え.sort((a, b) => a.start - b.start || b.end - a.end);
  const 採る = [];
  let ここまで = -1;
  for (const w of 書き換え) {
    if (w.start < ここまで) continue;
    採る.push(w);
    ここまで = w.end;
  }
  return { 採る, 全部: 書き換え };
}

const 数え = {};
for (const ファイル of ファイルたち) {
  let code = fs.readFileSync(ファイル, 'utf8');
  const 元 = code;
  for (let 回 = 0; 回 < 20; 回++) {
    const ast = parse(code, { sourceType: 'unambiguous', plugins: ['jsx'], attachComment: false });
    const { 採る } = 書き換えを集める(code, ast);
    if (!採る.length) break;
    for (const w of 採る) 数え[w.種] = (数え[w.種] || 0) + 1;
    if (見るだけ) break;
    for (const w of [...採る].sort((a, b) => b.start - a.start)) code = code.slice(0, w.start) + w.新 + code.slice(w.end);
  }
  if (見るだけ || code === 元) continue;
  const 設定 = await prettier.resolveConfig(ファイル);
  code = await prettier.format(code, { ...設定, filepath: ファイル });
  // コメントが 1 つも減っていないか（中身の字で数える）
  const コメントの字 = (c) =>
    parse(c, { sourceType: 'unambiguous', plugins: ['jsx'] }).comments.map((x) => x.value.trim()).sort();
  const 前の = コメントの字(元);
  const 後の = new Map();
  for (const x of コメントの字(code)) 後の.set(x, (後の.get(x) || 0) + 1);
  const 消えた = 前の.filter((x) => {
    const n = 後の.get(x) || 0;
    if (n > 0) 後の.set(x, n - 1);
    return n === 0;
  });
  if (消えた.length) {
    console.error('コメントが消えたので書かない', ファイル, 消えた.slice(0, 3));
    process.exitCode = 1;
    continue;
  }
  fs.writeFileSync(ファイル, code);
  console.log('書き換えた', ファイル);
}
console.log(数え);
