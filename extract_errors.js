const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\yutoi\\Downloads\\記録用アプリ\\RecordAppExpo\\run_log_utf8.txt', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('Error:')) {
    console.log(`--- Line ${index + 1} ---`);
    console.log(lines.slice(Math.max(0, index - 5), index + 5).join('\n'));
  }
});
