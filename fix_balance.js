const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
let l = lines[17].replace(/\r/g, '');

// 行全体のバランスを確認
function getBalance(str) {
  let p=0, b=0, br=0;
  for (const ch of str) {
    if(ch==='(')p++; else if(ch===')')p--;
    if(ch==='[')b++; else if(ch===']')b--;
    if(ch==='{')br++; else if(ch==='}')br--;
  }
  return {p, b, br};
}

console.log('Current balance:', getBalance(l));
console.log('Current last 60:', JSON.stringify(l.slice(-60)));

// 末尾の ; を取り除いて不足分を補う
l = l.replace(/;\s*$/, ''); // 末尾の ; を除去
const bal = getBalance(l);
console.log('After removing ;, balance:', bal);

// 不足分を追加
let suffix = '';
for (let i = 0; i < -bal.br; i++) suffix += '}';
for (let i = 0; i < -bal.b; i++) suffix += ']';
for (let i = 0; i < -bal.p; i++) suffix += ')';
suffix += ';';

l = l + suffix;
console.log('New last 60:', JSON.stringify(l.slice(-60)));
console.log('New balance:', getBalance(l));

// ファイルに書き戻す
lines[17] = l;
fs.writeFileSync('./src/JP_MainNavigator_216.js', lines.join('\n'), 'utf8');
console.log('File written.');
