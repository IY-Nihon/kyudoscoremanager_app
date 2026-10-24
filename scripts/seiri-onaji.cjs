/**
 * 同じ並びの行が、別の場所にもあるかを探す（まとめられる処理の下調べ。2026-10-24）。
 *
 *   node scripts/seiri-onaji.cjs [行数（既定 6）] ファイル...
 *
 * 字下げと空白をならして比べる。かっこだけ・コメントだけの行ばかりの塊は数えない。
 * 見つかったものを必ずまとめるわけではない（画像処理の内側の繰り返しは速さのためにわざと開いてある）
 */
const fs = require('fs');
const 引数 = process.argv.slice(2);
const 窓 = /^\d+$/.test(引数[0]) ? Number(引数.shift()) : 6;
const 表 = new Map();
for (const f of 引数) {
  const L = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const 並 = L.map((行) => 行.trim().replace(/\s+/g, ' '));
  for (let i = 0; i + 窓 <= 並.length; i++) {
    const 塊 = 並.slice(i, i + 窓);
    // 中身の薄い行（かっこだけ・コメントだけ・空）ばかりの塊は数えない
    const 濃い = 塊.filter((行) => 行.length > 12 && !/^(\/\/|\*|\/\*)/.test(行));
    if (濃い.length < 窓 - 1) continue;
    const 鍵 = 塊.join('\n');
    if (!表.has(鍵)) 表.set(鍵, []);
    表.get(鍵).push(`${f}:${i + 1}`);
  }
}
// 重なる窓をまとめて、場所の組ごとに 1 回だけ出す
const 出した = new Set();
const 結果 = [];
for (const [鍵, 場所] of 表) {
  if (場所.length < 2) continue;
  const 組 = 場所.map((x) => x.replace(/:\d+$/, '')).join('|');
  const 頭 = 場所.map((x) => Number(x.split(':').pop()));
  const 印 = 組 + '#' + 頭.map((n) => Math.floor(n / 15)).join(',');
  if (出した.has(印)) continue;
  出した.add(印);
  結果.push(`${場所.join('  ')}\n    ${鍵.split('\n')[0].slice(0, 100)}`);
}
console.log(結果.join('\n'));
console.log('件数', 結果.length);
