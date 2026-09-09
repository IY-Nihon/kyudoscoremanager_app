/**
 * 履歴の月の並びが、潰れない指定を持っているかの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 *
 * 同じ型で2回踏んだ。
 *
 * 1回目：月の札（monthTab）が横に縮んで、字が折り返した。
 *        横に並べる器の中では、既定で縮むため。
 * 2回目：札を直しても、札を載せている横スクロールの器（monthTabsScroll）が
 *        縦に潰れた。この器は縦に並ぶ器の直の子で、下の一覧が場所を欲しがると
 *        縮められる。中の月が上下で切れ、一覧が月に重なって見えた。
 *
 * どちらも「縮ませない」で直る。目で気づきにくく、月が増えるまで出ない
 *（記録が1か月ぶんしか無い検証環境では再現しない）ので、指定そのものを
 * 機械で押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 中身 = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'HistoryScreen.js'),
  'utf8'
);

/** 名前で型を1つ取り出す。`名: { … }` の形 */
function 型を取る(名) {
  const 印 = 名 + ': {';
  const 始め = 中身.indexOf(印);
  assert.ok(始め >= 0, 名 + ' が見つからない');
  let 深さ = 0;
  for (let i = 中身.indexOf('{', 始め); i < 中身.length; i++) {
    const c = 中身[i];
    if (c === '{') 深さ++;
    else if (c === '}') {
      深さ--;
      if (0 === 深さ) return 中身.slice(始め, i + 1);
    }
  }
  assert.fail(名 + ' の終わりが見つからない');
}

test('月の札は、横に縮まない', () => {
  assert.match(
    型を取る('monthTab'),
    /flexShrink:\s*0/,
    '月の札が縮む。月が増えると字が折り返す'
  );
});

test('月の並びを載せる器は、縦に潰れない', () => {
  const 型 = 型を取る('monthTabsScroll');
  assert.match(型, /flexGrow:\s*0/, '器が縦に伸びる');
  assert.match(
    型,
    /flexShrink:\s*0/,
    '器が縦に潰れる。下の一覧が場所を欲しがると、月が切れて一覧と重なる'
  );
});
