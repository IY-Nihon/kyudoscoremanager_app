/**
 * 上のバー（記録・履歴・分析・メンバー・出欠・設定）の絵の中身（どの図形を描くか）。
 *
 * 線だけの絵（24×24、線の太さ 2、端は丸め）。React に触れない純粋なデータで、
 * そのまま検査できる（test/tabIcons.test.js）。描くのは src/tabIcons.js。
 *
 * ■ 絵の出どころ
 *   Lucide（https://lucide.dev）の線画をそのまま使っている（notebook-pen・history・
 *   chart-column・users・calendar-check・settings）。ライセンスは下のとおり。
 *   Lucide の中で Feather（MIT）由来とされる絵は使っていない（lucide-react-native の LICENSE の一覧と照合した）。
 *
 *   ISC License
 *   Copyright (c) 2026 Lucide Icons and Contributors
 *   Permission to use, copy, modify, and/or distribute this software for any purpose with or
 *   without fee is hereby granted, provided that the above copyright notice and this permission
 *   notice appear in all copies.
 *   THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS
 *   SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
 *   AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 *   WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
 *   NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *   PERFORMANCE OF THIS SOFTWARE.
 *
 */
'use strict';

/**
 * 画面の名前ごとの絵。[図形の種類, 属性] の並び。
 * 種類は 'path'（d）・'circle'（cx, cy, r）・'rect'（x, y, width, height, rx）。
 * キーは MainNavigator のタブの名前と同じ。
 */
const 画 = {
  // 記録 … ノートにペン（アプリ名の「的中ノート」。記録＝書き込む）
  記録: [
    ['path', { d: 'M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4' }],
    ['path', { d: 'M2 6h4' }],
    ['path', { d: 'M2 10h4' }],
    ['path', { d: 'M2 14h4' }],
    ['path', { d: 'M2 18h4' }],
    [
      'path',
      {
        d: 'M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z',
      },
    ],
  ],
  // 履歴 … 時計と戻る矢印（過去へ戻る）
  履歴: [
    ['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }],
    ['path', { d: 'M3 3v5h5' }],
    ['path', { d: 'M12 7v5l4 2' }],
  ],
  // 分析 … 棒グラフ
  分析: [
    ['path', { d: 'M3 3v16a2 2 0 0 0 2 2h16' }],
    ['path', { d: 'M18 17V9' }],
    ['path', { d: 'M13 17V5' }],
    ['path', { d: 'M8 17v-3' }],
  ],
  // メンバー … 2 人
  メンバー: [
    ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
    ['path', { d: 'M16 3.128a4 4 0 0 1 0 7.744' }],
    ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }],
    ['circle', { cx: 9, cy: 7, r: 4 }],
  ],
  // 出欠 … カレンダーにチェック
  出欠: [
    ['path', { d: 'M8 2v4' }],
    ['path', { d: 'M16 2v4' }],
    ['rect', { x: 3, y: 4, width: 18, height: 18, rx: 2 }],
    ['path', { d: 'M3 10h18' }],
    ['path', { d: 'm9 16 2 2 4-4' }],
  ],
  // 設定 … 歯車
  設定: [
    [
      'path',
      {
        d: 'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915',
      },
    ],
    ['circle', { cx: 12, cy: 12, r: 3 }],
  ],
};

/** 絵のある画面の名前 */
const 絵のある画面 = Object.keys(画);

module.exports = { 画, 絵のある画面 };
