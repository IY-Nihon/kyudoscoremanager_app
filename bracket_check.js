const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
const l = lines[17];

// 括弧の対応をトレース (エラー位置の前後200文字)
const start = 1574;
const end = 1831;
const segment = l.slice(start, end);
console.log('Segment:', segment);
console.log('---');

// 括弧カウント
let stack = [];
for (let i = 0; i < segment.length; i++) {
  const ch = segment[i];
  if ('([{'.includes(ch)) stack.push({ch, pos: start+i});
  else if (')]}'.includes(ch)) {
    const match = {'(':')','[':']','{':'}'}[stack[stack.length-1]?.ch];
    if (match !== ch) {
      console.log('MISMATCH at pos', start+i, ': expected', match, 'got', ch);
      console.log('Last opened at:', stack[stack.length-1]);
      console.log('Stack depth:', stack.length);
    }
    stack.pop();
  }
}
console.log('Remaining unclosed:', stack.length, stack.slice(-5));
