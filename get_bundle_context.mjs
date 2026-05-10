import fs from 'fs';
let content = fs.readFileSync('live_bundle.js', 'utf8');
content = content.replace(/\\u([0-9a-fA-F]{4})/g, (m, g) => String.fromCharCode(parseInt(g, 16)));
const keywords = ['弓具変更履歴', '自動進級', 'タグ定型文'];
let output = '';
for (const kw of keywords) {
  let idx = content.indexOf(kw);
  while(idx !== -1) {
    output += `\n--- Match for ${kw} ---\n`;
    output += content.substring(Math.max(0, idx - 1500), Math.min(content.length, idx + 1500));
    idx = content.indexOf(kw, idx + 1);
  }
}
fs.writeFileSync('context_out.txt', output);
console.log('Saved to context_out.txt');
