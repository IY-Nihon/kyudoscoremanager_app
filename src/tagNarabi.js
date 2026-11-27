'use strict';

/**
 * タグの絞り込みの札の並べ方と見た目（履歴・分析・書き出しで同じにする）。
 *
 * 選んだタグ → 今見ている範囲（年度・月・期間）の記録に有るタグ → 無いタグ、の順に並べ、同じ組の中は名前順。
 * 無いタグは灰色の点線で出す（押せる）。範囲を変えても選んだタグは外さず、「その範囲に無いだけ」と分かるように
 * （2026-11-13 本人。履歴で始めた。11/28 本人「分析や書き出しなどは？」で分析と書き出しにも）
 */

/** 記録たちに付いているタグの集まり */
function 範囲のタグを集める(記録たち) {
  const 集めた = new Set();
  (記録たち || []).forEach((記録) => {
    if (記録 && Array.isArray(記録.tags)) 記録.tags.forEach((タグ) => 集めた.add(タグ));
  });
  return 集めた;
}

/** 札の並び。選んだ → 範囲に有る → 無い、同じ組の中は名前順 */
function タグを並べる(一覧, 選んだ, 範囲のタグ) {
  const 選 = 選んだ || [];
  const 組 = (タグ) => (選.includes(タグ) ? 0 : 範囲のタグ && 範囲のタグ.has(タグ) ? 1 : 2);
  return [...(一覧 || [])]
    .filter(Boolean)
    .sort((甲, 乙) => 組(甲) - 組(乙) || String(甲).localeCompare(String(乙)));
}

/**
 * 範囲に無いタグの札の見た目（札の箱と字に足す）。有る・選んだ札には何も足さない（選んでいて無い札は薄く）
 * @param {boolean} ここに無い
 * @param {boolean} 選ばれている
 * @param {{灰: string, 灰_明るい: string}} 色
 */
function 無いタグの見た目(ここに無い, 選ばれている, 色) {
  if (!ここに無い) return { 箱: null, 字: null };
  if (選ばれている) return { 箱: { opacity: 0.6 }, 字: null };
  return {
    箱: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: 色.灰_明るい,
    },
    字: { color: 色.灰 },
  };
}

module.exports = { 範囲のタグを集める, タグを並べる, 無いタグの見た目 };
