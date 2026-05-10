const fs = require('fs');

const log = fs.readFileSync('current_failed.log', 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
const lines = log.split(/\r?\n/);
const lastLines = lines.slice(-200);

console.log(lastLines.join('\n'));
