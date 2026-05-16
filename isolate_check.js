const fs = require('fs');
const acorn = require('acorn');

const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
const l = lines[17];

// 18行目のコードを単独でパースしてみる（constとして）
// まずそのまま
const code = l.trim();
try {
  acorn.parse(code, { ecmaVersion: 2020, sourceType: 'script' });
  console.log('Parse OK');
} catch(e) {
  console.log('Error col:', e.loc ? e.loc.column : e.pos);
  const col = e.loc ? e.loc.column : e.pos;
  console.log('Exact context:', JSON.stringify(code.slice(col-5, col+5)));
}

// .map((h,p)=>{ の中を取り出す
const mapStart = code.indexOf('.map((h,p)=>{');
const mapCode = 'const _=[' + code.slice(mapStart + '.map('.length) + ']';
console.log('Map code start:', mapCode.slice(0, 100));
try {
  acorn.parse(mapCode, { ecmaVersion: 2020, sourceType: 'script' });
  console.log('Map code parse OK');
} catch(e2) {
  console.log('Map code error at:', e2.loc ? e2.loc.column : e2.pos, e2.message);
}
