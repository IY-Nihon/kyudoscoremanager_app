/**
 * ストアのうち、画面が使う項目だけを購読する。
 *
 * ストア全体を購読すると（useScoreStore()）、どの項目が変わっても描き直す。タブの画面は
 * 一度開くと裏でも生きたままなので、記録画面でますを押すたびに、一度開いた全部の画面が
 * 裏で描き直されていた（2026-09-26 の実測。30 人 × 20 射・CPU を 6 倍遅くして、押してから
 * 描き変わるまで 44ms → 全部のタブを開いた後 114ms。scripts/perf-tap.mjs の PERF_TABS）。
 *
 * 渡した項目を浅く比べ、どれかが変わったときだけ描き直す（zustand の useShallow）。
 * 画面では分解の形はそのままに、取る元だけを替える:
 *   const { sessions = [], members } = useストアの一部(['sessions', 'members']);
 */
'use strict';

const { useScoreStore } = require('./useScoreStore');
const { useShallow } = require('zustand/react/shallow');

/**
 * @param {string[]} 鍵たち 画面が使うストアの項目の名前
 * @returns {object} その項目だけを持つ写し
 */
function useストアの一部(鍵たち) {
  return useScoreStore(
    useShallow((状態) => {
      const 出 = {};
      for (const 鍵 of 鍵たち) 出[鍵] = 状態[鍵];
      return 出;
    })
  );
}

module.exports = { useストアの一部 };
