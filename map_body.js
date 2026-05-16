const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
const l = lines[17];

// .map((h,p)=>{...}) の内部を取り出す
const mapIdx = l.indexOf('.map((h,p)=>{');
const mapStart = mapIdx + '.map((h,p)=>{'.length;

// 対応するカッコを探す
let depth = 1;
let i = mapStart;
while (i < l.length && depth > 0) {
  if (l[i] === '{') depth++;
  else if (l[i] === '}') depth--;
  i++;
}
const mapBody = l.slice(mapStart, i-1);
console.log('Map body:');
console.log(mapBody);
console.log('\n--- Length:', mapBody.length);

// 最後の100文字
console.log('\nLast 150 chars:', mapBody.slice(-150));
