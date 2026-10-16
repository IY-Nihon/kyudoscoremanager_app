'use strict';

/**
 * 今の団体の学年の決まり（src/gakunen.js）を画面で使うためのフック。
 * 団体の種類だけでなく、自分で決める学年・卒業するか・呼び方・年度の始まりの月が変わっても作り直す
 * （種類だけを見ていると、設定で学年を足しても、開いたままの画面の札が古いままになる）。
 */
const React = require('react');
const { useScoreStore } = require('./useScoreStore');
const 学 = require('./gakunen');

function use団体の決まり() {
  const 種類 = useScoreStore((状態) => 状態.groupType);
  const customGrades = useScoreStore((状態) => 状態.customGrades);
  const customGraduate = useScoreStore((状態) => 状態.customGraduate);
  const customWording = useScoreStore((状態) => 状態.customWording);
  const yearStartMonth = useScoreStore((状態) => 状態.yearStartMonth);
  return React.useMemo(
    () => 学.決まりを作る(種類, { customGrades, customGraduate, customWording, yearStartMonth }),
    [種類, customGrades, customGraduate, customWording, yearStartMonth]
  );
}

module.exports = { use団体の決まり };
