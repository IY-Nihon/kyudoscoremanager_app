/**
 * 使っていない名前を消す道具（2026-10-24）。eslint の no-unused-vars が指した所だけを、意味を変えずに消す。
 *
 *   npx eslint "src/**\/*.js" App.js -f json > lint.json
 *   node scripts/seiri-tsukawanai.mjs lint.json
 *
 * 消すもの
 *   1. catch で受け取って使っていない誤り   catch (誤り) { … }      → catch { … }
 *   2. 分割で取り出して使っていない名前      const { a, b } = x;     → const { a } = x;
 *      （…残り を受ける分割は、取り出す名前で残りの中身が変わるので触らない）
 *      引数の分割（画面の props など）も同じ
 *   3. 使っていない取り込み（import の名前・丸ごとの require）。副作用の無いものだけ
 * 変数・関数は消さない（なぜ在るかを読んでから手で消す）。
 */
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as prettier from 'prettier';

const traverse = traverseModule.default || traverseModule;
const lint = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
// 丸ごと消してよい取り込み。読み込むだけで何かが起きないもの（useScoreStore は店を作るが、App が必ず先に読むので消しても同じ）
const 副作用の無い取り込み =
  /^(react|\.\/useScoreStore|\.\/IS_WEB|\.\/rn|\.\/shadowStyle|@expo\/vector-icons|\.\/platform|\.\/iro(\.js)?)$/;

const 数え = {};
for (const f of lint) {
  const 指された = new Set(
    f.messages.filter((m) => m.ruleId === 'no-unused-vars').map((m) => m.line + ':' + m.column)
  );
  if (!指された.size) continue;
  let code = fs.readFileSync(f.filePath, 'utf8');
  const ast = parse(code, { sourceType: 'unambiguous', plugins: ['jsx'] });
  const 書き換え = [];
  const 足す = (start, end, 新, 種) => {
    書き換え.push({ start, end, 新 });
    数え[種] = (数え[種] || 0) + 1;
  };
  const 指されたか = (n) => 指された.has(n.loc.start.line + ':' + (n.loc.start.column + 1));
  traverse(ast, {
    CatchClause(p) {
      const 引 = p.node.param;
      if (引 && 引.type === 'Identifier' && 指されたか(引)) {
        // catch (誤り) の括弧ごと消す
        const 始め = code.lastIndexOf('(', 引.start);
        const 終わり = code.indexOf(')', 引.end) + 1;
        足す(始め, 終わり, '', 'catch');
      }
    },
    ObjectPattern(p) {
      if (p.node.properties.some((x) => x.type === 'RestElement')) return;
      const 消す = p.node.properties.filter((x) => {
        if (x.type !== 'ObjectProperty') return false;
        const 名 = x.value.type === 'AssignmentPattern' ? x.value.left : x.value;
        return 名.type === 'Identifier' && 指されたか(名);
      });
      if (!消す.length) return;
      const 残す = p.node.properties.filter((x) => !消す.includes(x));
      const 親 = p.parentPath;
      if (!残す.length && 親.isVariableDeclarator()) {
        // 全部使っていない：宣言ごと。require なら副作用の無いものだけ
        const init = 親.node.init;
        const 取り込み = init && init.type === 'CallExpression' && init.callee.name === 'require' ? init.arguments[0].value : null;
        if (取り込み && !副作用の無い取り込み.test(取り込み)) return;
        const 宣言 = 親.parentPath;
        if (宣言.node.declarations.length !== 1) return;
        足す(宣言.node.start, 宣言.node.end, '', '分割');
        return;
      }
      if (!残す.length) return;
      足す(p.node.start, p.node.end, '{ ' + 残す.map((x) => code.slice(x.start, x.end)).join(', ') + ' }', '分割');
    },
    ImportDeclaration(p) {
      const 消す = p.node.specifiers.filter((s) => 指されたか(s.local));
      if (!消す.length || !副作用の無い取り込み.test(p.node.source.value)) return;
      const 残す = p.node.specifiers.filter((s) => !消す.includes(s));
      if (!残す.length) return 足す(p.node.start, p.node.end, '', '取り込み');
      const 既定 = 残す.find((s) => s.type === 'ImportDefaultSpecifier');
      const 名たち = 残す.filter((s) => s.type === 'ImportSpecifier').map((s) => code.slice(s.start, s.end));
      const 中 = [既定 ? 既定.local.name : null, 名たち.length ? '{ ' + 名たち.join(', ') + ' }' : null].filter(Boolean).join(', ');
      足す(p.node.start, p.node.end, `import ${中} from '${p.node.source.value}';`, '取り込み');
    },
    VariableDeclarator(p) {
      const id = p.node.id;
      const init = p.node.init;
      if (id.type !== 'Identifier' || !指されたか(id)) return;
      if (!init || init.type !== 'CallExpression' || init.callee.name !== 'require') return;
      if (!副作用の無い取り込み.test(init.arguments[0].value)) return;
      if (p.parentPath.node.declarations.length !== 1) return;
      足す(p.parentPath.node.start, p.parentPath.node.end, '', '取り込み');
    },
  });
  if (!書き換え.length) continue;
  for (const w of 書き換え.sort((a, b) => b.start - a.start)) code = code.slice(0, w.start) + w.新 + code.slice(w.end);
  const 設定 = await prettier.resolveConfig(f.filePath);
  code = await prettier.format(code, { ...設定, filepath: f.filePath });
  fs.writeFileSync(f.filePath, code);
}
console.log(数え);
