/**
 * 変換の前後で、意味が変わっていないかを突き合わせる道具。
 *
 *   node scripts/touka-kurabe.mjs <元のフォルダー> <今のフォルダー> <出力フォルダー>
 *
 * ■ やり方
 * 同じ file を、両方とも同じ手順で「機械の形」に落としてから比べる。
 *   1. JSX だけを外す（本番と同じ theme-jsx の jsx 呼び出しに）
 *   2. 読み込みと書き出しの書き方を1つに寄せる
 *        e(require('m')).default / require('m').default ?? require('m') / require('m').default
 *          → __I_m__.default（react と react-native は CommonJS なので .default を外す）
 *        const { a: A } = require('m')・X.a（X = require('m')）→ __I_m__.a
 *        Object.defineProperty(exports, 'X', { get })・exports.X = v → __EXPORT__('X', v)
 *        (0, f)(…) → f(…)、'use strict' と __esModule の印、副作用だけの require は捨てる
 *   3. terser の compress で、if と &&、文の区切り、true と !0 のような
 *      書き方の違いを寄せる（名前は縮めない）
 *   4. 束縛の名前を、宣言の順に v1, v2… と付け直す（α変換）。
 *      これで「名前を変えただけ」は同じ文字列になる
 *   5. 注釈を捨てて、同じ印字器で書き出す
 * 残った差が、意味の違い（か、寄せきれなかった書き方の違い）。
 * 出力フォルダーに両方の正規形と diff を置く。
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as babel from '@babel/core';
import { parse } from '@babel/parser';
import traverseMod from '@babel/traverse';
import generateMod from '@babel/generator';
import * as t from '@babel/types';
import { minify } from 'terser';

const traverse = traverseMod.default || traverseMod;
const generate = generateMod.default || generateMod;
const [元, 今, 出] = process.argv.slice(2).map((p) => path.resolve(p));
fs.mkdirSync(出, { recursive: true });

const CommonJSの部品 = new Set(['react', 'react-native']);
const 部品の名 = (道) => {
  if (道 === './themedJsx') 道 = 'theme-jsx/jsx-runtime';
  return `__I_${道.replace(/[^A-Za-z0-9]/g, '_')}__`;
};
const require道 = (n) =>
  t.isCallExpression(n) &&
  t.isIdentifier(n.callee, { name: 'require' }) &&
  n.arguments.length === 1 &&
  t.isStringLiteral(n.arguments[0])
    ? n.arguments[0].value
    : null;

/** 読み込み・書き出しの書き方を寄せる */
function 寄せる(ast) {
  // e(require('m')) の e を見つける
  const 橋の関数 = new Set();
  traverse(ast, {
    'FunctionDeclaration|VariableDeclarator'(p) {
      const fn = p.isFunctionDeclaration() ? p.node : t.isFunction(p.node.init) ? p.node.init : null;
      const id = p.isFunctionDeclaration() ? p.node.id : t.isIdentifier(p.node.id) ? p.node.id : null;
      if (!fn || !id) return;
      const src = generate(fn).code;
      if (/__esModule\s*\?\s*\w+\s*:\s*\{\s*default:\s*\w+\s*\}/.test(src)) {
        橋の関数.add(id.name);
        p.remove();
      }
    },
  });
  // 読み込みの別名を集める：名 → { 道, 員 }（員 = 'default' | '*' | 名前）
  const 別名 = new Map();
  const exportsの別名 = new Set(['exports']);
  traverse(ast, {
    VariableDeclarator(p) {
      const { id, init } = p.node;
      if (!init) return;
      if (t.isIdentifier(id) && t.isIdentifier(init, { name: 'exports' })) {
        exportsの別名.add(id.name);
        p.remove();
        return;
      }
      let 道 = require道(init);
      if (道 && t.isIdentifier(id)) {
        別名.set(id.name, { 道, 員: '*' });
        p.remove();
        return;
      }
      if (道 && t.isObjectPattern(id)) {
        for (const pr of id.properties) {
          if (t.isObjectProperty(pr) && t.isIdentifier(pr.key) && t.isIdentifier(pr.value))
            別名.set(pr.value.name, { 道, 員: pr.key.name });
        }
        p.remove();
        return;
      }
      // X(require('m')) 橋。X(t) で t が require の別名のときも同じ
      if (
        t.isCallExpression(init) &&
        t.isIdentifier(init.callee) &&
        橋の関数.has(init.callee.name) &&
        t.isIdentifier(id)
      ) {
        const 引 = init.arguments[0];
        道 =
          require道(引) ||
          (t.isIdentifier(引) && 別名.get(引.name) && 別名.get(引.name).員 === '*'
            ? 別名.get(引.name).道
            : null);
        if (道) {
          別名.set(id.name, { 道, 員: '*' });
          p.remove();
          return;
        }
      }
      // require('m').default / require('m').x / require('m').default ?? require('m')
      let 元 = init;
      if (t.isLogicalExpression(init, { operator: '??' }) && require道(init.right)) 元 = init.left;
      if (
        t.isMemberExpression(元) &&
        !元.computed &&
        t.isIdentifier(元.property) &&
        (道 = require道(元.object)) &&
        t.isIdentifier(id)
      ) {
        別名.set(id.name, { 道, 員: 元.property.name });
        p.remove();
      }
    },
  });
  const 読み込み式 = (道, 員) => {
    if (員 === 'default' && CommonJSの部品.has(道)) return t.identifier(部品の名(道));
    return t.memberExpression(t.identifier(部品の名(道)), t.identifier(員));
  };
  traverse(ast, {
    // 参照を置き換える
    Identifier(p) {
      const 情 = 別名.get(p.node.name);
      if (!情 || !p.isReferencedIdentifier()) return;
      if (p.scope.getBinding(p.node.name)) return; // 宣言は消してあるので、残っている束縛は別物
      const 親 = p.parentPath;
      if (情.員 === '*') {
        if (
          親.isMemberExpression() &&
          親.node.object === p.node &&
          !親.node.computed &&
          t.isIdentifier(親.node.property)
        ) {
          親.replaceWith(読み込み式(情.道, 親.node.property.name));
        } else {
          p.replaceWith(t.identifier(部品の名(情.道)));
        }
      } else {
        p.replaceWith(読み込み式(情.道, 情.員));
      }
    },
    // e(require('m')).default をその場で使う形
    CallExpression(p) {
      const c = p.node.callee;
      if (t.isIdentifier(c) && 橋の関数.has(c.name) && require道(p.node.arguments[0])) {
        p.replaceWith(t.identifier(部品の名(require道(p.node.arguments[0]))));
      }
    },
    MemberExpression(p) {
      const 道 = require道(p.node.object);
      if (道 && !p.node.computed && t.isIdentifier(p.node.property))
        p.replaceWith(読み込み式(道, p.node.property.name));
    },
    LogicalExpression(p) {
      if (p.node.operator !== '??') return;
      const 道 = require道(p.node.right);
      if (道 && t.isMemberExpression(p.node.left) && require道(p.node.left.object) === 道)
        p.replaceWith(読み込み式(道, 'default'));
    },
  });
  // 文の中のカンマ（a, b, c）は別々の文に分ける。元の code は書き出しの定型をカンマでつないでいる
  traverse(ast, {
    ExpressionStatement(p) {
      if (
        t.isSequenceExpression(p.node.expression) &&
        (p.parentPath.isProgram() || p.parentPath.isBlockStatement())
      ) {
        p.replaceWithMultiple(p.node.expression.expressions.map((e) => t.expressionStatement(e)));
      }
    },
  });
  // 書き出し・その他
  traverse(ast, {
    ExpressionStatement(p) {
      const e = p.node.expression;
      if (t.isStringLiteral(e)) {
        p.remove(); // 'use strict'
        return;
      }
      if (require道(e)) {
        p.remove(); // 副作用だけの require
        return;
      }
      // Object.defineProperty(exports, 'X', {...})
      if (
        t.isCallExpression(e) &&
        t.isMemberExpression(e.callee) &&
        t.isIdentifier(e.callee.object, { name: 'Object' }) &&
        t.isIdentifier(e.callee.property, { name: 'defineProperty' }) &&
        t.isIdentifier(e.arguments[0]) &&
        exportsの別名.has(e.arguments[0].name) &&
        t.isStringLiteral(e.arguments[1])
      ) {
        const 名 = e.arguments[1].value;
        if (名 === '__esModule') {
          p.remove();
          return;
        }
        const 中 = e.arguments[2];
        const get = t.isObjectExpression(中)
          ? 中.properties.find((x) => t.isObjectProperty(x) && t.isIdentifier(x.key, { name: 'get' }))
          : null;
        const 値 =
          get &&
          t.isFunction(get.value) &&
          t.isBlockStatement(get.value.body) &&
          get.value.body.body.length === 1 &&
          t.isReturnStatement(get.value.body.body[0])
            ? get.value.body.body[0].argument
            : null;
        if (値) {
          p.replaceWith(
            t.expressionStatement(t.callExpression(t.identifier('__EXPORT__'), [t.stringLiteral(名), 値]))
          );
          return;
        }
      }
      // exports.X = v
      if (
        t.isAssignmentExpression(e) &&
        t.isMemberExpression(e.left) &&
        t.isIdentifier(e.left.object) &&
        exportsの別名.has(e.left.object.name) &&
        !e.left.computed &&
        t.isIdentifier(e.left.property)
      ) {
        if (
          t.isUnaryExpression(e.right, { operator: 'void' }) ||
          t.isIdentifier(e.right, { name: 'undefined' })
        ) {
          p.remove();
          return;
        }
        p.replaceWith(
          t.expressionStatement(
            t.callExpression(t.identifier('__EXPORT__'), [t.stringLiteral(e.left.property.name), e.right])
          )
        );
      }
    },
    SequenceExpression(p) {
      // (0, f)(…) → f(…)
      if (
        p.node.expressions.length === 2 &&
        t.isNumericLiteral(p.node.expressions[0], { value: 0 }) &&
        p.parentPath.isCallExpression() &&
        p.parentPath.node.callee === p.node
      )
        p.replaceWith(p.node.expressions[1]);
    },
    Directive(p) {
      p.remove();
    },
  });
  // __EXPORT__ は最後にまとめる（getter で先に置くか、終わりに代入するかの違いを消す）
  {
    const 書き出したち = [];
    traverse(ast, {
      ExpressionStatement(p) {
        const e = p.node.expression;
        if (
          p.parentPath.isProgram() &&
          t.isCallExpression(e) &&
          t.isIdentifier(e.callee, { name: '__EXPORT__' })
        ) {
          書き出したち.push(p.node);
          p.remove();
        }
      },
    });
    書き出したち.sort((a, b) => (a.expression.arguments[0].value < b.expression.arguments[0].value ? -1 : 1));
    ast.program.body.push(...書き出したち);
  }
  // jsx と jsxs、children の [x] と x、入れ子の配列 [[…]] は React では同じ描画になる。1つの形に寄せる
  traverse(ast, {
    CallExpression(p) {
      const c = p.node.callee;
      if (!(
        t.isMemberExpression(c) &&
        t.isIdentifier(c.object, { name: 部品の名('theme-jsx/jsx-runtime') }) &&
        t.isIdentifier(c.property) &&
        /^jsxs?$/.test(c.property.name)
      ))
        return;
      c.property.name = 'jsx';
      const props = p.node.arguments[1];
      if (!t.isObjectExpression(props)) return;
      const ch = props.properties.find(
        (x) => t.isObjectProperty(x) && t.isIdentifier(x.key, { name: 'children' })
      );
      if (!ch || !t.isArrayExpression(ch.value)) return;
      const 平ら = [];
      for (const el of ch.value.elements) {
        if (t.isArrayExpression(el)) 平ら.push(...el.elements);
        else 平ら.push(el);
      }
      ch.value.elements = 平ら;
      if (平ら.length === 1 && !t.isSpreadElement(平ら[0])) ch.value = 平ら[0];
    },
  });
  // exports の別名を exports に（残っている参照）
  traverse(ast, {
    Identifier(p) {
      if (exportsの別名.has(p.node.name) && p.node.name !== 'exports' && p.isReferencedIdentifier())
        p.node.name = 'exports';
    },
  });
}

