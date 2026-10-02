/**
 * 上のバーの絵の中身（src/tabIconShapes.js）。
 * どのタブにも絵があること、絵の図形が描けること。
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { 画, 絵のある画面 } = require('../src/tabIconShapes');

test('MainNavigator のタブは、全部に絵がある（絵だけのときに名前の無いタブが残らない）', () => {
  const 画面の作り = fs.readFileSync(path.join(__dirname, '..', 'src', 'MainNavigator.js'), 'utf8');
  const 名前たち = [...画面の作り.matchAll(/<Tab\.Screen name="([^"]+)"/g)].map((m) => m[1]);
  assert.deepStrictEqual(名前たち.sort(), ['メンバー', '出欠', '分析', '履歴', '記録', '設定'].sort());
  for (const 名 of 名前たち) assert.ok(絵のある画面.includes(名), `「${名}」に絵が無い`);
});

test('絵の図形：種類と属性がそろっていて、数が有限', () => {
  const 必要 = { path: ['d'], circle: ['cx', 'cy', 'r'], rect: ['x', 'y', 'width', 'height', 'rx'] };
  for (const [名, 図形たち] of Object.entries(画)) {
    assert.ok(図形たち.length > 0, `${名} が空`);
    for (const [種類, 属性] of 図形たち) {
      assert.ok(必要[種類], `${名}: 知らない図形 ${種類}`);
      for (const 鍵 of 必要[種類]) assert.ok(鍵 in 属性, `${名}: ${種類} に ${鍵} が無い`);
      if (種類 === 'path') assert.match(属性.d, /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s-]+$/, `${名}: d に変な字がある`);
      else for (const v of Object.values(属性)) assert.ok(Number.isFinite(v), `${名}: 数でない値 ${v}`);
    }
  }
});

test('絵は 24×24 の中に収まる（円と四角は座標で確かめる）', () => {
  for (const [名, 図形たち] of Object.entries(画)) {
    for (const [種類, 属性] of 図形たち) {
      if (種類 === 'circle') {
        assert.ok(属性.cx - 属性.r >= 0 && 属性.cx + 属性.r <= 24, `${名}: 円が横にはみ出す`);
        assert.ok(属性.cy - 属性.r >= 0 && 属性.cy + 属性.r <= 24, `${名}: 円が縦にはみ出す`);
      }
      if (種類 === 'rect') {
        assert.ok(属性.x >= 0 && 属性.x + 属性.width <= 24 && 属性.y >= 0 && 属性.y + 属性.height <= 24, `${名}: 四角がはみ出す`);
      }
    }
  }
});
