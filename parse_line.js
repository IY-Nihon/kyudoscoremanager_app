const fs = require('fs');
const acorn = require('acorn');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const l = src.split('\n')[17].replace(/\r/g, '');

// 行だけを単独でパース
try {
  acorn.parse(l, { ecmaVersion: 2020, sourceType: 'script' });
  console.log('Line 18 alone: OK');
} catch(e) {
  console.log('Line 18 alone error:', e.message);
  console.log('Col:', e.loc ? e.loc.column : e.pos);
  const col = e.loc ? e.loc.column : e.pos;
  console.log('Context:', JSON.stringify(l.slice(Math.max(0,col-30), col+30)));
}

// ファイル全体
try {
  acorn.parse(src.replace(/\r/g,''), { ecmaVersion: 2020, sourceType: 'module' });
  console.log('Full file: OK');
} catch(e2) {
  console.log('Full file error col:', e2.loc ? e2.loc.column : e2.pos, e2.message);
  const col = e2.loc ? e2.loc.column : e2.pos;
  const line = src.replace(/\r/g,'').split('\n')[17];
  console.log('Context:', JSON.stringify(line.slice(Math.max(0,col-30), col+30)));
}
