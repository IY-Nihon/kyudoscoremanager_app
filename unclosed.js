const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const l = src.split('\n')[17].replace('\r','');
console.log('Last 30:', JSON.stringify(l.slice(-30)));

// 開き括弧の位置を記録
let parens = [];
for (let i = 0; i < l.length; i++) {
  const ch = l[i];
  if (ch === '(') parens.push(i);
  else if (ch === ')') parens.pop();
}
console.log('Unclosed ( at positions:', parens);
parens.forEach(p => {
  console.log('  pos', p, ':', JSON.stringify(l.slice(p, p+40)));
});
