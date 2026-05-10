const fs = require('fs');
const log = fs.readFileSync('c:\\Users\\yutoi\\Downloads\\記録用アプリ\\RecordAppExpo\\run_log.txt', 'utf16le');
const lines = log.split(/\r?\n/);
const errors = lines.filter(line => line.includes('error:'));
console.log(errors.slice(-20).join('\n'));
if (errors.length === 0) {
    console.log('No errors found with "error:"');
    const warnings = lines.filter(line => line.includes('warning:'));
    console.log('Last 5 warnings:', warnings.slice(-5).join('\n'));
}
