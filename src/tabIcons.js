/**
 * 上のバー（記録・履歴・分析・メンバー・出欠・設定）のアイコンを描く。
 *
 * 絵の中身は src/tabIconShapes.js（出どころとライセンスもそちら）。ここでは react-native-svg で描く。
 *
 * ■ なぜ字体（Ionicons など）を使わないか
 *   字体は電波の弱い端末で取り寄せに失敗することがある（2026-09 に 12000ms timeout の便りが
 *   47 通。src/iconFont.js）。アイコンだけにしたバーは、字体が読めないと空になって、どれが
 *   どの画面か分からなくなる。絵として持てば、読み込みを待たずに出る。
 *
 * ■ 色
 *   線の色は currentColor。呼び出し側が Svg の color に文字と同じ色を渡す。
 *   stroke に直接色を渡すと、ダークモードの変換表（theme.js の KEY_KIND）では 罫線 の色として
 *   引かれて、文字の色と食い違う。color で渡せば 文字 の表で引かれる。
 *   JSX の color は、ダークモードのとき babel の jsxImportSource が変換する（React.createElement で
 *   書くと通らない）。
 */
'use strict';

const { 画, 絵のある画面 } = require('./tabIconShapes');

/**
 * タブのアイコン。
 * @param {{名前: string, 大きさ?: number, 色: string, 線の太さ?: number}} 引数
 *   名前 … タブの名前（記録・履歴・分析・メンバー・出欠・設定）。知らない名前は何も描かない
 *   色 … 文字と同じ色。Svg の color に渡し、線は currentColor で引く
 *        （JSX の color は、ダークモードのとき babel の jsxImportSource が文字の表で変換する）
 */
function タブの絵(引数) {
  const { 名前, 大きさ = 20, 色, 線の太さ = 2 } = 引数;
  const 図形たち = 画[名前];
  if (!図形たち) return null;
  const Svgの部品 = require('react-native-svg');
  const Svg = Svgの部品.default ?? Svgの部品;
  const 部品の表 = { path: Svgの部品.Path, circle: Svgの部品.Circle, rect: Svgの部品.Rect };
  return (
    <Svg width={大きさ} height={大きさ} viewBox="0 0 24 24" color={色}>
      {図形たち.map(([種類, 属性], 番) => {
        const 部品 = 部品の表[種類];
        return (
          <部品
            key={番}
            {...属性}
            fill="none"
            stroke="currentColor"
            strokeWidth={線の太さ}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </Svg>
  );
}

module.exports = { タブの絵, 画, 絵のある画面 };
