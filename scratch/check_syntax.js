const fs = require('fs');
const babel = require('@babel/parser');

try {
  const code = fs.readFileSync('src/JP_SettingsScreen_1023.js', 'utf8');
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('Syntax is OK!');
} catch (e) {
  console.error('Syntax Error found:', e.message);
  if (e.loc) {
    console.error(`Line: ${e.loc.line}, Column: ${e.loc.column}`);
    // その周辺の文字を切り出してみる
    const lines = fs.readFileSync('src/JP_SettingsScreen_1023.js', 'utf8').split('\n');
    const targetLine = lines[e.loc.line - 1];
    if (targetLine) {
      const start = Math.max(0, e.loc.column - 100);
      const end = Math.min(targetLine.length, e.loc.column + 100);
      console.error('Context:', targetLine.substring(start, end));
    }
  }
}
