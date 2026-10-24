/**
 * 中で一度も待たない async を外す（eslint の require-await の警告を、意味を変えずに消す）。
 *
 *   node scripts/seiri-async.mjs [--見るだけ] ファイル...
 *
 * 外すのは、中（入れ子の関数を除く）に await も for await も無い関数だけ。
 * async を外すと、返す値が約束で包まれなくなる。呼ぶ側が .then でつないでいると壊れるので、
 * 名前の付いた関数は、どこかで「名前(…).then」とつないでいれば外さない（倉庫の src・e2e・test・scripts を探す）。
 * 名前の無い関数（ページへ渡す関数・押したときの関数など）は、返す値を待つ側が約束でも値でも受けるものに限って使うこと。
 * 書き換えたあとは prettier を通す。
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default || traverseModule;
const 見るだけ = process.argv.includes('--見るだけ');
const ファイルたち = process.argv.slice(2).filter((x) => !x.startsWith('--'));

// 倉庫の中で「名前(…).then / .catch / .finally」とつないでいる名前
const 集める = (道) =>
  readdirSync(道).flatMap((名) => {
    const 先 = join(道, 名);
    if (名 === 'node_modules' || 名.startsWith('.')) return [];
    return statSync(先).isDirectory() ? 集める(先) : /\.(c?js|mjs)$/.test(名) ? [先] : [];
  });
const 全部の字 = ['src', 'e2e', 'test', 'scripts']
  .flatMap((道) => 集める(道))
  .concat(['App.js'])
  .map((道) => readFileSync(道, 'utf8'))
  .join('\n');
const つないでいるか = (名) =>
  new RegExp(`${名.replace(/[$]/g, '\\$')}\\([^;]*?\\)\\s*\\.(then|catch|finally)\\(`, 's').test(全部の字);

let 合計 = 0;
for (const ファイル of ファイルたち) {
  const 元 = readFileSync(ファイル, 'utf8');
  const 木 = parse(元, { sourceType: 'unambiguous', plugins: ['jsx'], errorRecovery: false });
  const 消す位置 = [];
  traverse(木, {
    Function(道) {
      const 関 = 道.node;
      if (!関.async || 関.generator) return;
      let 待つ = false;
      道.traverse({
        Function(内) {
          内.skip();
        },
        AwaitExpression() {
          待つ = true;
        },
        ForOfStatement(内) {
          if (内.node.await) 待つ = true;
        },
      });
      if (待つ) return;
      const 名 =
        (関.id && 関.id.name) ||
        (関.key && 関.key.name) ||
        (道.parent.type === 'VariableDeclarator' && 道.parent.id.name) ||
        (道.parent.type === 'ObjectProperty' && 道.parent.key && 道.parent.key.name) ||
        null;
      if (名 && つないでいるか(名)) {
        console.log(`残す（.then でつないでいる）: ${ファイル}:${関.loc.start.line} ${名}`);
        return;
      }
      // async の字の位置。メソッドは key の前、それ以外は関数の頭
      const 頭 = 関.start;
      const 字 = 元.slice(頭, 頭 + 5);
      if (字 !== 'async') {
        console.log(`飛ばす（async の位置が読めない）: ${ファイル}:${関.loc.start.line}`);
        return;
      }
      消す位置.push(頭);
      if (見るだけ) console.log(`${ファイル}:${関.loc.start.line} ${名 || '（名前なし）'}`);
    },
  });
  if (!消す位置.length) continue;
  合計 += 消す位置.length;
  if (見るだけ) continue;
  let 出 = 元;
  for (const 頭 of 消す位置.sort((甲, 乙) => 乙 - 甲)) {
    出 = 出.slice(0, 頭) + 出.slice(頭 + 5).replace(/^[ \t]+/, '');
  }
  writeFileSync(ファイル, 出);
}
console.log('合計', 合計);
