const fs = require('fs');
const acorn = require('acorn');

// まず行全体を取り出す
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
const l = lines[17];

// \r を除去してみる
const cleaned = src.replace(/\r/g, '');
try {
  acorn.parse(cleaned, { ecmaVersion: 2020, sourceType: 'module' });
  console.log('Parse OK after removing \\r');
} catch(e) {
  console.log('Still error after removing \\r:', e.message, 'pos:', e.pos);
  const cl = cleaned.split('\n')[17];
  console.log('Col:', e.loc ? e.loc.column : '?');
  if (e.loc) console.log('Context:', JSON.stringify(cl.slice(e.loc.column-20, e.loc.column+20)));
}
