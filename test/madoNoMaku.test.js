// 窓の外側を押すと閉じる面（幕）は、窓の後ろに分けて置く（2026-11-03）。
// 幕が窓を包むと、見出しやボタンの間など窓の中を押しても閉じた（射数・ライブの選び・参加のしかた・確認・年度の窓）
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const src = path.join(__dirname, '..', 'src');

test('Modal のすぐ内側を、押すと閉じる部品で包まない（幕は absoluteFill で窓の後ろに置く）', () => {
  const 包んでいる = [];
  for (const 名 of fs.readdirSync(src).filter((x) => x.endsWith('.js'))) {
    const 行 = fs.readFileSync(path.join(src, 名), 'utf8').split(/\r?\n/);
    行.forEach((一行, 番) => {
      if (!/<Modal\b/.test(一行)) return;
      for (let 次 = 番 + 1; 次 < Math.min(番 + 8, 行.length); 次++) {
        if (/^\s*<View\b/.test(行[次]) || /^\s*\{/.test(行[次])) return;
        if (/^\s*<(Pressable|TouchableOpacity|TouchableWithoutFeedback)\b/.test(行[次])) {
          const 塊 = 行.slice(次, 次 + 14).join(' ');
          if (!/absoluteFill|position: 'absolute'/.test(塊)) 包んでいる.push(`${名}:${次 + 1}`);
          return;
        }
      }
    });
  }
  assert.deepStrictEqual(包んでいる, [], '窓を包む幕があります');
});
