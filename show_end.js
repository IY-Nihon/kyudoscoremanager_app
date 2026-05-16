const fs = require('fs');
let src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
let l = lines[17].replace(/\r/g, '');

// 末尾の正確な文字を確認
const end = l.slice(-40);
console.log('End:', JSON.stringify(end));
// 各文字を表示
for (let i = l.length-20; i < l.length; i++) {
  console.log(i, JSON.stringify(l[i]));
}
