const fs = require('fs');
// Expoは0-basedの行列を使うことがある。各行の1771文字目付近を全行確認
const code = fs.readFileSync('src/JP_MainNavigator_216.js', 'utf8');
const lines = code.split('\n');
lines.forEach((line, i) => {
  if (line.length > 1700) {
    // 1771前後で問題のある文字を探す
    const snippet = line.substring(1760, 1785);
    console.log(`Line ${i+1} (len=${line.length}): ...${snippet}...`);
  }
});
