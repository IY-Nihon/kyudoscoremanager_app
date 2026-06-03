// JP_ArcherActionModal_689.js を書き換えて、個人IDログイン時に自分自身をメンバー選択リストの一番上にソートするスクリプトです。
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/JP_ArcherActionModal_689.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. デストラクションの書き換え
const destTarget = 'const { members: B, alumni: alumniState, archers: H, setArcherMember: P, addArcher: R, addSeparator: W, addTotalCalculator: V, deleteArcher: D } = (0, m.useScoreStore)();';
const destReplacement = 'const { members: B, alumni: alumniState, archers: H, setArcherMember: P, addArcher: R, addSeparator: W, addTotalCalculator: V, deleteArcher: D, activeRole, myMemberId } = (0, m.useScoreStore)();';

if (!code.includes(destTarget)) {
  console.error("エラー: デストラクションのターゲット文字列が見つかりません！");
  process.exit(1);
}
code = code.replace(destTarget, destReplacement);

// 2. ソートロジックの書き換え
const sortTarget = "const L = (0, t.useMemo)(() => B.filter(e => (e.grade || 0) < 5).filter(e => '' === O || e.name.includes(O)).sort((e, t) => {";
const sortReplacement = `const L = (0, t.useMemo)(() => B.filter(e => (e.grade || 0) < 5).filter(e => '' === O || e.name.includes(O)).sort((e, t) => {
    if (activeRole === 'member' && myMemberId) {
      const isEMySelf = e.id === myMemberId;
      const isTMySelf = t.id === myMemberId;
      if (isEMySelf !== isTMySelf) return isEMySelf ? -1 : 1;
    }`;

if (!code.includes(sortTarget)) {
  console.error("エラー: ソート開始のターゲット文字列が見つかりません！");
  process.exit(1);
}
code = code.replace(sortTarget, sortReplacement);

fs.writeFileSync(filePath, code, 'utf8');
console.log("JP_ArcherActionModal_689.js の修正が完了しました。");