async function 正規形(source, 名札) {
  // 1. JSX だけ外す
  const b = babel.transformSync(source, {
    filename: path.join(process.cwd(), 'src', 名札),
    configFile: false,
    babelrc: false,
    presets: [['@babel/preset-react', { runtime: 'automatic', importSource: 'theme-jsx' }]],
    sourceType: 'unambiguous',
    compact: false,
    comments: false,
  });
  // 2. 読み込み・書き出しを寄せる
  const ast1 = parse(b.code, { sourceType: 'unambiguous' });
  寄せる(ast1);
  const code1 = generate(ast1, { comments: false }).code;
  // 3. terser compress（名前はそのまま）
  const m = await minify(code1, {
    compress: {
      passes: 3,
      toplevel: false,
      unused: false,
      dead_code: false,
      collapse_vars: false,
      reduce_vars: false,
      inline: false,
      join_vars: true,
      sequences: true,
      conditionals: true,
      booleans: true,
      if_return: true,
      hoist_props: false,
      evaluate: false,
      side_effects: false,
      pure_getters: false,
      keep_fargs: true,
      keep_fnames: false,
    },
    mangle: false,
    format: { beautify: true, comments: false },
    module: false,
  });
  // 4. α変換
  // TOUKA_NO_TERSER=1 なら terser を通さない（terser が書き換える前の形で見たいとき）
  const ast = parse(process.env.TOUKA_NO_TERSER ? code1 : m.code, { sourceType: 'unambiguous' });
  // 名前は「宣言している行の形」から付ける（v + 行の形の指紋 + 同じ形の中での順）。
  // 通し番号にすると束縛が1つ増えるだけで後ろが全部ずれるが、行の形から付ければ
  // その束縛の行が変わらないかぎり同じ名前になり、別の変数を指すようになった所だけが残る
  const 元code = process.env.TOUKA_NO_TERSER ? code1 : m.code;
  const 元行 = 元code.split(/\r?\n/);
  const 指紋 = (文) => {
    let h = 0;
    for (const ch of 文) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return h.toString(36);
  };
  const 使った = new Map(); // 指紋 → 数
  traverse(ast, {
    Scope(p) {
      const 束たち = Object.values(p.scope.bindings).sort((a, b) => a.identifier.start - b.identifier.start);
      for (const b of 束たち) {
        // 宣言の行の、名前を x に潰した形（文字は Unicode の字ぜんぶ。σ や 々 も）
        const 行 = (元行[b.identifier.loc.start.line - 1] || '')
          .trim()
          .replace(/[\p{L}_$][\p{L}\p{N}_$]*/gu, 'x');
        const k = 指紋(b.kind + '|' + 行);
        const n = (使った.get(k) || 0) + 1;
        使った.set(k, n);
        const 新 = `v${k}_${n}`;
        try {
          p.scope.rename(b.identifier.name, 新);
        } catch (_) {
          /* 付け替えられないものは残す */
        }
      }
    },
  });
  // 5. 印字
  const code = generate(ast, { comments: false, compact: false, jsescOption: { minimal: true } }).code;
  // 6. 参照の結び付き：「参照している行」と「宣言している行」の組（行の中の名前は出た順に付け直す）。
  //    番号の付け方に依らないので、束縛の増減で後ろがずれても変わらない。
  //    内側の同名に隠されて別の変数を指すようになった参照は、宣言の行が変わるのでここに出る
  const ast2 = parse(code, { sourceType: 'unambiguous' });
  const 行たち = code.split(String.fromCharCode(10));
  const 行を消す = (l) => {
    const 表 = new Map();
    return l.trim().replace(/\bv[0-9a-z]+_\d+\b/g, (m) => {
      if (!表.has(m)) 表.set(m, `v${表.size + 1}`);
      return 表.get(m);
    });
  };
  const 結び = [];
  traverse(ast2, {
    Identifier(p) {
      if (!p.isReferencedIdentifier()) return;
      const b = p.scope.getBinding(p.node.name);
      if (!b) return;
      結び.push(
        `${行を消す(行たち[p.node.loc.start.line - 1])}  <=  ${行を消す(行たち[b.identifier.loc.start.line - 1])}`
      );
    },
  });
  結び.sort();
  return { code, 結び };
}

