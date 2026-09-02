/**
 * src/ の最小化されたままのコードを、読める形に整形する。
 *
 *   node scripts/format-src.mjs               確認のみ（書き込まない）
 *   node scripts/format-src.mjs --commit      書き込む
 *   node scripts/format-src.mjs --commit 名前 その名前を含むファイルだけ
 *
 * src/ はソースマップから復元した最小化コードで、1行が4万字を超える
 * ファイルもある。行番号が意味を持たないので差分が読めず、変更のたびに
 * 事故のもとになっていた。
 *
 * Prettier は書き方だけを変える道具だが、念のため整形の前後で構文木を
 * 突き合わせ、一致したものだけ書き換える。位置情報と表記の差、注釈は
 * 比較から外す（注釈の位置は動くことがあるが、動きに意味はない）。
 *
 * 仕上げに expo export のバンドルが同一かどうかを見ると、利用者に届く
 * ものが1バイトも変わらないことまで確かめられる。
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import * as prettier from 'prettier';

const 引数 = process.argv.slice(2);
const COMMIT = 引数.includes('--commit');
const 絞り込み = 引数.find((a) => !a.startsWith('--'));
const SRC = 'src';

/**
 * 対象外。JSX で書かれており、整形すると要素の中の字下げが変わる。
 * JSX の空白は表示上まとめられるので見た目は変わらないはずだが、
 * 構文木では差として出るため「変わっていない」と言い切れない。
 * いずれも元から読める形（最長でも418字）なので、整形の必要も薄い。
 */
const 対象外 = new Set([
  'ArrowLocationPopover.js',
  'ArrowLocationView.js',
  'AIChatBot.js',
  'OCRRecordModal.js',
]);

const 解析設定 = {
  sourceType: 'unambiguous',
  allowReturnOutsideFunction: true,
  plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator', 'classProperties'],
};

const 落とす = new Set([
  'loc', 'start', 'end', 'range', 'extra', 'raw',
  'leadingComments', 'trailingComments', 'innerComments', 'comments',
]);

function 骨格(node) {
  if (Array.isArray(node)) return node.map(骨格);
  if (node && typeof node === 'object') {
    const out = {};
    for (const key of Object.keys(node)) {
      if (落とす.has(key)) continue;
      out[key] = 骨格(node[key]);
    }
    return out;
  }
  return node;
}

const 設定 = await prettier.resolveConfig(path.resolve('.prettierrc.json'));
const 結果 = [];
let 失敗 = 0;

for (const f of fs.readdirSync(SRC).sort()) {
  if (!f.endsWith('.js')) continue;
  if (絞り込み && !f.includes(絞り込み)) continue;
  if (対象外.has(f)) { 結果.push({ ファイル: f, 判定: '対象外（JSX）' }); continue; }
  const p = path.join(SRC, f);
  const 元 = fs.readFileSync(p, 'utf8');
  const 元行数 = 元.split(/\r?\n/).length;
  const 元最長 = Math.max(...元.split(/\r?\n/).map((l) => l.length));

  let 新;
  try {
    新 = await prettier.format(元, Object.assign({}, 設定, { parser: 'babel', filepath: p }));
  } catch (e) {
    結果.push({ ファイル: f, 判定: '整形できず: ' + e.message.slice(0, 40) });
    失敗++;
    continue;
  }
  if (新 === 元) continue;

  let 判定;
  try {
    const a = JSON.stringify(骨格(parse(元, 解析設定).program));
    const b = JSON.stringify(骨格(parse(新, 解析設定).program));
    判定 = a === b ? '一致' : '不一致';
  } catch (e) {
    判定 = '解析できず: ' + e.message.slice(0, 40);
  }

  if (判定 === '一致') {
    if (COMMIT) fs.writeFileSync(p, 新);
  } else {
    失敗++;
  }

  const 新行数 = 新.split(/\r?\n/).length;
  結果.push({
    ファイル: f,
    行数: `${元行数} → ${新行数}`,
    最長行: `${元最長} → ${Math.max(...新.split(/\r?\n/).map((l) => l.length))}`,
    判定,
  });
}

console.table(結果);
console.log(
  COMMIT
    ? `${結果.length - 失敗} 本を整形しました（見送り ${失敗} 本）`
    : `対象 ${結果.length} 本。書き込むには --commit を付けてください（見送り予定 ${失敗} 本）`
);
if (失敗) process.exit(1);
