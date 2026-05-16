const fs = require('fs');
const code = fs.readFileSync('src/JP_LoginScreen_1036.js', 'utf8');

// keyプロパティを全部抽出
const keyMatches = [];
const re = /key:([^,}\]]+)/g;
let m;
while ((m = re.exec(code)) !== null) {
  keyMatches.push({ pos: m.index, value: m[1].trim() });
}

console.log('=== key プロパティ一覧 ===');
keyMatches.forEach((k, i) => {
  console.log(`[${i+1}] pos:${k.pos} value: ${k.value}`);
});

// [object Object]になりうるパターン: key にオブジェクトや変数が入っているもの
console.log('\n=== 問題候補 (オブジェクトっぽいもの) ===');
keyMatches.forEach((k, i) => {
  if (!k.value.startsWith('"') && !k.value.startsWith("'") && !k.value.match(/^\d+$/)) {
    console.log(`[${i+1}] pos:${k.pos} value: ${k.value}`);
    // 前後のコンテキストを表示
    console.log('  context:', code.substring(k.pos - 50, k.pos + 80));
    console.log('');
  }
});
