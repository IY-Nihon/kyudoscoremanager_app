const fs = require('fs');
let src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
let l = lines[17].replace(/\r/g, '');

console.log('Before:', JSON.stringify(l.slice(-30)));

// 末尾の ]); の前の余分な ] を除去
// 現在: ...rightActions])]})})}));
// 正しい: ...rightActions})]})})});
// 末尾パターンを確認して修正
l = l.replace(/\]\](\}[^}]*)$/, ']$1');  // ]] → ] (末尾付近)

console.log('After:', JSON.stringify(l.slice(-30)));

// バランス確認
let p=0, b=0, br=0;
for(const ch of l){
  if(ch==='(')p++; else if(ch===')')p--;
  if(ch==='[')b++; else if(ch===']')b--;
  if(ch==='{')br++; else if(ch==='}')br--;
}
console.log('Balance - paren:', p, 'bracket:', b, 'brace:', br);

lines[17] = l;
fs.writeFileSync('./src/JP_MainNavigator_216.js', lines.join('\n'), 'utf8');
console.log('Written.');
