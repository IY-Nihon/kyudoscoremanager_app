const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
const l = lines[17];

// 18行目の末尾を確認
console.log('Last 80 chars of line 18:', JSON.stringify(l.slice(-80)));

// 行全体の ( ) [ ] { } のカウント
let parens = 0, brackets = 0, braces = 0;
for (const ch of l) {
  if (ch === '(') parens++;
  else if (ch === ')') parens--;
  else if (ch === '[') brackets++;
  else if (ch === ']') brackets--;
  else if (ch === '{') braces++;
  else if (ch === '}') braces--;
}
console.log('Paren balance:', parens, '(should be 0)');
console.log('Bracket balance:', brackets, '(should be 0)');
console.log('Brace balance:', braces, '(should be 0)');
