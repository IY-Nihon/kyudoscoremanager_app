import fs from 'fs';
const lines = fs.readFileSync('live_bundle.js', 'utf8').split('\n');

const keywords = [
  '4月1日の自動進級',
  '弓具変更履歴を表示・編集',
  '現在の期 (新入生)',
  'CSV出力を実行',
  'メールアドレスを忘れた',
  '団体IDを忘れた',
  'セッション名',
  '高度なフィルタ',
  'AI',
  'チャット',
  'ゴミ箱'
];

let out = '';
for (const kw of keywords) {
  let foundLine = -1;
  // unescape manually for searching
  for(let i=0; i<lines.length; i++) {
    const unescaped = lines[i].replace(/\\u([0-9a-fA-F]{4})/g, (m, g) => String.fromCharCode(parseInt(g, 16)));
    if (unescaped.includes(kw)) {
      foundLine = i;
      break;
    }
  }

  if (foundLine !== -1) {
    out += `\n\n=========== Match for: ${kw} ===========\n`;
    const start = Math.max(0, foundLine - 100);
    const end = Math.min(lines.length - 1, foundLine + 300);
    for (let i=start; i<=end; i++) {
      const lineStr = lines[i].replace(/\\u([0-9a-fA-F]{4})/g, (m, g) => String.fromCharCode(parseInt(g, 16)));
      out += `${i}: ${lineStr}\n`;
    }
  }
}

fs.writeFileSync('components_extract.txt', out);
console.log('Saved to components_extract.txt');
