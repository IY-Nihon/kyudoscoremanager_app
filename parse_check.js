const fs = require('fs');
const acorn = require('acorn');

const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');

try {
  acorn.parse(src, { ecmaVersion: 2020, sourceType: 'module' });
  console.log('Parse OK');
} catch(e) {
  console.log('Error:', e.message);
  console.log('Pos:', e.pos);
  const lines = src.split('\n');
  const lineNo = e.loc ? e.loc.line : src.slice(0, e.pos).split('\n').length;
  const col = e.loc ? e.loc.column : e.pos - src.split('\n').slice(0, lineNo-1).join('\n').length - 1;
  console.log('Line:', lineNo, 'Col:', col);
  const l = lines[lineNo - 1];
  console.log('Context:', JSON.stringify(l.slice(Math.max(0, col-30), col+30)));
  console.log('Exact char:', JSON.stringify(l[col]));
}
