const fs = require('fs');
const code = fs.readFileSync('./src/JP_SettingsScreen_1023.js', 'utf8');
const lines = code.split(/\r?\n/);

// 全ファイルを1つの文字列として見て、括弧バランスを追跡
let fullCode = '';
for (let i = 0; i < lines.length; i++) {
  fullCode += lines[i] + '\n';
}

let depth = {paren: 0, curly: 0, square: 0};
let inString = false;
let stringChar = '';
let escaped = false;
let lineNum = 1;
let colNum = 0;

for (let i = 0; i < fullCode.length; i++) {
  const ch = fullCode[i];
  colNum++;
  
  if (ch === '\n') {
    lineNum++;
    colNum = 0;
    continue;
  }
  
  if (escaped) {
    escaped = false;
    continue;
  }
  
  if (ch === '\\' && inString) {
    escaped = true;
    continue;
  }
  
  if (inString) {
    if (ch === stringChar) inString = false;
    continue;
  }
  
  if (ch === "'" || ch === '"') {
    inString = true;
    stringChar = ch;
    continue;
  }
  
  // Skip template literals (backtick strings)
  if (ch === '`') {
    inString = true;
    stringChar = '`';
    continue;
  }
  
  if (ch === '(') depth.paren++;
  else if (ch === ')') {
    depth.paren--;
    if (depth.paren < 0) {
      console.log('EXTRA ) at line', lineNum, 'col', colNum);
      console.log('Context:', fullCode.substring(Math.max(0,i-50), Math.min(fullCode.length, i+50)));
      process.exit(1);
    }
  }
  else if (ch === '{') depth.curly++;
  else if (ch === '}') {
    depth.curly--;
    if (depth.curly < 0) {
      console.log('EXTRA } at line', lineNum, 'col', colNum);
      console.log('Context:', fullCode.substring(Math.max(0,i-50), Math.min(fullCode.length, i+50)));
      process.exit(1);
    }
  }
  else if (ch === '[') depth.square++;
  else if (ch === ']') {
    depth.square--;
    if (depth.square < 0) {
      console.log('EXTRA ] at line', lineNum, 'col', colNum);
      console.log('Context:', fullCode.substring(Math.max(0,i-50), Math.min(fullCode.length, i+50)));
      process.exit(1);
    }
  }
}

console.log('Final balance:', JSON.stringify(depth));
if (depth.paren !== 0 || depth.curly !== 0 || depth.square !== 0) {
  console.log('UNBALANCED BRACKETS!');
  // Look for where things went wrong by checking at certain milestones
  console.log('Checking at end of each line:');
  let d2 = {paren: 0, curly: 0, square: 0};
  let inStr2 = false;
  let strCh2 = '';
  let esc2 = false;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    for (let ci = 0; ci < line.length; ci++) {
      const ch = line[ci];
      if (esc2) { esc2 = false; continue; }
      if (ch === '\\' && inStr2) { esc2 = true; continue; }
      if (inStr2) { if (ch === strCh2) inStr2 = false; continue; }
      if (ch === "'" || ch === '"' || ch === '`') { inStr2 = true; strCh2 = ch; continue; }
      if (ch === '(') d2.paren++;
      else if (ch === ')') d2.paren--;
      else if (ch === '{') d2.curly++;
      else if (ch === '}') d2.curly--;
      else if (ch === '[') d2.square++;
      else if (ch === ']') d2.square--;
    }
    if (d2.paren !== 0 || d2.curly !== 0 || d2.square !== 0) {
      if (li >= 13) { // Only print for lines 14+
        console.log(`After line ${li+1}: () ${d2.paren}, {} ${d2.curly}, [] ${d2.square}`);
      }
    }
  }
}
