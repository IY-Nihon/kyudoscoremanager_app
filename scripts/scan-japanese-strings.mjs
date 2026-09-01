/**
 * 画面に日本語が直に書かれている箇所を数える。
 *
 *   npm run ops:scan-japanese
 *
 * 多言語化（src/i18n.js）は仕組みだけができていて、画面の大半はまだ
 * 日本語のままになっている。その「残り」を見当で語らないための道具。
 *
 * ■ 数え方と、その限界
 * 注釈を取り除いたうえで、日本語を含む文字列を数える。だから
 *   ・変数名や鍵に使っている日本語（識別子）は数えない
 *   ・console.log や Error の中の日本語も数えてしまう（訳す必要は無い）
 * つまり出る数は「訳す上限」であって、実際に要る数はこれより少ない。
 * 少なく見せるより多めに出すほうが、見積もりを外しにくい。
 *
 * 読むだけ。何も書き換えない。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const 日本語 = /[぀-ゟ゠-ヿ一-鿿]/;
const 逃がし = 92; // 「\」の文字コード

/** 注釈を取り除く。文字列の中の記号は消さない */
function 注釈を落とす(元) {
  let 出 = '';
  let i = 0;
  let 囲み = null; // いま文字列の中なら、その引用符
  while (i < 元.length) {
    const c = 元[i];
    const 次 = 元[i + 1];
    if (囲み) {
      if (c.charCodeAt(0) === 逃がし) ((出 += c + (次 || '')), (i += 2));
      else ((出 += c), c === 囲み && (囲み = null), i++);
      continue;
    }
    if (c === '/' && 次 === '/') {
      while (i < 元.length && 元[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && 次 === '*') {
      i += 2;
      while (i < 元.length && !(元[i] === '*' && 元[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') 囲み = c;
    ((出 += c), i++);
  }
  return 出;
}

/**
 * 文字列そのものを拾う形。
 *
 * 逃がしの字は文字コードから組み立てる。ここに直に書くと、書き出しの
 * 経路によっては半分に減って壊れる（この道具を作るとき実際に2度壊した）
 */
const B = String.fromCharCode(逃がし);
const 文字列の形 = new RegExp(
  [
    "'((?:[^'" + B + B + '\\n]|' + B + B + '.)*)' + "'",
    '"((?:[^"' + B + B + '\\n]|' + B + B + '.)*)"',
    '`((?:[^`' + B + B + ']|' + B + B + '.)*)`',
  ].join('|'),
  'g'
);

function 文字列たち(元) {
  const 出 = [];
  文字列の形.lastIndex = 0;
  let m;
  while ((m = 文字列の形.exec(元))) {
    const v = m[1] ?? m[2] ?? m[3] ?? '';
    if (日本語.test(v)) 出.push(v);
  }
  return 出;
}

// 辞書そのものは日本語で当たり前なので数えない
const 除く = /^(messages|i18n)\.js$/;
const 一覧 = readdirSync('src')
  .filter((f) => f.endsWith('.js') && !除く.test(f))
  .map((f) => {
    const 中 = 文字列たち(注釈を落とす(readFileSync(join('src', f), 'utf8')));
    return { 名: f, 数: 中.length, 別々: new Set(中).size };
  })
  .filter((x) => x.数 > 0)
  .sort((a, b) => b.数 - a.数);

const 合計 = 一覧.reduce((a, x) => a + x.数, 0);
const 別々 = 一覧.reduce((a, x) => a + x.別々, 0);

console.log('画面に直に書かれた日本語（訳す上限。注釈は除いてある）\n');
console.log('  件数   種類   ファイル');
console.log('  ' + '─'.repeat(62));
for (const x of 一覧.slice(0, 20))
  console.log(`  ${String(x.数).padStart(4)}  ${String(x.別々).padStart(5)}   ${x.名}`);
if (一覧.length > 20) console.log(`  …ほか ${一覧.length - 20} ファイル`);
console.log('  ' + '─'.repeat(62));
console.log(`  ${String(合計).padStart(4)}  ${String(別々).padStart(5)}   合計（${一覧.length}ファイル）\n`);
console.log('i18n を通してあるのは src/a11yLabels.js と src/livePresence.js だけ。');
console.log('残りは日本語のまま出る。だから既定は日本語にしてあり、切り替えは画面に出していない。');
console.log('');
console.log('移すときは1画面ずつ。手順は README の「1画面ずつ移す」と');
console.log('src/messages/index.js の説明にある。上の件数の多い順に片づけると、');
console.log('1回の差分が大きくなりすぎる。押した回数の多い画面（記録・設定）から。');