const 元の一覧 = fs.readdirSync(元).filter((f) => f.endsWith('.js'));
const 今の一覧 = new Set(fs.readdirSync(今).filter((f) => f.endsWith('.js')));
const まとめ = [];
for (const f of 元の一覧) {
  if (!今の一覧.has(f)) {
    まとめ.push({ f, 結果: '今に無い' });
    continue;
  }
  try {
    const 元の = await 正規形(fs.readFileSync(path.join(元, f), 'utf8'), f);
    const 今の = await 正規形(fs.readFileSync(path.join(今, f), 'utf8'), f);
    const a = 元の.code;
    const b = 今の.code;
    // 参照の結び付きの違い（片方にしか無い組）
    const 数 = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
    const 元数 = 数(元の.結び);
    const 今数 = 数(今の.結び);
    const 結びの差 = [];
    for (const [k, n] of 元数) if ((今数.get(k) || 0) < n) 結びの差.push(`- ${k}`);
    for (const [k, n] of 今数) if ((元数.get(k) || 0) < n) 結びの差.push(`+ ${k}`);
    fs.writeFileSync(path.join(出, f + '.refs.diff'), 結びの差.join(String.fromCharCode(10)));
    fs.writeFileSync(path.join(出, f + '.moto.js'), a);
    fs.writeFileSync(path.join(出, f + '.ima.js'), b);
    if (a === b) {
      まとめ.push({ f, 結果: '同じ' });
    } else {
      let 差 = '';
      try {
        execFileSync('diff', ['-u', path.join(出, f + '.moto.js'), path.join(出, f + '.ima.js')], {
          encoding: 'utf8',
        });
      } catch (e) {
        差 = e.stdout || '';
      }
      fs.writeFileSync(path.join(出, f + '.diff'), 差);
      const 数える = (d) => d.split('\n').filter((l) => /^[-+]/.test(l) && !/^(---|\+\+\+)/.test(l)).length;
      // 名前の番号をぜんぶ v にした diff も出す。束縛が1つ増減すると後ろの番号が
      // 全部ずれるので、そのずれを消して「形の違い」だけを数える
      // 行ごとに、出てきた順に v1, v2… と付け直す。「v57 !== v55」と「v57 !== v57」の
      // ように、同じ行の中で別の変数だったものが同じ変数になった（影に入った）違いは残る
      const 消す = (c) =>
        c
          .split('\n')
          .map((l) => {
            const 表 = new Map();
            return l.replace(/\bv[0-9a-z]+_\d+\b/g, (m) => {
              if (!表.has(m)) 表.set(m, `v${表.size + 1}`);
              return 表.get(m);
            });
          })
          .join('\n');
      fs.writeFileSync(path.join(出, f + '.moto.v.js'), 消す(a));
      fs.writeFileSync(path.join(出, f + '.ima.v.js'), 消す(b));
      let 差2 = '';
      try {
        execFileSync('diff', ['-u', path.join(出, f + '.moto.v.js'), path.join(出, f + '.ima.v.js')], {
          encoding: 'utf8',
        });
      } catch (e) {
        差2 = e.stdout || '';
      }
      fs.writeFileSync(path.join(出, f + '.v.diff'), 差2);
      // さらに、file 全体で「出てきた順」に付け直した形。番号の絶対値には依らないので
      // 束縛の増減で後ろがずれることはなく、行をまたいだ影の読み替えも残る
      const 全体で消す = (c) => {
        const 表 = new Map();
        return c.replace(/\bv[0-9a-z]+_\d+\b/g, (m) => {
          if (!表.has(m)) 表.set(m, `v${表.size + 1}`);
          return 表.get(m);
        });
      };
      fs.writeFileSync(path.join(出, f + '.moto.w.js'), 全体で消す(a));
      fs.writeFileSync(path.join(出, f + '.ima.w.js'), 全体で消す(b));
      let 差3 = '';
      try {
        execFileSync('diff', ['-u', path.join(出, f + '.moto.w.js'), path.join(出, f + '.ima.w.js')], {
          encoding: 'utf8',
        });
      } catch (e) {
        差3 = e.stdout || '';
      }
      fs.writeFileSync(path.join(出, f + '.w.diff'), 差3);
      まとめ.push({
        f,
        結果: `違う（差 ${数える(差)} 行、行ごとに付け直すと ${数える(差2)} 行、参照の結び付きの差 ${結びの差.length}）`,
      });
    }
  } catch (e) {
    まとめ.push({ f, 結果: `落ちた: ${String(e.message).split('\n')[0].slice(0, 120)}` });
  }
}
for (const f of 今の一覧) if (!元の一覧.includes(f)) まとめ.push({ f, 結果: '元に無い（新しい file）' });
for (const x of まとめ) console.log(`${x.結果.padEnd(16)} ${x.f}`);
