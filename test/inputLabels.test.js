/**
 * 入力欄の読み上げ用の名前の検査（2026-10-05・U-3）。
 *
 *   npm test
 *
 * 入力欄（TextInput）は見本の字（placeholder）だけで、読み上げ用の名前が無かった（47 か所）。
 * 見本の字は入力すると消え、「例: 123456」のような字は名前にならない。新しく足した入力欄が
 * 名前なしのまま入るのを防ぐため、src の全ファイルを読んで、TextInput に aria-label
 * （または accessibilityLabel）があるかを見る。
 * あわせて、チュートリアルの蓋が「何もしないボタン」に戻っていないかを見る（焦点と読み上げに出てしまう）。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const parser = require('@babel/parser');

const 根 = path.join(__dirname, '..', 'src');

/** src のファイルから、TextInput の開きタグを全部取り出す */
function 入力欄を集める() {
  const 集め = [];
  for (const 名 of fs.readdirSync(根).filter((f) => f.endsWith('.js'))) {
    const 中身 = fs.readFileSync(path.join(根, 名), 'utf8');
    if (!中身.includes('<TextInput')) continue;
    const 木 = parser.parse(中身, { sourceType: 'unambiguous', plugins: ['jsx'] });
    const 歩く = (節) => {
      if (!節 || typeof 節.type !== 'string') return;
      if (節.type === 'JSXOpeningElement' && 節.name.type === 'JSXIdentifier' && 節.name.name === 'TextInput') {
        const 属性 = 節.attributes.filter((a) => a.type === 'JSXAttribute').map((a) => a.name.name);
        集め.push({
          場所: `${名}:${節.loc.start.line}`,
          名前あり: 属性.includes('aria-label') || 属性.includes('accessibilityLabel'),
          広げあり: 節.attributes.some((a) => a.type === 'JSXSpreadAttribute'),
        });
      }
      for (const k of Object.keys(節)) {
        if (k === 'loc') continue;
        const v = 節[k];
        if (Array.isArray(v)) v.forEach(歩く);
        else if (v && typeof v.type === 'string') 歩く(v);
      }
    };
    歩く(木.program);
  }
  return 集め;
}

test('入力欄（TextInput）にはすべて読み上げ用の名前がある', () => {
  const 欄 = 入力欄を集める();
  assert.ok(欄.length >= 40, `入力欄が見つからない（${欄.length} か所）。読み方が壊れていないか`);
  // {...props} で渡しているものは、渡す側で名前を付ける（ここでは見えないので外す）
  const 名前なし = 欄.filter((x) => !x.名前あり && !x.広げあり).map((x) => x.場所);
  assert.deepStrictEqual(名前なし, [], `aria-label が無い入力欄: ${名前なし.join(', ')}`);
});

test('チュートリアルの蓋は、何もしないボタンではない', () => {
  const 中身 = fs.readFileSync(path.join(根, 'TutorialGuide.js'), 'utf8');
  assert.ok(!/onPress=\{\(\) => \{\}\}/.test(中身), '空の onPress の部品がある（焦点と読み上げに名前の無いボタンとして出る）');
  assert.ok(/function 蓋\(/.test(中身), '蓋の部品が見つからない');
});
