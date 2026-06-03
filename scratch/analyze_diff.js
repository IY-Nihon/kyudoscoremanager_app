const { execSync } = require('child_process');
const fs = require('fs');

const original = execSync('git show HEAD:src/JP_SettingsScreen_1023.js', { maxBuffer: 10*1024*1024 }).toString().split('\n')[13];
const current = fs.readFileSync('src/JP_SettingsScreen_1023.js', 'utf8').split('\n')[13];

// 変更箇所の周辺を比較
console.log('Original length:', original.length);
console.log('Current length:', current.length);

// 最初に一致しなくなる場所を探す
let firstDiff = -1;
for (let i = 0; i < Math.min(original.length, current.length); i++) {
  if (original[i] !== current[i]) {
    firstDiff = i;
    break;
  }
}

if (firstDiff !== -1) {
  console.log('First difference at index:', firstDiff);
  console.log('Original context:');
  console.log(original.substring(Math.max(0, firstDiff - 100), firstDiff + 200));
  console.log('Current context:');
  console.log(current.substring(Math.max(0, firstDiff - 100), firstDiff + 200));
} else {
  console.log('No front diff found');
}

// 後ろから一致しなくなる場所を探す
let lastDiffOriginal = original.length - 1;
let lastDiffCurrent = current.length - 1;
while (lastDiffOriginal >= 0 && lastDiffCurrent >= 0) {
  if (original[lastDiffOriginal] !== current[lastDiffCurrent]) {
    break;
  }
  lastDiffOriginal--;
  lastDiffCurrent--;
}

console.log('Difference ends (original index):', lastDiffOriginal, '(current index):', lastDiffCurrent);
console.log('Original end context:');
console.log(original.substring(lastDiffOriginal - 200, lastDiffOriginal + 100));
console.log('Current end context:');
console.log(current.substring(lastDiffCurrent - 200, lastDiffCurrent + 100));
