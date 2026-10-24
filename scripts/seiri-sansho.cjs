/**
 * コメントの中の参照（src/…・scripts/…・test/…・e2e/… と「src/xxx.js の 名前」）が今もあるかを確かめる（2026-10-24）。
 *
 *   node scripts/seiri-sansho.cjs
 *
 * 倉庫の根で流す。別の倉庫（kyudo-chukei など）を指すもの・手元だけに置く鍵のファイルも「無い」に出るので、目で見て分ける
 */
const fs = require('fs');
const path = require('path');
const 根 = process.cwd();
const 集める = (道) =>
  fs.readdirSync(道, { withFileTypes: true }).flatMap((d) => {
    const 先 = path.join(道, d.name);
    if (
      d.name === 'node_modules' ||
      d.name.startsWith('.') ||
      d.name === 'dist' ||
      d.name.startsWith('dist-')
    )
      return [];
    return d.isDirectory() ? 集める(先) : /\.(c?js|mjs|md|yml)$/.test(d.name) ? [先] : [];
  });
const ファイル = [
  ...集める('src'),
  ...集める('e2e'),
  ...集める('test'),
  ...集める('scripts'),
  'App.js',
  'README.md',
  ...集める('.github'),
];
const 無い = [];
const 名が無い = [];
for (const f of ファイル) {
  const s = fs.readFileSync(f, 'utf8');
  const 行たち = s.split(/\r?\n/);
  行たち.forEach((行, 番) => {
    // コメントか md の行だけ
    const コメント =
      f.endsWith('.md') || f.endsWith('.yml') ? 行 : (行.match(/(\/\/.*|\/\*.*|^\s*\*.*)$/) || [])[0];
    if (!コメント) return;
    for (const m of コメント.matchAll(
      /\b((?:src|scripts|test|e2e)\/[\w\-./぀-鿿]+?\.(?:json|m?js|cjs|md))(?!\w)(?:\s*の\s*([\w$぀-鿿]+))?/g
    )) {
      const 参照 = m[1];
      if (!fs.existsSync(path.join(根, 参照))) {
        無い.push(`${f}:${番 + 1}  ${参照}`);
        continue;
      }
      if (
        m[2] &&
        !/^(中|上|下|頭|ほう|形|決まり|検査|説明|作り|道|置き場|手前|表|ため|もの|とき|ところ|値|名前|部品|まとめ|並び|中身|同じ|最初|最後|末尾|仕組み|あたり|一覧|続き|外)$/.test(
          m[2]
        )
      ) {
        const 先 = fs.readFileSync(path.join(根, 参照), 'utf8');
        if (!先.includes(m[2])) 名が無い.push(`${f}:${番 + 1}  ${参照} の ${m[2]}`);
      }
    }
  });
}
console.log('■ 無いファイル', 無い.length);
console.log(無い.join('\n'));
console.log('■ そのファイルに無い名前', 名が無い.length);
console.log(名が無い.join('\n'));
