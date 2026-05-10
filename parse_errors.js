const fs = require('fs');
// Remove ascii control codes just in case they're messing with the console
const log = fs.readFileSync('current_failed.log', 'utf8').replace(/\x1b\[[0-9;]*m/g, '');

const regex = /([\/a-zA-Z0-9_\-\.]+):(\d+):(\d+):\s+(fatal\s+)?error:\s+([^\n]+)/g;

let match;
let errors = [];
// Use a Set to avoid duplicates if any
let seen = new Set();

while ((match = regex.exec(log)) !== null) {
  const file = match[1];
  const line = match[2];
  const col = match[3];
  const errorMsg = match[5].replace(/\x1b\[[0-9;]*m/g, '').trim();
  
  const formatted = `${file}:${line}:${col}: ${errorMsg}`;
  
  if (!seen.has(formatted)) {
    seen.add(formatted);
    errors.push({ file, line, col, errorMsg, formatted });
  }
}

let outputStr = "";
if (errors.length === 0) {
  outputStr += "No specific file and line errors found with the standard pattern.\n";
  const fallbackRegex = /error:\s+([^\n]+)/g;
  let matches = 0;
  while ((match = fallbackRegex.exec(log)) !== null && matches < 50) {
     outputStr += `- ${match[1].trim()}\n`;
     matches++;
  }
} else {
  outputStr += `=== 検出されたエラーの箇所 (${errors.length}件) ===\n`;
  errors.slice(0, 100).forEach(e => {
    outputStr += `[ファイル]: ${e.file}\n`;
    outputStr += `[箇所]: ${e.line}行目 (${e.col}列目)\n`;
    outputStr += `[内容]: ${e.errorMsg}\n`;
    outputStr += '-'.repeat(50) + '\n';
  });
}

fs.writeFileSync('parsed_errors.txt', outputStr);
console.log("Done. Wrote to parsed_errors.txt");
